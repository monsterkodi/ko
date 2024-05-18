var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var Pigments

import kxk from "../../../kxk.js"
let matchr = kxk.matchr


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
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                rng = list[_a_]
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
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                m = list[_a_]
                this.editor.meta.delMeta(m)
            }
        }
        return this.onLineInserted(li)
    }

    Pigments.prototype["onFile"] = function (file)
    {
        if (window.stash.get(`pigments|${file}`))
        {
            return this.pigmentize()
        }
    }

    Pigments.prototype["activate"] = function ()
    {
        window.stash.set(`pigments|${this.editor.currentFile}`,true)
        return this.pigmentize()
    }

    Pigments.prototype["deactivate"] = function ()
    {
        window.stash.set(`pigments|${this.editor.currentFile}`)
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

        this.editor.on('lineChanged',this.onLineChanged)
        this.editor.on('lineInserted',this.onLineInserted)
        for (var _a_ = li = 0, _b_ = this.editor.numLines(); (_a_ <= _b_ ? li < this.editor.numLines() : li > this.editor.numLines()); (_a_ <= _b_ ? ++li : --li))
        {
            this.onLineInserted(li)
        }
    }

    return Pigments
})()

export default {actions:{togglePigments:{name:'Toggle Pigments',text:'toggle pigments for current file',combo:'command+alt+ctrl+p'}},initPigments:function ()
{
    var _116_31_

    return this.pigments = ((_116_31_=this.pigments) != null ? _116_31_ : new Pigments(this))
},togglePigments:function ()
{
    var _121_21_, _123_21_

    if (window.stash.get(`pigments|${this.currentFile}`,false))
    {
        return (this.pigments != null ? this.pigments.deactivate() : undefined)
    }
    else
    {
        return (this.pigments != null ? this.pigments.activate() : undefined)
    }
}}