
#  0000000  00000000   0000000   00000000    0000000  000   000
# 000       000       000   000  000   000  000       000   000
# 0000000   0000000   000000000  0000000    000       000000000
#      000  000       000   000  000   000  000       000   000
# 0000000   00000000  000   000  000   000   0000000  000   000

{ packagePath, unresolve, path, post, fs, os, log, _ } = require 'kxk'

walker   = require '../tools/walker'
matchr   = require '../tools/matchr'
syntax   = require '../editor/syntax'
Command  = require '../commandline/command'
stream   = require 'stream'

class Search extends Command

    constructor: (@commandline) ->
        if os.platform() == 'win32'
            @shortcuts = ["ctrl+shift+f", "alt+shift+f", "alt+ctrl+shift+f", ""]
        else
            @shortcuts = ["command+shift+f", "ctrl+shift+f", "alt+shift+f", "alt+ctrl+shift+f"]
        @names = ["search", "Search", "/search/", "/Search/"]
        super @commandline
     
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
        
        terminal.doAutoClear()
        
        @startSearchInFiles 
            text: command
            name: @name
            file: file
            
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
        terminal.appendMeta clss: 'searchHeader', diss: syntax.dissForTextAndSyntax "▸ Search for '#{opt.text}':", 'ko'
        terminal.appendMeta clss: 'spacer'
        terminal.singleCursorAtPos [0, terminal.numLines()-2]
        dir = packagePath path.dirname opt.file
        dir ?= path.dirname opt.file
        @walker = new walker
            root:        dir
            maxDepth:    6
            includeDirs: false
            file:        (f,stat) => @searchInFile opt, f
        @walker.cfg.ignore.push 'js'
        @walker.start()
        
    searchInFile: (opt, file) ->
        
        stream = fs.createReadStream file, encoding: 'utf8'
        stream.pipe new FileSearcher @, opt, file

    # 00     00  00000000  000000000   0000000    0000000  000      000   0000000  000   000  
    # 000   000  000          000     000   000  000       000      000  000       000  000   
    # 000000000  0000000      000     000000000  000       000      000  000       0000000    
    # 000 0 000  000          000     000   000  000       000      000  000       000  000   
    # 000   000  00000000     000     000   000   0000000  0000000  000   0000000  000   000  
    
    onMetaClick: (meta, event) =>

        href = meta[2].href      
        split = href.split ':'
        
        if split.length == 1 or _.isFinite parseInt split[1]
            
            window.split.show 'editor'
            file = href + ':' + window.terminal.posForEvent(event)[0]
            window.openFiles [file], newTab: event.metaKey
            # window.loadFile file
            
        else
            
            if window.commandline.commands[split[0]]?
                command = window.commandline.commands[split[0]]
                window.commandline.startCommand split[0], command.shortcuts[0]
                window.commandline.setText split[1]
                command.execute split[1]

        'unhandled'

#  0000000  00000000   0000000   00000000    0000000  000   000  00000000  00000000 
# 000       000       000   000  000   000  000       000   000  000       000   000
# 0000000   0000000   000000000  0000000    000       000000000  0000000   0000000  
#      000  000       000   000  000   000  000       000   000  000       000   000
# 0000000   00000000  000   000  000   000   0000000  000   000  00000000  000   000

class FileSearcher extends stream.Writable
    
    constructor: (@command, @opt, @file) ->
        
        @line = 0
        @flags = ''
        @patterns = switch @opt.name
            when 'search'   then [[new RegExp(_.escapeRegExp(@opt.text), 'i'), 'found']]
            when 'Search'   then [[new RegExp(_.escapeRegExp(@opt.text)),      'found']]
            when '/search/' then @flags='i'; @opt.text
            when '/Search/' then @opt.text
        @found = []
        extn = path.extname(@file).slice 1
        if extn in syntax.syntaxNames
            @syntaxName = extn
        else
            @syntaxName = null
        super
            
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
                diss: syntax.dissForTextAndSyntax "◼ #{unresolve @file}", 'ko'
                href: @file
                click: @command.onMetaClick
                
            terminal.appendMeta meta
            terminal.appendMeta clss: 'spacer'
            
            for fi in [0...@found.length]
                f = @found[fi]
                rgs = f[2].concat syntax.rangesForTextAndSyntax f[1], @syntaxName
                matchr.sortRanges rgs
                dss = matchr.dissect rgs, join:true
                
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
