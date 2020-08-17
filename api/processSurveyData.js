'use strict'
const surveyDataDo = require("../dataObjects/processSurveyDataDo")
const sendEmail = require('../aws/ses').sendEmail
const cls = require('cls-hooked')
const uuidv1 = require('uuid/v1')

async function saveUserSurvey(req, res) {
  try {
    const ns = cls.getNamespace('session')
    const userId  = ns.get('userId')
    const _id = req.body._id || uuidv1()
    const data = req.body

    const result = await surveyDataDo.update(_id, {userId, ...data})
    //const messageId = await sendEmail({ name: "Bobby Brown", favoriteanimal: "cat" }, result.email)
    //await surveyDataDo.update(newUserId, { surveySubmittedEmailMessageId: messageId })
    res.send({_id: result._id})
  } catch (e) {
    console.error('status error ', e)
    res.status(500)
    res.send(e)
  }
}

async function getUserSurvey(req, res) {
  if (req.query.id) {
    const userData = await surveyDataDo.query({_id: req.query.id})
    return res.send({...userData[0]})
  } else {
    const userData = await surveyDataDo.query()
    return res.send({surveys:userData})
  }
}

module.exports = {
  saveUserSurvey,
  getUserSurvey
}