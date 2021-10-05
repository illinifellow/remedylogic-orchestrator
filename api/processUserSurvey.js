'use strict'
import ProcessSurveyDataDo from '../dataObjects/processSurveyDataDo.js'
import uuidv1 from 'uuid/v1.js'
import analyzerService from '../services/analyzerService.js'
import filesProcessor from '../services/filesProcessorService.js'
import diagnosisService from '../services/diagnosisService.js'

class ProcessUserSurveyApi {
  constructor() {
    this.processSurveyDataDo = new ProcessSurveyDataDo()
    for (let obj = this; obj; obj = Object.getPrototypeOf(obj)) {
      for (let name of Object.getOwnPropertyNames(obj)) {
        if (typeof this[name] === 'function') {
          this[name] = this[name].bind(this)
        }
      }
    }

  }
  processSurveyDataDo

  async processUserSurvey(req, res) {
    try {
      const _id = uuidv1()
      const data = req.body
      const surveyId = data?.surveyData?.surveyId
//-
      await this.processSurveyDataDo.update(_id, {
        uploadedS3Folder: data.s3folder,
        surveyId: data.surveyData.surveyId,
        surveyData: data.surveyData.survey,
        stage: "filesprocessor",
        date: Date()
      })
      filesProcessor.setDebugUrl('http://localhost:4003/v1/api/process')
      const fileProcessingResult = await filesProcessor.parseFiles(data.s3folder)
      await this.processSurveyDataDo.do.findOneAndUpdate({_id}, {
        $push: {
          stagesLog: {
            stage: "filesprocessor",
            date: Date(),
            data: fileProcessingResult
          }
        }
      }, {new: true, upsert:true})
      if (fileProcessingResult.error) {
        console.error(`Error processing uploaded files for survey ${surveyId}`, fileProcessingResult.error)
        await this.processSurveyDataDo.update(_id, {stage: "errorFilesprocessor", error: fileProcessingResult.error})
        res.status(200)
        return res.send(fileProcessingResult)
      }
      await this.processSurveyDataDo.update(_id, {
        parsedS3folder: fileProcessingResult.parsedS3folder,
        parsedFilesData: fileProcessingResult.data,
        stage: "analyzer"
      })
//-
      analyzerService.setDebugUrl('http://localhost:5000/v1/api/analyze')
      const imageAnalyzerResult = await analyzerService.analyze(fileProcessingResult.parsedS3folder, fileProcessingResult.data)
      await this.processSurveyDataDo.do.findOneAndUpdate({_id}, {
        $push: {
          stagesLog: {
            stage: "analyzer",
            date: Date(),
            data: imageAnalyzerResult
          }
        }
      })
      if (imageAnalyzerResult.error) {
        console.error(`Error analyzing data for survey ${surveyId}`, imageAnalyzerResult.error)
        await this.processSurveyDataDo.update(_id, {stage: "errorAnalyzer", error: imageAnalyzerResult.error})
        res.status(200)
        return res.send(imageAnalyzerResult)
      }
      await this.processSurveyDataDo.update(_id, {imageAnalyzerResult, stage: "diagnosis"})
//-
      diagnosisService.setDebugUrl('http://localhost:4004/v1/api/diagnosis')
      const diagnosisResult = await diagnosisService.diagnosis({imageAnalyzerResult, surveyData: data.surveyData})
      await this.processSurveyDataDo.do.findOneAndUpdate({_id}, {
        $push: {
          stagesLog: {
            stage: "diagnosis",
            date: Date(),
            data: diagnosisResult
          }
        }
      },{new: true, upsert:true})
      if (diagnosisResult.error) {
        console.error(`Error diagnosing data for survey ${surveyId}`, diagnosisResult.error)
        await this.processSurveyDataDo.update(_id, {stage: "errorDiagnosis", error: diagnosisResult.error})
        res.status(200)
        return res.send(diagnosisResult)
      }
      await this.processSurveyDataDo.update(_id, {diagnosisResult, stage: "complete"})

      res.send({_id: data._id, data: {imageAnalyzerResult, diagnosisResult}})
    } catch (e) {
      console.error('processUserSurvey error ', e)
      res.status(500)
      res.send(e)
    }
  }
}
export default ProcessUserSurveyApi