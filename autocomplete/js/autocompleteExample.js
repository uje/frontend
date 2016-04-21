var AutoComplete = require('./autocomplete');

new AutoComplete({
	el  : '#keyword',
	url : 'data/data.json?keyword={0}'
});