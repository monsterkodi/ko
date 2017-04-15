# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000

{ packagePath, dirExists, unresolve, resolve, path, fs, 
  noon, store, clamp, log, _
}        = require 'kxk'
Walker   = require '../tools/walker'
Syntax   = require '../editor/syntax'
Command  = require '../commandline/command'
electron = require 'electron'
ipc      = electron.ipcRenderer
remote   = electron.remote

class Term extends Command

    constructor: (@commandline) ->
        @idCommands = Object.create null
        @commandIDs = Object.create null
        @shortcuts  = ['command+t', 'command+shift+t']
        @names      = ['term', 'Term']
        log 'create alias store'
        @alias      = new store 'alias'
        super @commandline
        @maxHistory = 99
        @headers    = false
        @autocd     = true
        @cmdID      = 0
        @pwdID      = -1
        @bins       = ipc.sendSync 'indexer', 'bins'
    
    #  0000000   000   000        0000000     0000000   000000000   0000000   
    # 000   000  0000  000        000   000  000   000     000     000   000  
    # 000   000  000 0 000        000   000  000000000     000     000000000  
    # 000   000  000  0000        000   000  000   000     000     000   000  
    #  0000000   000   000        0000000    000   000     000     000   000  
        
    onShellCommandData: (cmdData) => 
        if cmdData.cmd == @pwdID
            if cmdData.data != "pwd"
                cwd = cmdData.data
                switch @pwdTag
                    when 'autocd'
                        pkgPath = packagePath window.editor.currentFile
                        if not cwd.startsWith pkgPath
                            @execute "cd #{pkgPath}"
                    when 'complete'
                        @completeDir cwd
        else
            terminal = window.terminal
            terminal.output cmdData.data
            terminal.scrollCursorToTop @headers and 7 or 1

    getPWD: (@pwdTag) ->
        @pwdID = @cmdID
        ipc.send 'shellCommand', winID: window.winID, cmdID: @cmdID, command: "pwd"
        @cmdID += 1

    #  0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
    # 000       000   000  000   000  000   000  000      000          000     000     
    # 000       000   000  000000000  00000000   000      0000000      000     0000000 
    # 000       000   000  000 0 000  000        000      000          000     000     
    #  0000000   0000000   000   000  000        0000000  00000000     000     00000000
        
    complete: =>
        word = _.last @getText().split ' '
        
        if word.indexOf("$") >= 0
            list = []
            for k,v of process.env
                if k.startsWith word.slice word.indexOf("$")+1
                    list.push word.slice(0, word.indexOf("$")) + "$" + k
            if list.length
                @completeList list
                return
        
        @getPWD 'complete'
        
    resolveDir: (dir) ->
        i = dir.indexOf '$'
        if i >= 0
            for k,v of process.env
                if k == dir.slice i+1, i+1+k.length
                    dir = dir.slice(0, i) + v + dir.slice(i+k.length+1)
        resolve dir
    
    resolveDirWord: (dir, word) =>
        start = ''
        rest  = word
        split = word.split '/'
        
        if split.length > 1
            rest = _.last split
            split.pop()
            start = split.join('/') + '/'
            if dirExists @resolveDir start
                dir = start
            else
                dir = dir + '/' + start
        else
            if dirExists @resolveDir word
                dir = word
                start = word + '/'
                rest = ''
        [dir, start, rest]
    
    # 0000000    000  00000000   
    # 000   000  000  000   000  
    # 000   000  000  0000000    
    # 000   000  000  000   000  
    # 0000000    000  000   000  
    
    completeDir: (dir) =>
        [dir, start, rest] = @resolveDirWord dir, _.last @getText().split ' ' 
        files = fs.readdirSync @resolveDir dir
        list = []
        
        for f in files
            if rest == '' or f.startsWith rest
                if dirExists start + f
                    list.push start + f + '/'
                else
                    list.push start + f
        if list.length
            @completeList list
            return

    completeList: (list) =>
        ss = @getText().length
        split = @getText().split ' ' 
        split.pop()
        items = []
        for l in list
            p = ''
            p = split.join(' ') + ' ' if split.length
            items.push p + l
        if _.last(items[0]) != '/'
            if dirExists @resolveDir _.last items[0].split ' '   
                items[0] +=  '/'
        @setText items[0]
        if items.length > 1
            @showItems items
            @select 0
            
        se = items[0].length        
        @commandline.selectSingleRange [0, [ss,se]]
        
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
    
    listItems: () -> 
        items = _.concat @history.reversed(), _.intersection @bins, [
            'cat', 'colorcat', 
            'ls', 'color-ls',
            'konrad', 'noon', 'sds', 
            'git', 'diff',
            'coffee', 'node', 'python'
            'apropos', 'which',
            'ag', 'grep', 'find',
            'tail', 'head', 'wc', 'sort', 
            'cd', 'rm', 'mkdir', 'rmdir'
        ]
        ({text: i, line: i in @bins and '●' or '▸', type: 'sh'} for i in items)

    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clear: ->
        if window.terminal.numLines() > 0
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
    
    aliasCmd: (aliasList) ->
        
        terminal = window.terminal
        
        log 'aliasCmd', aliasList

        cmmd = 'alias ' + aliasList.join ' ' 
        terminal.appendMeta 
            line: "■"
            cmmd:  cmmd.trim()
            clss: 'termCommand'

        if aliasList.length == 1 # show single alias
            key = aliasList[0]
            cmd = @alias.get key
            meta =
                diss: Syntax.dissForTextAndSyntax "#{_.padEnd key, 10} #{cmd}" , 'noon'
                line: 0
                clss: 'termResult'
            terminal.appendMeta meta
            return
        
        if aliasList.length == 2 and aliasList[0] == 'del'
            
            @alias.del aliasList[1]
            
        else if aliasList.length >= 2 # set alias
            
            @alias.set aliasList[0], aliasList.slice(1).join ' '
                
        li = 0
        for key,cmd of @alias.data
            li += 1
            meta =
                diss: Syntax.dissForTextAndSyntax "#{_.padEnd key, 10} #{cmd}" , 'noon'
                line: li
                clss: 'termResult'
            terminal.appendMeta meta
            
        return text: '', show: 'terminal'
    
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
            split = command.trim().split ' '
            if /^[!]+\d*/.test split[0]
                if split[0] == '!'
                    return ['history']
                else if split[0][1] == '!'
                    if split[0][2] == '~'
                        @deleteCommandWithID @commandIDs[_.last @history]
                        return ['history']
                    else
                        split.splice 0, 1, _.last @history
                else if split[0][1] == '~'
                    if split[0].length > 2
                        @deleteCommandWithID split[0].slice 2
                    for id in split.slice 1
                        @deleteCommandWithID id
                    return ['history']
                else if @idCommands[parseInt(split[0].slice(1))]?
                    split.splice 0, 1, @idCommands[parseInt(split[0].slice(1))]                
            
            if @alias.get split[0]
                @splitAlias (@alias.get(split[0]) + ' ' + split.slice(1).join ' ').trim()
            else
                [split.join ' ']
                
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (combo) ->
        
        @getPWD 'autocd' if @autocd
        
        super combo
        text:   @last()
        select: true
        do:     'show terminal'
                
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
                if not @commandIDs[command]?
                    @commandIDs[command] = Object.keys(@commandIDs).length+1 
                @idCommands[@commandIDs[command]] = command
                @setState 'commandIDs', @commandIDs
                @setState 'idCommands', @idCommands
                super command # @setCurrent command -> moves items in @history
                
        for cmmd in cmds
            
            if @headers 
                terminal.appendMeta clss: 'salt', text: cmmd.slice 0, 32
                terminal.singleCursorAtPos [0, terminal.numLines()-1]

            args = cmmd.split ' '
            cmd  = args.shift()
              
            filterRegExp = (args) -> new RegExp("(#{args.join '|'})", 'i')
                
            if cmd == 'alias'
                @aliasCmd args
                continue
                                
            switch cmd
                when 'clear'   then terminal.clear()
                when 'stop' 
                    ipc.send 'restartShell', winID: window.winID
                    for meta in terminal.meta.metas.reversed()
                        if meta[2].cmdID?
                            meta[2].span?.innerHTML = "■"
                    terminal.appendMeta 
                        line: "■"
                        clss: 'termCommand'
                        cmmd: "stop"
                                
                when 'headers' 
                    
                    # 000   000  00000000   0000000   0000000    00000000  00000000    0000000  
                    # 000   000  000       000   000  000   000  000       000   000  000       
                    # 000000000  0000000   000000000  000   000  0000000   0000000    0000000   
                    # 000   000  000       000   000  000   000  000       000   000       000  
                    # 000   000  00000000  000   000  0000000    00000000  000   000  0000000   
                    
                    if args.length 
                        if args[0] in ['on', 'true', '1'] then   @headers = true
                        if args[0] in ['off', 'false', '0'] then @headers = false

                    terminal.appendMeta 
                        line: "■"
                        clss: 'termCommand'
                        cmmd: "headers #{@headers and 'on' or 'off'}" 
                
                when 'autocd'
                    
                    if args.length 
                        if args[0] in ['on', 'true', '1'] then   @autocd = true
                        if args[0] in ['off', 'false', '0'] then @autocd = false

                    terminal.appendMeta 
                        line: "■"
                        clss: 'termCommand'
                        cmmd: "autocd #{@autocd and 'on' or 'off'}"
                
                when 'history' 
                    
                    # 000   000  000   0000000  000000000   0000000   00000000   000   000
                    # 000   000  000  000          000     000   000  000   000   000 000 
                    # 000000000  000  0000000      000     000   000  0000000      00000  
                    # 000   000  000       000     000     000   000  000   000     000   
                    # 000   000  000  0000000      000      0000000   000   000     000   

                    terminal.appendMeta 
                        line: "■"
                        clss: 'termCommand'
                        cmmd: cmmd
                
                    if args.length == 1 and args[0] == 'clear'
                        @clearHistory()
                        return
                    
                    for h in @history
                        continue if args.length and not filterRegExp(args).test h
                        continue if not @commandIDs[h]
                        meta =
                            diss: Syntax.dissForTextAndSyntax "#{h}", 'ko'
                            cmmd: h
                            line: @commandIDs[h]
                            clss: 'termResult'
                        terminal.appendMeta meta
                                            
                when 'files'
                    
                    # 00000000  000  000      00000000   0000000
                    # 000       000  000      000       000     
                    # 000000    000  000      0000000   0000000 
                    # 000       000  000      000            000
                    # 000       000  0000000  00000000  0000000 
                    
                    window.split.show 'terminal'
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
                            diss: Syntax.dissForTextAndSyntax "◼ #{pth}", 'ko'
                            href: "#{file}:1"
                            line: li
                            clss: 'termResult'
                        terminal.queueMeta meta
                        li += 1
                        
                when 'funcs'
                    
                    # 00000000  000   000  000   000   0000000   0000000
                    # 000       000   000  0000  000  000       000     
                    # 000000    000   000  000 0 000  000       0000000 
                    # 000       000   000  000  0000  000            000
                    # 000        0000000   000   000   0000000  0000000 
                    
                    window.split.show 'terminal'
                    funcs = ipc.sendSync 'indexer', 'funcs'
                    char = ''
                    for func in Object.keys(funcs).sort()
                        infos = funcs[func]
                        continue if args.length and not filterRegExp(args).test func
                        i = 0
                        for info in infos
                            if func[0] != char
                                char = func[0]
                                terminal.queueMeta clss: 'salt', text: char                        
                            classOrFile = info.class? and "#{info.static and '◆' or '●'} #{info.class}" or "◼ #{path.basename info.file}"
                            if i == 0
                                diss = Syntax.dissForTextAndSyntax "▸ #{func} #{classOrFile}", 'ko'
                            else
                                spcs = _.padStart '', "▸ #{func}".length
                                diss = Syntax.dissForTextAndSyntax "#{spcs} #{classOrFile}", 'ko'
                            meta =
                                diss: diss
                                href: "#{info.file}:#{info.line+1}"
                                clss: 'termResult'
                            terminal.queueMeta meta
                            i += 1
                        
                when 'classes', 'class'
                    
                    #  0000000  000       0000000    0000000   0000000  00000000   0000000
                    # 000       000      000   000  000       000       000       000     
                    # 000       000      000000000  0000000   0000000   0000000   0000000 
                    # 000       000      000   000       000       000  000            000
                    #  0000000  0000000  000   000  0000000   0000000   00000000  0000000 
                    
                    window.split.show 'terminal'
                    classes = ipc.sendSync 'indexer', 'classes'
                    for clss in Object.keys(classes).sort()
                        continue if args.length and not filterRegExp(args).test clss
                        info = classes[clss]
                        terminal.queueMeta clss: 'salt', text: clss
                        meta =
                            diss: Syntax.dissForTextAndSyntax "● #{clss}", 'ko'
                            href: "#{info.file}:#{info.line+1}"
                            clss: 'termResult'
                        terminal.queueMeta meta
                        
                        for mthd, minfo of info.methods
                            meta =
                                diss: Syntax.dissForTextAndSyntax "    #{minfo.static and '◆' or '▸'} #{mthd}", 'ko'
                                href: "#{minfo.file}:#{minfo.line+1}"
                                clss: 'termResult'
                            terminal.queueMeta meta
                            
                when 'words'
                    
                    # 000   000   0000000   00000000   0000000     0000000
                    # 000 0 000  000   000  000   000  000   000  000     
                    # 000000000  000   000  0000000    000   000  0000000 
                    # 000   000  000   000  000   000  000   000       000
                    # 00     00   0000000   000   000  0000000    0000000 
                    
                    window.split.show 'terminal'
                    words = ipc.sendSync 'indexer', 'words'
                    char = ''
                    for word in Object.keys(words).sort()
                        continue if args.length and not filterRegExp(args).test word
                        info = words[word]
                        if word[0] != char
                            char = word[0]
                            terminal.queueMeta clss: 'salt', text: char                        
                        diss = Syntax.dissForTextAndSyntax "▸ #{word}", 'ko'
                        meta =
                            diss: diss
                            line: info.count
                            href: "search:#{word}"
                            clss: 'termResult'
                        terminal.queueMeta meta
                            
                else
                    
                    #  0000000  000   000  00000000  000      000      
                    # 000       000   000  000       000      000      
                    # 0000000   000000000  0000000   000      000      
                    #      000  000   000  000       000      000      
                    # 0000000   000   000  00000000  0000000  0000000  
                    
                    ipc.send 'shellCommand', winID: window.winID, cmdID: @cmdID, command: cmmd
                    
                    terminal.appendMeta 
                        line: "▶"
                        cmmd:  cmmd
                        cmdID: @cmdID
                        clss: 'termCommand'
                        
                    terminal.singleCursorAtPos [0, terminal.numLines()-1]
                        
                    @cmdID += 1
                    
        text: ''
        do:   (@name == 'Term' and 'maximize' or 'show') + ' terminal'
        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        switch combo
            when 'tab'
                @complete()
                return
        super mod, key, combo, event
        
module.exports = Term
