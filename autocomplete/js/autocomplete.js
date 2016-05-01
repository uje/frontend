'use strict';

var ajax    = require('./ajax'),
	Event   = require('./Event'),
	utils   = require('./utils'),
	emptyFn = function(){},
	slice = Array.prototype.slice;


function proxy(fun, thisTraget){
	return function(){

		// 将原this作为第一个参数
		fun.apply(thisTraget, [this].concat(slice.call(arguments)));
	};
}

function AutoComplete(){
	this.initialize.apply(this, arguments);
}

AutoComplete.prototype = {
	initialize: function(options){
		utils.extend(this, new Event());
		var options = this.options = utils.extend({}, AutoComplete.defaults, options),
			instance = this;

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
				this.keyupHandler(input);
				event.stopPropagation();
			}
		}, this), false);

		input.addEventListener('keydown', proxy(function(input, event){

			// 列表没数据时不响应按钮
			if(this.items == null || this.items.length < 1)
				return;

			switch(event.keyCode){
				case 38:
					if(this.focusIndex > 0){
						this.focusIndex--;
						this.itemFocus();
						var item = this.items[this.focusIndex];

						// 如果当前选中项不要视野范围则移动到视野范围
						if(instance.listContainer.scrollTop > item.offsetTop)
							instance.listContainer.scrollTop = item.offsetTop - instance.listContainer.offsetHeight + item.offsetHeight;
					}
				break;
				case 40:
					if(this.focusIndex < this.items.length - 1){
						this.focusIndex++;
						this.itemFocus();
						var item = this.items[this.focusIndex];

						// 如果当前选中项不要视野范围则移动到视野范围
						if(instance.listContainer.scrollTop + instance.listContainer.offsetHeight - item.offsetHeight < item.offsetTop)
							instance.listContainer.scrollTop = item.offsetTop;
					}
				break;
				case 13:
					this.items.forEach(function(item){
						if(item.classList.contains(options.itemFocusClass)){
							instance.fromEnter = true;
							item.click();
						}
					});
				break;
			}
		}, this), false);

		input.addEventListener('focus', function(){
			container.classList.add(options.focusClass);
		}, false);

		input.addEventListener('blur', function(){
			container.classList.remove(options.focusClass);
		},false);

		container.appendChild(input);

		// 创建列表
		var listHtml = options.buildList(),
			listContainer = this.listContainer = document.createElement('div'), list;

		listContainer.innerHTML = listHtml;
		listContainer.className = options.listContainerClass;
		list = this.list = listContainer.childNodes[0];
		list.className = options.listClass;
		container.appendChild(listContainer);
		list.addEventListener('click', proxy(this.itemClickHandler, this), false);

		// 计算空内容模板
		this.emptyTemplate = options.buildEmptyTemplate();
		container.style.display = 'inline-block';

		// 如果是传入的数据是数组，复制到数据源
		if(utils.isArray(options.data))
			this.data = options.data;

		document.addEventListener('click', function(){
			listContainer.style.display = 'none';
		},false);

		// 触发控件创建事件
		this.trigger('created');
	},
	keyupHandler: function(input, event){
		var instance = this,
			options  = this.options,
			value    = input.value.trim(), url ;

		if(this.timerID) 
			clearTimeout(this.timerID);

		// 如果没有关键词，隐藏结果
		if(value.trim() === ''){
			this.listContainer.style.display = 'none';
			return;
		}

		// 清掉回车过来的状态
		if(this.fromEnter){
			this.fromEnter = false;
			return;
		}

		// 当前值跟上次一样
		if(this.lastValue === value)
			return;

		// 保存当前值，防止同样的值重新搜索
		this.lastValue = value;

		// 如果是本地数据直接用函数过滤
		if(utils.isArray(options.data)){
			var filterData = this.filterData = options.filter(this.data, value);
			this.render(filterData);
			return;
		}

		
		url = options.data.replace('{0}', value);

		// 使用定时器来减少服务器压力
		this.timerID = setTimeout(function(){
			ajax({
				type: 'get',
				url: url,
				done: function(text){
					try{
						var data = instance.data = options.formatData(JSON.parse(text));
						instance.render(data);
					}catch(e){
						instance.list.innerHTML = instance.emptyTemplate;
						instance.listContainer.style.display = 'block';
					}
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
		
		// 找到 有item标识的节点
		if(!selectedItem.classList.contains(options.itemClass)){
			event.stopPropagation();
			return;
		}

		// 找到数据并转换数据
		var selectedIndex = this.focusIndex = selectedItem.getAttribute('data-index'),
			selectedData = (this.filterData || this.data)[selectedIndex],
			inputValue = options.formatSelectedData(selectedData); // 格式化选中的值

		this.input.value = inputValue;
		this.list.style.visibility = 'hidden';

		// 去除之前选中节点的选中class，给现在选中的节点加class
		this.items.forEach(function(item){
			item.classList.remove(options.selectedClass);
		});

		this.list.style.visibility = 'visible';
		this.input.focus();
		selectedItem.classList.add(options.selectedClass);
		this.trigger('selected', selectedData);

	},
	render: function(data){
		var instance = this,
			options = this.options,
			list    = this.list,
			items;

		if(data.length > 0){
			var listItemsHtml = data.map(function(item){
					return options.buildItem(item);
				}).join('');

			list.innerHTML = listItemsHtml;

			// 给数据列表加标识，加样式
			items = this.items = slice.call(list.childNodes);
			items.forEach(function(item, i){
				item.className = [options.itemClass, (i % 2 === 0 ? options.oddClass : options.evenClass)].join(' ');
				item.setAttribute('data-index', i);
				instance.focusIndex = 0;
				instance.itemFocus();
			});
		}else{
			list.innerHTML = this.emptyTemplate;
		}

		this.listContainer.style.display = 'block';
	},
	itemFocus: function(){
		var instance = this,
			options = this.options;

		this.items.forEach(function(item, index){
			if(index === instance.focusIndex){
				item.classList.add(options.itemFocusClass);
			}
			else
				item.classList.remove(options.itemFocusClass);
		})
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
	focusClass     : 'ac-focus',
	itemFocusClass : 'ac-item-focus',
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
	filter: function(data, value){
		var filterData = [],
			i = 0,
			l = data.length,
			item;

		for(; i<l; i++){
			item = data[i];

			if(new RegExp(value).test(item, 'gi'))
				filterData.push(item);
		}

		return filterData;

	},   // 过滤
	created: emptyFn,  // 控件创建后触发
	selected: emptyFn  // 选择后触发
};


module.exports = AutoComplete;