'use strict'
const appVersion = 'v1'
global.appVersion = appVersion
global.appName = 'orchestrator'
import baseApp from '@remedy-logic/service-common'
import getApiRoutes from './api/apiRoutes.js'
import express from 'express'

;( async () => {
  await baseApp.preStartInit()

  const apiRoot = express()
  apiRoot.use("/api", getApiRoutes())

  const settings = {
    appVersion,
    expressRoutes: apiRoot
  }
  baseApp(settings)
})()