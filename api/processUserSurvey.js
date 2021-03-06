'use strict'
const processSurveyDataDo = require("../dataObjects/processSurveyDataDo")
const cls = require('cls-hooked')
const uuidv1 = require('uuid/v1')
const analyzerService = require('../services/analyzerService')
const filesProcessor = require('../services/filesProcessorService')
const diagnosisService = require('../services/diagnosisService')

async function processUserSurvey(req, res) {
  try {
    const ns = cls.getNamespace('session')
    const _id = uuidv1()
    const data = req.body
    const surveyId = data?.surveyData?.surveyId
//-
    await processSurveyDataDo.update(_id, {
      uploadedS3Folder: data.s3folder,
      surveyId: data.surveyData.surveyId,
      surveyData: data.surveyData.survey,
      stage: "filesprocessor",
      date: Date()
    })
    filesProcessor.setDebugUrl('http://localhost:4003/v1/api/process')
    const fileProcessingResult = await filesProcessor.parseFiles(data.s3folder)
    await processSurveyDataDo.update(_id, { $push: {stagesLog:{
          stage: "filesprocessor",
          date: Date(),
          data: fileProcessingResult
        }}})
    if (fileProcessingResult.error) {
      console.error(`Error processing uploaded files for survey ${surveyId}`, fileProcessingResult.error)
      await processSurveyDataDo.update(_id, { stage: "errorFilesprocessor", error: fileProcessingResult.error})
      res.status(200)
      return res.send(fileProcessingResult)
    }
    await processSurveyDataDo.update(_id, {parsedS3folder: fileProcessingResult.parsedS3folder, parsedFilesData: fileProcessingResult.data, stage:"analyzer"})
//-
    analyzerService.setDebugUrl('http://localhost:5000/v1/api/analyze')
    const imageAnalyzerResult = await analyzerService.analyze(fileProcessingResult.parsedS3folder, fileProcessingResult.data)
    await processSurveyDataDo.update(_id, { $push: {stagesLog:{
          stage: "analyzer",
          date: Date(),
          data: imageAnalyzerResult
        }}})
    if (imageAnalyzerResult.error) {
      console.error(`Error analyzing data for survey ${surveyId}`, imageAnalyzerResult.error)
      await processSurveyDataDo.update(_id, { stage: "errorAnalyzer", error: imageAnalyzerResult.error})
      res.status(200)
      return res.send(imageAnalyzerResult)
    }
    await processSurveyDataDo.update(_id, {imageAnalyzerResult, stage:"diagnosis"})
//-
    diagnosisService.setDebugUrl('http://localhost:4004/v1/api/diagnosis')
    const diagnosisResult = await diagnosisService.diagnosis({imageAnalyzerResult, surveyData:data.surveyData})
    await processSurveyDataDo.update(_id, { $push: {stagesLog:{
          stage: "diagnosis",
          date: Date(),
          data: diagnosisResult
        }}})
    if (diagnosisResult.error) {
      console.error(`Error diagnosing data for survey ${surveyId}`, diagnosisResult.error)
      await processSurveyDataDo.update(_id, { stage: "errorDiagnosis", error: diagnosisResult.error})
      res.status(200)
      return res.send(diagnosisResult)
    }
    await processSurveyDataDo.update(_id, {diagnosisResult, stage:"complete"})

    res.send({_id: data._id, data: {imageAnalyzerResult, diagnosisResult}})
  } catch (e) {
    console.error('processUserSurvey error ', e)
    res.status(500)
    res.send(e)
  }
}

module.exports = {
  processUserSurvey
}