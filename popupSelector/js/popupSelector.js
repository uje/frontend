define(['./event', '../../libs/jquery.min', '../../libs/doT'], function (require, exports, module) {

    var Event = require('./event'),
        cacheData = {};

    function ajax(url, params, done, fail) {
        var parameters = $.param(params),
            joinCode = (url.indexOf('?') > -1 ? '&' : '?'),
            deferred = $.Deferred().
                        done(done).
                        fail(fail);

        url = [url, parameters].join(joinCode);

        if (url in cacheData)
            deferred.resolve(cacheData[url]);
        else {
            $.get(url, function (result) {
                cacheData[url] = result;
                deferred.resolve(result);
            }, 'json').fail(deferred.reject);
        }
    }

    function Drag(){
        this.initialize.apply(this, arguments);
    }

    Drag.prototype = {
        initialize: function(options){
            var me = this,
                $el = $(options.el),
                uniqueID = Math.random().toString().substring(2);

            this.$el = $el;
            this.uniqueID = uniqueID;
            this.$container = $(options.container);
            this.dragable = false;

            $el.on(['mousedown', uniqueID].join('.'), function(e){
                me.start(e);
                e.stopPropagation();
            }).
            on(['mouseup', uniqueID].join('.'), function(){
                me.dragable = false;
            });

            $(document).on(['mousemove', uniqueID].join('.'), function(e){
                me.dragable && me.move(e);
            });
        },
        start: function(e){
            var $container = this.$container,
                offset = $container.offset(),
                $doc = $(document);

            this.startArgs = {
                left: offset.left, 
                top: offset.top,
                x: e.clientX,
                y: e.clientY,
                maxLeft: $doc.width() - $container.width(),
                maxTop: $doc.height() - $container.height()
            };

            this.dragable = true;
        },
        move: function(e){
            var $doc =　$(document),
                startArgs = this.startArgs,
                offsetX = e.clientX - startArgs.x,
                offsetY = e.clientY - startArgs.y,
                newLeft = startArgs.left + offsetX,
                newTop = startArgs.top + offsetY;

            if(newLeft < 0)
                newLeft = 0;

            if(newTop < 0)
                newTop = 0;

            if(newLeft > startArgs.maxLeft)
                newLeft = startArgs.maxLeft;

            if(newTop > startArgs.maxTop)
                newTop = startArgs.maxTop;

            this.$container.css('left', newLeft);
            this.$container.css('top', newTop);
        },
        destory: function(){
            var me = this;

            ['mousedown', 'mouseup'].forEach(function(evtName){
                me.$el.off([evtName, me.uniqueID].join('.'));
            });

            $(document).off(['mousemove', me.uniqueID].join('.'));
        }
    };

    function PopupSelector(options) {
        $.extend(this, new Event()); // 扩展事件支持
        this.options = $.extend({}, PopupSelector.defaults, options);
        this.initialize(this.options);
    }

    PopupSelector.prototype = {
        initialize: function (options) {

            if (options.tabs == null)
                throw Error('PopupSelector::options.tabs undefine');

            this.create(options);
        },
        create: function (options) {
            var $popup, $mask, $popupHeader, $tabs, $popupContent, $popupFooter,
                i, l, tab, $tab, $content;

            this.$window = $(window);
            this.$root = $('body');
            this.$popup = $popup = $('<div class="c-popup"></div>').addClass(options.className);
            this.$mask = $mask = $('<div class="c-mask"></div>');
            this.$popupHeader = $popupHeader = $('<header class="c-header"></header>').appendTo($popup);
            this.$popupContent = $popupContent = $('<div class="c-contents"></div>').appendTo($popup);
            this.$popupFooter = $popupFooter = $('<footer class="c-footer" style="display: none"></footer>').appendTo($popup);
            this.$title = $('<h1></h1>').text(options.title || '').toggle(options.title != null).appendTo($popupHeader);
            this.$operation = $('<div class="c-operation"></div>').appendTo(this.$popupHeader);
            this.$tabs = $tabs = $('<ul class="c-tabs"></ul>').appendTo($popupHeader);
            this.$close = $('<a href="javascript:;" class="icon smaller close"></a>').appendTo($popupHeader);
            this.$pagintion = $('<div class="c-pagintion" style="display: none"></div>').appendTo(this.$operation);
            this.$pagePrev = $('<button type="button" class="btn btn-default" data-action="page" data-trigger="prev" disabled>上一页</button>').appendTo(this.$pagintion);
            this.$pageNext = $('<button type="button" class="btn btn-default" data-action="page" data-trigger="next" disabled>下一页</button>').appendTo(this.$pagintion);
            this.tabList = [];
            this.contentList = [];
            this.cacheParameter = Date.now(); //用来确定缓存版本

            // 生成tab内容
            for (i = 0, l = options.tabs.length; i < l; i++) {
                tab = options.tabs[i];
                $tab = $(this.render(options.tabTemplate, tab)).appendTo($tabs);
                $content = $(this.render(options.contentTemplate, tab)).html(options.contentLoadingTemplate).appendTo($popupContent);
                this.tabList.push($tab);
                this.contentList.push($content);
            }

            // 是否加入搜索
            if (options.search)
                this.$search = $('<input class="c-search" placeholder="输入关键词进行搜索."/>').prependTo(this.$operation.show());

            // 如果是多选则加入确定按钮
            if (options.multiple)
                this.$btnConfirm = $('<button type="button" class="btn btn-success" data-action="confirm" disabled></button>').text(options.confirmText).appendTo(this.$popupFooter.show());

            $mask.css('z-index', PopupSelector.zIndex++);
            $popup.css('z-index', PopupSelector.zIndex++);

            if (this.tabList.length < 2)
                this.$tabs.hide();

            this.$root.append($popup).append($mask);
            this.initEvent(options);
            this.trigger('created');
        },
        initEvent: function (options) {
            var that = this, searchTimer;

            if ($.isFunction(options.onItemSelected))
                this.on('item.selected', options.onItemSelected);

            if ($.isFunction(options.onCreated))
                this.on('created', options.onCreated);

            if ($.isFunction(options.onConfirm))
                this.on('confirm', options.onConfirm);

            if ($.isFunction(options.onTabShow))
                this.on('tab.show', options.onTabShow);

            if ($.isFunction(options.onShow))
                this.on('show', options.onShow);

            if ($.isFunction(options.onHide))
                this.on('hide', options.onHide);

            if ($.isFunction(options.onLoad))
                this.on('load', options.onLoad);

            if ($.isFunction(options.onFail))
                this.on('fail', options.onFail);

            // 窗体大小改变时重新计算遮罩层的大小
            $(window).on('resize', function () {

                if (that.$popup.is(':visible') && that.$follow == null)
                    that.computer();
            })
            .on('mousedown.close.popup', function (event) {
                if (that.$follow != null && that.$follow.is(event.target))
                    return;

                that.hide();
            });

            this.$popup.on('mousedown', function (event) {

                //禁止隐藏Popup
                event.stopPropagation();
            })
            .on('click.show.tab', '.c-tabs li', function () {

                // 点击标签的时候显示内容
                that.showTab($(this).index());
            })
            .on('click.item.selected', '.c-content-item', function () {
                var $this = $(this),
                    data = $this.data('value') || $this.text(),
                    _extraData = $this.data(),
                    selectedEventValue;

                if (!$.isEmptyObject(_extraData))
                    data = $.extend({}, _extraData, { value: data });

                // 如果规定了最多选择项则当前是选中的
                if (options.maxSelectLength && $this.hasClass(options.itemSelectedClass) === false &&
                    that.$currentContent.find(['.', options.itemSelectedClass].join('')).length > options.maxSelectLength) {
                    alert('最多只能选择{0}项！'.replace('{0}', options.maxSelectLength));
                    return;
                }

                selectedEventValue = that.trigger('item.selected', [data, options.tabs[that.currentIndex], that.$currentTab, that.$currentContent, $this]);

                // 多选时加入选中标识
                if (options.multiple) {

                    // 是否允许Item进行操作
                    if (selectedEventValue !== false)
                        $this.toggleClass(options.itemSelectedClass);

                    that.$btnConfirm.prop('disabled', that.$currentContent.find(['.', options.itemSelectedClass].join('')).length === 0);
                } else if (selectedEventValue !== false)
                    that.hide();
            })
            .on('click', '[data-action="confirm"]', function () {
                var selectedList = that.$currentContent.find(['.', options.itemSelectedClass].join('')).map(function () {
                    var $this = $(this),
                    data = $this.data('value') || $this.text(),
                    _extraData = $this.data();

                    return $.extend({}, _extraData, { value: data });
                }).toArray();

                if (selectedList.length === 0)
                    alert('请最少选择一项！');
                else if (that.trigger('confirm', [selectedList, options.tabs[that.currentIndex], that.$currentTab, that.$currentContent]) !== false)
                    that.hide();

            })
            .on('click', '[data-action="page"]', function () {

                // 点击页面按钮时加载页面
                var $this = $(this),
                    loadType = $this.data('trigger'),
                    currentTab = options.tabs[that.currentIndex],
                    currentData = currentTab.data,
                    offset = Math.max(0, loadType === 'next' ? (currentData.offset + currentData.limit) : currentData.offset - currentData.limit);

                that.ajaxLoad(currentTab, offset);

            })
            .on('keyup', '.c-search', function () {

                // 输入进行搜索
                searchTimer && clearTimeout(searchTimer)
                searchTimer = setTimeout(function () {
                    var currentTab = that.options.tabs[that.currentIndex],
                        currentData = currentTab.data;

                    if ($.isPlainObject(currentData)) {
                        currentData.offset = 0;
                        that.ajaxLoad(currentTab, currentData.offset);
                    }
                }, 600);
            })
            .on('click.close.popup', '.c-header .close', function () {
                that.hide();
            });

        },
        render: function (template, data) {
            return ($.isArray(data) ?
                data.map(function (item) { return doT.compile(template)(item); }).join('') :
                doT.compile(template)(data));
        },
        loadTabData: function ($content, data) {
            if (data && data.length > 0)
                $content.html(['<ul>', this.render(this.options.contentDataTemplate, data), '</ul>'].join('')).data('loaded', true);
            else
                $content.html(this.options.emptyDataTemplate);

            $content.data('height', $content.height());
            this.computer();
            this.trigger('load');
        },
        ajaxLoad: function (tab, offset) {
            var that = this,
                queryParams = { _cache: this.cacheParameter },
                options = this.options,
                ajaxSettings;

            this.$currentContent.html(options.contentLoadingTemplate);

            if (typeof (tab.data) === 'string')
                ajaxSettings = { url: tab.data };
            else if ($.isPlainObject(tab.data))
                ajaxSettings = tab.data;
            else
                throw Error('unsupport tab.data');

            if (this.options.search) {
                queryParams.search = this.$search.val();
            }

            if (ajaxSettings.limit) {
                queryParams.offset = ajaxSettings.offset = (offset || 0);
                queryParams.limit = ajaxSettings.limit;
                this.$pagintion.show();
            }

            tab.data = ajaxSettings;

            if ($.isFunction(tab.formatParameters)) {
                var parameters = tab.formatParameters(queryParams);

                if (parameters != null)
                    queryParams = parameters;
            }

            ajax(ajaxSettings.url, queryParams, function (data) {

                ajaxSettings.total = data.total || data.Total;
                that.togglePagintion();

                if ($.isFunction(options.format)) {
                    var formatedData = options.format(data);

                    if (formatedData != null)
                        data = formatedData;
                }

                if ($.isPlainObject(data))
                    data = data.data;

                that.loadTabData(that.$currentContent, data);
            }, function (e) {
                that.trigger('fail', [e]);
                that.ajaxFail(e);
            });
        },
        ajaxFail: function (e) {
            try {
                var json = $.parseJSON(e.responseText);
                this.$currentContent.html($(this.options.errorTemplate).html(json.Message));
            } catch (e) {
                alert(e.message);
            }
        },
        togglePagintion: function () {
            var currentTab = this.options.tabs[this.currentIndex],
                currentData = currentTab.data;

            this.$pagintion.show();
            this.$pagePrev.prop('disabled', currentData.offset === 0);
            this.$pageNext.prop('disabled', !currentData.total || currentData.total <= (currentData.offset + currentData.limit));
        },
        showTab: function (i) {
            var that = this,
                options = that.options,
                currentTab = options.tabs[i];

            if (i >= this.options.tabs.length)
                throw Error('PopupSelector::tabs index overflow');

            this.tabList.forEach(function ($tab, j) {
                $tab.toggleClass(options.selectedClass, i === j);
            });
            this.contentList.forEach(function ($content, j) {
                $content.toggleClass(options.selectedClass, i === j);

            });

            this.currentIndex = i;
            this.$currentTab = this.tabList[i];
            this.$currentContent = this.contentList[i];

            // 填充tab关键词
            if (options.search && $.isPlainObject(currentTab.data))
                this.$search.val(currentTab.data.seach);

            if (this.$currentContent.data('loaded') != true) {
                var dataType = (typeof currentTab.data);

                // 如果数据是url则使用ajax获取数据再加载
                if (currentTab.content != null) {
                    this.$currentContent.html(currentTab.content);
                } else {
                    if ($.isArray(currentTab.data))
                        this.loadTabData(this.$currentContent, currentTab.data);
                    else if (dataType === 'string' || dataType === 'object')
                        this.ajaxLoad(currentTab, 0);
                    else
                        throw Error(['PopupSelector::no support data format, index: ', i].join(''))
                }
            } else
                that.togglePagintion();

            this.trigger('tab.show', [this.$currentTab, this.$currentContent]);
        },
        show: function (follow) {
            var that = this;

            this.$popup.show();

            if (this.currentIndex == null)
                this.showTab(0);

            if (follow == null) {
                this.$popup.addClass(this.options.popupDialogClass);
                this.$mask.show();
                this.computer(); // 计算遮罩层的大小
                delete this.$follow;

                this.computer();

                if(this.drag != null){
                    this.drag.destory();
                    delete this.drag;
                }

                that.drag = new Drag({
                    el: that.$popupHeader,
                    container: that.$popup
                });

            }
            else {
                this.follow(follow); // 跟随元素
                this.$popup.removeClass(this.options.popupDialogClass);
            }

            this.trigger('show');
        },
        hide: function () {
            if (this.$popup.is(':visible')) {
                this.$popup.hide();
                this.$mask.hide();
                this.trigger('hide');
            }
        },
        computer: function () {
            var $window = this.$window,
                height = $window.height();

            if (this.$follow == null) {
                this.$currentContent.height(Math.min(this.$currentContent.data('height'), height - this.$popupHeader.outerHeight() - this.$popupFooter.outerHeight() - 30));
                this.$currentContent.css('overflow-y', 'auto');

                this.$popup.css({
                    left: ($window.width() - this.$popup.outerWidth()) / 2,
                    top : ($window.height() - this.$popup.outerHeight()) / 2
                });
            }

            this.$mask.css({
                width: Math.max(document.documentElement.scrollWidth, $window.width()),
                height: Math.max(document.documentElement.scrollHeight, height)
            });
        },
        follow: function (element) {
            if (!element) return;

            var $follow = $(element),
                $popup = this.$popup,
                $window = this.$window,
                options = this.options,
                offset = $follow.offset(),
                formHeight = $window.height(),
                formWidth = $window.width(),
                popupWidth = $popup.outerWidth(),
                popupHeight = $popup.outerHeight(),
                left, top, alignments;

            alignments = (function () {
                var _alignments = {};

                ['left', 'right', 'top', 'bottom'].forEach(function (direction) {
                    _alignments[direction] = options.alignments.indexOf(direction) > -1;
                });

                return _alignments;
            })();

            if (!alignments.top && (alignments.bottom || (offset.top + popupHeight - $window.scrollTop()) < formHeight))
                top = (offset.top + $follow.outerHeight());
            else
                top = offset.top - popupHeight;

            if (!alignments.right && (alignments.left || (offset.left + popupWidth - $window.scrollLeft()) < formWidth))
                left = offset.left;
            else
                left = offset.left + $follow.width() - popupWidth + options.fixedLeft;

            this.$follow = $follow;
            $popup.css({ left: left, top: top });
        },
        clearSelect: function () {
            var options = this.options;
            this.$currentContent.find(['.', options.selectedClass].join('')).removeClass(options.selectedClass);
            this.$btnConfirm.prop('disabled', true);
        }
    };

    PopupSelector.list = {};
    PopupSelector.zIndex = 1024;
    PopupSelector.defaults = {
        tabTemplate: '<li class="c-tab"><a href="javascript:;">{{=it.name}}</a></li>',
        contentTemplate: '<section class="c-content"></section>',
        contentLoadingTemplate: '<div class="c-loading">请稍候...</div>',
        contentDataTemplate: ['<li class="c-content-item"',
            '{{? it.data}}',
                '{{for(var key in it.data){ }}',
                    'data-{{=key}}="{{=it.data[key]}}" ',
                '{{ } }} ',
            '{{?}}>',
            '<a href="javascript:;">{{=it.text}}</a></li>'].join(''),
        emptyDataTemplate: '<div class="c-empty">没有数据.</div>',
        errorTemplate: '<div class="c-empty"></div>',
        popupDialogClass: 'c-dialog',
        selectedClass: 'c-selected',
        itemSelectedClass: 'c-selected',
        confirmText: '确定',
        alignments: '',
        fixedLeft: 0,
        fixedTop: 0,
        multiple: false,
        maxSelectLength: null
    };

    // 对话框创建入口
    PopupSelector.create = function (options, id) {
        options = $.isPlainObject(options) ? options : {};
        var defineID = (id != null);

        if (defineID && (id in PopupSelector.list))
            return PopupSelector.list[options.id];

        var popup = new PopupSelector(options);

        if (defineID)
            PopupSelector.list[id] = popup;

        return popup;
    };

    module.exports = exports = PopupSelector;
});