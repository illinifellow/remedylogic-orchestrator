const BaseService = require("./BaseService")

class DiagnosisService extends BaseService{
  constructor() {
    super('diagnosis')
  }

  diagnosis(surveyAndParsedFilesData){
    return this.execute('diagnosis', surveyAndParsedFilesData)
  }
}

module.exports = new DiagnosisService()
