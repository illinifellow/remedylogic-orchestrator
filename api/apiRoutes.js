'use strict'
import express from 'express'
import PprocessUserSurveyApi from './processUserSurvey.js'

const api = express.Router()

function getApiRoutes() {
    const processUserSurveyApi = new PprocessUserSurveyApi()
    api.post('/processusersurvey', processUserSurveyApi.processUserSurvey)

    return api
}

export default getApiRoutes
