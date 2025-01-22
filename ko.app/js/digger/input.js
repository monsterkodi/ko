var _k_ = {isArr: function (o) {return Array.isArray(o)}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var input


input = (function ()
{
    function input (actor)
    {
        this.actor = actor
    
        this["onKeyUp"] = this["onKeyUp"].bind(this)
        this["onKeyDown"] = this["onKeyDown"].bind(this)
        this["init"] = this["init"].bind(this)
        this.downKeys = {}
        this.actionMap = {}
        this.keyMap = {}
        this.action = {}
    }

    input.prototype["init"] = function (actionMap)
    {
        var action, key, keys

        this.actionMap = actionMap
    
        for (action in this.actionMap)
        {
            keys = this.actionMap[action]
            if (_k_.isArr(keys))
            {
                var list = _k_.list(keys)
                for (var _a_ = 0; _a_ < list.length; _a_++)
                {
                    key = list[_a_]
                    this.keyMap[key] = action
                }
            }
            else
            {
                this.keyMap[keys] = action
            }
        }
    }

    input.prototype["onKeyDown"] = function (keyInfo)
    {
        var action

        this.downKeys[keyInfo.combo] = true
        if (!keyInfo.event.repeat)
        {
            if (action = this.keyMap[keyInfo.combo])
            {
                this.action[action] = true
                return this.actor.startAction(action)
            }
        }
    }

    input.prototype["onKeyUp"] = function (keyInfo)
    {
        var action

        delete this.downKeys[keyInfo.combo]
        if (action = this.keyMap[keyInfo.combo])
        {
            delete this.action[action]
            return this.actor.stopAction(action)
        }
    }

    return input
})()

export default input;