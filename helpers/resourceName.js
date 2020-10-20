function checkEnv(env, isOptional) {
  env = process.env[env]
  if (env === undefined || env == "" || env.trim() == "") {
    if (isOptional) {
      console.warn(`${env} is not set`)
    } else {
      console.error(`${env} is not set`)
      return true // should exit
    }
  }
}

function isNotBlank(string) {
  if (string) {
    string = string.trim()
  }
  return string
}

function get(resource) {
  let realResource

  if (process.env.DEPLOYMENT_ENV == "prod") {
    realResource = isNotBlank(process.env.CUSTOM_APP_LABEL) ? `${resource}-${process.env.CUSTOM_APP_LABEL}` : resource
  } else {
    realResource = isNotBlank(process.env.CUSTOM_APP_LABEL) ? `${resource}-${process.env.CUSTOM_APP_LABEL}-${process.env.DEPLOYMENT_ENV}` : `${resource}-${process.env.DEPLOYMENT_ENV}`
  }
  return realResource
}

function getUrl(resource) {
  let realResource
  realResource = isNotBlank(process.env.CUSTOM_APP_LABEL) ?
    `http://${resource}-${process.env.CUSTOM_APP_LABEL}.remedy${process.env.DEPLOYMENT_ENV}`
    : `http://${resource}.remedy${process.env.DEPLOYMENT_ENV}`
  return realResource
}

module.exports = {
  get,
  getUrl,
  checkEnv
}
