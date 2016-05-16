(function(window, Object, undefined){
	'use strict';

	var rNumber = /^\d+$/,
		hasOwn = Object.prototype.hasOwnProperty;

	function LikeArray(){
		if(!(this instanceof LikeArray)){
			var _instance = new LikeArray();
			_instance._initProperies.apply(_instance, arguments);
			return _instance;
		}else{
			this._initPrivateProperies();
			this._initProperies.apply(this, arguments);	
		}
	}

	function defProp(obj, key, value){

		if(typeof key === 'object'){
			for(var _itemKey in key){
				defProp(obj, _itemKey, key[_itemKey]);
			}
		}else{
			Object.defineProperty(obj, key, {
				enumerable: false,
				configurable: true,
				writeable: false,
				value: value
			});
		}

		return defProp;
	}

	defProp(LikeArray.prototype, {
		_initPrivateProperies: function(){
			var reverse = false,
				length = 0,
				instance = this;

			Object.defineProperty(this, '__reverse__', {
				enumerable:false,
				writeable: true,
				configurable: true,
				get: function(){
					return reverse;
				},
				set: function(value){
					reverse = value;
				}
			});

			Object.defineProperty(this, 'length', {
				enumerable: false,
				get: function(){
					return length;
				},
				set: function(value){
					if(!rNumber.test(value))
						throw Error('value not a number');

					// 同样的长度不做任何操作
					if(length === value)
						return;

					// 设定的长度短于当前长度则删除指定长度之后的数据
					else if(value < length){
						for(var i=value; i<length; i++){
							delete instance[i];
						}
					}else{

						// 设定的长度比当前长度长则填充空值
						for(var i=length; i<value; i++){
							instance[i]=undefined;
						}
					}
					
					length = value;
				}
			});
		},
		_initProperies: function(length){
			var instance = this;

			if(arguments.length ===1 && typeof length === 'number'){
				this.length = length;
			}else {
				var length = this.length = arguments.length;
				for(var i=0, l=length; i<l; i++){
					this[i]=arguments[i];
				}

			}
		},
		forEach: function(callback){

			for(var key in this){
				if(hasOwn.call(this, key) && rNumber.test(key)){
					var i = parseInt(key),
						value = this[key];

					if(callback.call(value, value, i, this) != null)
						return;
				}
			}
		},
		map: function(callback){
			var newLikeArray = new LikeArray();

			for(var key in this){
				if(hasOwn.call(this, key) && rNumber.test(key)){
					var i = parseInt(key),
						value = this[key];

					newLikeArray[i] = callback.call(value, value, i, this);
				}
			}

			return newLikeArray;
		},
		filter: function(checkFn){
			if(typeof checkFn !== 'function')
				throw Error('undefined is not a function');

			var newLikeArray = new LikeArray();

			for(var key in this){
				var value = this[key];

				if(hasOwn.call(this, key) && rNumber.test(key) && checkFn(value))
					newLikeArray.push(value);
			}

			return newLikeArray;
		},
		join: function(splitCode){
			splitCode = splitCode || ',';
			var instance = this,
				joinValue = '';

			this.forEach(function(item){
				if(instance.__reverse__)
                    joinValue = item + splitCode + joinValue;
                else
                    joinValue += splitCode + item;
			});

			return joinValue.replace(new RegExp('^' + splitCode + '|' + splitCode +'$', 'ig'), '');
		},
		reverse: function(){
			this.__reverse__ = this.__reverse__? false : true;
			return this;
		},
		slice: function(min, max){
			min = rNumber.test(min) ? min : 0;
			max = rNumber.test(max) ? max : this.length;

			var instance = new LikeArray();

			this.forEach(function(item){
				instance.push(item);
			});

			return instance;
		},
		push: function(value){
			var instance = this;

            for(var i=0, l=arguments.length, item; i<l; i++){
                item = arguments[i];
                
                if(item instanceof LikeArray){
                    item.forEach(function(item){
                        instance.push(item);
                    });
                }else{
                    this[this.length++] = item;
                }
            }

			return this.length;
		},
		pop: function(){
			var delValue = this[this.length - 1];
			delete this[this.length - 1];
			return delValue;
		},
		unshift: function(){
			var len = arguments.length;

			if(len === 0)
				return 0;

			for(var i=this.length-1; i> -1; i--){
				this[i+len] = this[i];
			}

			for(var j=0; j<len; j++){
				this[j] = arguments[0];
			}

			return this.length += arguments.length;
		},
		shift: function(){
			var instance = this;

			this.forEach(function(item, i){
				instance[i] = instance[i+1];
			});

			this.length = this.length - 1;
			delete instance[this.length];
		},
		concat: function(value){
			var instance = this,
				instanceCopy = this.slice();

            instanceCopy.push.apply(instanceCopy, arguments);
			return instanceCopy;
		},
		every: function(checkFn){
			if(typeof checkFn !== 'function')
				throw Error('undefined is not a function');

			for(var key in this){
				var value = this[key];

				if(hasOwn.call(this, key) && rNumber.test(key) && !checkFn.call(value, value))
					return false;
			}

			return true;
		},
		some: function(checkFn){
			if(typeof checkFn !== 'function')
				throw Error('undefined is not a function');

			for(var key in this){
				var value = this[key];

				if(hasOwn.call(this, key) && rNumber.test(key) && checkFn.call(value, value))
					return true;
			}

			return false;
		},
		indexOf: function(item, startPos){
			for(var i=(startPos||0); i<this.length; i++){
				if(this[i] === item)
					return i;
			}

			return -1;
		},
		lastIndexOf: function(item, pos){
			var endPos = (pos && pos > -1 ? pos : -1);

			for(var i=this.length-1; i>endPos; i--){
				if(this[i] === item)
					return i;
			}

			return -1;
		},
		reduce: function(callback, initValue){
			if(typeof callback !== 'function')
				throw Error('undefined is not a function');

			var value, i=0;

			if(initValue != null){
				value = initValue;
			}else{
				value = this[0];
				i = 1;
			}

			for(; i<this.length; i++){
				value = callback.call(value, value, this[i]);
			}

			return value;
		},
		reduceRight: function(callback, initValue){
			if(typeof callback !== 'function')
				throw Error('undefined is not a function');

			var value, i=this.length-1;

			if(initValue != null){
				value = initValue;
			}else{
				value = this[i];
				i = this.length-2;
			}

			for(; i>-1; i--){
				value = callback.call(value, value, this[i]);
			}

			return value;
		},
		toString: function(){
			return '[Object Array]';
		}
	});
	
	// 增加对for..in支持
	if(window.Symbol && window.Symbol.iterator){
		LikeArray.prototype[Symbol.iterator]= function*(){
			for(var i=0; i<this.length; i++){
				yield i;
			}
		};
	}

	// 在ES6环境下支持　delete instance[0]及 instance[0] = 'hello'
	if(window.Proxy){
		window.LikeArray = function(){
			return new Proxy(LikeArray.apply(null, arguments),{
				deleteProperty: function(oTarget, oKey){
					if(rNumber.test(oKey) && oKey in oTarget){
						oKey = parseInt(oKey, 10);

						if(oKey > 0 && oKey < oTarget.length - 1){
							for(var i=oKey; i<oTarget.length; i++){
								oTarget[i] = oTarget[i+1];
							}
							
							oTarget.length -= 1;
						}
					}
				},
				set: function (oTarget, oKey, vValue) {
					if (rNumber.test(oKey) && !(oKey in oTarget)) {
						oKey = parseInt(oKey, 10);
						
						for(var i=oTarget.length; i< oKey; i++){
							oTarget[i] = undefined;
						}
						
						oTarget.length = oKey + 1;
						return oTarget[oKey] = vValue;
					}
				}
			});
		};
	}else{
		window.LikeArray = LikeArray;
	}
	
})(window, Object, undefined);
