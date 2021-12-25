// monsterkodi/kode 0.228.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var matchr

matchr = require('kxk').matchr

class Pigments
{
    constructor (editor)
    {
        var hexa, rgb, rgba, trio

        this.editor = editor
    
        this.onFile = this.onFile.bind(this)
        this.onLineChanged = this.onLineChanged.bind(this)
        this.onLineInserted = this.onLineInserted.bind(this)
        this.test = /#[a-fA-F0-9]{3}|rgba?/
        trio = /#[a-fA-F0-9]{3}(?![\w\d])/
        hexa = /#[a-fA-F0-9]{6}(?![\w\d])/
        rgb = /rgb\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\)/
        rgba = /rgba\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\,\s*\d+\.?\d*\s*\)/
        this.regexps = [[trio,'trio'],[hexa,'hexa'],[rgb,'rgb'],[rgba,'rgbaa']]
        this.editor.on('file',this.onFile)
    }

    del ()
    {
        return this.editor.removeListener('file',this.onFile)
    }

    onLineInserted (li)
    {
        var line, ri, rng, rngs

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
                this.editor.meta.add({line:li,start:line.length + 2 + ri * 3,end:line.length + 2 + ri * 3 + 2,clss:'pigment',style:{backgroundColor:rng.match}})
            }
        }
    }

    onLineChanged (li)
    {
        var m, metas

        metas = this.editor.meta.metasAtLineIndex(li).filter(function (m)
        {
            return m[2].clss === 'pigment'
        })
        if (metas.length)
        {
            var list = _k_.list(metas)
            for (var _58_18_ = 0; _58_18_ < list.length; _58_18_++)
            {
                m = list[_58_18_]
                this.editor.meta.delMeta(m)
            }
        }
        return this.onLineInserted(li)
    }

    onFile (file)
    {
        if (window.state.get(`pigments|${file}`))
        {
            return this.pigmentize()
        }
    }

    activate ()
    {
        window.state.set(`pigments|${this.editor.currentFile}`,true)
        return this.pigmentize()
    }

    deactivate ()
    {
        window.state.set(`pigments|${this.editor.currentFile}`)
        return this.clear()
    }

    clear ()
    {
        this.editor.removeListener('lineChanged',this.onLineChanged)
        this.editor.removeListener('lineInserted',this.onLineInserted)
        return this.editor.meta.delClass('pigment')
    }

    pigmentize ()
    {
        var li

        this.clear()
        this.editor.on('lineChanged',this.onLineChanged)
        this.editor.on('lineInserted',this.onLineInserted)
        for (var _103_19_ = li = 0, _103_23_ = this.editor.numLines(); (_103_19_ <= _103_23_ ? li < this.editor.numLines() : li > this.editor.numLines()); (_103_19_ <= _103_23_ ? ++li : --li))
        {
            this.onLineInserted(li)
        }
    }
}

module.exports = {actions:{togglePigments:{name:'Toggle Pigments',text:'toggle pigments for current file',combo:'command+alt+shift+p',accel:'alt+ctrl+shift+p'}},initPigments:function ()
{
    var _116_31_

    return this.pigments = ((_116_31_=this.pigments) != null ? _116_31_ : new Pigments(this))
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