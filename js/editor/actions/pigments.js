// monsterkodi/kode 0.256.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var matchr, Pigments

matchr = require('kxk').matchr


Pigments = (function ()
{
    function Pigments (editor)
    {
        var hexa, rgb, rgba, trio

        this.editor = editor
    
        this["onFile"] = this["onFile"].bind(this)
        this["onLineChanged"] = this["onLineChanged"].bind(this)
        this["onLineInserted"] = this["onLineInserted"].bind(this)
        this.test = /(#|0x)[a-fA-F0-9]{3}|rgba?/
        trio = /#[a-fA-F0-9]{3}(?![\w\d])/
        hexa = /#[a-fA-F0-9]{6}|0x[a-fA-F0-9]{6}(?![\w\d])/
        rgb = /rgb\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\)/
        rgba = /rgba\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\,\s*\d+\.?\d*\s*\)/
        this.regexps = [[trio,'trio'],[hexa,'hexa'],[rgb,'rgb'],[rgba,'rgbaa']]
        this.editor.on('file',this.onFile)
    }

    Pigments.prototype["del"] = function ()
    {
        return this.editor.removeListener('file',this.onFile)
    }

    Pigments.prototype["onLineInserted"] = function (li)
    {
        var color, line, ri, rng, rngs

        line = this.editor.line(li)
        if (this.test.test(line))
        {
            rngs = matchr.ranges(this.regexps,line)
            ri = -1
            var list = _k_.list(rngs)
            for (var _38_20_ = 0; _38_20_ < list.length; _38_20_++)
            {
                rng = list[_38_20_]
                ri++
                color = (rng.match.startsWith('0x') ? "#" + rng.match.slice(2) : rng.match)
                this.editor.meta.add({line:li,start:line.length + 2 + ri * 3,end:line.length + 2 + ri * 3 + 2,clss:'pigment',style:{backgroundColor:color}})
            }
        }
    }

    Pigments.prototype["onLineChanged"] = function (li)
    {
        var m, metas

        metas = this.editor.meta.metasAtLineIndex(li).filter(function (m)
        {
            return m[2].clss === 'pigment'
        })
        if (metas.length)
        {
            var list = _k_.list(metas)
            for (var _59_18_ = 0; _59_18_ < list.length; _59_18_++)
            {
                m = list[_59_18_]
                this.editor.meta.delMeta(m)
            }
        }
        return this.onLineInserted(li)
    }

    Pigments.prototype["onFile"] = function (file)
    {
        if (window.state.get(`pigments|${file}`))
        {
            return this.pigmentize()
        }
    }

    Pigments.prototype["activate"] = function ()
    {
        window.state.set(`pigments|${this.editor.currentFile}`,true)
        return this.pigmentize()
    }

    Pigments.prototype["deactivate"] = function ()
    {
        window.state.set(`pigments|${this.editor.currentFile}`)
        return this.clear()
    }

    Pigments.prototype["clear"] = function ()
    {
        this.editor.removeListener('lineChanged',this.onLineChanged)
        this.editor.removeListener('lineInserted',this.onLineInserted)
        return this.editor.meta.delClass('pigment')
    }

    Pigments.prototype["pigmentize"] = function ()
    {
        var li

        this.clear()
        this.editor.on('lineChanged',this.onLineChanged)
        this.editor.on('lineInserted',this.onLineInserted)
        for (var _104_19_ = li = 0, _104_23_ = this.editor.numLines(); (_104_19_ <= _104_23_ ? li < this.editor.numLines() : li > this.editor.numLines()); (_104_19_ <= _104_23_ ? ++li : --li))
        {
            this.onLineInserted(li)
        }
    }

    return Pigments
})()

module.exports = {actions:{togglePigments:{name:'Toggle Pigments',text:'toggle pigments for current file',combo:'command+alt+shift+p',accel:'alt+ctrl+shift+p'}},initPigments:function ()
{
    var _117_31_

    return this.pigments = ((_117_31_=this.pigments) != null ? _117_31_ : new Pigments(this))
},togglePigments:function ()
{
    if (window.state.get(`pigments|${this.currentFile}`))
    {
        return this.pigments.deactivate()
    }
    else
    {
        return this.pigments.activate()
    }
}}