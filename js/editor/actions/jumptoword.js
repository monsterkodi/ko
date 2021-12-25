// monsterkodi/kode 0.223.0

var _k_ = {list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var kxk, matchr, post, slash

kxk = require('kxk')
matchr = kxk.matchr
post = kxk.post
slash = kxk.slash

module.exports = {actions:{jumpToWord:{name:'Jump to Word',text:'jump to word at cursor',combo:'alt+enter'}},jumpToFileAtPos:function (p = this.cursorPos())
{
    var col, cwd, d, diss, file, line, ranges, rgx, text

    text = this.line(p[1])
    rgx = /([\~\/\w\.]+\/[\w\.]+\w[:\d]*)/
    if (rgx.test(text))
    {
        ranges = matchr.ranges(rgx,text)
        diss = matchr.dissect(ranges,{join:false})
        var list = _k_.list(diss)
        for (var _30_18_ = 0; _30_18_ < list.length; _30_18_++)
        {
            d = list[_30_18_]
            if ((d.start <= p[0] && p[0] <= d.start + d.match.length))
            {
                var _33_38_ = slash.splitFileLine(d.match); file = _33_38_[0]; line = _33_38_[1]; col = _33_38_[2]

                if (slash.fileExists(file))
                {
                    post.emit('jumpTo',{file:file,line:line,col:col})
                    return true
                }
            }
            if (!slash.isAbsolute(d.match))
            {
                cwd = window.cwd.cwd
                var _41_38_ = slash.splitFileLine(slash.join(cwd,d.match)); file = _41_38_[0]; line = _41_38_[1]; col = _41_38_[2]

                if (slash.isFile(file))
                {
                    post.emit('jumpTo',{file:file,line:line,col:col})
                    return true
                }
                else if (!_k_.empty(this.currentFile) && slash.isFile(slash.swapExt(file,slash.ext(this.currentFile))))
                {
                    file = slash.swapExt(file,slash.ext(this.currentFile))
                    post.emit('jumpTo',{file:file,line:line,col:col})
                    return true
                }
            }
        }
    }
    if (slash.win())
    {
        rgx = /([\~\\\w\.]+\\[\w\.]+\w[:\d]*)/
        ranges = matchr.ranges(rgx,text)
        diss = matchr.dissect(ranges,{join:false})
        var list1 = _k_.list(diss)
        for (var _56_18_ = 0; _56_18_ < list1.length; _56_18_++)
        {
            d = list1[_56_18_]
            if ((d.start <= p[0] && p[0] <= d.start + d.match.length))
            {
                var _58_38_ = slash.splitFileLine(d.match); file = _58_38_[0]; line = _58_38_[1]; col = _58_38_[2]

                if (slash.fileExists(file))
                {
                    post.emit('jumpTo',{file:file,line:line,col:col})
                    return true
                }
            }
        }
    }
    return false
},jumpToWord:function ()
{
    return this.jumpToWordAtPos(this.cursorPos())
},jumpToWordAtPos:function (p = this.cursorPos())
{
    var index, line, nextChar, opt, range, rest, selectionText, text, type, word

    selectionText = this.textOfSelection().trim()
    if (!_k_.empty(selectionText))
    {
        post.emit('jumpTo',selectionText,{})
        return
    }
    if (this.jumpToFileAtPos(p))
    {
        return
    }
    text = this.line(p[1])
    word = this.wordAtPos(p)
    range = this.rangeForRealWordAtPos(p)
    opt = {}
    line = this.line(range[0])
    if (range[1][0] > 0)
    {
        if (line[range[1][0] - 1] === '.')
        {
            opt.type = 'func'
        }
    }
    if (!opt.type && range[1][1] < line.length)
    {
        rest = line.slice(range[1][1])
        index = rest.search(/\S/)
        if (index >= 0)
        {
            nextChar = rest[index]
            type = ((function ()
            {
                switch (nextChar)
                {
                    case '.':
                        return 'class'

                    case '(':
                        return 'func'

                    case ':':
                    case '=':
                        return 'word'

                }

            }).bind(this))()
            if ((type != null))
            {
                opt.type = type
            }
        }
    }
    return post.emit('jumpTo',word,opt)
}}