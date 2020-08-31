const getServiceUrl = require('../helpers/resourceName').getUrl
const axios = require('axios')

class BaseService {
  constructor(serviceName) {
    this.name = serviceName
  }
  async execute(command, data) {
    try {
      return await axios({
        url: `${getServiceUrl(this.name)}/${command}`,
        method: 'post',
        responseType: 'json',
        data
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

module.exports = BaseService
