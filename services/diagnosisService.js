import BaseService from '@remedy-logic/service-common/services/BaseService.js'

class DiagnosisService extends BaseService{
  constructor() {
    super('diagnosis')
  }

  diagnosis(surveyAndParsedFilesData){
    return this.execute('diagnosis', surveyAndParsedFilesData)
  }
}

export default new DiagnosisService()
