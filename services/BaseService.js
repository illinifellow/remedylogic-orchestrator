const getServiceUrl = require('../helpers/resourceName').getUrl
const axios = require('axios')

class BaseService {
  constructor(serviceName) {
    this.name = serviceName
  }
  async execute(command, data) {
    try {
      const url = `${getServiceUrl(this.name)}/${global.appVersion}/api/${command}`
      console.log(`calling ${url} with ${JSON.stringify(data)}`)
      return await axios({
        url,
        method: 'post',
        responseType: 'json',
        data
      })
    } catch (e) {
      console.error(e)
      return {
        error: e
      }
    }
  }
}

module.exports = BaseService
