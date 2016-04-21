// 事件代理
function Event() {
    this.events = {};
}

Event.prototype = {

    // 注册事件
    on: function (eventType, handler) {

        if (eventType == null)
            throw new Error('Event::eventType undefine');

        // 如果事件名称包含逗号则注册多个事件
        if (eventType.indexOf(',') > -1) {
            var that = this,
                eventTypeList = eventType.split(',');

            eventTypeList.forEach(function (name) {
                if ((name = name.trim()) !== '') that.on(name, handler);
            });
        } else {
            if (!(eventType in this.events))
                this.events[eventType] = [];

            if ($.isFunction(handler))
                this.events[eventType].push(handler);
        }
        return this;
    },

    // 取消事件
    off: function (eventType, handler) {

        if (!(eventType in this.events))
            return;

        if (handler == null) {
            delete this.events[eventType];
            return; 
        }

        var i, l, h, handlers = this.events[eventType];

        for (i = 0, l = handlers.length; i < l; i++) {

            if ((h = handlers[i]) == handler)
                handlers.splice(i, 1);
        }
        return this;
    },

    // 触发事件
    trigger: function (eventType, data) {

        if (eventType == null)
            throw new Error('Event::eventType undefine');

        this.currentEventType = eventType;

        var i, l, returnValue, handlers = this.events[eventType];
        console.log('trigger ' + eventType);

        if (handlers) {
            for (i = 0, l = handlers.length; i < l; i++) {
                returnValue = handlers[i].apply(this, data);

                if (returnValue != null && returnValue !== true)
                    return returnValue;
            }
        }
        return this;
    }
};

module.exports = Event;