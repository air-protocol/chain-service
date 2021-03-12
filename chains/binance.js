const BncClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');
const fetch = require('node-fetch');
const config = require('../config/config');
const chainFee = 0.001;
const Web3 = require('web3');
let api = 'https://testnet-dex.binance.org/';
let networkURL = 'https://bsc-dataseed1.binance.org:443';

if (config.network !== 'testnet') {
  api = 'https://dex.binance.org/';
  networkURL = 'https://data-seed-prebsc-2-s1.binance.org:8545';
}

const newUser = async () => {
  const client = new BncClient(api);
  await client.initChain();
  if (config.network !== 'testnet') {
    client.chooseNetwork(config.network);
  }
  return client.createAccount();
};

const send = async (to, amount, asset, secret) => {
  const bnbClient = new BncClient(api);

  bnbClient.chooseNetwork(config.network); // or this can be "mainnet
  bnbClient.setPrivateKey(secret);
  await bnbClient.initChain();

  const sender = await bnbClient.getClientKeyAddress(); // sender address string (e.g. bnb1...)
  const total = parseFloat(amount) + parseFloat(chainFee);
  const httpClient = axios.create({ baseURL: api });
  const sequenceURL = `${api}api/v1/account/${sender}/sequence`;

  await httpClient
    .get(sequenceURL)
    .then((res) => {
      const sequence = res.data.sequence || 0;
      return bnbClient.transfer(sender, to, total, asset, 'AP TX', sequence);
    })
    .then((result) => {
      console.log(result);
      if (result.status === 200) {
        console.log('success', result.result[0].hash + '\n');
      } else {
        console.error('error', result);
      }
    })
    .catch((error) => {
      console.error('error', error);
    });
};

const gas = async (fromKey, to) => {
  try {
    const web3 = new Web3(networkURL);

    const secret = fromKey;
    const { address } = web3.eth.accounts.privateKeyToAccount(secret);

    const hexGasLimit = await web3.utils.toHex('120000').toString();
    const gasPrice = 20 * Math.pow(10, 9);

    const bnbTX = {
      from: address,
      to,
      value: web3.utils.toHex('1500000000000000').toString(), //0.0015 BNB
      gas: hexGasLimit,
      gasPrice,
    };

    const { rawTransaction } = await web3.eth.accounts.signTransaction(
      bnbTX,
      secret
    );
    return await web3.eth.sendSignedTransaction(rawTransaction);
  } catch (error) {
    console.log('error ', error);
    throw error;
  }
};

const balance = async (address) => {
  const web3 = new Web3(networkURL);
  const balance = (await web3.eth.getBalance(address)) / 10 ** 18;
  return balance;
};

const fee = async () => {
  const aux = await fetch(`${api}api/v1/fees`);
  const res = await aux.json();
  return res;
};

module.exports = { newUser, send, gas, balance, fee };
