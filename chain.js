const hostConfiguration = require('./config/config')
const chain = require('./chains/'+hostConfiguration.chain)


const createAccount = async () => {
  return await chain.newUser()
}

const send = async(to, amount, asset, secret) =>{
  return await chain.send(to, amount, asset, secret)
}

const fee = async () => {
  return await chain.fee()
}

module.exports = {createAccount, send, fee}
