const fs = require('fs');
const dir = require('node-dir');
const path = require('path');
const keythereum = require("keythereum");
const EthereumTx = require('ethereumjs-tx');
const assert = require('assert');
const generateInitialKey = require('../generateInitialKey');
const configureWeb3 = require('../utils/configureWeb3');
const getConfig = require('../utils/getConfig');
const constants = require('../utils/constants');

const keyExt = ".key";
const jsonExt = ".json";
const listOfExt = [keyExt, jsonExt];

let web3;
let rpc;

let keyStorePath;
let passwordPath;
let keyStore;
let password;
let initialKey;
let KeysManagerAddress;

describe("Initial key generation", async function() {

	it('should return KeysManager contract address', async function() {
		let contracts;
		try { contracts = await readFile("../submodules/poa-test-setup/submodules/poa-network-consensus-contracts/contracts.json") }
		catch (err) { return assert.fail(err.message) }
		contracts = JSON.parse(contracts);
		KeysManagerAddress = contracts.KEYS_MANAGER_ADDRESS;

		assert.ok(true)
	})

	it('should successfully generate initial key', async function() {
		this.timeout(20000);
		let status
		try { status = await generateInitialKey(KeysManagerAddress) }
		catch (err) { return assert.fail(err.message) }

		assert.equal(status, true);
	})

	it('should get .json and .key in output directory', async function() {
		try { await getOutput() }
		catch (err) { return assert.fail(err.message) }

		assert.ok(true)
	})

	it('initial key should be valid to generate production keys', async function() {
		this.timeout(10000);
		initialKey = `0x${keyStore.address}`
		
		var privateKey = keythereum.recover(password, keyStore);
		const privateKeyHex = Buffer.from(privateKey, 'hex')

		try { config = await getConfig() }
		catch (err) { return errorFinish(err); }

		rpc = process.env.RPC || config.Ethereum[config.environment].rpc || 'http://127.0.0.1:8545'

		try { web3 = await configureWeb3(rpc) }
		catch (err) { return errorFinish(err); }

		let methodSignature = web3.eth.abi.encodeFunctionSignature('createKeys(address,address,address)')
		
		let miningKey = '0xb8487eed31cf5c559bf3f4edd166b949553d0d11'
		let payoutKey = '0x1b3cb81e51011b549d78bf720b0d924ac763a7c2'
		let votingKey = '0xfca70e67b3f93f679992cd36323eeb5a5370c8e4'
		let params = web3.eth.abi.encodeParameters(["address", "address", "address"], [miningKey, payoutKey, votingKey]);
		let txData = methodSignature + params.substr(2)
		
		var nonce = await web3.eth.getTransactionCount(initialKey);
		var nonceHex = web3.utils.toHex(nonce);
		const rawTx = {
		  nonce: nonceHex,
		  gasPrice: 21000,
		  gasLimit: 400000,
		  to: KeysManagerAddress, 
		  value: 0,
		  data: txData,
		  chainId: web3.utils.toHex(web3.version.network)
		};
		
		var tx = new EthereumTx(rawTx);
		tx.sign(privateKeyHex);

		var serializedTx = tx.serialize();

		let receipt;
		try { receipt = await web3.eth.sendSignedTransaction("0x" + serializedTx.toString('hex')) }
		catch (err) { return returnError(err.message); }
		
		if (receipt.status == "0x0")
			return returnError("Transaction failed");

		fs.unlinkSync(keyStorePath)
		fs.unlinkSync(passwordPath)

		assert.ok(true)
	})
})

function getOutput() {
	return new Promise((resolve, reject) => {
		dir.files(constants.outputFolderPath, async function(err, files) {
		    if (err) reject(err);

		    files = files.filter(e => e !== `${constants.outputFolderName}/.DS_Store` && e !== `${constants.outputFolderName}/.gitkeep`);
		    
		    if (files.length != 2) {
		    	let err = {message: "number of output files != 2"}
		    	reject(err)
		    }

		    for (let i in files) {
		    	let file = files[i]
		    	let ext = path.extname(file)
		    	if (!listOfExt.includes(ext)) reject({message: `Incorrect ext ${ext} of file`})

		    	if (ext == jsonExt) {
		    		keyStorePath = file
		    		try { keyStore = await checkKeyStoreFile(file) }
					catch (err) { return reject(err) }
		    	} else if (ext = keyExt) {
		    		passwordPath = file
		    		try { password = await readFile(file) }
					catch (err) { return reject(err) }
		    	}
		    }
		    resolve();
		});
	});
}

function checkKeyStoreFile(file) {
	return new Promise(async (resolve, reject) => {
		try { content = await readFile(file) }
		catch (err) { return reject(err) }

		keyStore = JSON.parse(content)
		resolve(keyStore)
	});
}

function readFile(file) {
	return new Promise((resolve, reject) => {
		fs.readFile(file, 'utf8', (err, content) => {
			if (err) reject(err);
			try {
			  	resolve(content)
			} catch (e) {
			  	reject(e)
			}
		});
	});
}

function sendRawTX() {
	web3.eth.sendRawTransaction("0x" + serializedTx.toString('hex'), function(err, hash) {
			sendRawTransactionResponse(err, hash, response);
		});
}

function returnError(err) {
	fs.unlinkSync(keyStorePath)
	fs.unlinkSync(passwordPath)
	assert.fail(err)
}