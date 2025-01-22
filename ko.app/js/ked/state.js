var _k_ = {clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }, min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var state

import immutable from "../kxk/immutable.js"
import kstr from "../kxk/kstr.js"

import color from "./color.js"


state = (function ()
{
    function state (cells)
    {
        this.cells = cells
    
        this["draw"] = this["draw"].bind(this)
        this["deselect"] = this["deselect"].bind(this)
        this["selectLine"] = this["selectLine"].bind(this)
        this["isSelectedLine"] = this["isSelectedLine"].bind(this)
        this["selectWord"] = this["selectWord"].bind(this)
        this["selectChunk"] = this["selectChunk"].bind(this)
        this["select"] = this["select"].bind(this)
        this["moveCursorAndSelect"] = this["moveCursorAndSelect"].bind(this)
        this["moveCursor"] = this["moveCursor"].bind(this)
        this["setCursor"] = this["setCursor"].bind(this)
        this["calcGutter"] = this["calcGutter"].bind(this)
        this.init([''])
    }

    state.prototype["init"] = function (lines)
    {
        this.s = immutable({lines:lines,selections:[],cursor:[0,0],view:[0,0],gutter:this.calcGutter(lines.length)})
        return this.setCursor(0,0)
    }

    state.prototype["calcGutter"] = function (numLines)
    {
        return 2 + Math.ceil(Math.log10(numLines))
    }

    state.prototype["setCursor"] = function (x, y)
    {
        var view

        y = _k_.clamp(0,this.s.lines.length - 1,y)
        x = _k_.clamp(0,this.s.lines[y].length,x)
        this.s = this.s.set('cursor',[x,y])
        if (y >= this.s.view[1] + this.cells.t.rows())
        {
            view = this.s.view.asMutable()
            view[1] = y - this.cells.t.rows() + 1
            this.s = this.s.set('view',view)
        }
        else if (y < this.s.view[1])
        {
            view = this.s.view.asMutable()
            view[1] = y
            this.s = this.s.set('view',view)
        }
        return this.cells.t.setCursor(x + this.s.gutter,y - this.s.view[1])
    }

    state.prototype["moveCursor"] = function (dir, steps = 1)
    {
        var c

        c = this.s.cursor.asMutable()
        switch (dir)
        {
            case 'left':
                c[0] -= 1
                break
            case 'right':
                c[0] += 1
                break
            case 'up':
                c[1] -= steps
                break
            case 'down':
                c[1] += steps
                break
        }

        this.deselect()
        return this.setCursor(c[0],c[1])
    }

    state.prototype["moveCursorAndSelect"] = function (dir)
    {
        var cpos, selection, selections

        if (_k_.empty(this.s.selections))
        {
            selections = [[this.s.cursor[0],this.s.cursor[1],this.s.cursor[0],this.s.cursor[1]]]
            selection = selections[0]
            switch (dir)
            {
                case 'up':
                case 'left':
                    cpos = 0
                    break
                case 'down':
                case 'right':
                    cpos = 2
                    break
            }

        }
        else
        {
            selections = this.s.selections.asMutable()
            var list = _k_.list(selections)
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                selection = list[_a_]
                if (this.s.cursor[0] === selection[0] && this.s.cursor[1] === selection[1])
                {
                    cpos = 0
                    break
                }
                else if (this.s.cursor[0] === selection[2] && this.s.cursor[1] === selection[3])
                {
                    cpos = 2
                    break
                }
            }
        }
        this.moveCursor(dir)
        switch (dir)
        {
            case 'left':
                selection[cpos] = _k_.max(0,selection[cpos] - 1)
                break
            case 'right':
                selection[cpos] = _k_.min(this.s.lines[selection[cpos + 1]].length,selection[cpos] + 1)
                break
            case 'up':
                selection[cpos + 1] = _k_.max(0,selection[cpos + 1] - 1)
                break
            case 'down':
                selection[cpos + 1] = _k_.min(this.s.lines.length,selection[cpos + 1] + 1)
                break
        }

        this.s = this.s.set('selections',selections)
        return true
    }

    state.prototype["select"] = function (from, to)
    {
        var selections

        selections = []
        this.setCursor(to[0],to[1])
        if (from[1] > to[1])
        {
            var _a_ = [to,from]; from = _a_[0]; to = _a_[1]

        }
        else if (from[1] === to[1] && from[0] > to[0])
        {
            var _b_ = [to,from]; from = _b_[0]; to = _b_[1]

        }
        to[0] = _k_.clamp(0,this.s.lines[to[1]].length,to[0])
        from[0] = _k_.clamp(0,this.s.lines[from[1]].length,from[0])
        selections.push([from[0],from[1],to[0],to[1]])
        this.s = this.s.set('selections',selections)
        return true
    }

    state.prototype["selectChunk"] = function (x, y)
    {
        var line, re, rs

        line = this.s.lines[y]
        var _a_ = kstr.rangeOfClosestChunk(line,x); rs = _a_[0]; re = _a_[1]

        if (rs >= 0 && re >= 0)
        {
            return this.select([rs,y],[re + 1,y])
        }
    }

    state.prototype["selectWord"] = function (x, y)
    {
        var line, re, rs

        line = this.s.lines[y]
        var _a_ = kstr.rangeOfClosestWord(line,x); rs = _a_[0]; re = _a_[1]

        if (rs >= 0 && re >= 0)
        {
            return this.select([rs,y],[re + 1,y])
        }
    }

    state.prototype["isSelectedLine"] = function (y)
    {
        var selection

        var list = _k_.list(this.s.selections)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            selection = list[_a_]
            if ((selection[1] <= y && y <= selection[3]))
            {
                return true
            }
        }
        return false
    }

    state.prototype["selectLine"] = function (y)
    {
        return this.select([0,y],[this.s.lines.length - 1,y])
    }

    state.prototype["deselect"] = function ()
    {
        if (!_k_.empty(this.s.selections))
        {
            this.s = this.s.set('selections',[])
            return true
        }
    }

    state.prototype["draw"] = function ()
    {
        var li, line, selection, x, xe, xs, y

        for (var _a_ = y = 0, _b_ = this.cells.t.rows(); (_a_ <= _b_ ? y < this.cells.t.rows() : y > this.cells.t.rows()); (_a_ <= _b_ ? ++y : --y))
        {
            li = y + this.s.view[1]
            line = this.s.lines[li]
            for (var _c_ = x = 0, _d_ = _k_.min(line.length,this.cells.t.cols() - this.s.gutter); (_c_ <= _d_ ? x < _k_.min(line.length,this.cells.t.cols() - this.s.gutter) : x > _k_.min(line.length,this.cells.t.cols() - this.s.gutter)); (_c_ <= _d_ ? ++x : --x))
            {
                if (x + this.s.gutter < this.cells.t.cols())
                {
                    this.cells.c[y][x + this.s.gutter].fg = 'ffffff'
                    this.cells.c[y][x + this.s.gutter].char = line[x]
                }
            }
        }
        var list = _k_.list(this.s.selections)
        for (var _e_ = 0; _e_ < list.length; _e_++)
        {
            selection = list[_e_]
            for (var _f_ = li = selection[1], _10_ = selection[3]; (_f_ <= _10_ ? li <= selection[3] : li >= selection[3]); (_f_ <= _10_ ? ++li : --li))
            {
                y = li - this.s.view[1]
                if ((this.s.view[1] <= li && li < this.s.view[1] + this.cells.t.rows()))
                {
                    if (li === selection[1])
                    {
                        xs = selection[0]
                    }
                    else
                    {
                        xs = 0
                    }
                    if (li === selection[3])
                    {
                        xe = selection[2]
                    }
                    else
                    {
                        xe = this.s.lines[li].length
                    }
                    for (var _11_ = x = xs, _12_ = xe; (_11_ <= _12_ ? x < xe : x > xe); (_11_ <= _12_ ? ++x : --x))
                    {
                        if (x + this.s.gutter < this.cells.t.cols())
                        {
                            this.cells.c[y][x + this.s.gutter].bg = color.selection
                        }
                    }
                }
            }
        }
    }

    return state
})()

export default state;