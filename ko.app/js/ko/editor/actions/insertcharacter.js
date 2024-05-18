var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, lpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s=c+s} return s}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr
let reversed = kxk.reversed

export default {insertCharacter:function (ch)
{
    var cc, cline, nc, newCursors, sline

    if (ch === '\n')
    {
        return this.newline()
    }
    if (this.salterMode && this.insertSalterCharacter(ch))
    {
        return
    }
    this.do.start()
    this.clampCursorOrFillVirtualSpaces()
    if (!_k_.empty(this.surroundCharacters))
    {
        if (_k_.in(ch,this.surroundCharacters))
        {
            if (this.insertSurroundCharacter(ch))
            {
                this.do.end()
                return
            }
        }
    }
    this.deleteSelection()
    newCursors = this.do.cursors()
    var list = _k_.list(newCursors)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        cc = list[_a_]
        cline = this.do.line(cc[1])
        sline = this.twiggleSubstitute(cline,cc,ch)
        if (sline)
        {
            this.do.change(cc[1],sline)
        }
        else
        {
            this.do.change(cc[1],kstr.splice(cline,cc[0],0,ch))
            var list1 = _k_.list(positionsAtLineIndexInPositions(cc[1],newCursors))
            for (var _b_ = 0; _b_ < list1.length; _b_++)
            {
                nc = list1[_b_]
                if (nc[0] >= cc[0])
                {
                    nc[0] += 1
                }
            }
        }
    }
    this.do.setCursors(newCursors)
    this.do.end()
    return this.emitEdit('insert')
},twiggleSubstitute:function (line, cursor, char)
{
    var sub, substitute

    if (cursor[0] && line[cursor[0] - 1] === '~')
    {
        substitute = ((function ()
        {
            switch (char)
            {
                case '>':
                    return '▸'

                case '.':
                    return '▶'

                case '<':
                    return '◂'

                case ',':
                    return '◀'

                case 'v':
                    return '▾'

                case 'V':
                    return '▼'

                case '^':
                    return '▴'

                case '6':
                    return '▲'

                case 'd':
                    return '◆'

                case 'c':
                    return '●'

                case 'o':
                    return '○'

                case 'r':
                    return '⮐'

                case 's':
                    return '▪'

                case 'S':
                    return '■'

                case 't':
                    return '➜'

                case 'X':
                    return '✘'

                case 'O':
                    return '✔'

            }

        }).bind(this))()
        if (substitute)
        {
            sub = kstr.splice(line,cursor[0] - 1,1,substitute)
            return sub
        }
    }
},clampCursorOrFillVirtualSpaces:function ()
{
    var cursor, lineLength, x, y

    this.do.start()
    if (this.do.numCursors() === 1)
    {
        cursor = this.do.cursor(0)
        y = _k_.clamp(0,this.do.numLines() - 1,cursor[1])
        lineLength = this.do.numLines() && this.do.line(cursor[1]).length || 0
        x = _k_.clamp(0,lineLength,cursor[0])
        this.do.setCursors([[x,y]])
    }
    else
    {
        this.fillVirtualSpaces()
    }
    return this.do.end()
},fillVirtualSpaces:function ()
{
    var c

    this.do.start()
    var list = _k_.list(reversed(this.do.cursors()))
    for (var _c_ = 0; _c_ < list.length; _c_++)
    {
        c = list[_c_]
        if (c[0] > this.do.line(c[1]).length)
        {
            this.do.change(c[1],kstr.splice(this.do.line(c[1]),c[0],0,_k_.lpad(c[0] - this.do.line(c[1]).length)))
        }
    }
    return this.do.end()
}}