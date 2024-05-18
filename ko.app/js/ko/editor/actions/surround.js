var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr
let isEqual = kxk.isEqual
let uniqEqual = kxk.uniqEqual
let reversed = kxk.reversed

export default {initSurround:function ()
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
    var _a_ = this.surroundPairs[ch]; cl = _a_[0]; cr = _a_[1]

    if (cl.length > 1)
    {
        return false
    }
    var list = _k_.list(this.cursors())
    for (var _b_ = 0; _b_ < list.length; _b_++)
    {
        cursor = list[_b_]
        count = 0
        var list1 = _k_.list(this.line(cursor[1]))
        for (var _c_ = 0; _c_ < list1.length; _c_++)
        {
            c = list1[_c_]
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
    for (var _d_ = 0; _d_ < list.length; _d_++)
    {
        c = list[_d_]
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
    var _e_ = this.splitStateLineAtPos(this.do,p); before = _e_[0]; after = _e_[1]

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
    var after, afterGood, before, beforeGood, c, cl, cr, found, newCursors, newSelections, ns, os, s, spaces, sr, trimmed

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
        if (_k_.last(this.surroundStack)[1] === ch)
        {
            var list = _k_.list(newCursors)
            for (var _f_ = 0; _f_ < list.length; _f_++)
            {
                c = list[_f_]
                if (this.do.line(c[1])[c[0]] !== ch)
                {
                    this.surroundStack = []
                    break
                }
            }
            if (this.surroundStack.length && _k_.last(this.surroundStack)[1] === ch)
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
        for (var _10_ = 0; _10_ < list1.length; _10_++)
        {
            s = list1[_10_]
            if (this.isRangeInString(s))
            {
                found = true
                break
            }
        }
        if (!found)
        {
            var list2 = _k_.list(newCursors)
            for (var _11_ = 0; _11_ < list2.length; _11_++)
            {
                c = list2[_11_]
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
        for (var _12_ = 0; _12_ < list3.length; _12_++)
        {
            c = list3[_12_]
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
    var _13_ = this.surroundPairs[ch]; cl = _13_[0]; cr = _13_[1]

    this.surroundStack.push([cl,cr])
    var list4 = _k_.list(reversed(newSelections))
    for (var _14_ = 0; _14_ < list4.length; _14_++)
    {
        ns = list4[_14_]
        if (cl === '#{')
        {
            if (sr = this.rangeOfStringSurroundingRange(ns))
            {
                if (this.do.line(sr[0])[sr[1][0]] === "'")
                {
                    this.do.change(ns[0],kstr.splice(this.do.line(ns[0]),sr[1][0],1,'"'))
                }
                if (this.do.line(sr[0])[sr[1][1] - 1] === "'")
                {
                    this.do.change(ns[0],kstr.splice(this.do.line(ns[0]),sr[1][1] - 1,1,'"'))
                }
            }
        }
        else if (_k_.in(this.fileType,['coffee','kode']) && cl === '(' && lengthOfRange(ns) > 0)
        {
            var _15_ = this.splitStateLineAtPos(this.do,rangeStartPos(ns)); before = _15_[0]; after = _15_[1]

            trimmed = before.trimRight()
            beforeGood = /\w$/.test(trimmed) && !/(if|when|in|and|or|is|not|else|return)$/.test(trimmed)
            afterGood = after.trim().length && !after.startsWith(' ')
            if (beforeGood && afterGood)
            {
                spaces = before.length - trimmed.length
                this.do.change(ns[0],kstr.splice(this.do.line(ns[0]),trimmed.length,spaces))
                var list5 = _k_.list(positionsAfterLineColInPositions(ns[0],ns[1][0] - 1,newCursors))
                for (var _16_ = 0; _16_ < list5.length; _16_++)
                {
                    c = list5[_16_]
                    c[0] -= spaces
                }
                ns[1][0] -= spaces
                ns[1][1] -= spaces
            }
        }
        this.do.change(ns[0],kstr.splice(this.do.line(ns[0]),ns[1][1],0,cr))
        this.do.change(ns[0],kstr.splice(this.do.line(ns[0]),ns[1][0],0,cl))
        var list6 = _k_.list(positionsAfterLineColInPositions(ns[0],ns[1][0] - 1,newCursors))
        for (var _17_ = 0; _17_ < list6.length; _17_++)
        {
            c = list6[_17_]
            c[0] += cl.length
        }
        var list7 = _k_.list(rangesAfterLineColInRanges(ns[0],ns[1][1] - 1,newSelections))
        for (var _18_ = 0; _18_ < list7.length; _18_++)
        {
            os = list7[_18_]
            os[1][0] += cr.length
            os[1][1] += cr.length
        }
        var list8 = _k_.list(rangesAfterLineColInRanges(ns[0],ns[1][0] - 1,newSelections))
        for (var _19_ = 0; _19_ < list8.length; _19_++)
        {
            os = list8[_19_]
            os[1][0] += cl.length
            os[1][1] += cl.length
        }
        var list9 = _k_.list(positionsAfterLineColInPositions(ns[0],ns[1][1],newCursors))
        for (var _1a_ = 0; _1a_ < list9.length; _1a_++)
        {
            c = list9[_1a_]
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

    if (_k_.empty(this.surroundPairs))
    {
        return
    }
    cs = this.do.cursors()
    pairs = uniqEqual(Object.values(this.surroundPairs))
    openClosePairs = []
    var list = _k_.list(cs)
    for (var _1b_ = 0; _1b_ < list.length; _1b_++)
    {
        c = list[_1b_]
        numPairs = openClosePairs.length
        var list1 = _k_.list(pairs)
        for (var _1c_ = 0; _1c_ < list1.length; _1c_++)
        {
            so = list1[_1c_][0]
            sc = list1[_1c_][1]
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
    uniquePairs = uniqEqual(openClosePairs)
    var list2 = _k_.list(cs)
    for (var _1d_ = 0; _1d_ < list2.length; _1d_++)
    {
        c = list2[_1d_]
        var _1e_ = openClosePairs.shift(); so = _1e_[0]; sc = _1e_[1]

        this.do.change(c[1],kstr.splice(this.do.line(c[1]),c[0] - so.length,so.length + sc.length))
        var list3 = _k_.list(positionsAfterLineColInPositions(c[1],c[0],cs))
        for (var _1f_ = 0; _1f_ < list3.length; _1f_++)
        {
            nc = list3[_1f_]
            nc[0] -= sc.length + so.length
        }
        c[0] -= so.length
    }
    if (this.surroundStack.length)
    {
        if (uniquePairs.length === 1 && isEqual(uniquePairs[0],_k_.last(this.surroundStack)))
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