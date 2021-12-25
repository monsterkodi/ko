// monsterkodi/kode 0.228.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var matchr, _

_ = require('kxk')._
matchr = require('kxk').matchr

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
            for (var _34_18_ = 0; _34_18_ < list.length; _34_18_++)
            {
                h = list[_34_18_]
                if (!(h[2] != null))
                {
                    return
                }
            }
        }
        cp = this.editor.cursorPos()
        var _38_24_ = this.beforeAfterForPos(cp); before = _38_24_[0]; after = _38_24_[1]

        if (after.length || before.length)
        {
            if (after.length && _.first(after).start === cp[0] && _.first(after).clss === 'open')
            {
                cp[0] += 1
            }
            if (before.length && _.last(before).start === cp[0] - 1 && _.last(before).clss === 'close')
            {
                cp[0] -= 1
            }
        }
        if (this.highlightInside(cp))
        {
            return
        }
        this.clear()
        return this.editor.renderHighlights()
    }

    highlightInside (pos)
    {
        var after, before, cnt, firstClose, lastOpen, next, pp, prev, stack

        stack = []
        pp = pos
        cnt = 0
        while (pp[1] >= 0)
        {
            var _62_28_ = this.beforeAfterForPos(pp); before = _62_28_[0]; after = _62_28_[1]

            while (before.length)
            {
                prev = before.pop()
                if (prev.clss === 'open')
                {
                    if (stack.length)
                    {
                        if (this.open[prev.match] === _.last(stack).match)
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
            if (cnt++ > 1000)
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
            var _87_28_ = this.beforeAfterForPos(pp); before = _87_28_[0]; after = _87_28_[1]

            while (after.length)
            {
                next = after.shift()
                if (next.clss === 'close')
                {
                    if (stack.length)
                    {
                        if (this.open[_.last(stack).match] === next.match)
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
            if (cnt++ > 1000)
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

        var _121_17_ = pos; cp = _121_17_[0]; li = _121_17_[1]

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
            for (var _141_30_ = 0; _141_30_ < list.length; _141_30_++)
            {
                r = list[_141_30_]
                r.line = li
            }
            lst = _.last(rngs)
            fst = _.first(rngs)
            for (var _144_36_ = firstAfterIndex = 0, _144_40_ = rngs.length; (_144_36_ <= _144_40_ ? firstAfterIndex < rngs.length : firstAfterIndex > rngs.length); (_144_36_ <= _144_40_ ? ++firstAfterIndex : --firstAfterIndex))
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

module.exports = Brackets