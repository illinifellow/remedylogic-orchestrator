// https://github.com/josephtzeng/hocon-parser
const appVersion = 'v1'
global.appVersion = appVersion
global.__basedir = __dirname
global.fetch = require('node-fetch')
const AWS = require('aws-sdk')
AWS.config.logger = console
const cookieParser = require("cookie-parser")
const fileUpload = require('express-fileupload')
const cls = require('cls-hooked')
const mongoose = require('mongoose')
const s3 = require('./aws/s3')

console.log(process.env)

let toExit = false
if (process.env.DEPLOYMENT_ENV === undefined) {
  console.error('DEPLOYMENT_ENV should be set')
  toExit = true
}
if (process.env.CUSTOM_APP_LABEL === undefined) {
  console.error('CUSTOM_APP_LABEL should be set')
  toExit = true
}
if (process.env.REGION === undefined) {
  console.error('REGION should be set')
  toExit = true
}
if (toExit) {
  process.exit(1)
}

// IMPORTANT semicolon ; is needed before next line
;( async () => {
  const ns = cls.createNamespace('session')
  console.log("initializing connections and cache starting")
  const db = await require('./dataObjects/baseDo').initMongoDb()
//  const s3res = await s3.init()

  console.log("initializing connections and cache finished")

  const mung = require('./helpers/mung')
  const https = require('https')
  const express = require('express')
  const path = require('path')
  const fs = require('fs')
  const bodyParser = require('body-parser')
  const api = require('./api/api')

  const app = express()
  app.get('/liveness_check', async (req, res) => {
    try {
    const info = await mongoose.connection.db.command({serverStatus: 1})
    console.log('liveness_check: ', info)
    res.status(200)
    res.send(info)
    } catch (e) {
      console.error('liveness_check error ', e)
      res.status(500)
      res.send(e)
    }

  })
  app.use(bodyParser.json({limit: '55mb'}))
  app.use(cookieParser())

  app.use(function (req, res, next) {
      const ns = cls.getNamespace('session')
      ns.bindEmitter(req)
      ns.bindEmitter(res)
      ns.run(() => next())
    }
  )

  app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/',
    limits: { fileSize: 500 * 1024 * 1024 },
  }))
  app.use(mung.json((body, req, res) => { // middleware hook for response
      console.log(`res: ${res.statusCode}`, body ? JSON.stringify(body): body)
      return body
    })
  )

  app.use(mung.headers((req, res) => { // middleware hook for response
      console.log("res headers :", res.getHeaders())
    })
  )

// hooks before the response will be sent out to client
// app.set('view engine', 'html');
// route for Home-Page
  app.use(express.static(path.join(__dirname, 'public')))

  app.use(function (req, res, next) {
    console.log("\x1b[36m%s\x1b[0m", `req origin: ${req.headers['origin']}`)
    console.log(`req: ${req.originalUrl}`, req.body ? JSON.stringify(req.body) : req.body)
    // console.log("expressSession " + JSON.stringify(ns.get('expressSession')))
    // console.log(req.method + ' ' + currentTime)
    if (req.method === 'OPTIONS') {
      console.log('OPTIONS header')
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin)
      // headers["Access-Control-Allow-Origin"] = "https://app.remedylogic.com:3000" //TODO don't forget about url here . Generate it from the requester
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
      res.setHeader("Access-Control-Allow-Credentials", "true")
      res.setHeader("Access-Control-Max-Age", '86400') // 24 hours
      res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, userid")
      res.send()
    } else {
      if (req.headers.origin) {
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin) //TODO don't forget about url here
      }
//    res.setHeader("Access-Control-Allow-Origin", "https://app.remedylogic.com:3000") //TODO don't forget about url here
      res.setHeader("Access-Control-Allow-Credentials", "true")
//    console.log(res)
      next()
    }
  })

  function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  }

  const apiRoot = express()
  apiRoot.post('/api/processusersurvey', api.processUserSurvey)

// TODO: Api Version Is Here
  app.use(`/${appVersion}`, apiRoot)

// catch 404 and forward to error handler
  app.use((req, res, next) => {
    console.error("Not Found", req.url, req.originalUrl)
    const err = new Error('Not Found')
    err.status = 404
    next(err)
  })

// error handler
  app.use((err, req, res, next) => {
    console.error("ERROR!", err)
    // set locals, only providing error in development
    const error = {
      message: err.message,
      err: err
    }
    // render the error page
    res.status(err.status || 500)
    res.end(JSON.stringify(error))
  })

  const port = process.env.PORT || 4000
  let server = app.listen(port, () => console.log('Example app listening on port ', port))
  // server = https.createServer(app)
  // server.listen(8443, () => console.log('Https app listening on port 8443'))
})()

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p)
    process.exit(1)
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown')
    process.exit(1)
  })

