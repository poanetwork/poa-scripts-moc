//finalizes script, if error arised
function errorFinish(err) {
	console.log("Something went wrong with generating initial key");
	if (err) {
		console.log(err.message);
	}
}

module.exports = errorFinish
