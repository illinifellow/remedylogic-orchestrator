const cls = require('cls-hooked')
const mongoose = require('mongoose')
const models = mongoose.models
const Long = require('mongodb').Long
const awsSecretManager = require('../aws/awsSecretsManager')
const fs = require('fs')
const mongoDatabaseName = require('../helpers/resourceName')('remedyorchestratordb')

let awsCreds

mongoose.set('useCreateIndex', true)
// DBQuery.shellBatchSize = 500

function promiseDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
// how to coonect https://stackoverflow.com/questions/54397644/connection-error-while-connecting-to-aws-documentdb
class BaseDo {

/*
  test commands:
  db.createUser({
    user: "test1",
    pwd: "password1",
    roles: [ { role: "readWrite", db: "remedy" } ],
    passwordDigestor: "server"
  })

  db.createUser({
    user: "test2",
    pwd: "password2",
    roles: [ { role: "readWrite", db: "remedy" } ],
    passwordDigestor: "server"
  })

  use remedy
  db.dropUser("test1", {w: "majority", wtimeout: 5000})
*/

  static async initMongoDb(attemptCounter = 0, subscribeToEvents = true, dontRereadCredentials = false) {
    let uri
    try {
      // perform connect
      console.log('mongoDatabaseName ', mongoDatabaseName)
      attemptCounter++
      console.log('getting info from awsSecretManager')
      if (!dontRereadCredentials) {
        awsCreds = await awsSecretManager.getDatabaseCredentials()
      }
      awsCreds = awsCreds || {} // if nothing then try environment variables
      const options = {
        keepAlive: true,
        keepAliveInitialDelay: 14000,
        autoReconnect: true,
        user: awsCreds.username || process.env.MONGOUSER,
        pass: awsCreds.password || process.env.MONGOPASSWORD,
        useNewUrlParser: true,
        reconnectTries: 10,
        reconnectInterval: 1500,
        connectTimeoutMS: 3000,
        socketTimeoutMS: 60000,
        dbName: mongoDatabaseName,
        ssl: true,
        sslValidate: process.env.USESSH ? false : true,
        sslCA: fs.readFileSync('./aws/certificates/rds-combined-ca-bundle.pem') // TODO where should it be?
      }
      const toLog = {name: "dbConnectionOptions", ...options}
      toLog.pass = '**************'
      toLog.sslCA = 'ca'
      console.debug('Initializing MongoDB', toLog)
      if (process.env.USESSH) {
        uri = process.env.MONGO
      } else {
        uri = awsCreds.host ? `mongodb://${awsCreds.host}/?replicaSet=rs0` : process.env.MONGO // TODO test in VPC if uri will work there
      }
      const db = await mongoose.connect(uri, options)

      if (subscribeToEvents) {

        mongoose.connection.on("connecting", err => {
          console.log(`MongoDB connecting ${uri} `, err)
        })

        mongoose.connection.on("connected", err => {
          console.log(`MongoDB connected ${uri} `, err)
        })

        mongoose.connection.on("disconnecting", err => {
          console.log(`MongoDB disconnecting ${uri} `, err)
        })

        mongoose.connection.on("disconnected", err => {
          console.log(`MongoDB disconnected ${uri} `, err)
        })

        // register event listener to track connection losses
        mongoose.connection.on("error", err => {
          console.error(`MongoDB connection lost (error) @ ${uri}! Auto-retry is active - check for reconnect event...`, err)
        })

        mongoose.connection.on("reconnectFailed", async err => {
          try {
            // all reconnection attempts failed - log fatal right away
            console.error(`MongoDB auto-reconnection failed @ ${uri}! Attempting to reset the connection...`, err)

            try {
              if (mongoose.connection.readyState !== 0) {
                console.warn(`Mongoose issued a 'reconnectFailed' event, but doesn't reflect it (readyState is ${mongoose.connection.readyState}).`)
              }
            } catch (e) {
              console.error("Disconnect on MongoDb during 'reconnectFailed' caused an error. Ignoring the exception - if the reconnect now fails, this is logged separately.", e)
            }

            // start a new connection attempt
            await promiseDelay(1500)
            this.initMongoDb(0, false, true)
          } catch (e) {
            console.error("Attempting to recover from MongoDb reconnect error failed with another exception. The data tier is dead now!", e)
          }
        })

        mongoose.connection.on("reconnected", err => {
          console.info(`MongoDB reconnection success @ ${uri}`, err)
        })
      }
      console.info("Successfully connected to MongoDb")
      return db
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes('authentication failed')) {
        console.error(`Failed connect to MongoDB @ ${uri} authentication failed. (attempt #${attemptCounter})! Will retry...`, e)
        await this.initMongoDb(attemptCounter, false)
      } else {
        // mongoose doesn't recover automatically from this kind of exception - reconnect manually
        console.error(`Failed connect to MongoDB @ ${uri} (attempt #${attemptCounter})! Will retry...`, e)
        await promiseDelay(2000)
        await this.initMongoDb(attemptCounter, false, true)
      }
    }
  }

  constructor(name, schema) {
    this.do = mongoose.model(name, schema)
    this.name = name
  }

  // FIXME https://github.com/mongoosejs/mongoose-long/issues/10
  _toObject(originalObj) {
    const getProps = function (obj) {
      for (let property in obj) {
        if (obj.hasOwnProperty(property) && obj[property] != null) {
          if (obj[property].constructor == Object) {
            getProps(obj[property])
          } else if (obj[property].constructor == Array) {
            for (let i = 0; i < obj[property].length; i++) {
              getProps(obj[property][i])
            }
          } else {
            if (obj[property]._bsontype === "Long") {
              obj[property] = Number((obj[property]))
              console.log(obj[property])
            }
          }
        }
      }
    }
    originalObj = originalObj.toObject()
    getProps(originalObj)
    return originalObj
  }

  async read(id, dontUseSession) {
    if (!dontUseSession) {
      const ns = cls.getNamespace('session')
      const session = ns.get('expressSession')
      let obj = session[this.name]
      if (!obj) {
        obj = await models[this.name].findById(id).exec()
        obj = obj ? obj.toObject() : null
      }
      return obj
    }
    let obj = await models[this.name].findById(id).exec()
    obj = obj ? obj.toObject() : null
    return obj
  }

  // TODO should retry on lost connection??
  async write(id, data) {
    data._id = id
    const model = new this.do(data)
    const res = await model.save()
    return data
  }

  async update(_id, doc) {
    // if doc not present then user is not in the system
    let obj = (await this.do.findOneAndUpdate({_id}, doc, {new: true, upsert: true}).exec())
    if (obj) {
      obj = this._toObject(obj)
    }
    return obj
  }

  async remove(id) {
    await this.do.deleteOne({_id: id}).exec()
  }

// TODO add indexes for email and _id
  async query(q,p) {
    let obj = await this.do.find(q,p).exec()
    if (obj) {
      obj = obj.map(o=> this._toObject(o))
    }
    return obj
  }

}

module.exports = BaseDo