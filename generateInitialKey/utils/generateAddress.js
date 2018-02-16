const keythereum = require("keythereum");

//generates initial key keystore file
function generateAddress(password) {
	return new Promise((resolve, reject) => {
		let params = { keyBytes: 32, ivBytes: 16 };

	  	keythereum.create(params, function (dk) {
		    let options = {};
		    keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, function (keyObject) {
		    	resolve(keyObject);
		    });
	  	});
	})
}

module.exports = generateAddress