const BaseService = require("./BaseService")

class FilesProcessorService extends BaseService{
  constructor() {
    super('dicom-preprocessor-api')
  }

  parseFiles(s3folder){
    return this.execute('process',{s3folder})
  }
}

module.exports = new FilesProcessorService()
