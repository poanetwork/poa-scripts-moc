let fs = require('fs');
let keythereum = require("keythereum");
let Web3 = require('web3');
let generatePassword = require('password-generator');

generateAddress(generateAddressCallback);

//generates initial key keystore file
function generateAddress(cb) {
	let params = { keyBytes: 32, ivBytes: 16 };

  	let dk = keythereum.create(params);

  	keythereum.create(params, function (dk) {
	    let options = {};
	    let password = generatePassword(20, false);
	    keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, function (keyObject) {
	    	cb(keyObject, password);
	    });
  	});
}

//saves initial key keystore file to ./initialKeysDemo folder
function generateAddressCallback(keyObject, password) {
	let initialKey = "0x" + keyObject.address
	let filename = "./initialKeysDemo/" + keyObject.address + ".json";
	let content = JSON.stringify(keyObject);
	fs.writeFileSync(filename, content)

	console.log("Initial key " + initialKey + " is generated to " + filename);
	console.log("Password for initial key:", password);
	attachToContract(initialKey, addInitialKey);
}

//attaches to KeysManager contract
async function attachToContract(initialKey, cb) {
	let config = getConfig();
	let web3 = await configureWeb3(config);
	let contractABI = config.Ethereum.contracts.KeysManager.abi;
	let contractAddress = config.Ethereum.contracts.KeysManager.addr;
	let contractInstance = new web3.eth.Contract(contractABI, contractAddress);
	
	cb(contractInstance, web3, initialKey);
}

//gets config from ./config.json
function getConfig() {
	let config = JSON.parse(fs.readFileSync('../config.json', 'utf8'));
	return config;
}

//configures web3
async function configureWeb3(config) {
	let web3;
	if (typeof web3 !== 'undefined') web3 = new Web3(web3.currentProvider);
	else web3 = new Web3(new Web3.providers.HttpProvider(config.Ethereum[config.environment].rpc));

	if (!web3) return finishScript(err);
	
	let isListening = await web3.eth.net.isListening()
	if (!isListening) {
		let err = {code: 500, title: "Error", message: "check RPC"};
		return finishScript(err);
	}

	let accounts = await web3.eth.getAccounts()
	web3.eth.defaultAccount = accounts[0]

	return web3;
}


//activates initial key in KeysManager contract
async function addInitialKey(contract, web3, initialKey) {
	let optsEstimate = {from: web3.eth.defaultAccount};
	let estimatedGas;
	try {
		estimatedGas = await contract.methods.initiateKeys(initialKey).estimateGas(optsEstimate);
	} catch(e) {
		finishScript(e);
	}
	if (!estimatedGas) return;
	
	console.log("Estimated gas to add initial key:", estimatedGas)

	addInitialKeyTX(web3, contract, initialKey, estimatedGas)
	.on("transactionHash", (txHash) => {
		console.log(`Wait tx ${txHash} to add initial key to be mined...`);
	})
	.on("receipt", (receipt) => {
		console.log("Tx " + receipt.transactionHash + " to add initial key is mined...");
		sendEtherToInitialKeyTX(web3, initialKey)
		.on("transactionHash", (txHash) => {
			console.log(`Wait tx ${txHash} to send Eth to initial key to be mined...`);
		})
		.on("receipt", (receipt) => {
			console.log("0.1 Eth sent to initial key");
		})
		.on("error", (err) => {
			finishScript(err);
		});
	})
	.on("error", (err) => {
		finishScript(err);
	});
}

//sends tx to activate initial key
function addInitialKeyTX(web3, contract, initialKey, estimatedGas) {
    let opts = {from: web3.eth.defaultAccount, gasLimit: estimatedGas}
    return contract.methods.initiateKeys(initialKey).send(opts);
}

//sends tx to transafer 0.1 eth from master of ceremony to initial key
function sendEtherToInitialKeyTX(web3, initialKey) {
	let BN = web3.utils.BN;
	let ethToSend = web3.utils.toWei(new BN(100), "milliether");
	console.log("WEI to send to initial key: " + ethToSend)

	let opts = {from: web3.eth.defaultAccount, to: initialKey, value: ethToSend};
	return web3.eth.sendTransaction(opts);
}

//finalizes script, if error arised
function finishScript(err) {
	if (err) {
		console.log("Something went wrong with generating initial key");
		console.log(err.message);
		return;
	}
}
