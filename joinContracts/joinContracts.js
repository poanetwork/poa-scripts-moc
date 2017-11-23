const fs = require('fs');
const Web3 = require('web3');

const config = getConfig();

joinContracts();

async function joinContracts() {
	let web3 = await configureWeb3();

	const validatorsStorageAddr = config.Ethereum.contracts.ValidatorsStorage.addr;
	const validatorsStorageABI = config.Ethereum.contracts.ValidatorsStorage.abi;
	const validatorsStorage = attachToContract(web3, validatorsStorageAddr, validatorsStorageABI);

	const validatorsManagerAddr = config.Ethereum.contracts.ValidatorsManager.addr;
	const validatorsManagerABI = config.Ethereum.contracts.ValidatorsManager.abi;
	const validatorsManager = attachToContract(web3, validatorsManagerAddr, validatorsManagerABI);

	const keysStorageAddr = config.Ethereum.contracts.KeysStorage.addr;
	const keysStorageABI = config.Ethereum.contracts.KeysStorage.abi;
	const keysStorage = attachToContract(web3, keysStorageAddr, keysStorageABI);

	const keysManagerAddr = config.Ethereum.contracts.KeysManager.addr;
	const keysManagerABI = config.Ethereum.contracts.KeysManager.abi;
	const keysManager = attachToContract(web3, keysManagerAddr, keysManagerABI);

	const ballotsStorageAddr = config.Ethereum.contracts.BallotsStorage.addr;
	const ballotsStorageABI = config.Ethereum.contracts.BallotsStorage.abi;
	const ballotsStorage = attachToContract(web3, ballotsStorageAddr, ballotsStorageABI);

	const ballotsManagerAddr = config.Ethereum.contracts.BallotsManager.addr;
	const ballotsManagerABI = config.Ethereum.contracts.BallotsManager.abi;
	const ballotsManager = attachToContract(web3, ballotsManagerAddr, ballotsManagerABI);

	console.log(web3.eth.defaultAccount)
	console.log(web3.eth.defaultAccount)

	await validatorsStorage.methods.initialize(validatorsManagerAddr, keysStorageAddr, ballotsManagerAddr).send({from: web3.eth.defaultAccount});
    await keysStorage.methods.initialize(keysManagerAddr, ballotsManagerAddr, validatorsStorageAddr, validatorsManagerAddr).send({from: web3.eth.defaultAccount})
    await validatorsManager.methods.initialize(validatorsStorageAddr, keysStorageAddr, keysManagerAddr).send({from: web3.eth.defaultAccount});
    await ballotsStorage.methods.initialize(ballotsManagerAddr, keysStorageAddr).send({from: web3.eth.defaultAccount});
    await ballotsManager.methods.initialize(ballotsStorageAddr, keysStorageAddr, keysManagerAddr, validatorsStorage.address).send({from: web3.eth.defaultAccount});

    finishScript();
}

function getConfig() {
	let config = JSON.parse(fs.readFileSync('../config.json', 'utf8'));
	return config;
}

async function configureWeb3(cb) {
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

function attachToContract(web3, addr, abi) {
	return contractInstance = new web3.eth.Contract(abi, addr);
}

function finishScript(err) {
	if (err) {
		console.log("Something went wrong with joining contracts");
		console.log(err.message);
		return;
	}

	console.log("Oracles contracts are joined");
}
