function get(resource) {
  let realResource
  if (process.env.AWS_ACCOUNT == "prod") {
    realResource = `${resource}-${process.env.APP_ENVIRONMENT}`
  } else {
    realResource = `${resource}-${process.env.AWS_ACCOUNT}-${process.env.APP_ENVIRONMENT}`
  }
  return realResource
}

function getUrl(resource) {
  let realResource
  if (process.env.AWS_ACCOUNT == "prod") {
    realResource = `http://${resource}-${process.env.APP_ENVIRONMENT}.remedylogic.com`
  } else {
    realResource = `http://${resource}-${process.env.APP_ENVIRONMENT}.remedy-${process.env.AWS_ACCOUNT}.com`
  }
  return realResource
}

module.exports = {
  get,
  getUrl
}
