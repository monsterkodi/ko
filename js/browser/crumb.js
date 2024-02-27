// monsterkodi/kode 0.256.0

var _k_

var elem, File, kpos, slash

elem = require('kxk').elem
kpos = require('kxk').kpos
slash = require('kxk').slash

File = require('../tools/file')
class Crumb
{
    constructor (column)
    {
        this.column = column
    
        this.onMouseUp = this.onMouseUp.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.elem = elem({class:'crumb'})
        this.elem.columnIndex = this.column.index
        this.elem.addEventListener('mousedown',this.onMouseDown)
        this.elem.addEventListener('mouseup',this.onMouseUp)
        this.column.div.insertBefore(this.elem,this.column.div.firstChild)
    }

    show ()
    {
        return this.elem.style.display = 'block'
    }

    hide ()
    {
        return this.elem.style.display = 'none'
    }

    onMouseDown (event)
    {
        return this.downPos = kpos(window.win.getBounds())
    }

    onMouseUp (event)
    {
        var br, root, upPos

        if (!this.downPos)
        {
            return
        }
        upPos = kpos(window.win.getBounds())
        if (upPos.to(this.downPos).length() > 0)
        {
            delete this.downPos
            this.column.focus()
            return
        }
        if (this.column.index === 0)
        {
            if (event.target.id)
            {
                this.column.browser.browse(event.target.id)
            }
            else
            {
                root = this.elem.firstChild
                br = root.getBoundingClientRect()
                if (kpos(event).x < br.left)
                {
                    this.column.browser.browse(root.id)
                }
                else
                {
                    this.column.browser.browse(this.column.parent.file)
                }
            }
        }
        else
        {
            this.column.makeRoot()
        }
        return delete this.downPos
    }

    setFile (file)
    {
        if (this.column.index === 0)
        {
            return this.elem.innerHTML = File.crumbSpan(slash.tilde(file))
        }
        else
        {
            return this.elem.innerHTML = slash.file(file)
        }
    }

    clear ()
    {
        return this.elem.innerHTML = ''
    }
}

module.exports = Crumb