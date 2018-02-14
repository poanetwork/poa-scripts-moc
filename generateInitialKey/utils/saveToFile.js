const fs = require('fs');

function saveToFile(filename, content) {
	return new Promise((resolve, reject) => {
		fs.writeFile(filename, content, (err) => {
		  if (err) reject(err);
		  resolve();
		});
	});
}

module.exports = saveToFile