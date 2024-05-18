var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}}

import kxk from "../../kxk.js"
let kstr = kxk.kstr
let matchr = kxk.matchr

class Strings
{
    constructor (editor)
    {
        this.editor = editor
    
        this.onCursor = this.onCursor.bind(this)
        this.setupConfig = this.setupConfig.bind(this)
        this.editor.on('cursor',this.onCursor)
        this.editor.on('fileTypeChanged',this.setupConfig)
        this.setupConfig()
    }

    setupConfig ()
    {
        var a, p

        return this.config = (function () { var r_a_ = []; for (var p in this.editor.stringCharacters)  { var a = this.editor.stringCharacters[p];r_a_.push([new RegExp(kstr.escapeRegexp(p)),a])  } return r_a_ }).bind(this)()
    }

    onCursor ()
    {
        var h

        if (this.editor.numHighlights())
        {
            var list = _k_.list(this.editor.highlights())
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                h = list[_a_]
                if (!(h[2] != null))
                {
                    return
                }
            }
        }
        if (this.highlightInside(this.editor.cursorPos()))
        {
            return
        }
        this.clear()
        return this.editor.renderHighlights()
    }

    highlightInside (pos)
    {
        var cp, i, li, line, lst, pair, pairs, rngs, stack, ths

        stack = []
        pairs = []
        pair = null
        var _a_ = pos; cp = _a_[0]; li = _a_[1]

        line = this.editor.line(li)
        rngs = matchr.ranges(this.config,line)
        if (!rngs.length)
        {
            return
        }
        for (var _b_ = i = 0, _c_ = rngs.length; (_b_ <= _c_ ? i < rngs.length : i > rngs.length); (_b_ <= _c_ ? ++i : --i))
        {
            ths = rngs[i]
            if (ths.start > 0 && line[ths.start - 1] === '\\')
            {
                if (ths.start - 1 <= 0 || line[ths.start - 2] !== '\\')
                {
                    continue
                }
            }
            if (lst = _k_.last(stack))
            {
                if ((lst.match === "'" && "'" === ths.match) && lst.start === ths.start - 1)
                {
                    stack.pop()
                    continue
                }
                if (lst.match === ths.match)
                {
                    pairs.push([stack.pop(),ths])
                    if (!(pair != null))
                    {
                        if ((_k_.last(pairs)[0].start <= cp && cp <= ths.start + 1))
                        {
                            pair = _k_.last(pairs)
                        }
                    }
                    continue
                }
            }
            if (stack.length > 1 && stack[stack.length - 2].match === ths.match)
            {
                stack.pop()
                pairs.push([stack.pop(),ths])
                if (!(pair != null))
                {
                    if ((_k_.last(pairs)[0].start <= cp && cp <= ths.start + 1))
                    {
                        pair = _k_.last(pairs)
                    }
                }
                continue
            }
            stack.push(ths)
        }
        if ((pair != null))
        {
            this.highlight(pair,li)
            return true
        }
    }

    highlight (pair, li)
    {
        var cls, opn

        this.clear()
        var _a_ = pair; opn = _a_[0]; cls = _a_[1]

        pair[0].clss = `stringmatch ${this.editor.stringCharacters[opn.match]}`
        pair[1].clss = `stringmatch ${this.editor.stringCharacters[cls.match]}`
        this.editor.addHighlight([li,[opn.start,opn.start + opn.match.length],pair[0]])
        this.editor.addHighlight([li,[cls.start,cls.start + cls.match.length],pair[1]])
        return this.editor.renderHighlights()
    }

    clear ()
    {
        return this.editor.setHighlights(this.editor.highlights().filter(function (h)
        {
            var _89_79_

            return !(h[2] != null ? (_89_79_=h[2].clss) != null ? _89_79_.startsWith('stringmatch') : undefined : undefined)
        }))
    }
}

export default Strings;