###
 0000000   000  000000000  000  000   000  00000000   0000000 
000        000     000     000  0000  000  000       000   000
000  0000  000     000     000  000 0 000  000000    000   000
000   000  000     000     000  000  0000  000       000   000
 0000000   000     000     000  000   000  000        0000000 
###

{ post, slash, elem, empty, error, log, fs, $, _ } = require 'kxk'

forkfunc = require '../tools/forkfunc'
syntax   = require '../editor/syntax'
matchr   = require '../tools/matchr'

class GitInfo
    
    constructor: ->
        
    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onMetaClick: (meta, event) =>
        
        if href = meta[2].href
            href += ':' + window.terminal.posForEvent(event)[0]
            window.split.show 'editor'
            window.openFiles [href], newTab: event.metaKey
        'unhandled' # otherwise cursor doesn't get set
        
    logText: (text) ->
        
        terminal = window.terminal
        terminal.appendMeta clss: 'searchHeader', diss: syntax.dissForTextAndSyntax text, 'ko'

    #  0000000  000   000   0000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  0000  000  000        000       000       
    # 000       000000000  000000000  000 0 000  000  0000  0000000   0000000   
    # 000       000   000  000   000  000  0000  000   000  000            000  
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000   
    
    logChanges: (changes) ->
        
        terminal = window.terminal
        
        extn = slash.ext changes.file
        if extn in syntax.syntaxNames
            syntaxName = extn
        else
            syntaxName = null
        
        sytx = new syntax syntaxName, (i) -> changes.lines[i]
        
        index = 0
        for text in changes.lines
            
            dss = sytx.getDiss index
            
            if changes.change == 'deleted'
                dss.map (ds) -> ds.clss += ' ' + 'deleted'
            
            meta =
                diss: dss
                href: "#{changes.file}:#{changes.line}"
                clss: 'searchResult'
                click: @onMetaClick
                            
            terminal.appendMeta meta
            post.emit 'search-result', meta
            index += 1
        
    #  0000000  000   000   0000000   000   000   0000000   00000000  
    # 000       000   000  000   000  0000  000  000        000       
    # 000       000000000  000000000  000 0 000  000  0000  0000000   
    # 000       000   000  000   000  000  0000  000   000  000       
    #  0000000  000   000  000   000  000   000   0000000   00000000  
    
    logChange: (change) ->
        
        terminal = window.terminal
        
        extn = slash.ext change.file
        if extn in syntax.syntaxNames
            syntaxName = extn
        else
            syntaxName = null
        
        rgs = syntax.rangesForTextAndSyntax change.text, syntaxName
        matchr.sortRanges rgs
        dss = matchr.dissect rgs, join:true
        
        if change.change == 'deleted'
            dss.map (ds) -> ds.clss += ' ' + 'deleted'
        
        meta =
            diss: dss
            href: "#{change.file}:#{change.line}"
            clss: 'searchResult'
            click: @onMetaClick
                        
        terminal.appendMeta meta
        post.emit 'search-result', meta
        
    # 00000000  000  000      00000000  
    # 000       000  000      000       
    # 000000    000  000      0000000   
    # 000       000  000      000       
    # 000       000  0000000  00000000  
    
    logFile: (change, file) -> 
        
        text = switch change
            when 'changed' then '  ● '
            when 'added'   then '  ◼ '
            when 'deleted' then '  ✘ '
            
        symbol = switch change

            when 'changed' then '●'
            when 'added'   then '◼'
            when 'deleted' then '✘'
            
        log text, slash.tilde file # dont delete this for now :)
        
        terminal = window.terminal
        meta = 
            diss:       syntax.dissForTextAndSyntax "#{slash.tilde file}", 'ko'
            href:       file
            clss:       'gitInfoFile'
            click:      @onMetaClick
            line:       symbol
            lineClss:   'gitInfoLine '+change
            
        terminal.appendMeta meta
        terminal.appendMeta clss: 'spacer'
    
    #  0000000  000000000   0000000   00000000   000000000  
    # 000          000     000   000  000   000     000     
    # 0000000      000     000000000  0000000       000     
    #      000     000     000   000  000   000     000     
    # 0000000      000     000   000  000   000     000     
    
    start: -> 
        
        dirOrFile = window.cwd.cwd ? window.editor.currentFile
        log 'Git:', slash.tilde dirOrFile # dont delete this for now :)

        window.split.raise 'terminal'
        terminal = window.terminal
        terminal.doAutoClear()
        
        forkfunc '../tools/gitinfo', dirOrFile, (err, info) =>
            
            return error "gitinfo failed for #{file}", err if not empty err
            
            return if empty info
            
            terminal = window.terminal
            terminal.appendMeta clss: 'salt', text: slash.tilde info.gitDir
            terminal.appendMeta clss: 'spacer'
                
            for file in info.deleted
                
                @logFile 'deleted', file # dont delete this for now :)
                
            for file in info.added
                
                @logFile 'added', file  # dont delete this for now :)
                
                data  = fs.readFileSync file, encoding: 'utf8'
                lines = data.split /\r?\n/
                line  = 1
                
                line += @logChanges lines:lines, file:file, line:line, change:'new'
                    
                terminal.appendMeta clss: 'spacer'
                
            for changeInfo in info.changed                
                
                @logFile 'changed', changeInfo.file # dont delete this for now :)
                
                for change in changeInfo.changes
                    line = change.line
                    
                    if not empty change.mod
                        lines = change.mod.map (l) -> l.new
                        line += @logChanges lines:lines, file:changeInfo.file, line:line, change:'changed'
                        
                    if not empty change.add
                        lines = change.add.map (l) -> l.new
                        line += @logChanges lines:lines, file:changeInfo.file, line:line, change:'added'
                        
                    if not empty change.del
                        lines = change.del.map (l) -> l.old
                        line += @logChanges lines:lines, file:changeInfo.file, line:line, change:'deleted'
                        
                    terminal.appendMeta clss: 'spacer'

            terminal.scroll.cursorToTop 7
        
module.exports = new GitInfo