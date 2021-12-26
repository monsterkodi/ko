// monsterkodi/kode 0.234.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var os, reversed, _

_ = require('kxk')._
os = require('kxk').os
reversed = require('kxk').reversed

module.exports = {initSurround:function ()
{
    this.surroundStack = []
    this.surroundPairs = {'#':['#{','}'],'{':['{','}'],'}':['{','}'],'[':['[',']'],']':['[',']'],'(':['(',')'],')':['(',')'],'<':['<','>'],'>':['<','>'],"'":["'","'"],'"':['"','"'],'*':['*','*']}
    this.surroundCharacters = "{}[]()\"'".split('')
    switch (this.fileType)
    {
        case 'html':
            return this.surroundCharacters = this.surroundCharacters.concat(['<','>'])

        case 'coffee':
        case 'kode':
            return this.surroundCharacters.push('#')

        case 'md':
            this.surroundCharacters = this.surroundCharacters.concat(['*','<','`'])
            this.surroundPairs['<'] = ['<!--','-->']
            return this.surroundPairs['`'] = ['`','`']

    }

},isUnbalancedSurroundCharacter:function (ch)
{
    var c, cl, count, cr, cursor

    if (_k_.in(ch,["#"]))
    {
        return false
    }
    var _43_16_ = this.surroundPairs[ch]; cl = _43_16_[0]; cr = _43_16_[1]

    if (cl.length > 1)
    {
        return false
    }
    var list = _k_.list(this.cursors())
    for (var _45_19_ = 0; _45_19_ < list.length; _45_19_++)
    {
        cursor = list[_45_19_]
        count = 0
        var list1 = _k_.list(this.line(cursor[1]))
        for (var _47_18_ = 0; _47_18_ < list1.length; _47_18_++)
        {
            c = list1[_47_18_]
            if (c === cl)
            {
                count += 1
            }
            else if (c === cr)
            {
                count -= 1
            }
        }
        if (((cl === cr) && (count % 2)) || ((cl !== cr) && count))
        {
            return true
        }
    }
    return false
},selectionContainsOnlyQuotes:function ()
{
    var c

    var list = _k_.list(this.textOfSelection())
    for (var _58_14_ = 0; _58_14_ < list.length; _58_14_++)
    {
        c = list[_58_14_]
        if (c === '\n')
        {
            continue
        }
        if (!(_k_.in(c,['"',"'"])))
        {
            return false
        }
    }
    return true
},insertTripleQuotes:function ()
{
    var after, before, p

    if (this.numCursors() > 1)
    {
        return false
    }
    if (this.numSelections())
    {
        return false
    }
    p = this.cursorPos()
    var _69_24_ = this.splitStateLineAtPos(this.state,p); before = _69_24_[0]; after = _69_24_[1]

    if (!before.endsWith('""'))
    {
        return false
    }
    if (before.length > 2 && before[before.length - 3] === '"')
    {
        return false
    }
    if (after.startsWith('"'))
    {
        return false
    }
    this.do.start()
    this.do.change(p[1],before + '""""' + after)
    this.do.setCursors([[p[0] + 1,p[1]]])
    this.do.end()
    return true
},insertSurroundCharacter:function (ch)
{
    var after, afterGood, before, beforeGood, c, cl, cr, found, newCursors, newSelections, ns, s, spaces, sr, trimmed

    if (ch === '"' && _k_.in(this.fileType,['coffee','kode']) && this.insertTripleQuotes())
    {
        return true
    }
    if (this.isUnbalancedSurroundCharacter(ch))
    {
        return false
    }
    if (this.numSelections() && _k_.in(ch,['"',"'"]) && this.selectionContainsOnlyQuotes())
    {
        return false
    }
    newCursors = this.do.cursors()
    if (this.surroundStack.length)
    {
        if (_.last(this.surroundStack)[1] === ch)
        {
            var list = _k_.list(newCursors)
            for (var _100_22_ = 0; _100_22_ < list.length; _100_22_++)
            {
                c = list[_100_22_]
                if (this.do.line(c[1])[c[0]] !== ch)
                {
                    this.surroundStack = []
                    break
                }
            }
            if (this.surroundStack.length && _.last(this.surroundStack)[1] === ch)
            {
                this.do.start()
                this.selectNone()
                this.deleteForward()
                this.do.end()
                this.surroundStack.pop()
                return false
            }
        }
    }
    if (ch === '#' && _k_.in(this.fileType,['coffee','kode']))
    {
        found = false
        var list1 = _k_.list(this.do.selections())
        for (var _114_18_ = 0; _114_18_ < list1.length; _114_18_++)
        {
            s = list1[_114_18_]
            if (this.isRangeInString(s))
            {
                found = true
                break
            }
        }
        if (!found)
        {
            var list2 = _k_.list(newCursors)
            for (var _120_22_ = 0; _120_22_ < list2.length; _120_22_++)
            {
                c = list2[_120_22_]
                if (this.isRangeInString(rangeForPos(c)))
                {
                    found = true
                    break
                }
            }
        }
        if (!found)
        {
            return false
        }
    }
    if (ch === "'" && !this.numSelections())
    {
        var list3 = _k_.list(newCursors)
        for (var _127_18_ = 0; _127_18_ < list3.length; _127_18_++)
        {
            c = list3[_127_18_]
            if (c[0] > 0 && /[A-Za-z]/.test(this.do.line(c[1])[c[0] - 1]))
            {
                return false
            }
        }
    }
    this.do.start()
    if (this.do.numSelections() === 0)
    {
        newSelections = rangesFromPositions(newCursors)
    }
    else
    {
        newSelections = this.do.selections()
    }
    var _137_16_ = this.surroundPairs[ch]; cl = _137_16_[0]; cr = _137_16_[1]

    this.surroundStack.push([cl,cr])
    var list4 = _k_.list(reversed(newSelections))
    for (var _141_15_ = 0; _141_15_ < list4.length; _141_15_++)
    {
        ns = list4[_141_15_]
        if (cl === '#{')
        {
            if (sr = this.rangeOfStringSurroundingRange(ns))
            {
                if (this.do.line(sr[0])[sr[1][0]] === "'")
                {
                    this.do.change(ns[0],this.do.line(ns[0]).splice(sr[1][0],1,'"'))
                }
                if (this.do.line(sr[0])[sr[1][1] - 1] === "'")
                {
                    this.do.change(ns[0],this.do.line(ns[0]).splice(sr[1][1] - 1,1,'"'))
                }
            }
        }
        else if (_k_.in(this.fileType,['coffee','kode']) && cl === '(' && lengthOfRange(ns) > 0)
        {
            var _151_32_ = this.splitStateLineAtPos(this.do,rangeStartPos(ns)); before = _151_32_[0]; after = _151_32_[1]

            trimmed = before.trimRight()
            beforeGood = /\w$/.test(trimmed) && !/(if|when|in|and|or|is|not|else|return)$/.test(trimmed)
            afterGood = after.trim().length && !after.startsWith(' ')
            if (beforeGood && afterGood)
            {
                spaces = before.length - trimmed.length
                this.do.change(ns[0],this.do.line(ns[0]).splice(trimmed.length,spaces))
                var list5 = _k_.list(positionsAfterLineColInPositions(ns[0],ns[1][0] - 1,newCursors))
                for (var _159_26_ = 0; _159_26_ < list5.length; _159_26_++)
                {
                    c = list5[_159_26_]
                    c[0] -= spaces
                }
                ns[1][0] -= spaces
                ns[1][1] -= spaces
            }
        }
        this.do.change(ns[0],this.do.line(ns[0]).splice(ns[1][1],0,cr))
        this.do.change(ns[0],this.do.line(ns[0]).splice(ns[1][0],0,cl))
        var list6 = _k_.list(positionsAfterLineColInPositions(ns[0],ns[1][0] - 1,newCursors))
        for (var _167_18_ = 0; _167_18_ < list6.length; _167_18_++)
        {
            c = list6[_167_18_]
            c[0] += cl.length
        }
        var list7 = _k_.list(rangesAfterLineColInRanges(ns[0],ns[1][1] - 1,newSelections))
        for (var _170_19_ = 0; _170_19_ < list7.length; _170_19_++)
        {
            os = list7[_170_19_]
            os[1][0] += cr.length
            os[1][1] += cr.length
        }
        var list8 = _k_.list(rangesAfterLineColInRanges(ns[0],ns[1][0] - 1,newSelections))
        for (var _174_19_ = 0; _174_19_ < list8.length; _174_19_++)
        {
            os = list8[_174_19_]
            os[1][0] += cl.length
            os[1][1] += cl.length
        }
        var list9 = _k_.list(positionsAfterLineColInPositions(ns[0],ns[1][1],newCursors))
        for (var _178_18_ = 0; _178_18_ < list9.length; _178_18_++)
        {
            c = list9[_178_18_]
            c[0] += cr.length
        }
    }
    this.do.select(rangesNotEmptyInRanges(newSelections))
    this.do.setCursors(newCursors)
    this.do.end()
    return true
},deleteEmptySurrounds:function ()
{
    var after, before, c, cs, nc, numPairs, openClosePairs, pairs, sc, so, uniquePairs

    cs = this.do.cursors()
    pairs = _.uniqWith(_.values(this.surroundPairs),_.isEqual)
    openClosePairs = []
    var list = _k_.list(cs)
    for (var _200_14_ = 0; _200_14_ < list.length; _200_14_++)
    {
        c = list[_200_14_]
        numPairs = openClosePairs.length
        var list1 = _k_.list(pairs)
        for (var _203_25_ = 0; _203_25_ < list1.length; _203_25_++)
        {
            so = list1[_203_25_][0]
            sc = list1[_203_25_][1]
            before = this.do.line(c[1]).slice(c[0] - so.length,c[0])
            after = this.do.line(c[1]).slice(c[0],c[0] + sc.length)
            if (so === before && sc === after)
            {
                openClosePairs.push([so,sc])
                break
            }
        }
        if (numPairs === openClosePairs.length)
        {
            return false
        }
    }
    if (cs.length !== openClosePairs.length)
    {
        return false
    }
    uniquePairs = _.uniqWith(openClosePairs,_.isEqual)
    var list2 = _k_.list(cs)
    for (var _218_14_ = 0; _218_14_ < list2.length; _218_14_++)
    {
        c = list2[_218_14_]
        var _219_20_ = openClosePairs.shift(); so = _219_20_[0]; sc = _219_20_[1]

        this.do.change(c[1],this.do.line(c[1]).splice(c[0] - so.length,so.length + sc.length))
        var list3 = _k_.list(positionsAfterLineColInPositions(c[1],c[0],cs))
        for (var _222_19_ = 0; _222_19_ < list3.length; _222_19_++)
        {
            nc = list3[_222_19_]
            nc[0] -= sc.length + so.length
        }
        c[0] -= so.length
    }
    if (this.surroundStack.length)
    {
        if (uniquePairs.length === 1 && _.isEqual(uniquePairs[0],_.last(this.surroundStack)))
        {
            this.surroundStack.pop()
        }
        else
        {
            this.surroundStack = []
        }
    }
    this.do.setCursors(cs)
    return true
},highlightsSurroundingCursor:function ()
{
    var hs

    if (this.numHighlights() % 2 === 0)
    {
        hs = this.highlights()
        sortRanges(hs)
        if (this.numHighlights() === 2)
        {
            return hs
        }
        else if (this.numHighlights() === 4)
        {
            if (areSameRanges([hs[1],hs[2]],this.selections()))
            {
                return [hs[0],hs[3]]
            }
            else
            {
                return [hs[1],hs[2]]
            }
        }
    }
}}