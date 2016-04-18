define(['../../libs/Zepto/Zepto.touch'], function(require, module, exports){
	console.log(require)

	var $ = require('../../libs/Zepto/Zepto.touch'),
		$window   = $(window),
		_elementStyle = document.createElement('div').style,
		browserPrefix = ['ms', 'moz', 'webkit', ''],
		transform = (function () {
			var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
				transform,
				i = 0,
				l = vendors.length;

			for ( ; i < l; i++ ) {
				transform = vendors[i] + 'ransform';
				if ( transform in _elementStyle ){
					console.log('browser support ' + transform);
					return transform;
				}
			}

			return false;
		})(),
		requestAnimationFrame = (function(){
			for(var i=browserPrefix.length, name, animateFrame; i> -1; i--){
				name = (browserPrefix[i] + 'RequestAnimationFrame').replace(/[a-z]/, function(letter){ return letter.toLowerCase(); });
				animateFrame = window[name];
				if(animateFrame) {
					console.log('browser support ' + name);
					return animateFrame; 
				}
			}

			console.log('animation use setTimeout');
			return function(callback){ return setTimeout(callback, 10); };
		})(),
		supportTF = (transform !== false),
		setElementPos = function(element, x, y){
			element.style[transform] = 'matrix(1, 0, 0, 1, ' + x + ' , '+ y + ')';
		};

	function animateFrame(callback){
		(function animate(){
			if(callback() !== true)  requestAnimationFrame(animate);
		})();
	}

	function Tabs(options){
		var options = this.options = $.extend({
			el: null
			, header: '.ui-header'
			, headerItems: 'a'
			, contents: '.ui-content'
			, duration: 100
			, jsScroll: false
			, height: null
			, touchmove: true
			, selectedClass: 'ui-selected'
		}, options);

		// tab控件
		this.$el = $(options.el);

		// 头部
		this.$header = this.$el.children(options.header);
		this.$headerItems = this.$header.children(options.headerItems);
		this.$contents = this.$el.children(options.contents);
		this.selectedIndex = 0;
		this.length = this.$contents.length;
		this.autoHeight = options.height === 'auto';
		this.setHeighted  = !!options.height;
		this.useTransform = supportTF && ! options.jsScroll;
		this.headerHeight = (/^absolute||fixed$/i.test(this.$header.css('position')||'') ?  0 : this.$header.height());

		this.initialize();
		this.register();
	}

	Tabs.prototype = {
		on: function(){
			this.$el.on.apply(this.$el, arguments);
			return this;
		}
		, off: function(){
			this.$el.off.apply(this.$el, arguments);
			return this;
		}
		, trigger: function(){
			this.$el.trigger.apply(this.$el, arguments);
			return this;
		}
		, initialize: function(){

			// 缓存索引
			this.$headerItems.each(function(i, item){
				var $this = $(this);
				$this.attr('data-index', i);
			});

			this.$contents.each(function(i, item){
				var $this = $(this);
				$this.attr('data-index', i);
			});

			this.autoHeight && this.initHeight();

			return this;

		}
		, initHeight: function(){
			this.$el.height(this.$el.height());
		}
		, register: function(){
			var that = this,
				options = this.options,
				tabItems = [options.header, options.headerItems].join(' ');

			this.$headerItems.off('click')
				.on('click', function(e){
					var $this = $(this),
						index = $this.data('index');

					if($this.hasClass(options.selectedClass)) return;

					that.$header.find('a.' + options.selectedClass).removeClass(options.selectedClass);
					$this.addClass(options.selectedClass);
					that.animate(index);

					e.stopPropagation();

			}, true);

			this.$el.swipeLeft(function(e){
				var activeIndex = parseInt(that.$contents.filter('.ui-selected').data('index'), 10) + 1;

				if(activeIndex < that.$contents.length){
					that.$header.find('a').eq(activeIndex).trigger('click');
					e.stopPropagation();
				}				
			});

			this.$el.swipeRight(function(e){
				var activeIndex = parseInt(that.$contents.filter('.ui-selected').data('index'), 10) - 1;

				if(activeIndex >= 0 ){
					that.$header.find('a').eq(activeIndex).trigger('click');
					e.stopPropagation();
				}
			});

			this.autoHeight && $window.resize(function(){
				that.initHeight();
			});

			return this;
		}
		, animate: function(index){

			if(!this.animating){
				var that     = this,
					options  = this.options,
					animateWidth = this.$el.width(),
					$visible = this.$contents.filter('.' + options.selectedClass),
					$element = this.$contents.eq(index),
					visible  = $visible.get(0),
					element  = $element.get(0),
					visibleIndex = $visible.data('index'),
					average  = animateWidth / options.duration * 10,
					value    = 0,
					elInitLeft,
					viInitLeft;

				this.selectedIndex = index;

				console.log('tab切换开始')
				console.log('宽度：' + animateWidth);
				console.log('时间：' + options.duration);
				console.log('速度：' + average);

				// 初始化位置， 如果当前点击的tab在已选中的tab之后则向左滚动，否则向右
				if(visibleIndex < index){
					elInitLeft = animateWidth;
					viInitLeft = 0;
				}else{
					elInitLeft = -animateWidth;
					viInitLeft = 0;
				}

				this.animating = true;
				this.$el.addClass('changing');

				if(this.useTransform){
					setElementPos(element, -elInitLeft, 0);
					setElementPos(visible, -viInitLeft, 0);
				}else{
					$element.css('left', elInitLeft);
					$visible.css('left', viInitLeft);
				}

				$element.addClass('animating')
						.css({
							width: animateWidth
						});

				$visible.addClass('animating')
						.css({
							width: animateWidth
						});

				// 防止背景透明
				!this.setHeighted && that.$el.height(Math.max(that.$el.height() || 0, $visible.height(), $element.height()) + this.headerHeight);

				this.trigger('beforeAnimate');


				animateFrame(function(){
					value += average;

					if(visibleIndex < index){
						if(that.useTransform){
							setElementPos(element, (animateWidth - value), 0);
							setElementPos(visible, -value, 0);
						}else{
							$visible.css('left', -value);
							$element.css('left', animateWidth - value);
						}
					}else{

						if(that.useTransform){
							setElementPos(element, -(animateWidth - value), 0);
							setElementPos(visible, value, 0);
						}else{
							$visible.css('left', value);
							$element.css('left', -(animateWidth - value));
						}
					}

					if(value >= (animateWidth - average)){
						$element.removeClass('animating').addClass(options.selectedClass).css('width', '');
						$visible.removeClass(['animating', options.selectedClass].join(' ')).css({
							width: ''
						});

						if(that.useTransform){
							setElementPos(visible, 0, 0);
							setElementPos(element, 0, 0);
						}else{
							$visible.css('left', 0);
							$element.css('left', 0);
						}

						!this.setHeighted && setTimeout(function(){
							that.$el.height('auto');
						}, 10);
						that.animating = false;
						that.$el.removeClass('changing');

						that.trigger('animated');
						return true;
					}
				});
			}
			return this;
		}
		, switchTo: function(index, effect){
			var options  = this.options,
				$tabCase = this.$headerItems.eq(index).addClass(options.selectedClass);
				$content = this.$contents.eq(index).addClass(options.selectedClass);

			if(effect === 'fade'){
				$content.fadeIn(options.duration);
			}

			this.$headerItems.not($tabCase).removeClass(options.selectedClass);
			this.$contents.not($content).removeClass(options.selectedClass);

			this.trigger('animated');
		}
		, animateNext: function(){
			this.$headerItems.filter('.' + this.options.selectedClass).next().trigger('click');
			return this;
		}
		, animatePrev: function(){
			this.$headerItems.filter('.' + this.options.selectedClass).prev().trigger('click');
			return this;
		}
		, tabs: function(index){
			return this.$contents.eq(index);
		}
		, currentTab: function(){
			return this.$contents.eq(this.selectedIndex);
		}

	};

	return Tabs;
});