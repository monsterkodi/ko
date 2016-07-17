# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000
{
unresolve,
clamp,
last
}        = require '../tools/tools'
log      = require '../tools/log'
syntax   = require '../editor/syntax'
Command  = require '../commandline/command'
electron = require 'electron'
path     = require 'path'
ipc      = electron.ipcRenderer

class Term extends Command

    constructor: (@commandline) ->
        @idCommands = Object.create null
        @commandIDs = Object.create null
        @shortcuts  = ['command+t', 'command+shift+t']
        @names      = ['term', 'Term']
        super @commandline
        @maxHistory = 99
        @cmdID      = 0
        
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
            
    loadState: ->
        @idCommands = @getState 'idCommands', Object.create null
        @commandIDs = @getState 'commandIDs', Object.create null
        super

    clearHistory: ->
        @idCommands = Object.create null
        @commandIDs = Object.create null
        @setState 'commandIDs', @commandIDs
        @setState 'idCommands', @idCommands
        super 

    deleteCommandWithID: (id) ->
        id = parseInt id
        if cmmd = @idCommands[id]
            _.pull @history, cmmd
            @index = clamp 0, @history.length-1, @index
            delete @commandIDs[cmmd]
            delete @idCommands[id]
            @setState 'index',      @index
            @setState 'history',    @history
            @setState 'commandIDs', @commandIDs
            @setState 'idCommands', @idCommands
       
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
        commands = command.trim().split ';'
        if commands.length > 1
            cmds = []
            for cmd in commands
                cmds = cmds.concat @splitAlias cmd.trim()
            cmds
        else            
            alias = @getState 'alias', {}
            split = command.trim().split ' '
            if /^[!]+\d*/.test split[0]
                if split[0][1] == '!'
                    split.splice 0, 1, last @history
                else if split[0][1] == '~'
                    if split[0].length > 2
                        @deleteCommandWithID split[0].slice 2
                    for id in split.slice 1
                        @deleteCommandWithID id
                    return ['']
                else if @idCommands[parseInt(split[0].slice(1))]?
                    split.splice 0, 1, @idCommands[parseInt(split[0].slice(1))]                
            
            if alias[split[0]]?
                @splitAlias (alias[split[0]] + ' ' + split.slice(1).join ' ').trim()
            else
                [split.join ' ']
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: (command) ->
        return if not command.trim().length
        terminal = window.terminal
        cmds = @splitAlias command
        command = cmds.join ' '
        switch
            when command[0] == '!'            then
            when command == 'clear'           then
            when command.startsWith 'history' then
            else 
                @commandIDs[command] = Object.keys(@commandIDs).length+1 if not @commandIDs[command]?
                @idCommands[@commandIDs[command]] = command
                @setState 'commandIDs', @commandIDs
                @setState 'idCommands', @idCommands
                super command # @setCurrent command -> moves items in @history
        for cmmd in cmds
            terminal.appendMeta clss: 'salt', text: cmmd.slice 0, 32                        
            terminal.singleCursorAtPos [0, terminal.lines.length-1]
                
            args = cmmd.split ' '
            cmd  = args.shift()
              
            filterRegExp = (args) -> new RegExp("(#{args.join '|'})", 'i')
                
            if cmd == 'alias'
                @alias args
                continue
                                
            switch cmd
                when 'clear' then terminal.clear()
                
                when 'history' 
                    
                    # 000   000  000   0000000  000000000   0000000   00000000   000   000
                    # 000   000  000  000          000     000   000  000   000   000 000 
                    # 000000000  000  0000000      000     000   000  0000000      00000  
                    # 000   000  000       000     000     000   000  000   000     000   
                    # 000   000  000  0000000      000      0000000   000   000     000   
                    
                    if args.length == 1 and args[0] == 'clear'
                        @clearHistory()
                        return
                    
                    for h in @history
                        continue if args.length and not filterRegExp(args).test h
                        meta =
                            diss: syntax.dissForTextAndSyntax "#{h}", 'ko'
                            cmmd: h
                            line: @commandIDs[h]
                            clss: 'termCommand'
                        terminal.appendMeta meta
                                            
                when 'files'
                    
                    # 00000000  000  000      00000000   0000000
                    # 000       000  000      000       000     
                    # 000000    000  000      0000000   0000000 
                    # 000       000  000      000            000
                    # 000       000  0000000  00000000  0000000 
                    
                    window.split.reveal 'terminal'
                    files = ipc.sendSync 'indexer', 'files'
                    lastDir = ''
                    li = 1
                    for file in Object.keys(files).sort()
                        continue if args.length and not filterRegExp(args).test file
                        info = files[file]
                        pth  = unresolve file
                        if lastDir != path.dirname pth
                            lastDir = path.dirname pth
                        else
                            pth = _.padStart('', lastDir.length+1) + path.basename pth
                        meta =
                            diss: syntax.dissForTextAndSyntax "◼ #{pth}", 'ko'
                            href: "#{file}:0"
                            line: li
                            clss: 'searchResult'
                        terminal.appendMeta meta
                        li += 1
                        
                when 'funcs'
                    
                    # 00000000  000   000  000   000   0000000   0000000
                    # 000       000   000  0000  000  000       000     
                    # 000000    000   000  000 0 000  000       0000000 
                    # 000       000   000  000  0000  000            000
                    # 000        0000000   000   000   0000000  0000000 
                    
                    window.split.reveal 'terminal'
                    funcs = ipc.sendSync 'indexer', 'funcs'
                    char = ''
                    for func in Object.keys(funcs).sort()
                        infos = funcs[func]
                        funcn = func
                        funcn = "@#{func}" if infos[0].static 
                        continue if args.length and not filterRegExp(args).test funcn
                        i = 0
                        for info in infos
                            if func[0] != char
                                char = func[0]
                                terminal.appendMeta clss: 'salt', text: char                        
                            classOrFile = info.class? and "● #{info.class}" or "◼ #{path.basename info.file}"
                            if i == 0
                                diss = syntax.dissForTextAndSyntax "▸ #{funcn} #{classOrFile}", 'ko'
                            else
                                spcs = _.padStart '', "▸ #{func}".length
                                diss = syntax.dissForTextAndSyntax "#{spcs} #{classOrFile}", 'ko'
                            meta =
                                diss: diss
                                href: "#{info.file}:#{info.line+1}"
                                clss: 'searchResult'
                            terminal.appendMeta meta
                            i += 1
                        
                when 'classes'
                    
                    #  0000000  000       0000000    0000000   0000000  00000000   0000000
                    # 000       000      000   000  000       000       000       000     
                    # 000       000      000000000  0000000   0000000   0000000   0000000 
                    # 000       000      000   000       000       000  000            000
                    #  0000000  0000000  000   000  0000000   0000000   00000000  0000000 
                    
                    window.split.reveal 'terminal'
                    classes = ipc.sendSync 'indexer', 'classes'
                    for clss in Object.keys(classes).sort()
                        continue if args.length and not filterRegExp(args).test clss
                        info = classes[clss]
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
                    ipc.send 'shellCommand', winID: window.winID, cmdID: @cmdID, command: cmmd
                    @cmdID += 1
                    
        terminal.scrollCursorToTop 5
        text:    ''
        do:      (@name == 'Term' and 'maximize' or 'reveal') + ' terminal'
        
module.exports = Term
