// monsterkodi/kode 0.214.0

var _k_

var getStyle

getStyle = require('kxk').getStyle

class Pane
{
    constructor (opt)
    {
        var k, v, _16_19_, _17_17_, _17_27_, _17_34_, _19_17_, _19_24_, _19_29_, _20_17_, _20_46_, _20_53_, _20_62_, _21_17_, _21_61_, _21_65_, _22_17_, _22_77_, _22_88_, _23_17_

        for (k in opt)
        {
            v = opt[k]
            this[k] = v
        }
        this.collapsed = ((_16_19_=this.collapsed) != null ? _16_19_ : false)
        this.size = ((_17_17_=this.size) != null ? _17_17_ : ((_17_27_=this.fixed) != null ? _17_27_ : ((_17_34_=this.min) != null ? _17_34_ : 0)))
        if (this.collapsed)
        {
            this.size = -1
        }
        this.id = ((_19_17_=this.id) != null ? _19_17_ : ((_19_29_=(this.div != null ? this.div.id : undefined)) != null ? _19_29_ : "pane"))
        if (((_20_46_=this.div) != null ? (_20_53_=_20_46_.style) != null ? (_20_62_=_20_53_.display) != null ? _20_62_.length : undefined : undefined : undefined))
        {
            this.display = ((_20_17_=this.display) != null ? _20_17_ : this.div.style.display)
        }
        if (((this.div != null ? this.div.id : undefined) != null))
        {
            this.display = ((_21_17_=this.display) != null ? _21_17_ : getStyle(`#${this.div.id}`,'display'))
        }
        if (((_22_77_=this.div) != null ? (_22_88_=_22_77_.className) != null ? _22_88_.length : undefined : undefined))
        {
            this.display = ((_22_17_=this.display) != null ? _22_17_ : getStyle(' .' + this.div.className.split(' ').join(' .')))
        }
        this.display = ((_23_17_=this.display) != null ? _23_17_ : 'initial')
    }

    update ()
    {
        if (!this.div)
        {
            return
        }
        this.size = parseInt(this.collapsed && -1 || Math.max(this.size,0))
        this.div.style.display = this.collapsed && 'none' || this.display
        if (this.fixed)
        {
            this.div.style[this.flex.dimension] = `${this.fixed}px`
            return this.div.style.flex = `0 0 ${this.fixed}px`
        }
        else if (this.size > 0)
        {
            return this.div.style.flex = `1 1 ${this.size}px`
        }
        else if (this.size === 0)
        {
            return this.div.style.flex = "0.01 0.01 0"
        }
        else
        {
            return this.div.style.flex = "0 0 0"
        }
    }

    setSize (size)
    {
        this.size = size
    
        this.collapsed = this.size < 0
        return this.update()
    }

    del ()
    {
        var _47_15_

        if ((this.div != null))
        {
            this.div.remove()
            return delete this.div
        }
    }

    collapse ()
    {
        return this.setSize(-1)
    }

    expand ()
    {
        var _52_53_

        delete this.collapsed
        return this.setSize(((_52_53_=this.fixed) != null ? _52_53_ : 0))
    }

    isVisible ()
    {
        return !this.collapsed
    }

    pos ()
    {
        return this.actualPos()
    }

    actualPos ()
    {
        var r

        if (!this.div)
        {
            return
        }
        this.div.style.display = this.display
        r = this.div.getBoundingClientRect()[this.flex.position]
        this.div.style.display = this.isVisible() && this.display || 'none'
        return parseInt(r - this.flex.pos())
    }

    actualSize ()
    {
        if (this.collapsed)
        {
            return -1
        }
        return parseInt(this.div.getBoundingClientRect()[this.flex.dimension])
    }
}

module.exports = Pane