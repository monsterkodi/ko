###
 0000000   000  000000000  000  000   000  00000000   0000000 
000        000     000     000  0000  000  000       000   000
000  0000  000     000     000  000 0 000  000000    000   000
000   000  000     000     000  000  0000  000       000   000
 0000000   000     000     000  000   000  000        0000000 
###

{ post, slash, elem, empty, fs, $, _ } = require 'kxk'

lineDiff   = require '../tools/linediff'
Syntax     = require '../editor/syntax'
hub        = require '../git/hub'

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
            post.emit 'openFiles', [href], newTab: event.metaKey
        'unhandled' # otherwise cursor doesn't get set
        
    logText: (text) ->
        
        terminal = window.terminal
        terminal.appendMeta clss: 'searchHeader', diss: Syntax.dissForTextAndSyntax text, 'ko'

    #  0000000  000   000   0000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  0000  000  000        000       000       
    # 000       000000000  000000000  000 0 000  000  0000  0000000   0000000   
    # 000       000   000  000   000  000  0000  000   000  000            000  
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000   
    
    logChanges: (changes) ->
        
        terminal = window.terminal
        
        extn = slash.ext changes.file
        if extn in Syntax.syntaxNames
            syntaxName = extn
        else
            syntaxName = 'txt'
        
        sytx = new Syntax syntaxName, (i) -> changes.lines[i]
        sytx.setFileType syntaxName
        
        index = 0
        for text in changes.lines
            
            dss = sytx.getDiss index
            
            if changes.change == 'deleted'
                
                dss.map (ds) -> ds.clss += ' ' + 'git-deleted'
                
            else if changes.change == 'changed'
                
                diffs = lineDiff changes.info.mod[index].old, changes.info.mod[index].new
                for diff in diffs 
                    continue if diff.change == 'delete'
                    lineMeta =
                        line:       terminal.numLines()
                        start:      diff.new
                        end:        diff.new+diff.length
                        clss:       'gitInfoChange'
                    terminal.meta.add lineMeta
                
            meta =
                diss: dss
                href: "#{changes.file}:#{changes.line+index}"
                clss: 'searchResult'
                click: @onMetaClick
                            
            terminal.appendMeta meta
            post.emit 'search-result', meta
            index += 1
        index
        
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
            
        terminal = window.terminal
        meta = 
            diss:       Syntax.dissForTextAndSyntax "#{slash.tilde file}", 'ko'
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

        window.split.raise 'terminal'
        terminal = window.terminal
        terminal.doAutoClear()
        
        hub.info dirOrFile, (info) =>

            return if empty info
            
            terminal = window.terminal
            terminal.appendMeta clss: 'salt', text: slash.tilde info.gitDir
            terminal.appendMeta clss: 'spacer'
                
            for file in info.deleted
                
                @logFile 'deleted', file # dont delete this for now :)
                
            for file in info.added
                
                @logFile 'added', file  # dont delete this for now :)
                
                if slash.isText file
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
                        line += @logChanges lines:lines, file:changeInfo.file, line:line, info:change, change:'changed'
                        
                    if not empty change.add
                        lines = change.add.map (l) -> l.new
                        line += @logChanges lines:lines, file:changeInfo.file, line:line, info:change, change:'added'
                        
                    if not empty change.del
                        lines = change.del.map (l) -> l.old
                        line += @logChanges lines:lines, file:changeInfo.file, line:line, info:change, change:'deleted'
                        
                    terminal.appendMeta clss: 'spacer'

            terminal.scroll.cursorToTop 7
        
module.exports = new GitInfo
