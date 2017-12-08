require('dotenv').config();
let fs = require('fs');
let Papa = require('papaparse');
let HOST = process.env.HOST;
let RPC_PORT = process.env.RPC_PORT;
let FAT_BALANCE = process.env.FAT_BALANCE;
let FILENAME_CSV_INVESTORS = process.env.FILENAME_CSV_INVESTORS;
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider(`http://${HOST}:${RPC_PORT}`);
const web3 = new Web3(provider);



const GAS_PRICE = web3.utils.toWei(process.env.GAS_PRICE, 'gwei');

web3.eth.getTransactionCount(FAT_BALANCE).then((txcount) => {
  let nonce = web3.utils.toHex(txcount);
  console.log('STARTED', nonce);
  Papa.parse(fs.createReadStream(__dirname + `/${FILENAME_CSV_INVESTORS}`, 'utf8'), {
    delimiter: ",",
    complete: sendTx.bind(this, nonce),
  });
})


async function sendTx(nonce, parsedCsv){
  parsedCsv.data.forEach((row) => {
    let address = row[0];
    let value = row[1];
    value = web3.utils.toWei(value);
    const isValid = web3.utils.isAddress(address);
    if(isValid && Number(value) > 0) {
      console.log('sending money to', address, value, nonce);
        web3.eth.sendTransaction({
          from: FAT_BALANCE, 
          to: address, 
          gasPrice: GAS_PRICE,
          nonce,
          value
        })
        .on('transactionHash', function(hash){console.log('hash', hash)})
        .on('receipt', function(receipt){
          fs.appendFileSync('success.csv', 
          `${address},${value},${receipt.blockNumber},${receipt.transactionHash}\n`,
          'utf8');
        })
        .on('error', function(error){
          console.error(error);
          fs.appendFileSync('errors.csv', 
          `${address},${value},${error.message}\n`,
          'utf8');
        })
        
        nonce = parseInt(nonce, 16);
        nonce++;
        nonce = web3.utils.toHex(nonce);
    } else {
      console.error('Error sending to', address, value);
      fs.appendFileSync('errors.csv', 
      `${address},${value}\n`,
      'utf8');
    }
  })

}