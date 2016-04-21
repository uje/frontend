var _extend = (function() {
    var toString = Object.prototype.toString,
        slice = [].slice,
        isType = function(type, input){

            if(input)
                return toString.call(input).slice(8, -1).toLowerCase() === type;
            else
                return function(input){
                    return isType(type, input);
                };
        },
        isObject = isType('object');

    return function(obj1, obj2){

        if(arguments.length === 2){
            for(var key in obj2){
                var newValue = obj2[key];

                if(newValue != null){
                    if(isObject(newValue)){

                        if(!obj1.hasOwnProperty(key))
                            obj1[key] = {};

                        _extend(obj1[key], newValue);
                    }
                    else{
                        obj1[key] = newValue;
                    }
                }
            }
        }else if(arguments.length > 2){
            var objList = slice.call(arguments, 1);

            for(var i=0, l=objList.length; i<l; i++){
                _extend(obj1, objList[i]);
            }
        }

        return obj1;
    };
})();

module.exports = {
    extend: _extend
};