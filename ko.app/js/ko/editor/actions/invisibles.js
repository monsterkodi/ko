var _k_

class Invisibles
{
    constructor (editor)
    {
        this.editor = editor
    
        this.onLineChanged = this.onLineChanged.bind(this)
        this.onLineInserted = this.onLineInserted.bind(this)
        this.onFile = this.onFile.bind(this)
        this.editor.on('file',this.onFile)
    }

    del ()
    {
        return this.editor.removeListener('file',this.onFile)
    }

    onFile (file)
    {
        if (window.stash.get(`invisibles|${file}`))
        {
            return this.show()
        }
        else
        {
            return this.clear()
        }
    }

    onLineInserted (li)
    {
        var kind, line

        line = this.editor.line(li)
        kind = line.endsWith(' ') && 'trailing' || 'newline'
        return this.editor.meta.add({line:li,html:'&#9687',start:line.length,end:line.length,yOffset:-1,clss:'invisible ' + kind})
    }

    onLineChanged (li)
    {
        var metas

        metas = this.editor.meta.metasAtLineIndex(li).filter(function (m)
        {
            return m[2].clss.startsWith('invisible')
        })
        if (metas.length)
        {
            this.editor.meta.delMeta(metas[0])
            return this.onLineInserted(li)
        }
    }

    activate ()
    {
        var _1_20_

        window.stash.set(`invisibles|${((_1_20_=this.editor.currentFile) != null ? _1_20_ : this.editor.name)}`,true)
        return this.show()
    }

    deactivate ()
    {
        window.stash.set(`invisibles|${this.editor.currentFile}`)
        return this.clear()
    }

    clear ()
    {
        this.editor.removeListener('lineChanged',this.onLineChanged)
        this.editor.removeListener('lineInserted',this.onLineInserted)
        return this.editor.meta.delClass('invisible')
    }

    show ()
    {
        var li

        this.clear()
        this.editor.on('lineChanged',this.onLineChanged)
        this.editor.on('lineInserted',this.onLineInserted)
        for (var _109_19_ = li = 0, _109_23_ = this.editor.numLines(); (_109_19_ <= _109_23_ ? li < this.editor.numLines() : li > this.editor.numLines()); (_109_19_ <= _109_23_ ? ++li : --li))
        {
            this.onLineInserted(li)
        }
    }
}

export default {actions:{toggleInvisibles:{name:'Toggle Invisibles',text:'toggle invisibles for current file',combo:'ctrl+i'}},toggleInvisibles:function ()
{
    var _1_13_

    if (!this.invisibles)
    {
        return
    }
    if (window.stash.get(`invisibles|${((_1_13_=this.currentFile) != null ? _1_13_ : this.name)}`,false))
    {
        return this.invisibles.deactivate()
    }
    else
    {
        return this.invisibles.activate()
    }
},initInvisibles:function ()
{
    var _130_35_

    return this.invisibles = ((_130_35_=this.invisibles) != null ? _130_35_ : new Invisibles(this))
}}