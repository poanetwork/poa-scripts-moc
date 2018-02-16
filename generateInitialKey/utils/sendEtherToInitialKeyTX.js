//sends tx to transafer 0.1 eth from master of ceremony to initial key
function sendEtherToInitialKeyTX(web3, initialKey, MoC) {
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
			resolve();
		})
		.on("error", (err) => {
			reject(err);
		});
	})
}

module.exports = sendEtherToInitialKeyTX