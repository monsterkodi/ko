// monsterkodi/kode 0.257.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var klog, _

_ = require('kxk')._
klog = require('kxk').klog

module.exports = {actions:{menu:'Cursors',moveCursorsAtBoundaryLeft:{name:'Move Cursors to Indent or Start of Line',combo:'command+left',accel:'ctrl+left'},moveCursorsAtBoundaryRight:{name:'Move Cursors to End of Line',combo:'command+right',accel:'ctrl+right'},moveCursorsToWordBoundary:{name:'move cursors to word boundaries',text:'moves cursors to word boundaries. extends selections, if shift is pressed.',combos:['alt+shift+left','alt+shift+right']},moveCursorsToWordBoundaryLeft:{separator:true,name:'Move Cursors to Start of Word',combo:'alt+left'},moveCursorsToWordBoundaryRight:{name:'Move Cursors to End of Word',combo:'alt+right'},moveCursorsToLineBoundary:{name:'move cursors to line boundaries',text:'moves cursors to line boundaries. extends selections, if shift is pressed.',combos:['home','end','command+shift+left','command+shift+right'],accels:['home','end','shift+home','shift+end','ctrl+shift+left','ctrl+shift+right']},moveMainCursor:{name:'move main cursor',text:`move main cursor independently of other cursors.
keeps current main cursor position in cursors if shift is pressed.`,combos:['ctrl+shift+up','ctrl+shift+down','ctrl+shift+left','ctrl+shift+right','ctrl+up','ctrl+down','ctrl+left','ctrl+right']},moveCursors:{name:'move cursors',combos:['left','right','up','down','shift+down','shift+right','shift+up','shift+left','ctrl+left','ctrl+right']}},moveCursorsAtBoundaryLeft:function ()
{
    return this.setOrMoveCursorsAtBoundary('left')
},moveCursorsAtBoundaryRight:function ()
{
    return this.setOrMoveCursorsAtBoundary('right')
},setOrMoveCursorsAtBoundary:function (key)
{
    if (this.numSelections() > 1 && this.numCursors() === 1)
    {
        return this.setCursorsAtSelectionBoundary(key)
    }
    else
    {
        return this.moveCursorsToLineBoundary(key)
    }
},moveMainCursor:function (key, info)
{
    var dir, dx, dy, newCursors, newMain, oldMain, opt, _75_18_, _75_29_

    dir = key
    opt = _.clone(info)
    opt.erase = ((_75_18_=opt.erase) != null ? _75_18_ : (info.mod != null ? info.mod.indexOf('shift') : undefined) < 0)
    this.do.start()
    var _77_17_ = ((function ()
    {
        switch (dir)
        {
            case 'up':
                return [0,-1]

            case 'down':
                return [0,1]

            case 'left':
                return [-1,0]

            case 'right':
                return [1,0]

        }

    }).bind(this))(); dx = _77_17_[0]; dy = _77_17_[1]

    newCursors = this.do.cursors()
    oldMain = this.mainCursor()
    newMain = [oldMain[0] + dx,oldMain[1] + dy]
    _.remove(newCursors,function (c)
    {
        if ((opt != null ? opt.erase : undefined))
        {
            return isSamePos(c,oldMain) || isSamePos(c,newMain)
        }
        else
        {
            return isSamePos(c,newMain)
        }
    })
    newCursors.push(newMain)
    this.do.setCursors(newCursors,{main:newMain})
    return this.do.end()
},moveCursorsToWordBoundaryLeft:function ()
{
    return this.moveCursorsToWordBoundary('left')
},moveCursorsToWordBoundaryRight:function ()
{
    return this.moveCursorsToWordBoundary('right')
},moveCursorsToWordBoundary:function (leftOrRight, info = {extend:false})
{
    var extend, f, _105_29_

    extend = ((_105_29_=info.extend) != null ? _105_29_ : 0 <= info.mod.indexOf('shift'))
    f = ((function ()
    {
        switch (leftOrRight)
        {
            case 'right':
                return this.endOfWordAtPos

            case 'left':
                return this.startOfWordAtPos

        }

    }).bind(this))()
    this.moveAllCursors(f,{extend:extend,keepLine:true})
    return true
},moveCursorsToLineBoundary:function (key, info = {extend:false})
{
    var extend, func, _121_29_

    this.do.start()
    extend = ((_121_29_=info.extend) != null ? _121_29_ : 0 <= info.mod.indexOf('shift'))
    func = ((function ()
    {
        switch (key)
        {
            case 'right':
            case 'e':
            case 'end':
                return (function (c)
                {
                    return [this.do.line(c[1]).length,c[1]]
                }).bind(this)

            case 'left':
            case 'a':
            case 'home':
                return (function (c)
                {
                    var d

                    if (this.do.line(c[1]).slice(0,c[0]).trim().length === 0)
                    {
                        return [0,c[1]]
                    }
                    else
                    {
                        d = this.do.line(c[1]).length - this.do.line(c[1]).trimLeft().length
                        return [d,c[1]]
                    }
                }).bind(this)

        }

    }).bind(this))()
    this.moveAllCursors(func,{extend:extend,keepLine:true})
    return this.do.end()
},moveCursors:function (key, info = {extend:false})
{
    var extend, _138_29_

    if (this.stickySelection && info.mod === 'ctrl')
    {
        klog('substract from sticky?',key)
    }
    extend = ((_138_29_=info.extend) != null ? _138_29_ : 'shift' === info.mod)
    switch (key)
    {
        case 'left':
            return this.moveCursorsLeft(extend)

        case 'right':
            return this.moveCursorsRight(extend)

        case 'up':
            return this.moveCursorsUp(extend)

        case 'down':
            return this.moveCursorsDown(extend)

    }

},setCursorsAtSelectionBoundary:function (leftOrRight = 'right')
{
    var i, main, newCursors, p, s

    this.do.start()
    i = leftOrRight === 'right' && 1 || 0
    newCursors = []
    main = 'last'
    var list = _k_.list(this.do.selections())
    for (var _151_14_ = 0; _151_14_ < list.length; _151_14_++)
    {
        s = list[_151_14_]
        p = rangeIndexPos(s,i)
        newCursors.push(p)
        if (this.isCursorInRange(s))
        {
            main = newCursors.indexOf(p)
        }
    }
    this.do.setCursors(newCursors,{main:main})
    return this.do.end()
},moveAllCursors:function (func, opt = {extend:false,keepLine:true})
{
    var c, main, mainLine, newCursors, newPos, oldMain

    this.do.start()
    this.startSelection(opt)
    newCursors = this.do.cursors()
    oldMain = this.do.mainCursor()
    mainLine = oldMain[1]
    if (newCursors.length > 1)
    {
        var list = _k_.list(newCursors)
        for (var _175_18_ = 0; _175_18_ < list.length; _175_18_++)
        {
            c = list[_175_18_]
            newPos = func(c)
            if (newPos[1] === c[1] || !opt.keepLine)
            {
                if (isSamePos(oldMain,c))
                {
                    mainLine = newPos[1]
                }
                cursorSet(c,newPos)
            }
        }
    }
    else
    {
        cursorSet(newCursors[0],func(newCursors[0]))
        mainLine = newCursors[0][1]
    }
    main = ((function ()
    {
        switch (opt.main)
        {
            case 'top':
                return 'first'

            case 'bot':
                return 'last'

            case 'left':
                return 'closest'

            case 'right':
                return 'closest'

        }

    }).bind(this))()
    this.do.setCursors(newCursors,{main:main})
    this.endSelection(opt)
    return this.do.end()
},moveCursorsUp:function (e, n = 1)
{
    return this.moveAllCursors((function (n)
    {
        return function (c)
        {
            return [c[0],c[1] - n]
        }
    })(n),{extend:e,main:'top'})
},moveCursorsRight:function (e, n = 1)
{
    var moveRight

    moveRight = function (n)
    {
        return function (c)
        {
            return [c[0] + n,c[1]]
        }
    }
    return this.moveAllCursors(moveRight(n),{extend:e,keepLine:true,main:'right'})
},moveCursorsLeft:function (e, n = 1)
{
    var moveLeft

    moveLeft = function (n)
    {
        return function (c)
        {
            return [Math.max(0,c[0] - n),c[1]]
        }
    }
    return this.moveAllCursors(moveLeft(n),{extend:e,keepLine:true,main:'left'})
},moveCursorsDown:function (e, n = 1)
{
    var c, newSelections

    if (e && this.numSelections() === 0)
    {
        if (0 === _.max((function () { var r_211_38_ = []; var list = _k_.list(this.cursors()); for (var _211_38_ = 0; _211_38_ < list.length; _211_38_++)  { c = list[_211_38_];r_211_38_.push(c[0])  } return r_211_38_ }).bind(this)()))
        {
            this.do.start()
            this.do.select(this.rangesForCursorLines())
            this.do.end()
            return
        }
    }
    else if (e && this.stickySelection && this.numCursors() === 1)
    {
        if (this.mainCursor()[0] === 0 && !this.isSelectedLineAtIndex(this.mainCursor()[1]))
        {
            this.do.start()
            newSelections = this.do.selections()
            newSelections.push(this.rangeForLineAtIndex(this.mainCursor()[1]))
            this.do.select(newSelections)
            this.do.end()
            return
        }
    }
    return this.moveAllCursors((function (n)
    {
        return function (c)
        {
            return [c[0],c[1] + n]
        }
    })(n),{extend:e,main:'bot'})
}}