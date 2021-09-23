import BaseService from '@remedy-logic/service-common/services/BaseService.js'

class AnalyzerService extends BaseService{
  constructor() {
    super('mri-analyzer')
  }

  analyze(s3folder, parsedFilesData){
    return this.execute('analyze', parsedFilesData)
  }
}

export default new AnalyzerService()
