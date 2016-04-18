define (require, exports, module)->

    toString= Object.prototype.toString
    isType= (type) ->
        throw new Error('route.coffee, isType, type is undefined') unless type?
        return (obj) ->
            throw new Error('route.coffee, isType, obj is undefined') unless obj?
            return toString.call(obj).substring(8, -1).toLowerCase() is type.toLowerCase()

    isArray= Array.isArray ? isType('array')
    isObject= isType('object')
    routeData= []
    supportHashChange= ('onhashchange' of window) && ((typeof document.documentMode is 'undefined') || document.documentMode > 8)

    eventRegister= (elm= window, name, fn, canBubble= false)->
        throw new Error('route.coffee, eventRegister, elm is undefined') unless elm?
        throw new Error('route.coffee, eventRegister, name is undefined') unless name?
        throw new Error('route.coffee, eventRegister, fn is undefined') unless fn?
        #throw new Error('route.coffee, eventRegister, elm type error') unless isObject(elm) and (elm isnt window or (!!elm.nodeType and elm.nodeType isnt 1))

        if typeof window.jQuery isnt 'undefined'
            jQuery(elm).bind name, fn
        else if elm.addEventListener
            elm.addEventListener name, fn, canBubble
        else if elm.attachEvent
            elm.attachEvent "on#{name}", fn
        else
            elm["on#{name}"]= fn

    class route
        constructor: (@prefix= '!')->
            return

        register: ( url, callback) ->
            throw new Error('route.coffee, register, url is undefined') unless url?
            throw new Error('route.coffee, register, callback is undefined') unless callback?

            url= @__generateRouteUrl(url)
            routeData.push { url: url, callback: callback }
            return this

        unregister: ( url ) ->
            throw new Error('route.coffee, unregister, url is undefined') unless url?
            for route,index in routeData
                result= new RegExp(route.url).exec(url)
                if result and result.length > 0
                    routeData.splice index, 1
            return this

        hasRoute: (url) ->
            url= @__generateRouteUrl(url)
            return !!@getRouteFn(url)

        getRouteFn: (url)->
            url= @__generateRouteUrl(url)

            for route in routeData
                result= new RegExp("^#{route.url}$", 'ig').exec(url)
                if result and result.length > 0
                    return url: url, callback: route.callback, args: result

        load: (url) ->
            route= @getRouteFn(url)
            route.callback.apply(window, route.args) if route?

        getRouteData: ->
            return routeData

        __generateRouteUrl: (url)->
            throw new Error('route.coffee, __generateRouteUrl, url is undefined') unless url?
            match= new RegExp("^##{@prefix}?([\\s\\S]+)").exec(url)

            if match and match.length > 1
                url= match[1]
            return url

    module.exports= new route()

    # 声明一个hash变更函数以便重复调用，页面加载时会触发一次
    hashChangeHandler= ->
        pageUrl= location.hash

        if module.exports.lastVisitHash isnt pageUrl
            module.exports.load(pageUrl)
            module.exports.lastVisitHash= pageUrl

    if supportHashChange
        eventRegister window, 'hashchange', hashChangeHandler

        if document.readyState is 'complete'
            setTimeout hashChangeHandler, 0
        else
            eventRegister window, 'load', hashChangeHandler
    else
        setInterval hashChangeHandler, 150

    return