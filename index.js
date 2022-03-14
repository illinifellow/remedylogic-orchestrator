'use strict'
const appVersion = 'v1'
global.appVersion = appVersion
global.appName = 'orchestrator'

const result = dotenv.config()
import dotenv from 'dotenv'
if (result.error) {
  throw result.error
}
console.log("dotenv:")
console.log(JSON.stringify(result.parsed,0,1))

import baseApp from '@remedy-logic/service-common'
import getApiRoutes from './api/apiRoutes.js'
import express from 'express'

;( async () => {
  await baseApp.preStartInit()

  const apiRoot = express()
  apiRoot.use("/api", getApiRoutes())

  const settings = {
    appVersion,
    expressRoutes: apiRoot,
    trackHeaderUserId: true
  }
  baseApp(settings)
})()