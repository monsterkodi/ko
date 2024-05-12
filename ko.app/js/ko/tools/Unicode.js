var _k_ = {dir: function () { let url = import.meta.url.substring(7); let si = url.lastIndexOf('/'); return url.substring(0, si); }, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var Unicode

import kxk from "../../kxk.js"
let post = kxk.post
let slash = kxk.slash
let ffs = kxk.ffs
let noon = kxk.noon


Unicode = (function ()
{
    function Unicode ()
    {
        this["onUnicode"] = this["onUnicode"].bind(this)
        ffs.read(slash.path(_k_.dir(),'../../../kode/ko/tools/Uniko.txt')).then((function (uniko)
        {
            this.uniko = uniko
        }).bind(this))
        noon.load(slash.path(_k_.dir(),'../../../kode/ko/tools/Uniko.noon')).then((function (fonts)
        {
            this.fonts = fonts
        }).bind(this))
        post.on('unicode',this.onUnicode)
    }

    Unicode.prototype["onUnicode"] = function ()
    {
        var ci, font, fonts, li, line, lines, start

        window.split.raise('terminal')
        window.split.do('maximize terminal')
        window.terminal.clear()
        window.terminal.singleCursorAtPos([0,0])
        window.terminal.setFontSize(Math.round(window.terminal.view.getBoundingClientRect().width / 64))
        if (false)
        {
            start = 67400
            for (li = 0; li <= 42; li++)
            {
                line = ' '
                for (ci = 0; ci <= 80; ci++)
                {
                    line += String.fromCharCode(start + ci + 80 * li)
                }
                window.terminal.queueMeta({font:'fontMono',text:line,line:''})
            }
        }
        if (true)
        {
            var list = _k_.list(this.uniko.split('\n'))
            for (var _41_21_ = 0; _41_21_ < list.length; _41_21_++)
            {
                line = list[_41_21_]
                window.terminal.queueMeta({text:line,line:'●'})
            }
        }
        if (false)
        {
            fonts = {fontMono:61440}
            for (font in fonts)
            {
                start = fonts[font]
                window.terminal.queueMeta({list:font,text:font,line:'●'})
                for (li = 0; li <= 42; li++)
                {
                    line = ' '
                    for (ci = 0; ci <= 80; ci++)
                    {
                        line += String.fromCharCode(start + ci + 80 * li)
                        line += ' '
                    }
                    window.terminal.queueMeta({font:font,text:line,line:''})
                }
            }
        }
        for (font in this.fonts)
        {
            lines = this.fonts[font]
            window.terminal.queueMeta({list:font,text:font,line:'◆'})
            var list1 = _k_.list(lines)
            for (var _82_21_ = 0; _82_21_ < list1.length; _82_21_++)
            {
                line = list1[_82_21_]
                window.terminal.queueMeta({font:font,text:'        ' + line,line:''})
            }
        }
    }

    return Unicode
})()

export default Unicode;