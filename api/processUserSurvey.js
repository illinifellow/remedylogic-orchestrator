'use strict'
import ProcessSurveyDataDo from '../dataObjects/processSurveyDataDo.js'
import uuidv1 from 'uuid/v1.js'
import analyzerService from '../services/analyzerService.js'
import filesProcessor from '../services/filesProcessorService.js'
import diagnosisService from '../services/diagnosisService.js'
import NonCriticalError from "@remedy-logic/service-common/helpers/NonCriticalError.js"

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

  async processFiles(data, _id) {
    try {
      console.log(`processing files for survey ${_id}`)
      const surveyId = data?.surveyData?.surveyId
      await this.processSurveyDataDo.update(_id, {
        uploadedS3Folder: data.s3folder,
        surveyId: data.surveyData.surveyId,
        surveyData: data.surveyData.survey,
        stage: "filesprocessor",
        date: Date()
      })
      filesProcessor.setDebugUrl('http://localhost:4003/v1/api/process')
      const fileProcessingResult = await filesProcessor.parseFiles(data.s3folder)
      // await this.processSurveyDataDo.do.findOneAndUpdate({_id}, {
      //   $push: {
      //     stagesLog: {
      //       stage: "filesprocessor",
      //       date: Date(),
      //       data: fileProcessingResult
      //     }
      //   }
      // }, {new: true, upsert: true})
      if (fileProcessingResult.error) {
        console.error(`Error processing uploaded files for survey ${surveyId}`, fileProcessingResult.error)
        await this.processSurveyDataDo.update(_id, {stage: "errorFilesprocessor", error: fileProcessingResult.error})
        throw new NonCriticalError(`Error processing uploaded files for survey ${surveyId} ${JSON.stringify(fileProcessingResult.error)}`)
      }
      return fileProcessingResult
    } catch (e) {
      console.error("critical error in processFiles", e)
      throw e
    }
  }

  async analyze(data, fileProcessingResult, _id) {
    const surveyId = data?.surveyData?.surveyId
    try {
      await this.processSurveyDataDo.update(_id, {
        parsedS3folder: fileProcessingResult.parsedS3folder,
        parsedFilesData: fileProcessingResult.data,
        stage: "analyzer"
      })
      analyzerService.setDebugUrl('http://localhost:5000/v1/api/analyze')
      const imageAnalyzerResult = await analyzerService.analyze(fileProcessingResult.parsedS3folder, fileProcessingResult.data)
      // await this.processSurveyDataDo.do.findOneAndUpdate({_id}, {
      //   $push: {
      //     stagesLog: {
      //       stage: "analyzer",
      //       date: Date(),
      //       data: imageAnalyzerResult
      //     }
      //   }
      // })
      if (imageAnalyzerResult.error) {
        console.error(`Error analyzing data for survey ${surveyId}`, imageAnalyzerResult.error)
        await this.processSurveyDataDo.update(_id, {stage: "errorAnalyzer", error: imageAnalyzerResult.error})
        throw new NonCriticalError(`Error analyzing data for survey ${surveyId} ${JSON.stringify(imageAnalyzerResult.error)}`)
      }
      return imageAnalyzerResult
    } catch (e) {
      console.error("critical error in analyze", e)
      throw e
    }
  }

  async diagnose(data, imageAnalyzerResult, _id, noFiles) {
    try {
      const surveyId = data?.surveyData?.surveyId
      await this.processSurveyDataDo.update(_id, {imageAnalyzerResult, stage: "diagnosis"})
      diagnosisService.setDebugUrl('http://localhost:4004/v1/api/diagnosis')
      const diagnosisResult = await diagnosisService.diagnosis({imageAnalyzerResult, surveyData: data.surveyData, noFiles})
      // await this.processSurveyDataDo.do.findOneAndUpdate({_id}, {
      //   $push: {
      //     stagesLog: {
      //       stage: "diagnosis",
      //       date: Date(),
      //       data: diagnosisResult
      //     }
      //   }
      // }, {new: true, upsert: true})
      if (diagnosisResult.error) {
        console.error(`Error diagnosing data for survey ${surveyId}`, diagnosisResult.error)
        await this.processSurveyDataDo.update(_id, {stage: "errorDiagnosis", error: diagnosisResult.error})
        throw new NonCriticalError(`Error diagnosing data for survey ${surveyId} ${JSON.stringify(diagnosisResult.error)}`)
      }
      return diagnosisResult
    } catch (e) {
      console.error("critical error in diagnose", e)
      throw e
    }
  }

  async processUserSurvey(req, res) {
    let imageAnalyzerResult
    try {
      const _id = uuidv1()
      const data = req.body
      const surveyId = data?.surveyData?.surveyId
      if (!data?.noFiles) {
        const fileProcessingResult = await this.processFiles(data)
        imageAnalyzerResult = await this.analyze(data, fileProcessingResult, _id)
      }
      const diagnosisResult = await this.diagnose(data, imageAnalyzerResult, _id, data?.noFiles)

//      await this.processSurveyDataDo.update(_id, {surveyId, diagnosisResult,  imageAnalyzerResult, stage: "complete"})

      res.send({_id: data._id, data: {fileProcessingResult, imageAnalyzerResult, diagnosisResult, noFiles:!data?.noFiles}})
    } catch (e) {
      if (e instanceof NonCriticalError) {
        console.warn(e)
        let errorMessage = e.message
        res.status(200)
        res.send({error: errorMessage,
          imageAnalyzerResult // for Jack to be able to debug without resubmitting TODO remove or not, after the logs are ready
        })
      } else {
        console.error(e)
        res.status(500)
        res.send({
          error: e.message,
          systemError: e
        })
      }
    }
  }

}

export default ProcessUserSurveyApi