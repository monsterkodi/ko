# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000
{
unresolve
}        = require '../tools/tools'
log      = require '../tools/log'
syntax   = require '../editor/syntax'
Command  = require '../commandline/command'
electron = require 'electron'
path     = require 'path'
ipc      = electron.ipcRenderer

class Term extends Command

    constructor: (@commandline) ->
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
                    
                    li = 0
                    for h in @history
                        li += 1
                        continue if args.length and not filterRegExp(args).test h
                        meta =
                            diss: syntax.dissForTextAndSyntax "#{h}", 'ko'
                            cmmd: h
                            line: li
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
