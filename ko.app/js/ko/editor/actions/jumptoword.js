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
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            d = list[_a_]
            if ((d.start <= p[0] && p[0] <= d.start + d.match.length))
            {
                var _b_ = slash.splitFileLine(d.match); file = _b_[0]; line = _b_[1]; col = _b_[2]

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
                        var _c_ = slash.splitFileLine(slash.path(cwd,d.match)); file = _c_[0]; line = _c_[1]; col = _c_[2]

                        console.log('jumpTo',cwd,{path:file,line:line,col:col})
                        return post.emit('jumpTo ++++++++++++',{path:file,line:line,col:col})
                    }
                })
                console.log('wait for file jump?',d)
                return
            }
            if (!slash.isAbsolute(d.match))
            {
                var _d_ = slash.splitFileLine(slash.path(kakao.bundle.path,d.match)); file = _d_[0]; line = _d_[1]; col = _d_[2]

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
        for (var _e_ = 0; _e_ < list1.length; _e_++)
        {
            d = list1[_e_]
            if ((d.start <= p[0] && p[0] <= d.start + d.match.length))
            {
                var _f_ = slash.splitFileLine(d.match); file = _f_[0]; line = _f_[1]; col = _f_[2]

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