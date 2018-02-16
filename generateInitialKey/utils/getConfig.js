const fs = require('fs');

//gets config from ./config.json
function getConfig() {
	return new Promise(async (resolve, reject) => {
		const configPath = '../config.json';
		fs.access(configPath, fs.F_OK, function(err) {
		    if (err) {
		        return reject(err)
		    } else {
		    	fs.readFile(configPath, 'utf8', (err, config) => {
				  if (err) reject(err);
				  resolve(JSON.parse(config));
				});
		    }
		})
	});
}

module.exports = getConfig