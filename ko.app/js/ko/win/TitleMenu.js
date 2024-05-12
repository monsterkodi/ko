var _k_

var QuickMenu

import kxk from "../../kxk.js"
let elem = kxk.elem
let post = kxk.post
let stopEvent = kxk.stopEvent
let $ = kxk.$


QuickMenu = (function ()
{
    function QuickMenu ()
    {
        var title

        this["updateIcons"] = this["updateIcons"].bind(this)
        this["onDevTools"] = this["onDevTools"].bind(this)
        this["onList"] = this["onList"].bind(this)
        this["onTerminal"] = this["onTerminal"].bind(this)
        this["onBrowser"] = this["onBrowser"].bind(this)
        title = $('title')
        this.div = elem({class:'titlemenu',children:[elem({text:'',class:'quickmenu-item quickmenu-browser',click:this.onBrowser,dblclick:function (e)
        {
            return stopEvent(e)
        }}),elem({text:'',class:'quickmenu-item quickmenu-terminal',click:this.onTerminal,dblclick:function (e)
        {
            return stopEvent(e)
        }}),elem({text:'',class:'quickmenu-item quickmenu-devtools',click:this.onDevTools,dblclick:function (e)
        {
            return stopEvent(e)
        }}),elem({text:'',class:'quickmenu-item quickmenu-list',click:this.onList,dblclick:function (e)
        {
            return stopEvent(e)
        }})]})
        post.on('split',this.updateIcons)
        title.parentElement.insertBefore(this.div,title.nextSibling)
    }

    QuickMenu.prototype["onBrowser"] = function ()
    {
        return this.toggle('browser')
    }

    QuickMenu.prototype["onTerminal"] = function ()
    {
        return this.toggle('terminal')
    }

    QuickMenu.prototype["onList"] = function ()
    {
        return post.emit('menuAction','Toggle Func List')
    }

    QuickMenu.prototype["onDevTools"] = function ()
    {
        return post.emit('menuAction','DevTools')
    }

    QuickMenu.prototype["toggle"] = function (what)
    {
        if (split[`${what}Visible`]())
        {
            split.do('maximize editor')
        }
        else
        {
            split.do(`quart ${what}`)
        }
        return this.updateIcons()
    }

    QuickMenu.prototype["updateIcons"] = function ()
    {
        $(".titlemenu-browser").innerHTML = (split.browserVisible() ? '' : '')
        return $(".titlemenu-terminal").innerHTML = (split.terminalVisible() ? '' : '')
    }

    return QuickMenu
})()

export default QuickMenu;