const appVersion = 'v1'
const baseApp = require('@remedy-logic/service-common')
const cls = require('cls-hooked')

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