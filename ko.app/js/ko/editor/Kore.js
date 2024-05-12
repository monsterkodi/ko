var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}}

var Kore

import kxk from "../../kxk.js"
let events = kxk.events


Kore = (function ()
{
    _k_.extend(Kore, events)
    function Kore ()
    {
        this["get"] = this["get"].bind(this)
        this["set"] = this["set"].bind(this)
        return Kore.__super__.constructor.apply(this, arguments)
    }

    Kore.prototype["set"] = function (key, value)
    {
        stash.set(`kore|${key}`,value)
        return this.emit(key,value)
    }

    Kore.prototype["get"] = function (key, def)
    {
        return stash.get(`kore|${key}`,def)
    }

    return Kore
})()

export default window.kore = new Kore;