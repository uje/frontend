'use strict';

var ajax    = require('./ajax'),
	Event   = require('./Event'),
	utils   = require('./utils'),
	emptyFn = function(){},
	slice = Array.prototype.slice;


function proxy(fun, thisTraget){
	return function(){

		// 将原this作为第一个参数
		var args = [this].concat(slice.call(arguments));
		fun.apply(thisTraget, args);
	};
}

function AutoComplete(){
	this.initialize.apply(this, arguments);
}

AutoComplete.prototype = {
	initialize: function(options){
		utils.extend(this, new Event());
		var options = this.options = utils.extend({}, AutoComplete.defaults, options);

		var input = this.input = document.querySelector(options.el);
		input.autocomplete = 'off';

		// 创建一个容器，替换掉input, 然后把input放入容器，这样后面的列表不用计算位置
		var container = this.container = document.createElement('div');
		container.style.display = 'none';
		container.className = options.containerClass;
		input.parentNode.replaceChild(container, input);
		input.classList.add(options.inputClass);
		input.addEventListener('keyup', proxy(this.keyupHandler, this), false);

		// 注册事件，有关键词有数据的时候显示控件
		input.addEventListener('click', proxy(function(input, event){

			if(input.value.trim() != '' && this.data != null && this.data.length > 0){
				this.listContainer.style.display = 'block';
				event.stopPropagation();
			}
		}, this), false);
		container.appendChild(input);

		// 创建列表
		var listHtml = options.buildList(),
			listContainer = this.listContainer = document.createElement('div'),
			list;

		listContainer.innerHTML = listHtml;
		listContainer.className = options.listContainerClass;
		list = this.list = listContainer.childNodes[0];
		list.className = options.listClass;
		container.appendChild(listContainer);
		list.addEventListener('click', proxy(this.itemClickHandler, this), false);

		// 计算空内容模板
		this.emptyTemplate = options.buildEmptyTemplate();
		container.style.display = 'inline-block';

		document.addEventListener('click', function(){
			listContainer.style.display = 'none';
		},false);

		// 触发控件创建事件
		this.trigger('created');
	},
	keyupHandler: function(input, event){
		var instance = this,
			options  = this.options,
			value    = input.value,
			url      = options.url.replace('{0}', value);

		if(this.timerID) 
			clearTimeout(this.timerID);

		// 如果没有关键词，隐藏结果
		if(value.trim() === ''){
			this.listContainer.style.display = 'none';
			return;
		}

		// 使用定时器来减少服务器压力
		this.timerID = setTimeout(function(){
			ajax({
				type: 'get',
				url: url,
				done: function(text){
					try{
						var data = instance.data = options.formatData(JSON.parse(text)),
							listItemsHtml = data.map(function(item){
								return options.buildItem(item);
							}).join('');

						instance.list.innerHTML = listItemsHtml;

						slice.call(instance.list.childNodes).forEach(function(item, i){
							item.className = [options.itemClass, (i % 2 === 0 ? options.oddClass : options.evenClass)].join(' ');
							item.setAttribute('data-index', i);
						});
					}catch(e){
						instance.list.innerHTML = instance.emptyTemplate;
					}

					instance.listContainer.style.display = 'block';
				},
				fail: function(){
					instance.list.innerHTML = instance.emptyTemplate;
				}
			});
		}, options.interval);

	},
	itemClickHandler: function(list, event){
		var options = this.options,
			selectedItem = event.target.classList.contains(options.itemClass) ? event.target : event.target.parentNode;
		
		if(!selectedItem.classList.contains(options.itemClass))
			event.stopPropagation();

		var selectedData = this.data[selectedItem.getAttribute('data-index')],
			inputValue = options.formatSelectedData(selectedData); // 格式化选中的值

		this.input.value = inputValue;
		this.list.style.visibility = 'hidden';

		slice.call(this.list.childNodes).forEach(function(item){
			item.classList.remove(options.selectedClass);
		});

		this.list.style.visibility = 'visible';
		selectedItem.classList.add(options.selectedClass);
		this.trigger('selected', selectedData);

	}
}



AutoComplete.defaults = {
	interval       : 500,
	containerClass : 'ac-container',
	inputClass     : 'ac-input',
	listContainerClass: 'ac-list-container',
	listClass      : 'ac-list',
	itemClass      : 'ac-item',
	oddClass       : 'ac-odd',
	evenClass      : 'ac-even',
	selectedClass  : 'ac-selected',
	buildList: function(){
		return '<ul></ul>';
	},
	buildItem: function(item){
		return '<li><a href="javascript:;">' + item +'</a></li>';
	},
	buildEmptyTemplate: function(){
		return '<li class="ac-empty">没有数据.</li>';
	},
	formatData: function(data){
		return data;
	},
	formatSelectedData: function(origialData){
		return origialData;
	},
	created: emptyFn,  // 控件创建后触发
	selected: emptyFn  // 选择后触发
};


module.exports = AutoComplete;