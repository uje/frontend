/* CoffeeScript编译生成的代码 */

(function (require, exports, module) {
    var eventRegister, hashChangeHandler, isArray, isObject, isType, route, routeData, supportHashChange, toString, _ref, defaultHash = '.*';
    toString = Object.prototype.toString;
    isType = function (type) {
        if (type == null) {
            throw new Error('route.coffee, isType, type is undefined');
        }
        return function (obj) {
            if (obj == null) {
                throw new Error('route.coffee, isType, obj is undefined');
            }
            return toString.call(obj).substring(8, -1).toLowerCase() === type.toLowerCase();
        };
    };
    isArray = (_ref = Array.isArray) != null ? _ref : isType('array');
    isObject = isType('object');
    routeData = [];
    supportHashChange = ('onhashchange' in window) && ((typeof document.documentMode === 'undefined') || document.documentMode > 8);
    eventRegister = function (elm, name, fn, canBubble) {
        if (elm == null) 
            elm = window;

        if (canBubble == null) 
            canBubble = false;

        if (elm == null) 
            throw new Error('route.coffee, eventRegister, elm is undefined');

        if (name == null) 
            throw new Error('route.coffee, eventRegister, name is undefined');

        if (fn == null) 
            throw new Error('route.coffee, eventRegister, fn is undefined');

        if (typeof window.jQuery !== 'undefined') {
            return jQuery(elm).bind(name, fn);
        } else if (elm.addEventListener) {
            return elm.addEventListener(name, fn, canBubble);
        } else if (elm.attachEvent) {
            return elm.attachEvent("on" + name, fn);
        } else {
            return elm["on" + name] = fn;
        }
    };

    route = (function () {
        function route(prefix) {
            this.prefix = prefix != null ? prefix : '!';
        }

        route.prototype.maps = function (list) {
            for (var key in list)
                this.register(key, list[key]);
        };

        route.prototype.register = function (url, callback) {

            if (!callback) {
                callback = url;
                url = null;
            }

            if (callback == null)  throw new Error('route.coffee, register, callback is undefined');

            url = this.__generateRouteUrl(url);
            var l = routeData.length, lastRoute, item;

            for (var i = 0, route; i < l; i++) {
                route = routeData[i];

                if (route.url === url) {
                    route.callbackList.push(callback);
                    return;
                }
            }

            lastRoute = routeData[l - 1];
            item = { url: url, callbackList: [callback] };

            if (l > 0 && lastRoute.url === defaultHash)
                routeData.splice(l - 1, 0, item);
            else 
                routeData.push(item);

            return this;
        };

        route.prototype.getRouteFn = function (url) {

            url = this.__generateRouteUrl(url);

            for (var i = 0, l = routeData.length, route, result; i < l; i++) {
                route = routeData[i],
                result = new RegExp("^" + route.url + "$", 'ig').exec(url);

                if (result && result.length > 0)
                    return {
                        url: route.url,
                        callbackList: route.callbackList,
                        args: result
                    };
            }
        };

        route.prototype.load = function (url) {
            var route = this.getRouteFn(url);

            if (!route)
                return;

            for (var i = 0, l = route.callbackList.length; i < l; i++) {
                var callback = route.callbackList[i];
                callback.apply(window, route.args);
            }

            this.lastRouteUrl = url;
            console.log('loadUrl:', this.lastRouteUrl);
        };

        route.prototype.getRouteData = function () {
            return routeData;
        };

        route.prototype.__generateRouteUrl = function (url) {
            var match;

            if (url == null)
                throw new Error('route.coffee, __generateRouteUrl, url is undefined');

            if (url === '' || url === '#')
                return defaultHash;

            match = new RegExp("^#" + this.prefix + "?([\\s\\S]+)").exec(url);

            if (match && match.length > 1)
                url = match[1];

            return url;
        };

        route.prototype.isFirstLoad = function () {
            return this.lastRouteUrl == null;
        }

        return route;

    })();
    var r = new route();
    hashChangeHandler = function () {
        if (routeData.length == 0) {
            setTimeout(hashChangeHandler, 10);
        } else {
            var pageUrl;
            pageUrl = location.hash;
            if (r.lastVisitHash !== pageUrl) {
                r.load(pageUrl);
                return r.lastVisitHash = pageUrl;
            }
        }
    };

    if (supportHashChange) {
        eventRegister(window, 'hashchange', hashChangeHandler);
        if (document.readyState === 'complete') {
            setTimeout(hashChangeHandler, 0);
        } else {
            eventRegister(window, 'load', hashChangeHandler);
        }
    } else {
        setInterval(hashChangeHandler, 100);
    }

    if (window.define && define.amd) {
        define(['require', 'exports', 'module'], function (require, exports, module) {
            module.exports = exports = r;
        });
    } else if (window.define && define.cmd) {
        define(function (require, exports, module) {
            module.exports = exports = r;
        });
    }
})();