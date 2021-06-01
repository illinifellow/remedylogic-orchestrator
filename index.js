'use strict'
const appVersion = 'v1'
global.appVersion = appVersion
global.appName = 'orchestrator'

const baseApp = require('@remedy-logic/service-common')

;( async () => {
  const express = require('express')
  const api = require('./api/api')
  const apiRoot = express()
  apiRoot.post('/api/processusersurvey', api.processUserSurvey)

  const settings = {
    appVersion,
    expressRoutes: apiRoot
  }
  baseApp(settings)
})()