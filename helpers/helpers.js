const cls = require('cls-hooked')

getFromSession = (paramName) => {
  const ns = cls.getNamespace('session')
  const paramValue = ns.get(paramName)
  return paramValue
}

setToSession = (paramName, value) => {
  const ns = cls.getNamespace('session')
  ns.set(paramName, value)
}


module.exports ={
  getFromSession,
  setToSession
}