// monsterkodi/kode 0.230.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var Command, FileSearcher, fs, kerror, klor, matchr, post, Search, slash, stream, Syntax, walker, WritableStream, _

_ = require('kxk')._
fs = require('kxk').fs
kerror = require('kxk').kerror
klor = require('kxk').klor
matchr = require('kxk').matchr
post = require('kxk').post
slash = require('kxk').slash

walker = require('../tools/walker')
Syntax = require('../editor/syntax')
Command = require('../commandline/command')
stream = require('stream')

Search = (function ()
{
    _k_.extend(Search, Command)
    function Search (commandline)
    {
        this["onMetaClick"] = this["onMetaClick"].bind(this)
        this["searchInFile"] = this["searchInFile"].bind(this)
        Search.__super__.constructor.call(this,commandline)
        this.names = ['search','Search','/search/','/Search/']
    }

    Search.prototype["historyKey"] = function ()
    {
        return this.name
    }

    Search.prototype["execute"] = function (command)
    {
        var file, rngs, _45_41_

        if (!command.length)
        {
            return
        }
        switch (this.name)
        {
            case '/search/':
            case '/Search/':
                if (_k_.in(command,['^','$','.']))
                {
                    return
                }
                rngs = matchr.ranges(command,'  ')
                if (rngs.length === 2)
                {
                    return
                }
                break
        }

        command = Search.__super__.execute.call(this,command)
        file = ((_45_41_=window.editor.currentFile) != null ? _45_41_ : _.first(_.keys(post.get('indexer','files'))))
        if (!(file != null))
        {
            return
        }
        window.terminal.clear()
        this.startSearchInFiles({text:command,name:this.name,file:slash.path(file)})
        return {focus:'terminal',show:'terminal',text:command,select:true}
    }

    Search.prototype["startSearchInFiles"] = function (opt)
    {
        var dir, terminal

        terminal = window.terminal
        terminal.appendMeta({clss:'searchHeader',diss:Syntax.dissForTextAndSyntax(`▸ Search for '${opt.text}':`,'ko')})
        terminal.appendMeta({clss:'spacer'})
        terminal.singleCursorAtPos([0,terminal.numLines() - 2])
        dir = slash.pkg(slash.dir(opt.file))
        dir = (dir != null ? dir : slash.dir(opt.file))
        this.walker = new walker({root:dir,maxDepth:12,maxFiles:5000,includeDirs:false,file:(function (f, stat)
        {
            return this.searchInFile(opt,slash.path(f))
        }).bind(this)})
        this.walker.cfg.ignore.push('js')
        this.walker.cfg.ignore.push('lib')
        this.walker.cfg.ignore.push('data')
        return this.walker.start()
    }

    Search.prototype["searchInFile"] = function (opt, file)
    {
        stream = fs.createReadStream(file,{encoding:'utf8'})
        return stream.pipe(new FileSearcher(this,opt,file))
    }

    Search.prototype["onMetaClick"] = function (meta, event)
    {
        var command, file, href, split

        href = meta[2].href
        if (href.startsWith('>'))
        {
            split = href.split('>')
            if ((window.commandline.commands[split[1]] != null))
            {
                command = window.commandline.commands[split[1]]
                window.commandline.startCommand(split[1])
                window.commandline.setText(split[2])
                command.execute(split[2])
            }
        }
        else
        {
            file = href + ':' + window.terminal.posForEvent(event)[0]
            post.emit('openFiles',[file],{newTab:event.metaKey})
        }
        return 'unhandled'
    }

    return Search
})()

WritableStream = stream.Writable

FileSearcher = (function ()
{
    _k_.extend(FileSearcher, WritableStream)
    function FileSearcher (command, opt, file)
    {
        var extn

        this.command = command
        this.opt = opt
        this.file = file
    
        this["end"] = this["end"].bind(this)
        FileSearcher.__super__.constructor.call(this)
        this.line = 0
        this.flags = ''
        this.patterns = ((function ()
        {
            switch (this.opt.name)
            {
                case 'search':
                    return [[new RegExp(_.escapeRegExp(this.opt.text),'i'),'found']]

                case 'Search':
                    return [[new RegExp(_.escapeRegExp(this.opt.text)),'found']]

                case '/search/':
                    this.flags = 'i'
                    return this.opt.text

                case '/Search/':
                    return this.opt.text

                default:
                    kerror(`commands/search FileSearcher -- unhandled '${this.opt.name}' command:`,this.command.name,'opt:',this.opt,'file:',this.file)
                    return [[new RegExp(_.escapeRegExp(this.opt.text),'i'),'found']]
            }

        }).bind(this))()
        this.found = []
        extn = slash.ext(this.file)
        if (_k_.in(extn,Syntax.syntaxNames))
        {
            this.syntaxName = extn
        }
        else
        {
            this.syntaxName = null
        }
    }

    FileSearcher.prototype["write"] = function (chunk, encoding, cb)
    {
        var l, lines, rngs, _150_64_

        lines = chunk.split('\n')
        if (!(this.syntaxName != null))
        {
            this.syntaxName = Syntax.shebang(lines[0])
        }
        var list = _k_.list(lines)
        for (var _151_14_ = 0; _151_14_ < list.length; _151_14_++)
        {
            l = list[_151_14_]
            this.line += 1
            rngs = matchr.ranges(this.patterns,l,this.flags)
            if (rngs.length)
            {
                this.found.push([this.line,l,rngs])
            }
        }
        return true
    }

    FileSearcher.prototype["end"] = function (chunk, encoding, cb)
    {
        var dss, f, fi, meta, regions, terminal

        if (this.found.length)
        {
            terminal = window.terminal
            meta = {diss:Syntax.dissForTextAndSyntax(`${slash.tilde(this.file)}`,'ko'),href:this.file,clss:'gitInfoFile',click:this.command.onMetaClick,line:'◼'}
            terminal.appendMeta(meta)
            terminal.appendMeta({clss:'spacer'})
            for (var _174_23_ = fi = 0, _174_27_ = this.found.length; (_174_23_ <= _174_27_ ? fi < this.found.length : fi > this.found.length); (_174_23_ <= _174_27_ ? ++fi : --fi))
            {
                f = this.found[fi]
                regions = klor.dissect([f[1]],this.syntaxName)[0]
                dss = matchr.merge(regions,matchr.dissect(f[2]))
                meta = {diss:dss,href:`${this.file}:${f[0]}`,clss:'searchResult',click:this.command.onMetaClick}
                if (fi && this.found[fi - 1][0] !== f[0] - 1)
                {
                    terminal.appendMeta({clss:'spacer'})
                }
                terminal.appendMeta(meta)
                post.emit('search-result',meta)
            }
            terminal.appendMeta({clss:'spacer'})
            return terminal.scroll.cursorToTop()
        }
    }

    return FileSearcher
})()

module.exports = Search