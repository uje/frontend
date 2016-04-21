module.exports = {
	entry: {
		'autocompleteExample': './autocomplete/js/autocompleteExample.js'
	},
	output: {
		path: './package/',
		filename: '[name].package.js'
	},
	devServer: {
		port: 8081
	}
};