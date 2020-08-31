const BaseService = require("./BaseService")

class AnalyzerService extends BaseService{
  constructor() {
    super('dicom-analyzer-backend')
  }

  analyze(s3folder, surveyData){
    return this.execute('analyze',{s3folder, surveyData})
  }
}

module.exports = new AnalyzerService()
