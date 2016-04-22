var ajax = require('./ajax'),
	AutoComplete = require('./autocomplete');

ajax.get('./data/data.json', function(jsonText){
	var data = JSON.parse(jsonText);

	new AutoComplete({
		el   : '#keyword',
		data : data
	});
});