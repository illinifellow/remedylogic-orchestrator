const BaseDo = require('@remedy-logic/service-common/dataObjects/baseDo')
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const Types = Schema.Types
const Number = Types.Number
const String = Types.String
const ObjectId = Schema.ObjectId
const Mixed = Types.Mixed
const MongooseDate = Types.Date

// TODO Add composite key for email and something else. User with same email can appear twice
const processSurveyDataSchema = new Schema({
  _id: String,
  userId: String,
  date: MongooseDate,
  surveyId: String,
  surveyData: Mixed,
  stage: String,
  uploadedS3Folder: String,
  parsedS3Folder: String,
  parsedFilesData: Mixed,
  imageAnalyzerResult: Mixed,
  diagnosisResult: Mixed,
  stagesLog: [Mixed]
}, {strict:false})

class ProcessSurveyDataDo extends BaseDo {
  constructor() {
    super("surveyData", processSurveyDataSchema)
  }
}

module.exports = new ProcessSurveyDataDo()
