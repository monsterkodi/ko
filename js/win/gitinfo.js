// monsterkodi/kode 0.228.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var fs, hub, kxk, lineDiff, post, slash, Syntax

kxk = require('kxk')
fs = kxk.fs
post = kxk.post
slash = kxk.slash

lineDiff = require('../tools/linediff')
Syntax = require('../editor/syntax')
hub = require('../git/hub')
class GitInfo
{
    constructor ()
    {
        this.onMetaClick = this.onMetaClick.bind(this)
    }

    onMetaClick (meta, event)
    {
        var href

        if (href = meta[2].href)
        {
            href += ':' + window.terminal.posForEvent(event)[0]
            post.emit('openFiles',[href],{newTab:event.metaKey})
        }
        return 'unhandled'
    }

    logText (text)
    {
        var terminal

        terminal = window.terminal
        return terminal.appendMeta({clss:'searchHeader',diss:Syntax.dissForTextAndSyntax(text,'ko')})
    }

    logChanges (changes)
    {
        var diff, diffs, dss, extn, index, lineMeta, meta, syntaxName, sytx, terminal, text

        terminal = window.terminal
        extn = slash.ext(changes.file)
        if (_k_.in(extn,Syntax.syntaxNames))
        {
            syntaxName = extn
        }
        else
        {
            syntaxName = 'txt'
        }
        sytx = new Syntax(syntaxName,function (i)
        {
            return changes.lines[i]
        })
        index = 0
        var list = _k_.list(changes.lines)
        for (var _57_17_ = 0; _57_17_ < list.length; _57_17_++)
        {
            text = list[_57_17_]
            dss = sytx.getDiss(index)
            if (changes.change === 'deleted')
            {
                dss.map(function (ds)
                {
                    return ds.clss += ' ' + 'git-deleted'
                })
            }
            else if (changes.change === 'changed')
            {
                diffs = lineDiff(changes.info.mod[index].old,changes.info.mod[index].new)
                var list1 = _k_.list(diffs)
                for (var _68_25_ = 0; _68_25_ < list1.length; _68_25_++)
                {
                    diff = list1[_68_25_]
                    if (diff.change === 'delete')
                    {
                        continue
                    }
                    lineMeta = {line:terminal.numLines(),start:diff.new,end:diff.new + diff.length,clss:'gitInfoChange'}
                    terminal.meta.add(lineMeta)
                }
            }
            meta = {diss:dss,href:`${changes.file}:${changes.line + index}`,clss:'searchResult',click:this.onMetaClick}
            terminal.appendMeta(meta)
            post.emit('search-result',meta)
            index += 1
        }
        return index
    }

    logFile (change, file)
    {
        var meta, symbol, terminal, text

        text = ((function ()
        {
            switch (change)
            {
                case 'changed':
                    return '  ● '

                case 'added':
                    return '  ◼ '

                case 'deleted':
                    return '  ✘ '

            }

        }).bind(this))()
        symbol = ((function ()
        {
            switch (change)
            {
                case 'changed':
                    return '●'

                case 'added':
                    return '◼'

                case 'deleted':
                    return '✘'

            }

        }).bind(this))()
        terminal = window.terminal
        meta = {diss:Syntax.dissForTextAndSyntax(`${slash.tilde(file)}`,'ko'),href:file,clss:'gitInfoFile',click:this.onMetaClick,line:symbol,lineClss:'gitInfoLine ' + change}
        terminal.appendMeta(meta)
        return terminal.appendMeta({clss:'spacer'})
    }

    start ()
    {
        var dirOrFile, terminal, _127_35_

        dirOrFile = ((_127_35_=window.cwd.cwd) != null ? _127_35_ : window.editor.currentFile)
        window.split.raise('terminal')
        terminal = window.terminal
        terminal.clear()
        return hub.info(dirOrFile,(function (info)
        {
            var change, changeInfo, data, file, line, lines

            if (_k_.empty(info))
            {
                return
            }
            terminal = window.terminal
            terminal.appendMeta({clss:'salt',text:slash.tilde(info.gitDir)})
            terminal.appendMeta({clss:'spacer'})
            var list = _k_.list(info.deleted)
            for (var _141_21_ = 0; _141_21_ < list.length; _141_21_++)
            {
                file = list[_141_21_]
                this.logFile('deleted',file)
            }
            var list1 = _k_.list(info.added)
            for (var _145_21_ = 0; _145_21_ < list1.length; _145_21_++)
            {
                file = list1[_145_21_]
                this.logFile('added',file)
                if (slash.isText(file))
                {
                    data = fs.readFileSync(file,{encoding:'utf8'})
                    lines = data.split(/\r?\n/)
                    line = 1
                    line += this.logChanges({lines:lines,file:file,line:line,change:'new'})
                }
                terminal.appendMeta({clss:'spacer'})
            }
            var list2 = _k_.list(info.changed)
            for (var _158_27_ = 0; _158_27_ < list2.length; _158_27_++)
            {
                changeInfo = list2[_158_27_]
                this.logFile('changed',changeInfo.file)
                var list3 = _k_.list(changeInfo.changes)
                for (var _162_27_ = 0; _162_27_ < list3.length; _162_27_++)
                {
                    change = list3[_162_27_]
                    line = change.line
                    if (!_k_.empty(change.mod))
                    {
                        lines = change.mod.map(function (l)
                        {
                            return l.new
                        })
                        line += this.logChanges({lines:lines,file:changeInfo.file,line:line,info:change,change:'changed'})
                    }
                    if (!_k_.empty(change.add))
                    {
                        lines = change.add.map(function (l)
                        {
                            return l.new
                        })
                        line += this.logChanges({lines:lines,file:changeInfo.file,line:line,info:change,change:'added'})
                    }
                    if (!_k_.empty(change.del))
                    {
                        lines = change.del.map(function (l)
                        {
                            return l.old
                        })
                        line += this.logChanges({lines:lines,file:changeInfo.file,line:line,info:change,change:'deleted'})
                    }
                    terminal.appendMeta({clss:'spacer'})
                }
            }
            return terminal.scroll.cursorToTop(7)
        }).bind(this))
    }
}

module.exports = new GitInfo