const BaseService = require("./BaseService")

class DiagnosisService extends BaseService{
  constructor() {
    super('remedy-diagnosis')
  }

  diagnosis(s3folder, surveyAndParsedFilesData){
    return this.execute('diagnosis', surveyAndParsedFilesData)
  }
}

module.exports = new DiagnosisService()
