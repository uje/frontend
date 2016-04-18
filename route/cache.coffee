define (require,exports) ->
   
    logger= console

    class cache
        ###
            创建一个缓存实例
            @name: 实例名称
        ###
        constructor: (@prefix)->
            throw new Error('cache.coffee,cache,prefix is empty') if not prefix
       
            @default_cache_second= 1800
            return

        data: {}
        ###
            使用前缀生成一个唯一key
            @key: 键
        ###
        gen_key: (key) ->
            return "#{@prefix}_#{key}"

        ###
            根据键检查缓存是否存在
            @key: 键
        ###
        exist: (key)->
            key= @gen_key(key)
            return (key of @data) and @data[key]

        ###
            插入一条缓存
            @key: {string}键
            @value: {object}缓存数据
            @expires: {integer} 缓存时间，单位为秒,默认缓存30分钟
        ###
        insert: (key, value, expires= @default_cache_second) ->
            _key= @gen_key(key)
            @data[_key]= value
            instance= @

            setTimeout(->
                instance.remove key
                logger.log 'cache.coffee', 'insert.timeout', "缓存过期，已移除，键值为#{key}"
            ,expires * 1000)

            logger.log 'cache.coffee', 'insert', "新增一个缓存，键值为#{key},缓存时间为#{expires}"

        ###
            获取缓存
            @key: {string} 键
        ###
        get: (key) ->
            key= @gen_key(key)
            logger.log 'cache.coffee', 'get', "获取缓存，键值为#{key}"
            return @data[key]
        ###
            删除缓存
            @key: {string} 键
        ###
        remove: (key) ->
            key= @gen_key(key)
            @data[key]= null
            delete @data[key]
            logger.log 'cache.coffee', 'remove', "缓存移除，键值为#{key}"

        ###
            获取缓存，如果缓存不存在则从远程抓取数据并缓存
            @key: {string} 键
            @fn: {function} 函数
       
        get_if_exist= (key, fn, expires= @default_cache_second)->
            return @get(key) if @exist(key)

            throw new Error('cache.coffee,cache.get_if_exist,fn is not function') unless $.isFunction(fn)
            while (value= fn())
        ###


    exports.create_instance= (name) ->
        logger.log 'cache.coffee', 'create_instance', "创建一个缓存实例，名称为：#{name}"
        return new cache( name )

    return