define(function(require, exports){
	var Tabs = require('./tabs');

	function Slider(config){

		$.extend(this, {
			interval: 3000
			, hoverStop: true
		}, config);

		this.pause = false;
		this.left2Right = true;
		this.animateIndex = 0;
		this.initialize();
		this.autoStart === true && this.start();
	}

	Slider.prototype = {
		initialize: function(){

			// 初始化tab控件
			var tabs = this.tabs = new Tabs({ 
				el:this.el
				, duration: this.duration 
			});
		}
		, start: function(){
			this.timeId = setInterval($.proxy(this.exChange, this), this.interval);
		}
		, exChange : function(){

			if(this.pause) return;

			// 初始化从左到右滚动
			if(this.left2Right){

				this.animateIndex++;
				this.tabs.animateNext();

				if(this.animateIndex === this.tabs.length - 1){
					this.left2Right = false;
				}
			}else{

				// 当滚动到最后一个后从右向左滚动
				this.animateIndex--;
				this.tabs.animatePrev();

				if(this.animateIndex === 0){
					this.left2Right = true;
				}
			}
		}
		, stop: function(){
			clearInterval(this.timeId);
		}
	};


	return Slider;
});