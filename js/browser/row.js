// monsterkodi/kode 0.256.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isStr: function (o) {return typeof o === 'string' || o instanceof String}}

var $, electron, elem, File, keyinfo, post, Row, slash, stopEvent, Syntax, _

$ = require('kxk').$
_ = require('kxk')._
elem = require('kxk').elem
keyinfo = require('kxk').keyinfo
post = require('kxk').post
slash = require('kxk').slash
stopEvent = require('kxk').stopEvent

Syntax = require('../editor/syntax')
electron = require('electron')
File = require('../tools/file')

Row = (function ()
{
    function Row (column, item)
    {
        var html, text, _20_26_

        this.column = column
        this.item = item
    
        this["rename"] = this["rename"].bind(this)
        this["onNameChange"] = this["onNameChange"].bind(this)
        this["onNameFocusOut"] = this["onNameFocusOut"].bind(this)
        this["onNameKeyDown"] = this["onNameKeyDown"].bind(this)
        this["editName"] = this["editName"].bind(this)
        this["activate"] = this["activate"].bind(this)
        this["onMouseOver"] = this["onMouseOver"].bind(this)
        this["onMouseOut"] = this["onMouseOut"].bind(this)
        this.browser = this.column.browser
        text = ((_20_26_=this.item.text) != null ? _20_26_ : this.item.name)
        if (_k_.empty((text)) || _k_.empty(text.trim()))
        {
            html = '<span> </span>'
        }
        else
        {
            html = Syntax.spanForTextAndSyntax(text,'browser')
        }
        this.div = elem({class:'browserRow',html:html})
        this.div.classList.add(this.item.type)
        this.column.table.appendChild(this.div)
        if (_k_.in(this.item.type,['file','dir']) || this.item.icon)
        {
            this.setIcon()
        }
    }

    Row.prototype["next"] = function ()
    {
        return this.index() < this.column.numRows() - 1 && this.column.rows[this.index() + 1] || null
    }

    Row.prototype["prev"] = function ()
    {
        return this.index() > 0 && this.column.rows[this.index() - 1] || null
    }

    Row.prototype["index"] = function ()
    {
        return this.column.rows.indexOf(this)
    }

    Row.prototype["onMouseOut"] = function ()
    {
        var _35_24_

        return (this.div != null ? this.div.classList.remove('hover') : undefined)
    }

    Row.prototype["onMouseOver"] = function ()
    {
        var _36_24_

        return (this.div != null ? this.div.classList.add('hover') : undefined)
    }

    Row.prototype["path"] = function ()
    {
        var _39_21_, _41_20_, _41_26_

        if ((this.item.file != null) && _k_.isStr(this.item.file))
        {
            return this.item.file
        }
        if (((this.item.obj != null ? this.item.obj.file : undefined) != null) && _k_.isStr(this.item.obj.file))
        {
            return this.item.obj.file
        }
    }

    Row.prototype["setIcon"] = function ()
    {
        var className, icon, _70_23_

        if (slash.ext(this.item.file) === 'kode')
        {
            icon = elem('span',{class:'kodeIcon'})
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M5.75 7.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm5.25.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z"></path><path fill-rule="evenodd" d="M6.25 0a.75.75 0 000 1.5H7.5v2H3.75A2.25 2.25 0 001.5 5.75V8H.75a.75.75 0 000 1.5h.75v2.75a2.25 2.25 0 002.25 2.25h8.5a2.25 2.25 0 002.25-2.25V9.5h.75a.75.75 0 000-1.5h-.75V5.75a2.25 2.25 0 00-2.25-2.25H9V.75A.75.75 0 008.25 0h-2zM3 5.75A.75.75 0 013.75 5h8.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-8.5a.75.75 0 01-.75-.75v-6.5z"></path></svg>`
            this.div.insertBefore(icon,this.div.firstChild)
            return
        }
        if (this.item.icon)
        {
            className = this.item.icon
        }
        else
        {
            if (this.item.type === 'dir')
            {
                className = 'folder-icon'
            }
            else
            {
                className = File.iconClassName(this.item.file)
            }
        }
        if (slash.base(this.item.file).startsWith('.'))
        {
            className += ' dotfile'
        }
        icon = elem('span',{class:className + ' browserFileIcon'})
        return (this.div.firstChild != null ? this.div.firstChild.insertBefore(icon,this.div.firstChild.firstChild) : undefined)
    }

    Row.prototype["activate"] = function (event, emit = true)
    {
        var col, opt, _84_19_

        if (this.column.index < 0)
        {
            this.column.activateRow(this)
            return
        }
        ;($('.hover') != null ? $('.hover').classList.remove('hover') : undefined)
        this.setActive({emit:emit})
        opt = {file:this.item.file}
        switch (this.item.type)
        {
            case 'dir':
            case 'file':
                post.emit('filebrowser','activateItem',this.item,this.column.index)
                col = this.column.index
                this.browser.select.row(this,false)
                break
            default:
                opt.line = this.item.line
                opt.col = this.item.column
                this.browser.clearColumnsFrom(this.column.index + 1,{pop:true})
                if (emit)
            {
                post.emit('jumpToFile',opt)
            }
        }

        return this
    }

    Row.prototype["isActive"] = function ()
    {
        return this.div.classList.contains('active')
    }

    Row.prototype["setActive"] = function (opt = {})
    {
        var _114_31_

        if (this.column.activeRow() !== this)
        {
            ;(this.column.activeRow() != null ? this.column.activeRow().clearActive() : undefined)
        }
        this.div.classList.add('active')
        if ((opt != null ? opt.scroll : undefined) !== false)
        {
            this.column.scroll.toIndex(this.index())
        }
        if ((opt != null ? opt.emit : undefined))
        {
            this.browser.emit('itemActivated',this.item)
            if (this.item.type === 'dir')
            {
                post.emit('setCWD',this.item.file)
            }
            else if (this.item.type === 'file')
            {
                post.emit('setCWD',slash.dir(this.item.file))
            }
        }
        return this
    }

    Row.prototype["clearActive"] = function ()
    {
        this.div.classList.remove('active')
        return this
    }

    Row.prototype["isSelected"] = function ()
    {
        return this.div.classList.contains('selected')
    }

    Row.prototype["setSelected"] = function ()
    {
        this.div.classList.add('selected')
        return this
    }

    Row.prototype["clearSelected"] = function ()
    {
        this.div.classList.remove('selected')
        return this
    }

    Row.prototype["editName"] = function ()
    {
        var _157_24_

        if ((this.input != null))
        {
            return
        }
        this.input = elem('input',{class:'rowNameInput'})
        this.input.value = slash.file(this.item.file)
        this.div.appendChild(this.input)
        this.input.addEventListener('change',this.onNameChange)
        this.input.addEventListener('keydown',this.onNameKeyDown)
        this.input.addEventListener('focusout',this.onNameFocusOut)
        this.input.focus()
        return this.input.setSelectionRange(0,slash.base(this.item.file).length)
    }

    Row.prototype["onNameKeyDown"] = function (event)
    {
        var combo, key, mod

        mod = keyinfo.forEvent(event).mod
        key = keyinfo.forEvent(event).key
        combo = keyinfo.forEvent(event).combo

        switch (combo)
        {
            case 'esc':
                if (this.input.value !== slash.file(this.item.file))
                {
                    this.input.value = slash.file(this.item.file)
                    event.preventDefault()
                    event.stopImmediatePropagation()
                }
                this.onNameFocusOut()
                break
            case 'enter':
                if (this.input.value !== slash.file(this.item.file))
                {
                    this.onNameChange()
                }
                else
                {
                    this.removeInput()
                }
                stopEvent(event)
                break
        }

        return event.stopPropagation()
    }

    Row.prototype["removeInput"] = function ()
    {
        var _190_28_, _197_37_

        if (!(this.input != null))
        {
            return
        }
        this.input.removeEventListener('focusout',this.onNameFocusOut)
        this.input.removeEventListener('change',this.onNameChange)
        this.input.removeEventListener('keydown',this.onNameKeyDown)
        this.input.remove()
        delete this.input
        this.input = null
        if (!(document.activeElement != null) || document.activeElement === document.body)
        {
            return this.column.focus({activate:false})
        }
    }

    Row.prototype["onNameFocusOut"] = function (event)
    {
        return this.removeInput()
    }

    Row.prototype["onNameChange"] = function (event)
    {
        var targetFile

        targetFile = slash.join(slash.dir(this.item.file),this.input.value.trim())
        this.removeInput()
        return this.rename(targetFile)
    }

    Row.prototype["rename"] = function (targetFile)
    {
        if (slash.samePath(this.item.file,targetFile))
        {
            return
        }
        return File.rename(this.item.file,targetFile,(function (source, target)
        {}).bind(this))
    }

    return Row
})()

module.exports = Row