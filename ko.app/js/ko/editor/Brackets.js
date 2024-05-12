var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}}

import kxk from "../../kxk.js"
let matchr = kxk.matchr

class Brackets
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
        this.open = this.editor.bracketCharacters.open
        return this.config = this.editor.bracketCharacters.regexps
    }

    onCursor ()
    {
        var after, before, cp, h

        if (this.editor.numHighlights())
        {
            var list = _k_.list(this.editor.highlights())
            for (var _36_18_ = 0; _36_18_ < list.length; _36_18_++)
            {
                h = list[_36_18_]
                if (!(h[2] != null))
                {
                    return
                }
            }
        }
        cp = this.editor.cursorPos()
        var _40_24_ = this.beforeAfterForPos(cp); before = _40_24_[0]; after = _40_24_[1]

        if (after.length || before.length)
        {
            if (after.length && _k_.first(after).start === cp[0] && _k_.first(after).clss === 'open')
            {
                cp[0] += 1
            }
            if (before.length && _k_.last(before).start === cp[0] - 1 && _k_.last(before).clss === 'close')
            {
                cp[0] -= 1
            }
        }
        if (this.highlightInside(cp))
        {
            return
        }
        this.clear()
        this.editor.renderHighlights()
        return this
    }

    highlightInside (pos)
    {
        var after, before, cnt, firstClose, lastOpen, maxLookBeforeAndAhead, next, pp, prev, stack

        maxLookBeforeAndAhead = 50
        stack = []
        pp = pos
        cnt = 0
        while (pp[1] >= 0)
        {
            var _67_28_ = this.beforeAfterForPos(pp); before = _67_28_[0]; after = _67_28_[1]

            while (before.length)
            {
                prev = before.pop()
                if (prev.clss === 'open')
                {
                    if (stack.length)
                    {
                        if (this.open[prev.match] === _k_.last(stack).match)
                        {
                            stack.pop()
                            continue
                        }
                        else
                        {
                            return
                        }
                    }
                    lastOpen = prev
                    break
                }
                else
                {
                    stack.push(prev)
                }
            }
            if ((lastOpen != null))
            {
                break
            }
            if (pp[1] < 1)
            {
                return
            }
            if (cnt++ > maxLookBeforeAndAhead)
            {
                return
            }
            pp = [this.editor.line(pp[1] - 1).length,pp[1] - 1]
        }
        if (!(lastOpen != null))
        {
            return
        }
        stack = []
        pp = pos
        while (pp[1] <= this.editor.numLines())
        {
            var _92_28_ = this.beforeAfterForPos(pp); before = _92_28_[0]; after = _92_28_[1]

            while (after.length)
            {
                next = after.shift()
                if (next.clss === 'close')
                {
                    if (stack.length)
                    {
                        if (this.open[_k_.last(stack).match] === next.match)
                        {
                            stack.pop()
                            continue
                        }
                        else
                        {
                            return
                        }
                    }
                    firstClose = next
                    break
                }
                else
                {
                    stack.push(next)
                }
            }
            if ((firstClose != null))
            {
                break
            }
            if (pp[1] >= this.editor.numLines() - 1)
            {
                return
            }
            if (cnt++ > maxLookBeforeAndAhead)
            {
                return
            }
            pp = [0,pp[1] + 1]
        }
        if (!(firstClose != null))
        {
            return
        }
        if (this.open[lastOpen.match] === firstClose.match)
        {
            this.highlight(lastOpen,firstClose)
            return true
        }
    }

    beforeAfterForPos (pos)
    {
        var after, before, cp, firstAfterIndex, fst, i, li, line, lst, r, rngs

        var _126_17_ = pos; cp = _126_17_[0]; li = _126_17_[1]

        line = this.editor.line(li)
        rngs = matchr.ranges(this.config,line)
        i = rngs.length - 1
        while (i >= 0)
        {
            if (rngs[i].start > 0 && line[rngs[i].start - 1] === '\\')
            {
                rngs.splice(i,1)
            }
            i -= 1
        }
        i = rngs.length - 1
        while (i > 0)
        {
            if (rngs[i - 1].clss === 'open' && rngs[i].clss === 'close' && this.open[rngs[i - 1].match] === rngs[i].match && rngs[i - 1].start === rngs[i].start - 1)
            {
                rngs.splice(i - 1,2)
                i -= 1
            }
            i -= 1
        }
        if (rngs.length)
        {
            var list = _k_.list(rngs)
            for (var _146_30_ = 0; _146_30_ < list.length; _146_30_++)
            {
                r = list[_146_30_]
                r.line = li
            }
            lst = _k_.last(rngs)
            fst = _k_.first(rngs)
            for (var _149_36_ = firstAfterIndex = 0, _149_40_ = rngs.length; (_149_36_ <= _149_40_ ? firstAfterIndex < rngs.length : firstAfterIndex > rngs.length); (_149_36_ <= _149_40_ ? ++firstAfterIndex : --firstAfterIndex))
            {
                if (rngs[firstAfterIndex].start >= cp)
                {
                    break
                }
            }
            before = rngs.slice(0,firstAfterIndex)
            after = rngs.slice(firstAfterIndex)
            return [before,after]
        }
        return [[],[]]
    }

    highlight (opn, cls)
    {
        this.clear()
        opn.clss = 'bracketmatch'
        cls.clss = 'bracketmatch'
        this.editor.addHighlight([opn.line,[opn.start,opn.start + opn.match.length],opn])
        this.editor.addHighlight([cls.line,[cls.start,cls.start + cls.match.length],cls])
        return this.editor.renderHighlights()
    }

    clear ()
    {
        return this.editor.setHighlights(this.editor.highlights().filter(function (h)
        {
            return (h[2] != null ? h[2].clss : undefined) !== 'bracketmatch'
        }))
    }
}

export default Brackets;