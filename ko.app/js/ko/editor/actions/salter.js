var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, lpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s=c+s} return s}, min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr
let uniq = kxk.uniq

import salt from "../../tools/salt.js"

export default {actions:{startSalter:{name:'ASCII Header Mode',text:`if cursor is not in ascii-header: 
                insert ascii-header of text in selection or word at cursor.
                switch to ascii-header mode in any case.`,combo:'command+3'}},startSalter:function (opt)
{
    var ci, col, cols, cp, indt, li, newCursors, r, rgs, s, stxt, word, _49_29_

    cp = this.cursorPos()
    if (!(opt != null ? opt.word : undefined) && (rgs = this.salterRangesAtPos(cp)))
    {
        cols = this.columnsInSalt((function () { var r_a_ = []; var list = _k_.list(rgs); for (var _b_ = 0; _b_ < list.length; _b_++)  { r = list[_b_];r_a_.push(this.textInRange(r))  } return r_a_ }).bind(this)())
        ci = 0
        while (ci < cols.length && cp[0] > cols[ci])
        {
            ci += 1
        }
        col = cols[ci]
        this.do.start()
        newCursors = (function () { var r_c_ = []; var list1 = _k_.list(rgs); for (var _d_ = 0; _d_ < list1.length; _d_++)  { r = list1[_d_];r_c_.push([col,r[0]])  } return r_c_ }).bind(this)()
        this.do.setCursors(newCursors,{main:'last'})
        this.do.select([])
        this.do.end()
    }
    else
    {
        word = ((_49_29_=(opt != null ? opt.word : undefined)) != null ? _49_29_ : this.selectionTextOrWordAtCursor().trim())
        if (this.textInRange(this.rangeForLineAtIndex(cp[1])).trim().length)
        {
            indt = _k_.lpad(this.indentationAtLineIndex(cp[1]))
        }
        else
        {
            indt = this.indentStringForLineAtIndex(cp[1])
        }
        stxt = word.length && salt(word).split('\n') || ['','','','','']
        stxt = (function () { var r_e_ = []; var list2 = _k_.list(stxt); for (var _f_ = 0; _f_ < list2.length; _f_++)  { s = list2[_f_];r_e_.push(`${indt}${this.lineComment} ${s}  `)  } return r_e_ }).bind(this)()
        this.do.start()
        newCursors = []
        li = cp[1]
        var list3 = _k_.list(stxt)
        for (var _10_ = 0; _10_ < list3.length; _10_++)
        {
            s = list3[_10_]
            this.do.insert(li,s)
            if (s.endsWith(`${this.lineComment}   `))
            {
                newCursors.push([s.length - 2,li])
            }
            else
            {
                newCursors.push([s.length,li])
            }
            li += 1
        }
        this.do.setCursors(newCursors,{main:'last'})
        this.do.select([])
        this.do.end()
    }
    return this.setSalterMode(true)
},endSalter:function ()
{
    return this.setSalterMode(false)
},setSalterMode:function (active = true)
{
    var _75_18_

    this.salterMode = active
    return ((_75_18_=this.layerDict) != null ? _75_18_['cursors'] != null ? _75_18_['cursors'].classList.toggle("salterMode",active) : undefined : undefined)
},insertSalterCharacter:function (ch)
{
    var char, s, salted

    if (ch === ' ')
    {
        char = ['    ','    ','    ','    ','    ']
    }
    else
    {
        char = salt(ch).split('\n')
    }
    if (char.length === 5)
    {
        salted = (function () { var r_11_ = []; var list = _k_.list(char); for (var _12_ = 0; _12_ < list.length; _12_++)  { s = list[_12_];r_11_.push(`${s}  `)  } return r_11_ }).bind(this)().join('\n')
        this.pasteText(salted)
    }
    else
    {
        this.setSalterMode(false)
    }
    return true
},deleteSalterCharacter:function ()
{
    var ci, cols, cp, length, r, rgs, slt

    if (!this.salterMode)
    {
        return
    }
    this.do.start()
    cp = this.do.mainCursor()
    if (rgs = this.salterRangesAtPos(cp))
    {
        slt = (function () { var r_13_ = []; var list = _k_.list(rgs); for (var _14_ = 0; _14_ < list.length; _14_++)  { r = list[_14_];r_13_.push(this.do.textInRange(r))  } return r_13_ }).bind(this)()
        cols = this.columnsInSalt(slt)
        ci = cols.length - 1
        while (ci > 0 && cols[ci - 1] >= cp[0])
        {
            ci -= 1
        }
        if (ci > 0)
        {
            length = cols[ci] - cols[ci - 1]
            var list1 = _k_.list(rgs)
            for (var _15_ = 0; _15_ < list1.length; _15_++)
            {
                r = list1[_15_]
                this.do.change(r[0],kstr.splice(this.do.line(r[0]),cols[ci - 1],length))
            }
            this.do.setCursors((function () { var r_16_ = []; var list2 = _k_.list(rgs); for (var _17_ = 0; _17_ < list2.length; _17_++)  { r = list2[_17_];r_16_.push([cols[ci - 1],r[0]])  } return r_16_ }).bind(this)())
        }
    }
    return this.do.end()
},checkSalterMode:function ()
{
    var cols, cs, r, rgs

    if (this.salterMode)
    {
        this.setSalterMode(false)
        if (this.do.numCursors() === 5 && positionsInContinuousLine(this.do.cursors()))
        {
            cs = this.do.cursors()
            rgs = this.salterRangesAtPos(this.do.mainCursor())
            if (!(rgs != null) || rgs[0][0] !== cs[0][1])
            {
                return
            }
            cols = this.columnsInSalt((function () { var r_18_ = []; var list = _k_.list(rgs); for (var _19_ = 0; _19_ < list.length; _19_++)  { r = list[_19_];r_18_.push(this.do.textInRange(r))  } return r_18_ }).bind(this)())
            if (cs[0][0] < cols[0])
            {
                return
            }
            return this.setSalterMode(true)
        }
    }
},salterRangesAtPos:function (p)
{
    var li, rgs, state

    rgs = []
    li = p[1]
    state = this.do.state
    while (rgs.length < 5 && li < state.numLines() && this.headerRegExp.test(state.line(li)))
    {
        rgs.push([li,[0,state.line(li).length]])
        li += 1
    }
    if (!rgs.length)
    {
        return
    }
    li = p[1] - 1
    while (rgs.length < 5 && li >= 0 && this.headerRegExp.test(state.line(li)))
    {
        rgs.unshift([li,[0,state.line(li).length]])
        li -= 1
    }
    if (rgs.length === 5)
    {
        return rgs
    }
},columnsInSalt:function (slt)
{
    var col, cols, i, maxv, minv, s

    minv = _k_.min((function () { var r_1a_ = []; var list = _k_.list(slt); for (var _1b_ = 0; _1b_ < list.length; _1b_++)  { s = list[_1b_];r_1a_.push(s.search(/0/))  } return r_1a_ }).bind(this)())
    if (minv < 0)
    {
        minv = _k_.min((function () { var r_1c_ = []; var list1 = _k_.list(slt); for (var _1d_ = 0; _1d_ < list1.length; _1d_++)  { s = list1[_1d_];r_1c_.push(s.search(/#/) + 1)  } return r_1c_ }).bind(this)())
        return [minv]
    }
    maxv = _k_.max((function () { var r_1e_ = []; var list2 = _k_.list(slt); for (var _1f_ = 0; _1f_ < list2.length; _1f_++)  { s = list2[_1f_];r_1e_.push(s.length)  } return r_1e_ }).bind(this)())
    cols = [minv,maxv]
    for (var _20_ = col = minv, _21_ = maxv; (_20_ <= _21_ ? col <= maxv : col >= maxv); (_20_ <= _21_ ? ++col : --col))
    {
        s = 0
        for (i = 0; i < 5; i++)
        {
            if (_k_.in(slt[i].substr(col - 2,2),['  ','# ']))
            {
                s += 1
            }
        }
        if (s === 5)
        {
            cols.push(col)
        }
    }
    return uniq(cols).sort()
}}