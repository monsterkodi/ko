// monsterkodi/kode 0.257.0

var _k_

var drag, elem

drag = require('kxk').drag
elem = require('kxk').elem

class Handle
{
    constructor (opt)
    {
        var k, v

        this.onStop = this.onStop.bind(this)
        this.onDrag = this.onDrag.bind(this)
        this.onStart = this.onStart.bind(this)
        for (k in opt)
        {
            v = opt[k]
            this[k] = v
        }
        this.div = elem({class:this.flex.handleClass})
        this.div.style.cursor = this.flex.cursor
        this.div.style.display = 'block'
        this.flex.view.insertBefore(this.div,this.paneb.div)
        this.update()
        this.drag = new drag({target:this.div,onStart:this.onStart,onMove:this.onDrag,onStop:this.onStop,cursor:this.flex.cursor})
    }

    del ()
    {
        var _32_22_

        ;(this.div != null ? this.div.remove() : undefined)
        return delete this.div
    }

    size ()
    {
        return this.isVisible() && this.flex.handleSize || 0
    }

    pos ()
    {
        return parseInt(this.flex.posOfPane(this.index + 1) - this.flex.handleSize - (!this.isVisible() && this.flex.handleSize || 0))
    }

    actualPos ()
    {
        return this.flex.pane(this.index + 1).actualPos() - this.flex.handleSize - (!this.isVisible() && this.flex.handleSize || 0)
    }

    update ()
    {
        this.div.style.flex = `0 0 ${this.size()}px`
        return this.div.style.display = this.isVisible() && 'block' || 'none'
    }

    isVisible ()
    {
        return !(this.panea.collapsed && this.paneb.collapsed)
    }

    isFirst ()
    {
        return this.index === 0
    }

    isLast ()
    {
        return this.flex.handles.slice(-1)[0] === this
    }

    prev ()
    {
        if (!this.isFirst())
        {
            return this.flex.handles[this.index - 1]
        }
    }

    next ()
    {
        if (!this.isLast())
        {
            return this.flex.handles[this.index + 1]
        }
    }

    index ()
    {
        return this.flex.handles.indexOf(this)
    }

    onStart ()
    {
        return this.flex.handleStart(this)
    }

    onDrag (d)
    {
        return this.flex.handleDrag(this,d)
    }

    onStop ()
    {
        return this.flex.handleEnd(this)
    }
}

module.exports = Handle