const generatePassword = require('password-generator');

const constants = require('./utils/constants');
const addInitialKey = require('./utils/addInitialKey');
const configureWeb3 = require('./utils/configureWeb3');
const errorFinish = require('./utils/errorResponse');
const generateAddress = require('./utils/generateAddress');
const getConfig = require('./utils/getConfig');
const getMoC = require('./utils/getMoC');
const saveToFile = require('./utils/saveToFile');
const sendEtherToInitialKeyTX = require('./utils/sendEtherToInitialKeyTX');

let rpc
let config
let web3
let MoC

async function generateInitialKey(_testKeysManagerAddress) {
	try { config = await getConfig() }
	catch (err) { return errorFinish(err); }

	rpc = process.env.RPC || config.Ethereum[config.environment].rpc || 'http://127.0.0.1:8545'
	let KeysManagerAbi = config.Ethereum.contracts.KeysManager.abi;
	let KeysManagerAddress = _testKeysManagerAddress ? _testKeysManagerAddress : config.Ethereum.contracts.KeysManager.addr;

	try { web3 = await configureWeb3(rpc) }
	catch (err) { return errorFinish(err); }

	try { MoC = await getMoC(web3) }
	catch (err) { return errorFinish(err); }

	let keysManager
	try { keysManager = await new web3.eth.Contract(KeysManagerAbi, KeysManagerAddress) }
	catch (err) { return errorFinish(err); }

	const password = generatePassword(20, false)
	const keyObject = await generateAddress(password)

	const initialKey = `0x${keyObject.address}`;
	const keyStoreFileName = constants.outputFolderPath + keyObject.address + ".json";
	const passwordFileName = constants.outputFolderPath + keyObject.address + ".key";
	const content = JSON.stringify(keyObject);

	try { await saveToFile(keyStoreFileName, content) }
	catch (err) { return errorFinish(err); }
	console.log(`Initial key ${initialKey} is generated to ${keyStoreFileName}`);

	try { await saveToFile(passwordFileName, password) }
	catch (err) { return errorFinish(err); }
	console.log(`Initial key password is generated to ${passwordFileName}`);

	try { await addInitialKey(keysManager, initialKey, MoC) }
	catch (err) { return errorFinish(err); }

	try { await sendEtherToInitialKeyTX(web3, initialKey, MoC) }
	catch (err) { return errorFinish(err); }

	return true;
}

module.exports = generateInitialKey