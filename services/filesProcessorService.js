import BaseService from '@remedy-logic/service-common/services/BaseService.js'

class FilesProcessorService extends BaseService{
  constructor() {
    super('mri-preprocessor')
  }

  parseFiles(s3folder){
    return this.execute('process',{s3folder})
  }
}

export default new FilesProcessorService()
