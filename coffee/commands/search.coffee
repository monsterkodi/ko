###
 0000000  00000000   0000000   00000000    0000000  000   000
000       000       000   000  000   000  000       000   000
0000000   0000000   000000000  0000000    000       000000000
     000  000       000   000  000   000  000       000   000
0000000   00000000  000   000  000   000   0000000  000   000
###

{ slash, post, fs, os, log, _ } = require 'kxk'

walker   = require '../tools/walker'
matchr   = require '../tools/matchr'
syntax   = require '../editor/syntax'
Command  = require '../commandline/command'
stream   = require 'stream'

class Search extends Command

    constructor: (commandline) ->
        
        super commandline
        
        @names = ["search", "Search", "/search/", "/Search/"]
     
    historyKey: -> @name
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: (command) ->
        
        return if not command.length
        
        switch @name
            when '/search/', '/Search/'
                if command in ['^', '$', '.']
                    log 'pattern would match anything!'
                    return 
                rngs = matchr.ranges command, '  '
                if rngs.length == 2
                    log 'pattern would match space!'
                    return
                
        command = super command
        file = window.editor.currentFile ? _.first _.keys(post.get('indexer', 'files'))
        
        return if not file?
        
        window.terminal.doAutoClear()
        
        @startSearchInFiles 
            text: command
            name: @name
            file: slash.path file
            
        focus:  'terminal'
        show:   'terminal'
        text:   command
        select: true
      
    #  0000000  00000000   0000000   00000000    0000000  000   000
    # 000       000       000   000  000   000  000       000   000
    # 0000000   0000000   000000000  0000000    000       000000000
    #      000  000       000   000  000   000  000       000   000
    # 0000000   00000000  000   000  000   000   0000000  000   000
    
    startSearchInFiles: (opt) ->
        
        terminal = window.terminal
        terminal.appendMeta clss: 'salt', text: opt.text.slice 0, 14
        terminal.appendMeta clss: 'searchHeader', diss: syntax.dissForTextAndSyntax "▸ Search for '#{opt.text}':", 'ko'
        terminal.appendMeta clss: 'spacer'
        terminal.singleCursorAtPos [0, terminal.numLines()-2]
        dir = slash.pkg slash.dir opt.file
        dir ?= slash.dir opt.file
        @walker = new walker
            root:        dir
            maxDepth:    6
            includeDirs: false
            file:        (f,stat) => @searchInFile opt, slash.path f
        @walker.cfg.ignore.push 'js'
        @walker.start()
        
    searchInFile: (opt, file) =>

        stream = fs.createReadStream file, encoding: 'utf8'
        stream.pipe new FileSearcher @, opt, file

    # 00     00  00000000  000000000   0000000    0000000  000      000   0000000  000   000  
    # 000   000  000          000     000   000  000       000      000  000       000  000   
    # 000000000  0000000      000     000000000  000       000      000  000       0000000    
    # 000 0 000  000          000     000   000  000       000      000  000       000  000   
    # 000   000  00000000     000     000   000   0000000  0000000  000   0000000  000   000  
    
    onMetaClick: (meta, event) =>

        href = meta[2].href   
        
        if href.startsWith '>'
            
            split = href.split '>'
            if window.commandline.commands[split[1]]?
                command = window.commandline.commands[split[1]]
                window.commandline.startCommand split[1]
                window.commandline.setText split[2]
                command.execute split[2]
        else
            file = href + ':' + window.terminal.posForEvent(event)[0]
            window.openFiles [file], newTab: event.metaKey

        'unhandled'

#  0000000  00000000   0000000   00000000    0000000  000   000  00000000  00000000 
# 000       000       000   000  000   000  000       000   000  000       000   000
# 0000000   0000000   000000000  0000000    000       000000000  0000000   0000000  
#      000  000       000   000  000   000  000       000   000  000       000   000
# 0000000   00000000  000   000  000   000   0000000  000   000  00000000  000   000

class FileSearcher extends stream.Writable
    
    constructor: (@command, @opt, @file) ->
        
        super()
        @line = 0
        @flags = ''
        @patterns = switch @opt.name
            when 'search'   then [[new RegExp(_.escapeRegExp(@opt.text), 'i'), 'found']]
            when 'Search'   then [[new RegExp(_.escapeRegExp(@opt.text)),      'found']]
            when '/search/' then @flags='i'; @opt.text
            when '/Search/' then @opt.text
            else
                log 'dafuk? name:', @command.name, 'opt:', @opt, 'file:', @file
                [[new RegExp(_.escapeRegExp(@opt.text), 'i'), 'found']]
                
        @found = []
        extn = slash.ext @file
        if extn in syntax.syntaxNames
            @syntaxName = extn
        else
            @syntaxName = null
            
    write: (chunk, encoding, cb) ->
        
        lines = chunk.split '\n'
        @syntaxName = syntax.shebang lines[0] if not @syntaxName?
        for l in lines
            @line += 1            
            rngs = matchr.ranges @patterns, l, @flags
            if rngs.length
                @found.push [@line, l, rngs]
        true
        
    end: (chunk, encoding, cb) =>
        
        if @found.length
            
            terminal = window.terminal
            
            meta = 
                diss:       syntax.dissForTextAndSyntax "#{slash.tilde @file}", 'ko'
                href:       @file
                clss:       'gitInfoFile'
                click:      @command.onMetaClick
                line:       '◼'
                
            terminal.appendMeta meta
            terminal.appendMeta clss: 'spacer'
                        
            for fi in [0...@found.length]
                
                f = @found[fi]
                
                sytx = new syntax @syntaxName, (i) -> f[1]
                sytx.setFileType @syntaxName
                dss = sytx.balancer.dissForLineAndRanges f[1], f[2]
                                
                meta =
                    diss: dss
                    href: "#{@file}:#{f[0]}"
                    clss: 'searchResult'
                    click: @command.onMetaClick
                    
                if fi and @found[fi-1][0] != f[0]-1
                    terminal.appendMeta clss: 'spacer'
                    
                terminal.appendMeta meta
                post.emit 'search-result', meta
                
            terminal.appendMeta clss: 'spacer'
            terminal.scroll.cursorToTop()
                
module.exports = Search
