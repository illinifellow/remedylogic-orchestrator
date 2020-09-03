'use strict'
const processSurveyDataDo = require("../dataObjects/processSurveyDataDo")
const cls = require('cls-hooked')
const uuidv1 = require('uuid/v1')
const analyzerService = require('../services/analyzerService')
const filesProcessor = require('../services/filesProcessorService')

async function processUserSurvey(req, res) {
  try {
    const ns = cls.getNamespace('session')
    const _id = uuidv1()
    const data = req.body

    await processSurveyDataDo.update(_id, {uploadedS3Folder: data.s3folder, surveyData: data.surveyData, stage: "filesprocessor"})
    const fileProcessingResult = await filesProcessor.parseFiles(data.s3folder)
    await processSurveyDataDo.update(_id, { $push: {stagesLog:{
          stage: "filesprocessor",
          date: new Date(),
          data: fileProcessingResult
        }}})
    if (fileProcessingResult.error) {
      console.error('Error processing uploaded files ', fileProcessingResult.error)
      res.status(200)
      return res.send(fileProcessingResult)
    }
    await processSurveyDataDo.update(_id, {parsedS3folder: fileProcessingResult.parsedS3folder, stage:"analyzer"})
    const analyzerResult = await analyzerService.analyze(fileProcessingResult.parsedS3folder, data.surveyData)
    if (analyzerResult.error) {
      console.error('Error processing uploaded files ', analyzerResult.error)
      res.status(200)
      return res.send(analyzerResult)
    }
    await processSurveyDataDo.update(_id, {result: analyzerResult, stage:"done"})
    await processSurveyDataDo.update(_id, { $push: {stagesLog:{
        stage: "analyzer",
        date: new Date(),
        data: analyzerResult
      }}})
    if (analyzerResult.error) {
      console.error('Error analyzing data ', analyzerResult.error)
      console.error('Error processing uploaded files ', fileProcessingResult.error)
      res.status(200)
      return res.send(fileProcessingResult)
    }

    res.send({_id: data._id, result: analyzerResult})
  } catch (e) {
    console.error('processUserSurvey error ', e)
    res.status(500)
    res.send(e)
  }
}

module.exports = {
  processUserSurvey
}