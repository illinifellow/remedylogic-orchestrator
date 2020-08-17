function create(resource) {
  let realResource
  if (process.env.AWS_ACCOUNT == "prod") {
    realResource = `${resource}-${process.env.APP_ENVIRONMENT}`
  } else {
    realResource = `${resource}-${process.env.AWS_ACCOUNT}-${process.env.APP_ENVIRONMENT}`
  }
  return realResource
}

module.exports = create
