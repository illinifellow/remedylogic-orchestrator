const BaseService = require("./BaseService")

class FilesProcessorService extends BaseService{
  constructor() {
    super('analyzer')
  }

  parseFiles(s3folder){
    return this.execute('parseFiles',{s3folder})
  }
}

module.exports = new FilesProcessorService()
