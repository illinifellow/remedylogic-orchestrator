'use strict'
let AWS = require('aws-sdk')
let region = process.env.REGION

let getDatabaseCredentials = async () => {
  try {
    let client = new AWS.SecretsManager({
      region
    })
    const SecretId = "backend-mongo"
    console.log(`getting secret ${SecretId} at ${region}`)
    const data = await client.getSecretValue({SecretId}).promise()
    let secret
    if ('SecretString' in data) {
      secret = data.SecretString
    } else {
      let buff = new Buffer(data.SecretBinary, 'base64')
      secret = buff.toString('ascii')
    }
    const dbData = JSON.parse(secret)
    const toLog = {...dbData}
    toLog.password = '**************'
    console.log(toLog)
    return dbData
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  getDatabaseCredentials
}
