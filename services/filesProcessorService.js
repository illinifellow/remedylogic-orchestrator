const BaseService = require('@remedy-logic/service-common/services/BaseService')

class FilesProcessorService extends BaseService{
  constructor() {
    super('mri-preprocessor')
  }

  parseFiles(s3folder){
    return this.execute('process',{s3folder})
  }
}

module.exports = new FilesProcessorService()
