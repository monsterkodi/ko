var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

import kxk from "../../../kxk.js"
let matchr = kxk.matchr
let slash = kxk.slash
let post = kxk.post
let ffs = kxk.ffs

export default {actions:{jumpToWord:{name:'Jump to Word',text:'jump to word at cursor',combo:'alt+enter'}},jumpToFileAtPos:function (p = this.cursorPos())
{
    var col, d, diss, file, line, ranges, rgx, text

    text = this.line(p[1])
    rgx = /([\~\/\w\.]+\/[\w\.]+\w[:\d]*)/
    if (rgx.test(text))
    {
        ranges = matchr.ranges(rgx,text)
        diss = matchr.dissect(ranges,{join:false})
        var list = _k_.list(diss)
        for (var _29_18_ = 0; _29_18_ < list.length; _29_18_++)
        {
            d = list[_29_18_]
            if ((d.start <= p[0] && p[0] <= d.start + d.match.length))
            {
                var _32_38_ = slash.splitFileLine(d.match); file = _32_38_[0]; line = _32_38_[1]; col = _32_38_[2]

                console.log('jumpToFileAtPos check file exists -----------',slash.dir(this.currentFile),file,slash.path(slash.dir(this.currentFile),file))
                ffs.fileExists(file).catch(function (err)
                {
                    console.error(`fileExists fail! ${err}`)
                }).then(function (f)
                {
                    var cwd

                    if (f)
                    {
                        console.log('file exists! ---------!!!!!!!!!!!',f,file)
                        return post.emit('jumpTo',{path:file,line:line,col:col})
                    }
                    else if (!slash.isAbsolute(d.match))
                    {
                        cwd = kakao.bundle.path
                        var _40_46_ = slash.splitFileLine(slash.path(cwd,d.match)); file = _40_46_[0]; line = _40_46_[1]; col = _40_46_[2]

                        console.log('jumpTo',cwd,{path:file,line:line,col:col})
                        return post.emit('jumpTo ++++++++++++',{path:file,line:line,col:col})
                    }
                })
                console.log('wait for file jump?',d)
                return
            }
            if (!slash.isAbsolute(d.match))
            {
                var _48_38_ = slash.splitFileLine(slash.path(kakao.bundle.path,d.match)); file = _48_38_[0]; line = _48_38_[1]; col = _48_38_[2]

                post.emit('jumpTo',{path:file,line:line,col:col})
                return true
            }
        }
    }
    if (slash.win())
    {
        rgx = /([\~\\\w\.]+\\[\w\.]+\w[:\d]*)/
        ranges = matchr.ranges(rgx,text)
        diss = matchr.dissect(ranges,{join:false})
        var list1 = _k_.list(diss)
        for (var _59_18_ = 0; _59_18_ < list1.length; _59_18_++)
        {
            d = list1[_59_18_]
            if ((d.start <= p[0] && p[0] <= d.start + d.match.length))
            {
                var _61_38_ = slash.splitFileLine(d.match); file = _61_38_[0]; line = _61_38_[1]; col = _61_38_[2]

                if (slash.fileExists(file))
                {
                    post.emit('jumpTo',{path:file,line:line,col:col})
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