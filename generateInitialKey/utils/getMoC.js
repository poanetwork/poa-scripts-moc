function getMoC(web3) {
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

module.exports = getMoC