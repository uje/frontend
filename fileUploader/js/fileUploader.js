define(['../../libs/jquery.min'], function (require, exports, module) {
    'use strict';

    /* 
        文件上传控件，
        实例化： new FileUploader({});
        参数请看：FileUploader.defaults
    */

    function FileUploader(options) {
        this.options = $.extend({}, FileUploader.defaults, options);
        this.initialize(this.options);
    }

    FileUploader.prototype = {
        initialize: function (options) {

            if (!options.el)
                throw new Error('FileUploader::options.el undefine');

            if (!options.url)
                throw new Error('FileUploader::options.url undefine');

            var $element = this.$el = $(options.el),
                name = ['FileUploader', Math.random().toString().substring(2)].join('');

            $element.addClass(options.containerClass);

            this.$form = $(['<form method="post" enctype="multipart/form-data" target="', name, '"></form>'].join('')).appendTo($element);
            this.$iframe = $(['<iframe style="position: absolute; opacity: 0;" name="', name, '"></iframe>'].join('')).appendTo($element);
            this.$file = $(['<input type="file"', ' name="', options.fileName, '" />'].join('')).appendTo(this.$form);
            this.$fileBtn = $('<span class=" btn file-btn"></span>').appendTo(this.$form);

            this.$form.prop('action', options.url);
            this.$file.prop('multiple', options.multiple);
            this.$fileBtn.text(options.btnText).addClass(options.btnClass);

            // 设置支持的mime类型
            if (options.mimeType)
                this.$file.prop('accept', options.mimeType);

            this.initEvent();
            this._call(options.onCreated);
        },
        initEvent: function () {
            this.$file.change($.proxy(this.fileUploadHandler, this));
            this.$iframe.load($.proxy(this.fileUploadCompleteHandler, this));
        },
        _call: function (fn, args) {
            if ($.isFunction(fn) === false)
                return;

            return fn.apply(this, args);
        },
        fileUploadHandler: function () {
            if (this._call(this.options.beforeUpload) === false)
                return;

            this.disabled();
            this.buildParams();
            this.uploadHandled = true;
            this.$form.submit();

        },
        fileUploadCompleteHandler: function () {

            if (!this.uploadHandled) {
                return;
            }

            var options = this.options,
                content = this.$iframe.contents().text(),
                json;

            try {
                json = $.parseJSON(content);

                if (json.Code != null && json.Code === 0)
                    this._call(options.uploadComplete, [json]);
                else
                    this._call(options.uploadError, [$.extend(json, { message: json.Message })]);

            } catch (e) {
                this._call(options.uploadError, [e]);
            }

            this.enabled();
            this._call(options.always);
            delete this.uploadHandled;
        },
        updateUrl: function (url) {
            if (!url) throw Error('FileUploader::updateUrl, url undefine');
            this.$form.prop('action', options.url);
        },
        buildParams: function () {
            var options = this.options,
                data = options.data,
                isFunc = $.isFunction(data),
                isObject = $.isPlainObject(data);

            if (isFunc) {
                data = options.data();
                this.$form.find('input[type="hidden"]').remove();
                this.createParamFieldList(data);
            } else if (isObject) {
                if (this.parameterFieldCreated)
                    return;

                this.createParamFieldList(data);
                this.parameterFieldCreated = true;
            }

        },

        // 创建参数列表
        createParamFieldList: function (dataObject) {
            for (var key in dataObject) {
                $('<input type="hidden" />').attr('name', key).val(dataObject[key]).appendTo(this.$form);
            }
        },

        // 禁用控件
        disabled: function () {
            this.$file.css('z-index', -1);
            this.$fileBtn.prop('disabled', true).text(this.options.loadingText);
        },

        // 启用控件
        enabled: function () {
            this.$file.css('z-index', 1);
            this.$fileBtn.prop('disabled', false).text(this.options.btnText);
        }
    };

    FileUploader.defaults = {
        fileName: 'file',
        btnText: '选择要导入文件...',
        loadingText: '请稍候...',
        btnClass: 'btn-primary',
        containerClass: 'file-group',
        multiple: false,
        mimeType: null,
        uploadError: function (e) {
            alert(['结果转换为Json失败', e.message].join(':') || '上传失败！');
        }
    };

    module.exports = exports = FileUploader;
});
