const getServiceUrl = require('../helpers/resourceName').getUrl
const axios = require('axios')

class BaseService {
  constructor(serviceName) {
    this.name = serviceName
  }
  #debugUrl
  #name

  setDebugUrl(debugUrl) {
    this.debugUrl= debugUrl
  }

  async execute(command, data) {
    let url
    try {
      url = `${getServiceUrl(this.name)}/${global.appVersion}/api/${command}`
      if (this.debugUrl && process.env.NODE_ENV === "debug") {
        console.warn(`USING DEBUG URL ${this.debugUrl} instead of ${url}`)
        url = this.debugUrl
      }
      console.log(`calling ${url} with data ${JSON.stringify(data)}`)
      let res = await axios({
        url,
        method: 'post',
        responseType: 'json',
        data
      })
      console.log(`from ${url} received ${JSON.stringify(res.data)}`)
      return res.data
    } catch (e) {
      let error
      if (e.response) {
        let {status, statusText, headers, data} = e.response
        error = {
          status, statusText, headers, data,
          systemMessage: e.message
        }
        if (data && data.error) {
          error.message = data.error
        }
      } else {
        error = {systemMessage: e.message}
      }
      console.error(`error calling ${url} error:${JSON.stringify(error)}`)
      return {
        error
      }
    }
  }
}

module.exports = BaseService
