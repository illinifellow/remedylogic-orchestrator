'use strict'
const processSurveyDataDo = require("../dataObjects/processSurveyDataDo")
const cls = require('cls-hooked')
const uuidv1 = require('uuid/v1')
const analyzerService = require('../services/analyzerService')
const filesProcessor = require('../services/analyzerService')

async function processSurveyData(req, res) {
  try {
    const ns = cls.getNamespace('session')
    const _id = uuidv1()
    const data = req.body

    await processSurveyDataDo.update(_id, {userId: data.userId, survey:data, stage: "filesprocessor"})
    const fileProcessingResult = await filesProcessor('filesprocessor', data)
    await processSurveyDataDo.update(_id, {filesProcessorData: fileProcessingResult, stage:"analyzer"})
    const analyzerResult = await analyzerService('analyzer', data)
    await processSurveyDataDo.update(_id, {analyzerData: analyzerResult, stage:"done"})
    res.send({_id: data._id, analyzerResult, fileProcessingResult})
  } catch (e) {
    console.error('status error ', e)
    res.status(500)
    res.send(e)
  }
}

module.exports = {
  processSurveyData
}