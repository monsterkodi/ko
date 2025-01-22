var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, copy: function (o) { return Array.isArray(o) ? o.slice() : typeof o == 'object' && o.constructor.name == 'Object' ? Object.assign({}, o) : typeof o == 'string' ? ''+o : o }, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var args, KED

import ttio from "./ttio.js"
import gutter from "./gutter.js"
import cells from "./cells.js"
import state from "./state.js"

import kxk from "../kxk.js"
let karg = kxk.karg

import nfs from "../kxk/nfs.js"

args = karg(`ked [file]
    options                                   **
    version    log version                    = false`)

KED = (function ()
{
    function KED ()
    {
        this["redraw"] = this["redraw"].bind(this)
        this["onResize"] = this["onResize"].bind(this)
        this["onKey"] = this["onKey"].bind(this)
        this["onWheel"] = this["onWheel"].bind(this)
        this["onMouse"] = this["onMouse"].bind(this)
        this["setCursor"] = this["setCursor"].bind(this)
        this["moveCursor"] = this["moveCursor"].bind(this)
        this["moveCursorAndSelect"] = this["moveCursorAndSelect"].bind(this)
        this["loadFile"] = this["loadFile"].bind(this)
        this.t = new ttio
        this.cells = new cells(this.t)
        this.state = new state(this.cells)
        this.gutter = new gutter(this.cells,this.state)
        this.t.on('key',this.onKey)
        this.t.on('mouse',this.onMouse)
        this.t.on('wheel',this.onWheel)
        this.t.on('resize',this.onResize)
        this.t.on('focus',function ()
        {})
        this.t.on('blur',function ()
        {})
        if (args.version)
        {
            console.log('0.0.1')
            process.exit(0)
        }
        if (!_k_.empty(args.options))
        {
            console.log('file(s):',args.options)
            this.loadFile(args.options[0])
        }
        else
        {
            this.state.init([''])
            this.t.setCursor(4,0)
            this.onResize(this.t.cols(),this.t.rows())
        }
    }

    KED["run"] = function ()
    {
        return new KED()
    }

    KED.prototype["loadFile"] = async function (p)
    {
        var lines, text

        text = await nfs.read(p)
        lines = text.split(/\r?\n/)
        this.state.init(lines)
        return this.redraw()
    }

    KED.prototype["moveCursorAndSelect"] = function (dir)
    {
        this.state.moveCursorAndSelect(dir)
        return this.redraw()
    }

    KED.prototype["moveCursor"] = function (dir, steps)
    {
        this.state.moveCursor(dir,steps)
        return this.redraw()
    }

    KED.prototype["setCursor"] = function (x, y)
    {
        this.state.setCursor(x,y)
        return this.redraw()
    }

    KED.prototype["onMouse"] = function (event, col, row, button, mods, count)
    {
        var redraw, start, x, y

        switch (event)
        {
            case 'press':
                if (count > 1)
                {
                    this.state.deselect()
                    x = col + this.state.s.view[0] - this.state.s.gutter
                    y = row + this.state.s.view[1]
                    if (count === 2)
                    {
                        if (mods === 'alt')
                        {
                            this.state.selectChunk(x,y)
                        }
                        else
                        {
                            this.state.selectWord(x,y)
                        }
                    }
                    else
                    {
                        this.state.selectLine(y)
                    }
                    this.dragStart = _k_.copy(this.state.s.selections[0])
                    return this.redraw()
                }
                else
                {
                    x = col + this.state.s.view[0] - this.state.s.gutter
                    y = row + this.state.s.view[1]
                    this.dragStart = [x,y,x]
                    redraw = this.state.deselect()
                    redraw |= this.state.setCursor(x,y)
                    if (redraw)
                    {
                        return this.redraw()
                    }
                }
                break
            case 'drag':
                x = col + this.state.s.view[0] - this.state.s.gutter
                y = row + this.state.s.view[1]
                start = [this.dragStart[0],this.dragStart[1]]
                if (y < this.dragStart[1])
                {
                    start = [this.dragStart[2],this.dragStart[1]]
                }
                if (this.state.select(start,[x,y]))
                {
                    return this.redraw()
                }
                break
            case 'release':
                return delete this.dragStart

        }

    }

    KED.prototype["onWheel"] = function (dir, mods)
    {
        var start, steps, x, y

        steps = ((function ()
        {
            switch (mods)
            {
                case 'shift':
                    return 4

                case 'shift+ctrl':
                    return 8

                case 'alt':
                    return 16

                case 'shift+alt':
                    return 32

                case 'ctrl+alt':
                    return 64

                case 'shift+ctrl+alt':
                    return 128

                default:
                    return 2
            }

        }).bind(this))()
        if (this.dragStart)
        {
            x = this.state.s.cursor[0]
            y = this.state.s.cursor[1]
            switch (dir)
            {
                case 'up':
                    y -= steps
                    break
                case 'down':
                    y += steps
                    break
                case 'left':
                    x -= 1
                    break
                case 'right':
                    x += 1
                    break
            }

            y = _k_.clamp(0,this.state.s.lines.length - 1,y)
            x = _k_.clamp(0,this.state.s.lines[y].length - 1,x)
            start = [this.dragStart[0],this.dragStart[1]]
            if (y < this.dragStart[1])
            {
                start = [this.dragStart[2],this.dragStart[1]]
            }
            if (this.state.select(start,[x,y]))
            {
                this.redraw()
            }
            return
        }
        switch (dir)
        {
            case 'up':
            case 'down':
            case 'left':
            case 'right':
                return this.moveCursor(dir,steps)

        }

    }

    KED.prototype["onKey"] = function (key)
    {
        switch (key)
        {
            case 'up':
            case 'down':
            case 'left':
            case 'right':
                return this.moveCursor(key)

            case 'ctrl+up':
                return this.moveCursor('up',4)

            case 'ctrl+down':
                return this.moveCursor('down',4)

            case 'ctrl+left':
                return this.moveCursor('left',4)

            case 'ctrl+right':
                return this.moveCursor('right',4)

            case 'ctrl+alt+up':
                return this.moveCursor('up',8)

            case 'ctrl+alt+down':
                return this.moveCursor('down',8)

            case 'ctrl+alt+left':
                return this.moveCursor('left',8)

            case 'ctrl+alt+right':
                return this.moveCursor('right',8)

            case 'shift+ctrl+alt+up':
                return this.moveCursor('up',16)

            case 'shift+ctrl+alt+down':
                return this.moveCursor('down',16)

            case 'shift+ctrl+alt+left':
                return this.moveCursor('left',16)

            case 'shift+ctrl+alt+right':
                return this.moveCursor('right',16)

            case 'ctrl+a':
                return this.setCursor(0,this.state.s.cursor[1])

            case 'ctrl+e':
                return this.setCursor(this.state.s.lines[this.state.s.cursor[1]].length,this.state.s.cursor[1])

            case 'ctrl+h':
                return this.setCursor(0,0)

            case 'ctrl+j':
            case 'shift+ctrl+h':
                return this.setCursor(this.state.s.lines.slice(-1)[0].length,this.state.s.lines.length - 1)

            case 'ctrl+k':
                return this.t.write('\x1b[0K')

            case 'return':
                return this.t.write('\n')

            case 'space':
                return this.t.write(' ')

            case 'delete':
                return this.t.write('\x1b[D\x1b[P')

            case 'tab':
                return this.t.write('    ')

            case 'ctrl+c':
                return process.exit(0)

            case 'ctrl+q':
                return process.exit(0)

            case 'shift+up':
                return this.moveCursorAndSelect('up')

            case 'shift+down':
                return this.moveCursorAndSelect('down')

            case 'shift+left':
                return this.moveCursorAndSelect('left')

            case 'shift+right':
                return this.moveCursorAndSelect('right')

        }

        return this.t.write(key)
    }

    KED.prototype["onResize"] = function (cols, rows)
    {
        return this.redraw()
    }

    KED.prototype["redraw"] = function ()
    {
        this.t.hideCursor()
        this.cells.init()
        this.gutter.draw()
        this.state.draw()
        this.cells.render()
        return this.t.showCursor()
    }

    return KED
})()

export default KED.run;