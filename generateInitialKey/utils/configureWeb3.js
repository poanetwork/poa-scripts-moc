const Web3 = require('web3');
const { errorFinish } = require('./errorResponse');

//configures web3
function configureWeb3(rpc) {
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

module.exports = configureWeb3