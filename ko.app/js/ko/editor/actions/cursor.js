var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }, lpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s=c+s} return s}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }}

import kxk from "../../../kxk.js"
let reversed = kxk.reversed

export default {actions:{menu:'Cursors',cursorInAllLines:{name:'Cursor in All Lines',combo:'alt+a'},alignCursorsUp:{separator:true,name:'Align Cursors with Top-most Cursor',combo:'alt+ctrl+shift+up'},alignCursorsDown:{name:'Align Cursors with Bottom-most Cursor',combo:'alt+ctrl+shift+down'},alignCursorsLeft:{name:'Align Cursors with Left-most Cursor'},alignCursorsRight:{name:'Align Cursors with Right-most Cursor'},alignCursorsAndText:{name:'Align Cursors and Text',text:'align text to the right of cursors by inserting spaces',combo:'alt+shift+a'},setCursorsAtSelectionBoundariesOrSelectSurround:{separator:true,name:'Cursors at Selection Boundaries or Select Brackets/Quotes',text:`set cursors at selection boundaries, if a selection exists.
select brackets or quotes otherwise.`,combo:'command+alt+b'},addCursorsUp:{separator:true,name:'Add Cursors Up',combo:'command+up'},addCursorsDown:{name:'Add Cursors Down',combo:'command+down'},delCursorsUp:{separator:true,name:'Remove Cursors Up',combo:'command+shift+up'},delCursorsDown:{name:'Remove Cursors Down',combo:'command+shift+down'},cursorMoves:{name:'Move Cursors To Start',combos:['ctrl+home','ctrl+end','page up','page down','ctrl+shift+home','ctrl+shift+end','shift+page up','shift+page down','alt+-','alt+=','alt+[','alt+]']}},singleCursorAtPos:function (p, opt = {extend:false})
{
    var mc

    if (this.numLines() === 0)
    {
        this.do.start()
        this.do.insert(0,'')
        this.do.end()
    }
    p = this.clampPos(p)
    mc = this.mainCursor()
    if (p[0] === mc[0] && p[1] === mc[1] && this.numCursors() === 1)
    {
        return
    }
    this.do.start()
    this.startSelection(opt)
    this.do.setCursors([[p[0],p[1]]])
    this.endSelection(opt)
    return this.do.end()
},setCursor:function (c, l)
{
    this.do.start()
    this.do.setCursors([[c,l]])
    return this.do.end()
},cursorMoves:function (key, info)
{
    var extend, _107_30_

    extend = ((_107_30_=(info != null ? info.extend : undefined)) != null ? _107_30_ : 0 <= (info != null ? info.mod.indexOf('shift') : undefined))
    switch (info.combo)
    {
        case 'alt+-':
            key = 'page up'
            break
        case 'alt+=':
            key = 'page down'
            break
        case 'alt+[':
            key = 'home'
            break
        case 'alt+]':
            key = 'end'
            break
    }

    switch (key)
    {
        case 'home':
            return this.singleCursorAtPos([0,0],{extend:extend})

        case 'end':
            return this.singleCursorAtPos([0,this.numLines() - 1],{extend:extend})

        case 'page up':
            return this.moveCursorsUp(extend,this.numFullLines() - 3)

        case 'page down':
            return this.moveCursorsDown(extend,this.numFullLines() - 3)

    }

},setCursorsAtSelectionBoundariesOrSelectSurround:function ()
{
    var newCursors, s

    if (this.numSelections())
    {
        this.do.start()
        newCursors = []
        var list = _k_.list(this.do.selections())
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            s = list[_a_]
            newCursors.push(rangeStartPos(s))
            newCursors.push(rangeEndPos(s))
        }
        this.do.select([])
        this.do.setCursors(newCursors)
        return this.do.end()
    }
    else
    {
        return this.selectSurround()
    }
},toggleCursorAtPos:function (p)
{
    if (isPosInPositions(p,this.do.cursors()))
    {
        return this.delCursorAtPos(p)
    }
    else
    {
        return this.addCursorAtPos(p)
    }
},addCursorAtPos:function (p)
{
    var newCursors

    this.do.start()
    newCursors = this.do.cursors()
    newCursors.push(p)
    this.do.setCursors(newCursors,{main:'last'})
    return this.do.end()
},addCursorsUp:function ()
{
    return this.addCursors('up')
},addCursorsDown:function ()
{
    return this.addCursors('down')
},addCursors:function (key)
{
    var c, d, dir, main, newCursors, oldCursors

    dir = key
    if (this.numCursors() >= 999)
    {
        return
    }
    oldCursors = this.do.cursors()
    this.do.start()
    d = ((function ()
    {
        switch (dir)
        {
            case 'up':
                return -1

            case 'down':
                return 1

        }

    }).bind(this))()
    newCursors = this.do.cursors()
    var list = _k_.list(oldCursors)
    for (var _b_ = 0; _b_ < list.length; _b_++)
    {
        c = list[_b_]
        if (!isPosInPositions([c[0],c[1] + d],oldCursors))
        {
            newCursors.push([c[0],c[1] + d])
            if (newCursors.length >= 999)
            {
                break
            }
        }
    }
    sortPositions(newCursors)
    main = ((function ()
    {
        switch (dir)
        {
            case 'up':
                return 'first'

            case 'down':
                return 'last'

        }

    }).bind(this))()
    this.do.setCursors(newCursors,{main:main})
    return this.do.end()
},cursorInAllLines:function ()
{
    var i

    this.do.start()
    this.do.setCursors((function () { var r_c_ = []; for (var _d_ = i = 0, _e_ = this.numLines(); (_d_ <= _e_ ? i < this.numLines() : i > this.numLines()); (_d_ <= _e_ ? ++i : --i))  { r_c_.push([0,i])  } return r_c_ }).bind(this)(),{main:'closest'})
    return this.do.end()
},cursorColumns:function (num, step = 1)
{
    var cp, i

    cp = this.cursorPos()
    this.do.start()
    this.do.setCursors((function () { var r_f_ = []; for (var _10_ = i = 0, _11_ = num; (_10_ <= _11_ ? i < num : i > num); (_10_ <= _11_ ? ++i : --i))  { r_f_.push([cp[0] + i * step,cp[1]])  } return r_f_ }).bind(this)(),{main:'closest'})
    return this.do.end()
},cursorLines:function (num, step = 1)
{
    var cp, i

    cp = this.cursorPos()
    this.do.start()
    this.do.setCursors((function () { var r_12_ = []; for (var _13_ = i = 0, _14_ = num; (_13_ <= _14_ ? i < num : i > num); (_13_ <= _14_ ? ++i : --i))  { r_12_.push([cp[0],cp[1] + i * step])  } return r_12_ }).bind(this)(),{main:'closest'})
    return this.do.end()
},alignCursorsAndText:function ()
{
    var c, cx, li, lines, nc, newCursors, newX

    this.do.start()
    newCursors = this.do.cursors()
    newX = _k_.max((function () { var r_15_ = []; var list = _k_.list(newCursors); for (var _16_ = 0; _16_ < list.length; _16_++)  { c = list[_16_];r_15_.push(c[0])  } return r_15_ }).bind(this)())
    lines = {}
    var list1 = _k_.list(newCursors)
    for (var _17_ = 0; _17_ < list1.length; _17_++)
    {
        nc = list1[_17_]
        lines[nc[1]] = nc[0]
        cursorSet(nc,newX,c[1])
    }
    for (li in lines)
    {
        cx = lines[li]
        this.do.change(li,this.do.line(li).slice(0,cx) + _k_.lpad(newX - cx) + this.do.line(li).slice(cx))
    }
    this.do.setCursors(newCursors)
    return this.do.end()
},alignCursorsUp:function ()
{
    return this.alignCursors('up')
},alignCursorsLeft:function ()
{
    return this.alignCursors('left')
},alignCursorsRight:function ()
{
    return this.alignCursors('right')
},alignCursorsDown:function ()
{
    return this.alignCursors('down')
},alignCursors:function (dir = 'down')
{
    var c, charPos, main, newCursors

    this.do.start()
    newCursors = this.do.cursors()
    charPos = ((function ()
    {
        var c

        switch (dir)
        {
            case 'up':
                return _k_.first(newCursors)[0]

            case 'down':
                return _k_.last(newCursors)[0]

            case 'left':
                return _k_.min((function () { var r_18_ = []; var list = _k_.list(newCursors); for (var _19_ = 0; _19_ < list.length; _19_++)  { c = list[_19_];r_18_.push(c[0])  } return r_18_ }).bind(this)())

            case 'right':
                return _k_.max((function () { var r_1a_ = []; var list1 = _k_.list(newCursors); for (var _1b_ = 0; _1b_ < list1.length; _1b_++)  { c = list1[_1b_];r_1a_.push(c[0])  } return r_1a_ }).bind(this)())

        }

    }).bind(this))()
    var list = _k_.list(newCursors)
    for (var _1c_ = 0; _1c_ < list.length; _1c_++)
    {
        c = list[_1c_]
        cursorSet(c,charPos,c[1])
    }
    main = ((function ()
    {
        switch (dir)
        {
            case 'up':
                return 'first'

            case 'down':
                return 'last'

        }

    }).bind(this))()
    this.do.setCursors(newCursors,{main:main})
    return this.do.end()
},delCursorAtPos:function (p)
{
    var c, newCursors, oldCursors

    oldCursors = this.do.cursors()
    c = posInPositions(p,oldCursors)
    if (c && this.numCursors() > 1)
    {
        this.do.start()
        newCursors = this.do.cursors()
        newCursors.splice(oldCursors.indexOf(c),1)
        this.do.setCursors(newCursors,{main:'closest'})
        return this.do.end()
    }
},delCursorsUp:function ()
{
    return this.delCursors('up')
},delCursorsDown:function ()
{
    return this.delCursors('down')
},delCursors:function (key, info)
{
    var d, dir, newCursors

    dir = key
    this.do.start()
    newCursors = this.do.cursors()
    d = ((function ()
    {
        var c, ci

        switch (dir)
        {
            case 'up':
                var list = _k_.list(this.do.cursors())
                for (var _1d_ = 0; _1d_ < list.length; _1d_++)
                {
                    c = list[_1d_]
                    if (isPosInPositions([c[0],c[1] - 1],newCursors) && !isPosInPositions([c[0],c[1] + 1],newCursors))
                    {
                        ci = newCursors.indexOf(c)
                        newCursors.splice(ci,1)
                    }
                }
                break
            case 'down':
                var list1 = _k_.list(reversed(newCursors))
                for (var _1e_ = 0; _1e_ < list1.length; _1e_++)
                {
                    c = list1[_1e_]
                    if (isPosInPositions([c[0],c[1] + 1],newCursors) && !isPosInPositions([c[0],c[1] - 1],newCursors))
                    {
                        ci = newCursors.indexOf(c)
                        newCursors.splice(ci,1)
                    }
                }
                break
        }

    }).bind(this))()
    this.do.setCursors(newCursors,{main:'closest'})
    return this.do.end()
},clearCursors:function ()
{
    this.do.start()
    this.do.setCursors([this.mainCursor()])
    return this.do.end()
},clearCursorsAndHighlights:function ()
{
    this.clearCursors()
    return this.clearHighlights()
}}