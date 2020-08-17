'use strict'
const {getUserSurvey, saveUserSurvey} = require('./processSurveyData')
const {getUserInfo, saveUserInfo} = require('./userInfo')
const userFiles = require('./userFiles')
const improvementSuggestion = require('./improvementSuggestion')
const surveyExperience = require('./surveyExperience')

module.exports = {
  saveUserSurvey,
  getUserSurvey,
  userFiles,
  improvementSuggestion,
  surveyExperience,
  getUserInfo,
  saveUserInfo
}
