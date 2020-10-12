const BaseService = require("./BaseService")

class AnalyzerService extends BaseService{
  constructor() {
    super('mri-analyzer')
  }

  analyze(s3folder, parsedFilesData){
    return this.execute('analyze', parsedFilesData)
  }
}

module.exports = new AnalyzerService()
