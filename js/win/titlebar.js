// monsterkodi/kode 0.270.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var $, elem, post, stopEvent

$ = require('kxk').$
elem = require('kxk').elem
post = require('kxk').post
stopEvent = require('kxk').stopEvent

class Titlebar
{
    constructor ()
    {
        this.onWinTabs = this.onWinTabs.bind(this)
        this.closeList = this.closeList.bind(this)
        this.showList = this.showList.bind(this)
        this.onWinFocus = this.onWinFocus.bind(this)
        this.onSticky = this.onSticky.bind(this)
        this.onNumWins = this.onNumWins.bind(this)
        this.elem = $('titlebar')
        this.selected = -1
        document.body.addEventListener('focusout',this.closeList)
        document.body.addEventListener('focusin',this.closeList)
        this.info = {numWins:1,sticky:false,focus:true}
        post.on('numWins',this.onNumWins)
        post.on('winFocus',this.onWinFocus)
        post.on('winTabs',this.onWinTabs)
        post.on('sticky',this.onSticky)
    }

    onNumWins (numWins)
    {
        if (this.info.numWins !== numWins)
        {
            return this.info.numWins = numWins
        }
    }

    onSticky (sticky)
    {
        if (this.info.sticky !== sticky)
        {
            return this.info.sticky = sticky
        }
    }

    onWinFocus (focus)
    {
        if (this.info.focus !== focus)
        {
            this.info.focus = focus
            return this.elem.classList.toggle('focus',this.info.focus)
        }
    }

    showList (event)
    {
        var winInfos, _55_23_

        if ((this.list != null))
        {
            return
        }
        winInfos = post.get('winInfos')
        if (winInfos.length <= 1)
        {
            return
        }
        document.activeElement.blur()
        this.selected = -1
        this.list = elem({class:'winlist'})
        this.elem.parentNode.insertBefore(this.list,this.elem.nextSibling)
        this.listWinInfos(winInfos)
        return stopEvent(event)
    }

    closeList ()
    {
        var _67_16_, _70_17_

        if ((this.list != null))
        {
            window.split.focusAnything()
            this.selected = -1
            ;(this.list != null ? this.list.remove() : undefined)
            return this.list = null
        }
    }

    listWinInfos (winInfos)
    {
        var activateWindow, div, info

        this.list.innerHTML = ""
        var list = _k_.list(winInfos)
        for (var _83_17_ = 0; _83_17_ < list.length; _83_17_++)
        {
            info = list[_83_17_]
            if (info.id === window.winID)
            {
                continue
            }
            div = elem({class:"winlist-item",children:[elem('span',{class:'wintabs',text:''})]})
            div.winID = info.id
            activateWindow = (function (id)
            {
                return (function (event)
                {
                    this.loadWindowWithID(id)
                    return stopEvent(event)
                }).bind(this)
            }).bind(this)
            div.addEventListener('mousedown',activateWindow(info.id))
            this.list.appendChild(div)
        }
        post.toOtherWins('sendTabs',window.winID)
        this.navigate('down')
        return this
    }

    onWinTabs (winID, tabs)
    {
        var div, w, width, _105_27_

        if (!(this.list != null))
        {
            return
        }
        if (winID === window.winID)
        {
            return
        }
        var list = _k_.list(this.list.children)
        for (var _107_16_ = 0; _107_16_ < list.length; _107_16_++)
        {
            div = list[_107_16_]
            if (div.winID === winID)
            {
                if (w = $('.wintabs',div))
                {
                    w.innerHTML = tabs
                }
                width = div.getBoundingClientRect().width
                break
            }
        }
    }

    loadWindowWithID (id)
    {
        this.closeList()
        return post.toMain('activateWindow',id)
    }

    loadSelected ()
    {
        if (this.selected < 0)
        {
            return this.closeList()
        }
        return this.loadWindowWithID(this.list.children[this.selected].winID)
    }

    navigate (dir = 'down')
    {
        if (!this.list)
        {
            return
        }
        ;(this.list.children[this.selected] != null ? this.list.children[this.selected].classList.remove('selected') : undefined)
        this.selected += ((function ()
        {
            switch (dir)
            {
                case 'up':
                    return -1

                case 'down':
                    return 1

                default:
                    return 0
            }

        }).bind(this))()
        if (this.selected < -1)
        {
            this.selected = this.list.children.length - 1
        }
        if (this.selected >= this.list.children.length)
        {
            this.selected = -1
        }
        if (this.selected > -1)
        {
            return this.list.children[this.selected].classList.add('selected')
        }
    }

    globalModKeyComboEvent (mod, key, combo, event)
    {
        var _148_16_

        switch (combo)
        {
            case 'command+alt+left':
            case 'command+alt+right':
                return winow.tabs.navigate(key)

            case 'command+alt+shift+left':
            case 'command+alt+shift+right':
                return window.tabs.move(key)

        }

        if ((this.list != null))
        {
            switch (combo)
            {
                case 'esc':
                case 'alt+`':
                    return this.closeList()

                case 'up':
                case 'down':
                    return this.navigate(key)

                case 'enter':
                    return this.loadSelected()

            }

        }
        return 'unhandled'
    }
}

module.exports = Titlebar