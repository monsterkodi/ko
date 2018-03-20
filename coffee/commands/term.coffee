###
000000000  00000000  00000000   00     00
   000     000       000   000  000   000
   000     0000000   0000000    000000000
   000     000       000   000  000 0 000
   000     00000000  000   000  000   000
###

{ reversed, slash, fs, post, noon, prefs, store, childp, clamp, empty, error, log, _ } = require 'kxk'
  
Walker   = require '../tools/walker'
syntax   = require '../editor/syntax'
Command  = require '../commandline/command'

class Term extends Command

    constructor: (commandline) ->

        super commandline

        post.on 'shellCommandData', @onShellCommandData
        post.on 'setCWD',           @setCWD
        
        @idCommands = Object.create null
        @commandIDs = Object.create null
        @names      = ['term', 'Term']
        @alias      = new store 'alias'
        
        @maxHistory = 99
        @autocd     = true
        @cmdID      = 0
        @pwdID      = -1
        @bins       = post.get 'indexer', 'bins'
        
        @setCWD process.cwd()

    #  0000000  00000000  000000000   0000000  000   000  0000000    
    # 000       000          000     000       000 0 000  000   000  
    # 0000000   0000000      000     000       000000000  000   000  
    #      000  000          000     000       000   000  000   000  
    # 0000000   00000000     000      0000000  00     00  0000000    
    
    setCWD: (cwd) => # only used on win (stupid terminal)
        
        if slash.isAbsolute slash.untilde cwd
            @cwd = slash.resolve cwd
        else
            @cwd = slash.resolve slash.join @cwd, cwd
        if not slash.isDir @cwd
            @cwd = process.cwd()
            
        post.emit 'cwdSet', @cwd

        slash.tilde @cwd
        
    #  0000000   000   000        0000000     0000000   000000000   0000000
    # 000   000  0000  000        000   000  000   000     000     000   000
    # 000   000  000 0 000        000   000  000000000     000     000000000
    # 000   000  000  0000        000   000  000   000     000     000   000
    #  0000000   000   000        0000000    000   000     000     000   000

    onShellCommandData: (cmdData) => # only used on mac (pty terminal)

        if cmdData.cmd == @pwdID
            if cmdData.data != "pwd"
                cwd = cmdData.data
                switch @pwdTag
                    when 'autocd'
                        pkgPath = slash.pkg window.editor.currentFile
                        if pkgPath? and not cwd.startsWith pkgPath
                            @execute "cd #{pkgPath}"
                    when 'complete'
                        @completeDir cwd
        else
            terminal = window.terminal
            terminal.output cmdData.data
            terminal.scroll.cursorToTop terminal.getHeader() and 7 or 1

    getPWD: (@pwdTag) -> # only used on mac (pty terminal)

        return if slash.win()
        
        @pwdID = @cmdID
        post.toMain 'shellCommand', winID: window.winID, cmdID: @cmdID, command: "pwd"
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
        slash.resolve dir

    resolveDirWord: (dir, word) =>

        start = ''
        rest  = word
        split = word.split '/'

        if split.length > 1
            rest = _.last split
            split.pop()
            start = split.join('/') + '/'
            if slash.dirExists @resolveDir start
                dir = start
            else
                dir = dir + '/' + start
        else
            if slash.dirExists @resolveDir word
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
                if slash.dirExists start + f
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
            if slash.dirExists @resolveDir _.last items[0].split ' '
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

        items = _.concat reversed(@history), _.intersection @bins, [
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

    loadState: ->

        @idCommands = @getState 'idCommands', Object.create null
        @commandIDs = @getState 'commandIDs', Object.create null
        super()

    clearHistory: ->

        @idCommands = Object.create null
        @commandIDs = Object.create null
        @setState 'commandIDs', @commandIDs
        @setState 'idCommands', @idCommands
        super()

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

        cmmd = 'alias ' + aliasList.join ' '
        terminal.appendMeta
            line:    '■'
            command: cmmd.trim()
            clss:    'termCommand'

        if aliasList.length == 1 # show single alias
            key = aliasList[0]
            cmd = @alias.get key
            meta =
                diss: syntax.dissForTextAndSyntax "#{_.padEnd key, 10} #{cmd}" , 'noon'
                line: 0
                clss: 'termResult'
            terminal.appendMeta meta
            return

        if aliasList.length == 2 and aliasList[0] == 'del'

            @alias.del aliasList[1]
            return

        else if aliasList.length >= 2 # set alias

            @alias.set aliasList[0], aliasList.slice(1).join ' '
            return

        li = 0
        for key,cmd of @alias.data
            li += 1
            meta =
                diss: syntax.dissForTextAndSyntax "#{_.padEnd key, 10} #{cmd}" , 'noon'
                line: li
                clss: 'termResult'
            terminal.appendMeta meta
        terminal.appendMeta clss: 'spacer'

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
                    split.splice 0, 1, _.last @history
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

    start: (name) ->

        @getPWD 'autocd' if @autocd

        super name
        text:   @last()
        select: true
        do:     'show terminal'

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000
    # 0000000     00000    0000000   000       000   000     000     0000000
    # 000        000 000   000       000       000   000     000     000
    # 00000000  000   000  00000000   0000000   0000000      000     00000000

    execute: (rawCommand) ->

        return if not rawCommand.trim().length

        terminal = window.terminal
        if not rawCommand.startsWith 'alias'
            cmds = @splitAlias rawCommand
        else
            cmds = [rawCommand]

        command = cmds.join ' '

        terminal.doAutoClear()
        
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
                super rawCommand # @setCurrent command -> moves items in @history

        appendCommandMeta = (cmmd) =>
            terminal.appendMeta
                line: "■"
                command: cmmd
                cmdID: @cmdID
                clss: 'termCommand'
                click: @onMetaClick

        for cmmd in cmds

            if terminal.getHeader()
                terminal.appendMeta clss: 'salt', text: cmmd.slice 0, 32
                terminal.singleCursorAtPos [0, terminal.numLines()-1]

            args = cmmd.split ' '
            cmd  = args.shift()

            filterRegExp = (args) -> new RegExp("(#{args.join '|'})", 'i')

            if slash.win()
                switch cmd
                    when '.'            then appendCommandMeta @setCWD slash.dir window.editor.currentFile; continue
                    when '..', '~', '/' then appendCommandMeta @setCWD cmd; continue
                    when 'cd..'         then appendCommandMeta @setCWD '..'; continue
                    when 'cd'           then appendCommandMeta @setCWD args[0]; continue
            
            switch cmd
                when 'alias' then @aliasCmd args
                when 'clear' then terminal.clear()
                
                when 'help'
                
                    terminal = window.terminal
                    text = fs.readFileSync "#{__dirname}/../../bin/help-terminal.noon", encoding: 'utf8'
                    for l in text.split '\n'
                        terminal.appendLineDiss l, syntax.dissForTextAndSyntax l, 'noon'
    
                    terminal.scroll.cursorToTop 1
                    window.split.do 'show terminal'
                
                #  0000000  000000000   0000000   00000000   
                # 000          000     000   000  000   000  
                # 0000000      000     000   000  00000000   
                #      000     000     000   000  000        
                # 0000000      000      0000000   000        
                
                when 'stop'

                    if slash.win() then continue
                    
                    appendCommandMeta 'stop'

                    post.toMain 'restartShell', winID: window.winID

                    for meta in reversed terminal.meta.metas
                        if meta[2].cmdID?
                            meta[2].span?.innerHTML = "■"

                #  0000000   000   000  000000000   0000000    0000000  0000000
                # 000   000  000   000     000     000   000  000       000   000
                # 000000000  000   000     000     000   000  000       000   000
                # 000   000  000   000     000     000   000  000       000   000
                # 000   000   0000000      000      0000000    0000000  0000000

                when 'autocd'

                    if args.length
                        if args[0] in ['on',   'true', '1'] then @autocd = true
                        if args[0] in ['off', 'false', '0'] then @autocd = false
                        prefs.set 'terminal|autocd', @autocd

                    appendCommandMeta "autocd #{@autocd and 'on' or 'off'}"
                            
                when 'header', 'headers'

                    # 000   000  00000000   0000000   0000000    00000000  00000000
                    # 000   000  000       000   000  000   000  000       000   000
                    # 000000000  0000000   000000000  000   000  0000000   0000000
                    # 000   000  000       000   000  000   000  000       000   000
                    # 000   000  00000000  000   000  0000000    00000000  000   000

                    if args.length
                        if args[0] in ['on', 'true', '1'] then   terminal.setHeader true
                        if args[0] in ['off', 'false', '0'] then terminal.setHeader false

                    appendCommandMeta "header #{terminal.getHeader() and 'on' or 'off'}"

                #  0000000   000   000  000000000   0000000    0000000  000      00000000   0000000   00000000   
                # 000   000  000   000     000     000   000  000       000      000       000   000  000   000  
                # 000000000  000   000     000     000   000  000       000      0000000   000000000  0000000    
                # 000   000  000   000     000     000   000  000       000      000       000   000  000   000  
                # 000   000   0000000      000      0000000    0000000  0000000  00000000  000   000  000   000  
                
                when 'autoclear'

                    if args.length
                        if args[0] in ['on',   'true', '1'] then terminal.setAutoClear true
                        if args[0] in ['off', 'false', '0'] then terminal.setAutoClear false
                        prefs.set 'terminal|autoclear', @autocd

                    appendCommandMeta "autoclear #{terminal.getAutoClear() and 'on' or 'off'}"

                when 'history'

                    # 000   000  000   0000000  000000000   0000000   00000000   000   000
                    # 000   000  000  000          000     000   000  000   000   000 000
                    # 000000000  000  0000000      000     000   000  0000000      00000
                    # 000   000  000       000     000     000   000  000   000     000
                    # 000   000  000  0000000      000      0000000   000   000     000

                    appendCommandMeta cmmd

                    if args.length == 1 and args[0] == 'clear'
                        @clearHistory()
                        return

                    for h in @history
                        continue if args.length and not filterRegExp(args).test h
                        continue if not @commandIDs[h]
                        meta =
                            diss: syntax.dissForTextAndSyntax "#{h}", 'ko'
                            cmmd: h
                            line: @commandIDs[h]
                            clss: 'termResult'
                        terminal.appendMeta meta
                    terminal.queueMeta clss: 'spacer'

                when 'file'

                    # 00000000  000  000      00000000
                    # 000       000  000      000
                    # 000000    000  000      0000000
                    # 000       000  000      000
                    # 000       000  0000000  00000000

                    appendCommandMeta cmmd

                    window.split.show 'terminal'
                    files = post.get 'indexer', 'files'
                    lastDir = ''
                    li = 1
                    for file in Object.keys(files).sort()
                        continue if args.length and not filterRegExp(args).test file
                        info = files[file]
                        pth  = slash.tilde file
                        if lastDir != slash.dirname pth
                            lastDir = slash.dirname pth
                        else
                            pth = _.padStart('', lastDir.length+1) + slash.basename pth
                        meta =
                            diss: syntax.dissForTextAndSyntax "◼ #{pth}", 'ko'
                            href: "#{file}:1"
                            line: li
                            clss: 'searchResult'
                            click: @onMetaClick
                        terminal.queueMeta meta
                        li += 1
                    terminal.queueMeta clss: 'spacer'

                when 'func'

                    # 00000000  000   000  000   000   0000000
                    # 000       000   000  0000  000  000
                    # 000000    000   000  000 0 000  000
                    # 000       000   000  000  0000  000
                    # 000        0000000   000   000   0000000

                    appendCommandMeta cmmd

                    window.split.show 'terminal'
                    funcs = post.get 'indexer', 'funcs'
                    char = ''
                    for func in Object.keys(funcs).sort()
                        infos = funcs[func]
                        continue if args.length and not filterRegExp(args).test func
                        i = 0
                        for info in infos
                            
                            if func[0] != char
                                char = func[0]
                                terminal.queueMeta clss: 'salt', text: char
                                
                            classOrFile = info.class? and "#{info.static and '◆' or '●'} #{info.class}" or "◼ #{slash.basename info.file}"
                            
                            if i == 0
                                diss = syntax.dissForTextAndSyntax "▸ #{func} #{classOrFile}", 'ko'
                            else
                                spcs = _.padStart '', "▸ #{func}".length
                                diss = syntax.dissForTextAndSyntax "#{spcs} #{classOrFile}", 'ko'
                                
                            meta =
                                diss: diss
                                href: "#{info.file}:#{info.line}"
                                clss: 'searchResult'
                                click: @onMetaClick
                                
                            terminal.queueMeta meta
                            i += 1
                    terminal.queueMeta clss: 'spacer'

                when 'class'

                    #  0000000  000       0000000    0000000   0000000
                    # 000       000      000   000  000       000
                    # 000       000      000000000  0000000   0000000
                    # 000       000      000   000       000       000
                    #  0000000  0000000  000   000  0000000   0000000

                    appendCommandMeta cmmd

                    window.split.show 'terminal'
                    classes = post.get 'indexer', 'classes'
                    for clss in Object.keys(classes).sort()
                        continue if args.length and not filterRegExp(args).test clss
                        info = classes[clss]
                        terminal.queueMeta clss: 'salt', text: clss
                        meta =
                            diss: syntax.dissForTextAndSyntax "● #{clss}", 'ko'
                            href: "#{info.file}:#{info.line}"
                            clss: 'termResult'
                            click: @onMetaClick
                        terminal.queueMeta meta

                        for mthd, minfo of info.methods
                            meta =
                                diss: syntax.dissForTextAndSyntax "    #{minfo.static and '◆' or '▸'} #{mthd}", 'ko'
                                href: "#{minfo.file}:#{minfo.line}"
                                clss: 'searchResult'
                                click: @onMetaClick
                            terminal.queueMeta meta
                    terminal.queueMeta clss: 'spacer'

                when 'word'

                    # 000   000   0000000   00000000   0000000
                    # 000 0 000  000   000  000   000  000   000
                    # 000000000  000   000  0000000    000   000
                    # 000   000  000   000  000   000  000   000
                    # 00     00   0000000   000   000  0000000

                    appendCommandMeta cmmd

                    window.split.show 'terminal'
                    words = post.get 'indexer', 'words'
                    char = ''
                    for word in Object.keys(words).sort()
                        continue if args.length and not filterRegExp(args).test word
                        info = words[word]
                        if word[0] != char
                            char = word[0]
                            terminal.queueMeta clss: 'salt', text: char
                        diss = syntax.dissForTextAndSyntax "▸ #{word}", 'ko'
                        meta =
                            diss: diss
                            line: info.count
                            href: ">search>#{word}"
                            clss: 'searchResult'
                            click: @onMetaClick
                        terminal.queueMeta meta
                    terminal.queueMeta clss: 'spacer'

                else

                    #  0000000  000   000  00000000  000      000
                    # 000       000   000  000       000      000
                    # 0000000   000000000  0000000   000      000
                    #      000  000   000  000       000      000
                    # 0000000   000   000  00000000  0000000  0000000

                    appendCommandMeta cmmd

                    if slash.win()
                        
                        topLine = window.terminal.numLines()
                        # log 'currentLine', topLine
                        childp.exec cmmd, {cwd:@cwd, encoding: 'utf8'}, (err, stdout, stderr) =>
                            return error stderr, stdout, err if not empty err
                            terminal = window.terminal
                            terminal.output stdout
                            terminal.output stderr
                            # log 'scroll', topLine
                            terminal.scroll.cursorToTop topLine + 1 # + terminal.getHeader() and 7 or 1
                    else
                        post.toMain 'shellCommand', winID: window.winID, cmdID: @cmdID, command: cmmd

                    terminal.singleCursorAtPos [0, terminal.numLines()-1]

                    @cmdID += 1

        text: ''
        do:   (@name == 'Term' and 'maximize' or 'show') + ' terminal'

    onMetaClick: (meta) =>

        if meta[2].command? then @execute meta[2].command
        if meta[2].href?
            window.split.show 'editor'
            window.loadFile meta[2].href

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
