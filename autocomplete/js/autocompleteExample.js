var ajax = require('./ajax'),
	AutoComplete = require('./autocomplete');

ajax.get({
	url: './data/data.json',
	done: function(jsonText){
		var data = JSON.parse(jsonText);

		new AutoComplete({
			el   : '#keyword',
			data : data
		});
	}
});