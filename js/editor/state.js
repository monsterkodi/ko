// monsterkodi/kode 0.223.0

var _k_

var Immutable, kerror, kstr

kerror = require('kxk').kerror
kstr = require('kxk').kstr

Immutable = require('seamless-immutable')
class State
{
    constructor (opt)
    {
        var lines, y, _20_31_

        if ((opt != null) && Immutable.isImmutable(opt))
        {
            this.s = opt
        }
        else
        {
            lines = ((_20_31_=(opt != null ? opt.lines : undefined)) != null ? _20_31_ : [])
            y = lines.length === 0 && -1 || 0
            this.s = Immutable({lines:lines,cursors:[[0,y]],selections:[],highlights:[],main:0})
        }
    }

    text (n = '\n')
    {
        return this.s.lines.join(n)
    }

    tabline (i)
    {
        return this.s.lines[i]
    }

    line (i)
    {
        if (!(this.s.lines[i] != null))
        {
            kerror(`editor/state -- requesting invalid line at index ${i}?`)
            return ''
        }
        return kstr.detab(this.s.lines[i])
    }

    lines ()
    {
        return this.s.lines.map(function (l)
        {
            return kstr.detab(l)
        })
    }

    cursors ()
    {
        return this.s.cursors.asMutable({deep:true})
    }

    highlights ()
    {
        return this.s.highlights.asMutable({deep:true})
    }

    selections ()
    {
        return this.s.selections.asMutable({deep:true})
    }

    main ()
    {
        return this.s.main
    }

    cursor (i)
    {
        return (this.s.cursors[i] != null ? this.s.cursors[i].asMutable({deep:true}) : undefined)
    }

    selection (i)
    {
        return (this.s.selections[i] != null ? this.s.selections[i].asMutable({deep:true}) : undefined)
    }

    highlight (i)
    {
        return (this.s.highlights[i] != null ? this.s.highlights[i].asMutable({deep:true}) : undefined)
    }

    numLines ()
    {
        return this.s.lines.length
    }

    numCursors ()
    {
        return this.s.cursors.length
    }

    numSelections ()
    {
        return this.s.selections.length
    }

    numHighlights ()
    {
        return this.s.highlights.length
    }

    mainCursor ()
    {
        return this.s.cursors[this.s.main].asMutable({deep:true})
    }

    setSelections (s)
    {
        return new State(this.s.set('selections',s))
    }

    setHighlights (h)
    {
        return new State(this.s.set('highlights',h))
    }

    setCursors (c)
    {
        return new State(this.s.set('cursors',c))
    }

    setMain (m)
    {
        return new State(this.s.set('main',m))
    }

    changeLine (i, t)
    {
        return new State(this.s.setIn(['lines',i],t))
    }

    insertLine (i, t)
    {
        var l

        l = this.s.lines.asMutable()
        l.splice(i,0,t)
        return new State(this.s.set('lines',l))
    }

    deleteLine (i)
    {
        var l

        l = this.s.lines.asMutable()
        l.splice(i,1)
        return new State(this.s.set('lines',l))
    }

    appendLine (t)
    {
        var l

        l = this.s.lines.asMutable()
        l.push(t)
        return new State(this.s.set('lines',l))
    }

    addHighlight (h)
    {
        var m

        m = this.s.highlights.asMutable()
        m.push(h)
        return new State(this.s.set('highlights',m))
    }
}

module.exports = State