function ajax(options) {

    options = options || {};
    options.type = options.type || 'get';
    options.done = options.done || emptyFn;
    options.fail = options.fail || emptyFn;

    var data = (options.data ? serialize(options.data) : null);

    if (options.url == null)
        throw Error('ajax::options.url undefine');

    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200)
            options.done(request.responseText);
    };
    request.onerror = options.fail;
    request.open(options.type, options.url, true);
    request.send(data);
    return request;
}

function serialize(parameters) {
    if (typeof parameters !== 'object') return parameters;
    var parms = [];

    for (var key in parameters) {
        var value = parameters[key];

        if (key && value != null)
            parms.push([key, encodeURIComponent(value)].join('='));
    }

    return parms.join('&');
}

['get', 'post', 'put', 'delete'].forEach(function (method) {
    ajax[method] = function (options) {
        options = options || {};
        options.type = method;
        return ajax(options);
    };
});

module.exports = ajax;