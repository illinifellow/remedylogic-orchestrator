// https://gist.github.com/jlouros/9abc14239b0d9d8947a3345b99c4ebcb on the bottom
// https://stackoverflow.com/questions/27670051/upload-entire-directory-tree-to-s3-using-aws-sdk-in-node-js

const AWS = require('aws-sdk')
const path = require("path")
const fs = require('fs')
const bucketName = require('../helpers/resourceName').get('remedy-backend-storage')

const uploadDir = function(s3Path, bucketName) {

  let s3 = new AWS.S3()
  function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
      var filePath = path.join(currentDirPath, name)
      var stat = fs.statSync(filePath)
      if (stat.isFile()) {
        callback(filePath, stat)
      } else if (stat.isDirectory()) {
        walkSync(filePath, callback)
      }
    })
  }

  walkSync(s3Path, function(filePath, stat) {
    let bucketPath = filePath.substring(s3Path.length+1)
    let params = {Bucket: bucketName, Key: bucketPath, Body: fs.readFileSync(filePath) }
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log('Successfully uploaded '+ bucketPath +' to ' + bucketName)
      }
    })

  })
}

async function init() {
  return createBucket(bucketName)
}

async function createBucket(bucketName) {
  try {
    let params = {
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: process.env.REGION
      }
    }
    let res = await (new AWS.S3()).createBucket(params).promise()
    console.log(res)
    return res
  } catch (e) {
    console.error(e)
  }
}

// https://medium.com/@kornatzky/upload-a-huge-file-to-aws-s3-with-node-76ce3854948d
async function uploadFile(filePath, s3Dest) {
  try {
    let s3 = new AWS.S3({ httpOptions: { timeout: 10 * 60 * 1000 }})
    let bucketPath = s3Dest
    console.log(`Uploading ${bucketPath} to ${bucketName} `)
    let params = {Bucket: bucketName, Key: bucketPath, Body: fs.createReadStream(filePath)}
    let options = { partSize: 5 * 1024 * 1024, queueSize: 10 }
    let res = await s3.upload(params, options).promise()
    console.log(`Successfully uploaded ${bucketPath} to ${bucketName} `, res)
    return filePath
  } catch (e) {
    e.filePath = filePath
    throw e
    console.log(`Error during file upload ${filePath}`, e)
  }
}

//uploadDir("path to your folder", "your bucket name")
module.exports = {
  uploadDir,
  uploadFile,
  init
}
