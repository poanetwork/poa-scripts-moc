//activates initial key in KeysManager contract
function addInitialKey(contract, initialKey, MoC) {
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

		addInitialKeyTX(contract, initialKey, estimatedGas, MoC)
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
function addInitialKeyTX(contract, initialKey, estimatedGas, MoC) {
    let opts = {from: MoC, gasLimit: estimatedGas}
    return contract.methods.initiateKeys(initialKey).send(opts);
}

module.exports = addInitialKey