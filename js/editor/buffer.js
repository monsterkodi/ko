// monsterkodi/kode 0.229.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, valid: undefined, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var Buffer, endOf, event, fuzzy, kerror, kxk, matchr, startOf, State, _

kxk = require('kxk')
_ = kxk._
kerror = kxk.kerror
matchr = kxk.matchr

State = require('./state')
fuzzy = require('fuzzy')
event = require('events')

startOf = function (r)
{
    return r[0]
}

endOf = function (r)
{
    return r[0] + Math.max(1,r[1] - r[0])
}

Buffer = (function ()
{
    _k_.extend(Buffer, event)
    function Buffer ()
    {
        this["startOfWordAtPos"] = this["startOfWordAtPos"].bind(this)
        this["endOfWordAtPos"] = this["endOfWordAtPos"].bind(this)
        this["lines"] = this["lines"].bind(this)
        this["line"] = this["line"].bind(this)
        Buffer.__super__.constructor.call(this)
        this.newlineCharacters = '\n'
        this.wordRegExp = new RegExp("(\\s+|\\w+|[^\\s])",'g')
        this.realWordRegExp = new RegExp("(\\w+)",'g')
        this.setState(new State())
    }

    Buffer.prototype["setLines"] = function (lines)
    {
        this.emit('numLines',0)
        this.state = new State({lines:lines})
        return this.emit('numLines',this.numLines())
    }

    Buffer.prototype["setState"] = function (state)
    {
        return this.state = new State(state.s)
    }

    Buffer.prototype["mainCursor"] = function ()
    {
        return this.state.mainCursor()
    }

    Buffer.prototype["line"] = function (i)
    {
        return this.state.line(i)
    }

    Buffer.prototype["tabline"] = function (i)
    {
        return this.state.tabline(i)
    }

    Buffer.prototype["cursor"] = function (i)
    {
        return this.state.cursor(i)
    }

    Buffer.prototype["highlight"] = function (i)
    {
        return this.state.highlight(i)
    }

    Buffer.prototype["selection"] = function (i)
    {
        return this.state.selection(i)
    }

    Buffer.prototype["lines"] = function ()
    {
        return this.state.lines()
    }

    Buffer.prototype["cursors"] = function ()
    {
        return this.state.cursors()
    }

    Buffer.prototype["highlights"] = function ()
    {
        return this.state.highlights()
    }

    Buffer.prototype["selections"] = function ()
    {
        return this.state.selections()
    }

    Buffer.prototype["numLines"] = function ()
    {
        return this.state.numLines()
    }

    Buffer.prototype["numCursors"] = function ()
    {
        return this.state.numCursors()
    }

    Buffer.prototype["numSelections"] = function ()
    {
        return this.state.numSelections()
    }

    Buffer.prototype["numHighlights"] = function ()
    {
        return this.state.numHighlights()
    }

    Buffer.prototype["setCursors"] = function (c)
    {
        return this.state = this.state.setCursors(c)
    }

    Buffer.prototype["setSelections"] = function (s)
    {
        return this.state = this.state.setSelections(s)
    }

    Buffer.prototype["setHighlights"] = function (h)
    {
        return this.state = this.state.setHighlights(h)
    }

    Buffer.prototype["setMain"] = function (m)
    {
        return this.state = this.state.setMain(m)
    }

    Buffer.prototype["addHighlight"] = function (h)
    {
        return this.state = this.state.addHighlight(h)
    }

    Buffer.prototype["select"] = function (s)
    {
        this.do.start()
        this.do.select(s)
        return this.do.end()
    }

    Buffer.prototype["isCursorVirtual"] = function (c = this.mainCursor())
    {
        return this.numLines() && c[1] < this.numLines() && c[0] > this.line(c[1]).length
    }

    Buffer.prototype["isCursorAtEndOfLine"] = function (c = this.mainCursor())
    {
        return this.numLines() && c[1] < this.numLines() && c[0] >= this.line(c[1]).length
    }

    Buffer.prototype["isCursorAtStartOfLine"] = function (c = this.mainCursor())
    {
        return c[0] === 0
    }

    Buffer.prototype["isCursorInIndent"] = function (c = this.mainCursor())
    {
        return this.numLines() && this.line(c[1]).slice(0,c[0]).trim().length === 0 && this.line(c[1]).slice(c[0]).trim().length
    }

    Buffer.prototype["isCursorInLastLine"] = function (c = this.mainCursor())
    {
        return c[1] === this.numLines() - 1
    }

    Buffer.prototype["isCursorInFirstLine"] = function (c = this.mainCursor())
    {
        return c[1] === 0
    }

    Buffer.prototype["isCursorInRange"] = function (r, c = this.mainCursor())
    {
        return isPosInRange(c,r)
    }

    Buffer.prototype["wordAtCursor"] = function ()
    {
        return this.wordAtPos(this.mainCursor())
    }

    Buffer.prototype["wordAtPos"] = function (c)
    {
        return this.textInRange(this.rangeForRealWordAtPos(c))
    }

    Buffer.prototype["wordsAtCursors"] = function (cs = this.cursors(), opt)
    {
        var r

        return (function () { var _88__66_ = []; var list = _k_.list(this.rangesForWordsAtCursors(cs,opt)); for (var _88_66_ = 0; _88_66_ < list.length; _88_66_++)  { r = list[_88_66_];_88__66_.push(this.textInRange(r))  } return _88__66_ }).bind(this)()
    }

    Buffer.prototype["rangesForWordsAtCursors"] = function (cs = this.cursors(), opt)
    {
        var c, rngs

        rngs = (function () { var _91__49_ = []; var list = _k_.list(cs); for (var _91_49_ = 0; _91_49_ < list.length; _91_49_++)  { c = list[_91_49_];_91__49_.push(this.rangeForWordAtPos(c,opt))  } return _91__49_ }).bind(this)()
        return rngs = cleanRanges(rngs)
    }

    Buffer.prototype["selectionTextOrWordAtCursor"] = function ()
    {
        if (this.numSelections() === 1)
        {
            return this.textInRange(this.selection(0))
        }
        else
        {
            return this.wordAtCursor()
        }
    }

    Buffer.prototype["rangeForWordAtPos"] = function (pos, opt)
    {
        var p, r, wr

        p = this.clampPos(pos)
        wr = this.wordRangesInLineAtIndex(p[1],opt)
        r = rangeAtPosInRanges(p,wr)
        return r
    }

    Buffer.prototype["rangeForRealWordAtPos"] = function (pos, opt)
    {
        var p, r, wr

        p = this.clampPos(pos)
        wr = this.realWordRangesInLineAtIndex(p[1],opt)
        r = rangeAtPosInRanges(p,wr)
        if (!(r != null) || _k_.empty(this.textInRange(r).trim()))
        {
            r = rangeBeforePosInRanges(p,wr)
        }
        if (!(r != null) || _k_.empty(this.textInRange(r).trim()))
        {
            r = rangeAfterPosInRanges(p,wr)
        }
        r = (r != null ? r : rangeForPos(p))
        return r
    }

    Buffer.prototype["endOfWordAtPos"] = function (c)
    {
        var r

        r = this.rangeForWordAtPos(c)
        if (this.isCursorAtEndOfLine(c))
        {
            if (this.isCursorInLastLine(c))
            {
                return c
            }
            r = this.rangeForWordAtPos([0,c[1] + 1])
        }
        return [r[1][1],r[0]]
    }

    Buffer.prototype["startOfWordAtPos"] = function (c)
    {
        var r

        if (this.isCursorAtStartOfLine(c))
        {
            if (this.isCursorInFirstLine(c))
            {
                return c
            }
            r = this.rangeForWordAtPos([this.line(c[1] - 1).length,c[1] - 1])
        }
        else
        {
            r = this.rangeForWordAtPos(c)
            if (r[1][0] === c[0])
            {
                r = this.rangeForWordAtPos([c[0] - 1,c[1]])
            }
        }
        return [r[1][0],r[0]]
    }

    Buffer.prototype["wordRangesInLineAtIndex"] = function (li, opt = {})
    {
        var mtch, r, _142_19_, _143_89_

        opt.regExp = ((_142_19_=opt.regExp) != null ? _142_19_ : this.wordRegExp)
        if ((opt != null ? (_143_89_=opt.include) != null ? _143_89_.length : undefined : undefined))
        {
            opt.regExp = new RegExp(`(\\s+|[\\w${opt.include}]+|[^\\s])`,'g')
        }
        r = []
        while ((mtch = opt.regExp.exec(this.line(li))) !== null)
        {
            r.push([li,[mtch.index,opt.regExp.lastIndex]])
        }
        return r.length && r || [[li,[0,0]]]
    }

    Buffer.prototype["realWordRangesInLineAtIndex"] = function (li, opt = {})
    {
        var mtch, r

        r = []
        while ((mtch = this.realWordRegExp.exec(this.line(li))) !== null)
        {
            r.push([li,[mtch.index,this.realWordRegExp.lastIndex]])
        }
        return r.length && r || [[li,[0,0]]]
    }

    Buffer.prototype["highlightsInLineIndexRangeRelativeToLineIndex"] = function (lineIndexRange, relIndex)
    {
        var hl, s

        hl = this.highlightsInLineIndexRange(lineIndexRange)
        if (hl)
        {
            return (function () { var _166__61_ = []; var list = _k_.list(hl); for (var _166_61_ = 0; _166_61_ < list.length; _166_61_++)  { s = list[_166_61_];_166__61_.push([s[0] - relIndex,[s[1][0],s[1][1]],s[2]])  } return _166__61_ }).bind(this)()
        }
    }

    Buffer.prototype["highlightsInLineIndexRange"] = function (lineIndexRange)
    {
        return this.highlights().filter(function (s)
        {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1]
        })
    }

    Buffer.prototype["selectionsInLineIndexRangeRelativeToLineIndex"] = function (lineIndexRange, relIndex)
    {
        var s, sl

        sl = this.selectionsInLineIndexRange(lineIndexRange)
        if (sl)
        {
            return (function () { var _182__55_ = []; var list = _k_.list(sl); for (var _182_55_ = 0; _182_55_ < list.length; _182_55_++)  { s = list[_182_55_];_182__55_.push([s[0] - relIndex,[s[1][0],s[1][1]]])  } return _182__55_ }).bind(this)()
        }
    }

    Buffer.prototype["selectionsInLineIndexRange"] = function (lineIndexRange)
    {
        return this.selections().filter(function (s)
        {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1]
        })
    }

    Buffer.prototype["selectedLineIndices"] = function ()
    {
        var s

        return _.uniq((function () { var _188__47_ = []; var list = _k_.list(this.selections()); for (var _188_47_ = 0; _188_47_ < list.length; _188_47_++)  { s = list[_188_47_];_188__47_.push(s[0])  } return _188__47_ }).bind(this)())
    }

    Buffer.prototype["cursorLineIndices"] = function ()
    {
        var c

        return _.uniq((function () { var _189__47_ = []; var list = _k_.list(this.cursors()); for (var _189_47_ = 0; _189_47_ < list.length; _189_47_++)  { c = list[_189_47_];_189__47_.push(c[1])  } return _189__47_ }).bind(this)())
    }

    Buffer.prototype["selectedAndCursorLineIndices"] = function ()
    {
        return _.uniq(this.selectedLineIndices().concat(this.cursorLineIndices()))
    }

    Buffer.prototype["continuousCursorAndSelectedLineIndexRanges"] = function ()
    {
        var csr, il, li

        il = this.selectedAndCursorLineIndices()
        csr = []
        if (il.length)
        {
            var list = _k_.list(il)
            for (var _200_19_ = 0; _200_19_ < list.length; _200_19_++)
            {
                li = list[_200_19_]
                if (csr.length && _.last(csr)[1] === li - 1)
                {
                    _.last(csr)[1] = li
                }
                else
                {
                    csr.push([li,li])
                }
            }
        }
        return csr
    }

    Buffer.prototype["isSelectedLineAtIndex"] = function (li)
    {
        var il, s

        il = this.selectedLineIndices()
        if (_k_.in(li,il))
        {
            s = this.selection(il.indexOf(li))
            if (s[1][0] === 0 && s[1][1] === this.line(li).length)
            {
                return true
            }
        }
        return false
    }

    Buffer.prototype["text"] = function ()
    {
        return this.state.text(this.newlineCharacters)
    }

    Buffer.prototype["textInRange"] = function (rg)
    {
        var _223_58_

        return (!_k_.empty((rg)) ? (typeof this.line(rg[0]).slice === "function" ? this.line(rg[0]).slice(rg[1][0],rg[1][1]) : undefined) : '')
    }

    Buffer.prototype["textsInRanges"] = function (rgs)
    {
        var r

        return (function () { var _224__51_ = []; var list = _k_.list(rgs); for (var _224_51_ = 0; _224_51_ < list.length; _224_51_++)  { r = list[_224_51_];_224__51_.push(this.textInRange(r))  } return _224__51_ }).bind(this)()
    }

    Buffer.prototype["textInRanges"] = function (rgs)
    {
        return this.textsInRanges(rgs).join('\n')
    }

    Buffer.prototype["textOfSelection"] = function ()
    {
        return this.textInRanges(this.selections())
    }

    Buffer.prototype["textOfHighlight"] = function ()
    {
        return this.numHighlights() && this.textInRange(this.highlight(0)) || ''
    }

    Buffer.prototype["indentationAtLineIndex"] = function (li)
    {
        var line

        if (li >= this.numLines())
        {
            return 0
        }
        line = this.line(li)
        while (_k_.empty((line.trim())) && li > 0)
        {
            li--
            line = this.line(li)
        }
        return indentationInLine(line)
    }

    Buffer.prototype["lastPos"] = function ()
    {
        var lli

        lli = this.numLines() - 1
        return [this.line(lli).length,lli]
    }

    Buffer.prototype["cursorPos"] = function ()
    {
        return this.clampPos(this.mainCursor())
    }

    Buffer.prototype["clampPos"] = function (p)
    {
        var c, l

        if (!this.numLines())
        {
            return [0,-1]
        }
        l = _k_.clamp(0,this.numLines() - 1,p[1])
        c = _k_.clamp(0,this.line(l).length,p[0])
        return [c,l]
    }

    Buffer.prototype["wordStartPosAfterPos"] = function (p = this.cursorPos())
    {
        if (p[0] < this.line(p[1]).length && this.line(p[1])[p[0]] !== ' ')
        {
            return p
        }
        while (p[0] < this.line(p[1]).length - 1)
        {
            if (this.line(p[1])[p[0] + 1] !== ' ')
            {
                return [p[0] + 1,p[1]]
            }
            p[0] += 1
        }
        if (p[1] < this.numLines() - 1)
        {
            return this.wordStartPosAfterPos([0,p[1] + 1])
        }
        else
        {
            return null
        }
    }

    Buffer.prototype["rangeForLineAtIndex"] = function (i)
    {
        if (i >= this.numLines())
        {
            return kerror(`Buffer.rangeForLineAtIndex -- index ${i} >= ${this.numLines()}`)
        }
        return [i,[0,this.line(i).length]]
    }

    Buffer.prototype["isRangeInString"] = function (r)
    {
        var _288_61_

        return (this.rangeOfStringSurroundingRange(r) != null)
    }

    Buffer.prototype["rangeOfInnerStringSurroundingRange"] = function (r)
    {
        var rgs

        rgs = this.rangesOfStringsInLineAtIndex(r[0])
        rgs = rangesShrunkenBy(rgs,1)
        return rangeContainingRangeInRanges(r,rgs)
    }

    Buffer.prototype["rangeOfStringSurroundingRange"] = function (r)
    {
        var ir

        if (ir = this.rangeOfInnerStringSurroundingRange(r))
        {
            return rangeGrownBy(ir,1)
        }
    }

    Buffer.prototype["distanceOfWord"] = function (w, pos = this.cursorPos())
    {
        var d, la, lb

        if (this.line(pos[1]).indexOf(w) >= 0)
        {
            return 0
        }
        d = 1
        lb = pos[1] - d
        la = pos[1] + d
        while (lb >= 0 || la < this.numLines())
        {
            if (lb >= 0)
            {
                if (this.line(lb).indexOf(w) >= 0)
                {
                    return d
                }
            }
            if (la < this.numLines())
            {
                if (this.line(la).indexOf(w) >= 0)
                {
                    return d
                }
            }
            d++
            lb = pos[1] - d
            la = pos[1] + d
        }
        return Number.MAX_SAFE_INTEGER
    }

    Buffer.prototype["rangesForCursorLines"] = function (cs = this.cursors())
    {
        var c

        return (function () { var _330__78_ = []; var list = _k_.list(cs); for (var _330_78_ = 0; _330_78_ < list.length; _330_78_++)  { c = list[_330_78_];_330__78_.push(this.rangeForLineAtIndex(c[1]))  } return _330__78_ }).bind(this)()
    }

    Buffer.prototype["rangesForAllLines"] = function ()
    {
        return this.rangesForLinesFromTopToBot(0,this.numLines())
    }

    Buffer.prototype["rangesForLinesBetweenPositions"] = function (a, b, extend = false)
    {
        var i, r

        r = []
        var _335_14_ = sortPositions([a,b]); a = _335_14_[0]; b = _335_14_[1]

        if (a[1] === b[1])
        {
            r.push([a[1],[a[0],b[0]]])
        }
        else
        {
            r.push([a[1],[a[0],this.line(a[1]).length]])
            if (b[1] - a[1] > 1)
            {
                for (var _341_26_ = i = a[1] + 1, _341_35_ = b[1]; (_341_26_ <= _341_35_ ? i < b[1] : i > b[1]); (_341_26_ <= _341_35_ ? ++i : --i))
                {
                    r.push([i,[0,this.line(i).length]])
                }
            }
            r.push([b[1],[0,extend && b[0] === 0 && this.line(b[1]).length || b[0]]])
        }
        return r
    }

    Buffer.prototype["rangesForLinesFromTopToBot"] = function (top, bot)
    {
        var ir, li, r

        r = []
        ir = [top,bot]
        for (var _349_19_ = li = startOf(ir), _349_33_ = endOf(ir); (_349_19_ <= _349_33_ ? li < endOf(ir) : li > endOf(ir)); (_349_19_ <= _349_33_ ? ++li : --li))
        {
            r.push(this.rangeForLineAtIndex(li))
        }
        return r
    }

    Buffer.prototype["rangesForText"] = function (t, opt)
    {
        var li, r, _358_43_

        t = t.split('\n')[0]
        r = []
        for (var _356_19_ = li = 0, _356_23_ = this.numLines(); (_356_19_ <= _356_23_ ? li < this.numLines() : li > this.numLines()); (_356_19_ <= _356_23_ ? ++li : --li))
        {
            r = r.concat(this.rangesForTextInLineAtIndex(t,li,opt))
            if (r.length >= (((_358_43_=(opt != null ? opt.max : undefined)) != null ? _358_43_ : 999)))
            {
                break
            }
        }
        return r
    }

    Buffer.prototype["rangesForTextInLineAtIndex"] = function (t, i, opt)
    {
        var mtch, r, re, rng, rngs, type, _363_25_

        r = []
        type = ((_363_25_=(opt != null ? opt.type : undefined)) != null ? _363_25_ : 'str')
        switch (type)
        {
            case 'fuzzy':
                re = new RegExp("\\w+",'g')
                while ((mtch = re.exec(this.line(i))) !== null)
                {
                    if (fuzzy.test(t,this.line(i).slice(mtch.index,re.lastIndex)))
                    {
                        r.push([i,[mtch.index,re.lastIndex]])
                    }
                }
                break
            default:
                if (_k_.in(type,['str','Str','glob']))
            {
                t = _.escapeRegExp(t)
            }
                if (type === 'glob')
            {
                t = t.replace(new RegExp("\\*",'g'),"\w*")
                if (!t.length)
                {
                    return r
                }
            }
                rngs = matchr.ranges(t,this.line(i),_k_.in(type,['str','reg','glob']) && 'i' || '')
                var list = _k_.list(rngs)
            for (var _376_24_ = 0; _376_24_ < list.length; _376_24_++)
            {
                rng = list[_376_24_]
                r.push([i,[rng.start,rng.start + rng.match.length]])
            }
        }

        return r
    }

    Buffer.prototype["rangesOfStringsInLineAtIndex"] = function (li)
    {
        var c, cc, i, r, ss, t

        t = this.line(li)
        r = []
        ss = -1
        cc = null
        for (var _385_18_ = i = 0, _385_22_ = t.length; (_385_18_ <= _385_22_ ? i < t.length : i > t.length); (_385_18_ <= _385_22_ ? ++i : --i))
        {
            c = t[i]
            if (!cc && _k_.in(c,"'\""))
            {
                cc = c
                ss = i
            }
            else if (c === cc)
            {
                if ((t[i - 1] !== '\\') || (i > 2 && t[i - 2] === '\\'))
                {
                    r.push([li,[ss,i + 1]])
                    cc = null
                    ss = -1
                }
            }
        }
        return r
    }

    return Buffer
})()

module.exports = Buffer