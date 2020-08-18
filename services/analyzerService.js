const BaseService = require("./BaseService")

class AnalyzerService extends BaseService{
  constructor() {
    super('analyzer')
  }

  analyze(s3folder, surveyData){
    return this.execute('analyze',{s3folder, surveyData})
  }
}

module.exports = new AnalyzerService()
