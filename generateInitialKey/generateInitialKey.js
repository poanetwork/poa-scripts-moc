var fs = require('fs');
var keythereum = require("keythereum");
var Web3 = require('web3');
var generatePassword = require('password-generator');

generateAddress(generateAddressCallback);

function generateAddress(cb) {
	var params = { keyBytes: 32, ivBytes: 16 };

  	var dk = keythereum.create(params);

  	keythereum.create(params, function (dk) {
	    var options = {};
	    var password = generatePassword(20, false);
	    keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, function (keyObject) {
	    	cb(keyObject, password);
	    });
  	});
}

function generateAddressCallback(keyObject, password) {
	var initialKey = "0x" + keyObject.address
	var filename = "./initialKeysDemo/" + keyObject.address + ".json";
	var content = JSON.stringify(keyObject);
	fs.writeFileSync(filename, content)

	console.log("Initial key " + initialKey + " is generated to " + filename);
	console.log("Password for initial key:", password);
	attachToContract(initialKey, addInitialKey);
}

function attachToContract(initialKey, cb) {
	configureWeb3(function(web3, config, defaultAccount) {
		var contractABI = config.Ethereum.contracts.KeysStorage.abi;
		var contractAddress = config.Ethereum.contracts.KeysStorage.addr;
		var contractInstance = new web3.eth.Contract(contractABI, contractAddress);
		
		cb(contractInstance, web3, initialKey);
	});
}

function getConfig() {
	var config = JSON.parse(fs.readFileSync('../config.json', 'utf8'));
	return config;
}

function configureWeb3(cb) {
	var config = getConfig();
	var web3;
	if (typeof web3 !== 'undefined') web3 = new Web3(web3.currentProvider);
	else web3 = new Web3(new Web3.providers.HttpProvider(config.Ethereum[config.environment].rpc));

	if (!web3) return finishScript(err);
	
	web3.eth.net.isListening().then(function(isListening) {
		if (!isListening) {
			var err = {code: 500, title: "Error", message: "check RPC"};
			return finishScript(err);
		}

		web3.eth.defaultAccount = config.Ethereum[config.environment].account;
		cb(web3, config, web3.eth.defaultAccount);
	}, function(err) {
		return finishScript(err);
	});
}

function addInitialKey(contract, web3, initialKey) {
	addInitialKeyTX(web3, contract, initialKey, function(err, txHash) {
		if (err) return finishScript(err);

		console.log("Wait tx " + txHash + " to add initial key to be mined...");
		getTxCallBack(web3, txHash, function() {
			console.log("Initial key " + initialKey + " is added to contract");
			sendEtherToInitialKeyTX(web3, initialKey, finishScript);
		});
	});
}

function getTxCallBack(web3, txHash, cb) {
	web3.eth.getTransaction(txHash, function(err, txDetails) {
		if (err) return finishScript(err);

  		if (!txDetails.blockNumber) {
  			setTimeout(function() {
				getTxCallBack(web3, txHash, cb);
			}, 2000)
  		} else {
  			cb();
  		}
  	});
};

function addInitialKeyTX(web3, contract, initialKey, cb) {
	var optsEstimate = {from: web3.eth.defaultAccount};
	contract.methods.addInitialKey(initialKey).estimateGas(optsEstimate)
	.then(function(estimatedGas) {
    	console.log("Estimated gas to add initial key:", estimatedGas)

	    var opts = {from: web3.eth.defaultAccount, gasLimit: estimatedGas}
		contract.methods.addInitialKey(initialKey)
		.send(opts, function(err, txHash) {
			cb(err, txHash);
		});
    })
}

function sendEtherToInitialKeyTX(web3, initialKey, cb) {
	var BN = web3.utils.BN;
	var ethToSend = web3.utils.toWei(new BN(100), "milliether");
	console.log("WEI to send to initial key: " + ethToSend)

	var opts = {from: web3.eth.defaultAccount, to: initialKey, value: ethToSend};
	web3.eth.sendTransaction(opts, function(err, result) {
		cb(err, web3, result);
	});
}

function finishScript(err, web3, txHash) {
	if (err) {
		console.log("Something went wrong with generating initial key");
		console.log(err.message);
		return;
	}

	console.log("Wait tx to send Eth to initial key to be mined...");
	getTxCallBack(web3, txHash, function() {
		console.log("0.1 Eth sent to initial key");
	});
}
