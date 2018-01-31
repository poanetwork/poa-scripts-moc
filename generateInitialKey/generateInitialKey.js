const fs = require('fs');
const keythereum = require("keythereum");
const Web3 = require('web3');
const fetch = require('node-fetch')
const generatePassword = require('password-generator');
const outputFolder = "./output/";
const network = process.env.NETWORK || 'core'
const rpc = process.env.RPC || 'http://127.0.0.1:8545'

const organization = 'poanetwork';
const repoName = 'poa-chain-spec';
const addressesSourceFile = 'contracts.json';
const ABIsSources = {
	'KeysManager': 'KeysManager.abi.json'
};
let web3
let MoC

generateInitialKey();

async function generateInitialKey() {
	try { web3 = await configureWeb3() }
	catch (err) { return errorFinish(err); }

	let contractAddresses
	try { contractAddresses = await getContractsAddresses(network) }
	catch (err) { return errorFinish(err); }

	let KeysManagerAbi
	try { KeysManagerAbi = await getABI(network, 'KeysManager') }
	catch (err) { return errorFinish(err); }

	try { MoC = await getMoC() }
	catch (err) { return errorFinish(err); }

	let keysManager
	try { keysManager = await new web3.eth.Contract(KeysManagerAbi, contractAddresses.KEYS_MANAGER_ADDRESS) }
	catch (err) { return errorFinish(err); }

	const password = generatePassword(20, false)
	const keyObject = await generateAddress(password)

	const initialKey = `0x${keyObject.address}`;
	const keyStoreFileName = outputFolder + keyObject.address + ".json";
	const passwordFileName = outputFolder + keyObject.address + ".key";
	const content = JSON.stringify(keyObject);

	try { await saveToFile(keyStoreFileName, content) }
	catch (err) { return errorFinish(err); }
	console.log(`Initial key ${initialKey} is generated to ${keyStoreFileName}`);

	try { await saveToFile(passwordFileName, password) }
	catch (err) { return errorFinish(err); }
	console.log(`Initial key password is generated to ${passwordFileName}`);

	try { await addInitialKey(keysManager, initialKey) }
	catch (err) { return errorFinish(err); }

	try { await sendEtherToInitialKeyTX(initialKey) }
	catch (err) { return errorFinish(err); }
}

//generates initial key keystore file
function generateAddress(password) {
	return new Promise((resolve, reject) => {
		let params = { keyBytes: 32, ivBytes: 16 };

	  	let dk = keythereum.create(params);

	  	keythereum.create(params, function (dk) {
		    let options = {};
		    keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, function (keyObject) {
		    	resolve(keyObject);
		    });
	  	});
	})
}

function saveToFile(filename, content) {
	return new Promise((resolve, reject) => {
		fs.writeFile(filename, content, (err) => {
		  if (err) reject(err);
		  resolve();
		});
	});
}

function ABIURL(branch, contract) {
    const URL = `https://raw.githubusercontent.com/${organization}/${repoName}/${branch}/abis/${ABIsSources[contract]}`;
    return URL;
}

function addressesURL(branch) {
    const URL = `https://raw.githubusercontent.com/${organization}/${repoName}/${branch}/${addressesSourceFile}`;
    return URL;
}

function getABI(branch, contract) {
	return new Promise((resolve, reject) => {
	    let addr = ABIURL(branch, contract);
	    return fetch(addr)
	    .then((response) => {
	        resolve(response.json());
	    })
	    .catch((err) => {
	    	reject(err)
	    })
	})
}

function getContractsAddresses(branch) {
	return new Promise((resolve, reject) => {
    	let addr = addressesURL(branch);
	    return fetch(addr)
	    .then((response) => {
	        resolve(response.json());
	    })
	    .catch((err) => {
	    	reject(err)
	    })
	});
}

//configures web3
function configureWeb3() {
	let web3;
	if (typeof web3 !== 'undefined') web3 = new Web3(web3.currentProvider);
	else web3 = new Web3(new Web3.providers.HttpProvider(rpc));

	if (!web3) return errorFinish(err);
	
	return new Promise((resolve, reject) => {
		web3.eth.net.isListening()
		.then(function(isListening) {
			if (!isListening) {
				var err = {code: 500, title: "Error", message: "check RPC"};
				return errorFinish(err);
			}

			resolve(web3);
		}).catch((err) => {
			reject(err);
		});
	});
}

function getMoC() {
	return new Promise((resolve, reject) => {
		web3.eth.getAccounts()
		.then((accounts) => {
			if (accounts.length > 0) {
				resolve(accounts[0])
			} else {
				const err = {code: 500, title: "Error", message: "There is no unlocked accounts"}
				reject(err)
			}
		})
	})
}

//activates initial key in KeysManager contract
function addInitialKey(contract, initialKey) {
	return new Promise(async (resolve, reject) => {
		let optsEstimate = {from: MoC};
		let estimatedGas;
		try {
			estimatedGas = await contract.methods.initiateKeys(initialKey).estimateGas(optsEstimate);
		} catch(e) {
			reject(e);
		}
		if (!estimatedGas) return;
		
		console.log(`Estimated gas to add initial key: ${estimatedGas}`)

		addInitialKeyTX(contract, initialKey, estimatedGas)
		.on("transactionHash", (txHash) => {
			console.log(`Wait tx ${txHash} to add initial key to be mined...`);
		})
		.on("receipt", (receipt) => {
			console.log(`Tx ${receipt.transactionHash} to add initial key is mined...`);
			resolve();
		})
		.on("error", (err) => {
			reject(err);
		});
	})
}

//sends tx to activate initial key
function addInitialKeyTX(contract, initialKey, estimatedGas) {
    let opts = {from: MoC, gasLimit: estimatedGas}
    return contract.methods.initiateKeys(initialKey).send(opts);
}

//sends tx to transafer 0.1 eth from master of ceremony to initial key
function sendEtherToInitialKeyTX(initialKey) {
	return new Promise((resolve, reject) => {
		let BN = web3.utils.BN;
		let ethToSend = web3.utils.toWei(new BN(100), "milliether");
		console.log(`WEI to send to initial key: ${ethToSend}`)

		let opts = {from: MoC, to: initialKey, value: ethToSend};
		web3.eth.sendTransaction(opts)
		.on("transactionHash", (txHash) => {
			console.log(`Wait tx ${txHash} to send ETH to initial key to be mined...`);
		})
		.on("receipt", (receipt) => {
			console.log("0.1 ETH successfully sent to initial key");
		})
		.on("error", (err) => {
			reject(err);
		});
	})
}

//finalizes script, if error arised
function errorFinish(err) {
	console.log("Something went wrong with generating initial key");
	if (err) {
		console.log(err.message);
	}
}
