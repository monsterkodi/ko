// monsterkodi/kode 0.214.0

var _k_ = {list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var salt, _

_ = require('kxk')._

salt = require('../../tools/salt')
module.exports = {actions:{startSalter:{name:'ASCII Header Mode',text:`if cursor is not in ascii-header: 
                insert ascii-header of text in selection or word at cursor.
                switch to ascii-header mode in any case.`,combo:'command+3',accel:'ctrl+3'}},startSalter:function (opt)
{
    var ci, col, cols, cp, indt, li, newCursors, r, rgs, s, stxt, word, _51_29_

    cp = this.cursorPos()
    if (!(opt != null ? opt.word : undefined) && (rgs = this.salterRangesAtPos(cp)))
    {
        cols = this.columnsInSalt((function () { var _38__56_ = []; var list = _k_.list(rgs); for (var _38_56_ = 0; _38_56_ < list.length; _38_56_++)  { r = list[_38_56_];_38__56_.push(this.textInRange(r))  } return _38__56_ }).bind(this)())
        ci = 0
        while (ci < cols.length && cp[0] > cols[ci])
        {
            ci += 1
        }
        col = cols[ci]
        this.do.start()
        newCursors = (function () { var _44__44_ = []; var list1 = _k_.list(rgs); for (var _44_44_ = 0; _44_44_ < list1.length; _44_44_++)  { r = list1[_44_44_];_44__44_.push([col,r[0]])  } return _44__44_ }).bind(this)()
        this.do.setCursors(newCursors,{main:'last'})
        this.do.select([])
        this.do.end()
    }
    else
    {
        word = ((_51_29_=(opt != null ? opt.word : undefined)) != null ? _51_29_ : this.selectionTextOrWordAtCursor().trim())
        if (this.textInRange(this.rangeForLineAtIndex(cp[1])).trim().length)
        {
            indt = _.padStart('',this.indentationAtLineIndex(cp[1]))
        }
        else
        {
            indt = this.indentStringForLineAtIndex(cp[1])
        }
        stxt = word.length && salt(word).split('\n') || ['','','','','']
        stxt = (function () { var _58__58_ = []; var list2 = _k_.list(stxt); for (var _58_58_ = 0; _58_58_ < list2.length; _58_58_++)  { s = list2[_58_58_];_58__58_.push(`${indt}${this.lineComment} ${s}  `)  } return _58__58_ }).bind(this)()
        this.do.start()
        newCursors = []
        li = cp[1]
        var list3 = _k_.list(stxt)
        for (var _62_18_ = 0; _62_18_ < list3.length; _62_18_++)
        {
            s = list3[_62_18_]
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
    var _77_18_

    this.salterMode = active
    return ((_77_18_=this.layerDict) != null ? _77_18_['cursors'] != null ? _77_18_['cursors'].classList.toggle("salterMode",active) : undefined : undefined)
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
        salted = (function () { var _93__37_ = []; var list = _k_.list(char); for (var _93_37_ = 0; _93_37_ < list.length; _93_37_++)  { s = list[_93_37_];_93__37_.push(`${s}  `)  } return _93__37_ }).bind(this)().join('\n')
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
        slt = (function () { var _113__43_ = []; var list = _k_.list(rgs); for (var _113_43_ = 0; _113_43_ < list.length; _113_43_++)  { r = list[_113_43_];_113__43_.push(this.do.textInRange(r))  } return _113__43_ }).bind(this)()
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
            for (var _120_22_ = 0; _120_22_ < list1.length; _120_22_++)
            {
                r = list1[_120_22_]
                this.do.change(r[0],this.do.line(r[0]).splice(cols[ci - 1],length))
            }
            this.do.setCursors((function () { var _122__57_ = []; var list2 = _k_.list(rgs); for (var _122_57_ = 0; _122_57_ < list2.length; _122_57_++)  { r = list2[_122_57_];_122__57_.push([cols[ci - 1],r[0]])  } return _122__57_ }).bind(this)())
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
            cols = this.columnsInSalt((function () { var _141__64_ = []; var list = _k_.list(rgs); for (var _141_64_ = 0; _141_64_ < list.length; _141_64_++)  { r = list[_141_64_];_141__64_.push(this.do.textInRange(r))  } return _141__64_ }).bind(this)())
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
    state = this.do.isDoing() && this.do.state || this.state
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
    var col, cols, i, max, min, s

    min = _.min((function () { var _174__40_ = []; var list = _k_.list(slt); for (var _174_40_ = 0; _174_40_ < list.length; _174_40_++)  { s = list[_174_40_];_174__40_.push(s.search(/0/))  } return _174__40_ }).bind(this)())
    if (min < 0)
    {
        min = _.min((function () { var _176__47_ = []; var list1 = _k_.list(slt); for (var _176_47_ = 0; _176_47_ < list1.length; _176_47_++)  { s = list1[_176_47_];_176__47_.push(s.search(/#/) + 1)  } return _176__47_ }).bind(this)())
        return [min]
    }
    max = _.max((function () { var _178__36_ = []; var list2 = _k_.list(slt); for (var _178_36_ = 0; _178_36_ < list2.length; _178_36_++)  { s = list2[_178_36_];_178__36_.push(s.length)  } return _178__36_ }).bind(this)())
    cols = [min,max]
    for (var _180_20_ = col = min, _180_25_ = max; (_180_20_ <= _180_25_ ? col <= max : col >= max); (_180_20_ <= _180_25_ ? ++col : --col))
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
    return _.sortBy(_.uniq(cols))
}}