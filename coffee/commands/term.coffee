# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000

log      = require '../tools/log'
syntax   = require '../editor/syntax'
Command  = require '../commandline/command'
electron = require 'electron'
ipc      = electron.ipcRenderer

class Term extends Command

    constructor: (@commandline) ->
        @shortcuts = ['command+t']
        @names     = ['term']
        super @commandline
        @maxHistory = 100
        @cmdID = 0
        
    onShellCommandData: (cmdData)  => 
        terminal = window.terminal
        terminal.output cmdData.data
        terminal.scrollCursorToTop 5

    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clear: ->
        if window.terminal.lines.length > 1
            window.terminal.clear()
        else
            text: ''
       
    #  0000000   000      000   0000000    0000000
    # 000   000  000      000  000   000  000     
    # 000000000  000      000  000000000  0000000 
    # 000   000  000      000  000   000       000
    # 000   000  0000000  000  000   000  0000000 
    
    alias: (aliasList) ->
        terminal = window.terminal
        alias = @getState 'alias', {}
        
        if aliasList.length == 1
            delete alias[aliasList[0]]
        else if aliasList.length > 1
            alias[aliasList[0]] = aliasList.slice(1).join ' '
        @setState 'alias', alias if aliasList.length
        for key,cmd of alias
            terminal.output "#{key} #{cmd}" 
        return text: '', reveal: 'terminal'
    
    #  0000000  00000000   000      000  000000000         0000000   000      000   0000000    0000000
    # 000       000   000  000      000     000           000   000  000      000  000   000  000     
    # 0000000   00000000   000      000     000           000000000  000      000  000000000  0000000 
    #      000  000        000      000     000           000   000  000      000  000   000       000
    # 0000000   000        0000000  000     000           000   000  0000000  000  000   000  0000000 
    
    splitAlias: (command) ->
        commands = command.split ';'
        if commands.length > 1
            cmds = []
            for cmd in commands
                cmds = cmds.concat @splitAlias cmd.trim()
            cmds
        else            
            alias = @getState 'alias', {}
            split = command.split ' '
            if alias[split[0]]?
                @splitAlias (alias[split[0]] + ' ' + split.slice(1).join ' ').trim()
            else
                [command.trim()]
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: (command) ->
        super command
        terminal = window.terminal
        cmds = @splitAlias command
        for cmd in cmds
            terminal.appendMeta clss: 'salt', text: cmd.slice 0, 32                        
            terminal.singleCursorAtPos [0, terminal.lines.length-1]
            if cmd.startsWith 'alias'
                @alias cmd.split(' ').slice 1
                continue
            switch cmd
                when 'history' then terminal.output @history.join '\n'
                when 'clear'   then terminal.clear()
                when 'classes' 
                    window.split.reveal 'terminal'
                    classes = ipc.sendSync 'indexer', 'classes'
                    for clss, info of classes
                        terminal.appendMeta clss: 'salt', text: clss
                        meta =
                            diss: syntax.dissForTextAndSyntax "● #{clss}", 'ko'
                            href: "#{info.file}:#{info.line+1}"
                            clss: 'searchResult'
                        terminal.appendMeta meta
                        
                        for mthd, minfo of info.methods
                            meta =
                                diss: syntax.dissForTextAndSyntax "    ▸ #{mthd}", 'ko'
                                href: "#{info.file}:#{minfo.line+1}"
                                clss: 'searchResult'
                            terminal.appendMeta meta
                else
                    ipc.send 'shellCommand', winID: window.winID, cmdID: @cmdID, command: cmd
                    @cmdID += 1
                    
        terminal.scrollCursorToTop 5
        text: ''
        reveal: 'terminal'
        
module.exports = Term
