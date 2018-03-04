
#  0000000   0000000   00000000  00000000  00000000  00000000
# 000       000   000  000       000       000       000     
# 000       000   000  000000    000000    0000000   0000000 
# 000       000   000  000       000       000       000     
#  0000000   0000000   000       000       00000000  00000000

{ post, str, error, log, _ } = require 'kxk'

Syntax        = require '../editor/syntax'
Command       = require '../commandline/command'
ObjectBrowser = require '../browser/objectbrowser'
coffee        = require 'coffeescript'

class Coffee extends Command
    
    constructor: (commandline) ->
        
        super commandline
        
        @cmdID      = 0
        @browser    = new ObjectBrowser window.area.view
        @commands   = Object.create null
        @names      = ["coffee", "Coffee"]
        
        @maxHistory = 99
        @syntaxName = 'coffee'
        
        window.area.on 'resized', @onAreaResized
        post.on 'executeResult',  @onResult
        post.on 'browseResult',   @onBrowseResult

    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
    
    state: -> 
        s = super()
        if @browser.column(0)
            s.browse = ( r.item.name for r in @browser.column(0).rows )
        s
        
    restoreState: (state) ->
        
        super state
        
        if state.browse?.length
            @browser.start()
            for name in state.browse
                @executeCoffee command:"browse #{name}, name:'#{name}'"
            window.split.swap $('terminal'), $('area')
        
    #  0000000   000   000        00000000   00000000   0000000  000   000  000      000000000
    # 000   000  0000  000        000   000  000       000       000   000  000         000   
    # 000   000  000 0 000        0000000    0000000   0000000   000   000  000         000   
    # 000   000  000  0000        000   000  000            000  000   000  000         000   
    #  0000000   000   000        000   000  00000000  0000000    0000000   0000000     000  
    
    onResult: (result,cmdID) =>
        
        terminal = window.terminal
        
        if result.error?
            
            window.split.raise 'terminal'        
            terminal.appendMeta 
                line: "#{cmdID} ⚡"
                diss: Syntax.dissForTextAndSyntax str(result.error), 'coffee'
                clss: 'coffeeResult'
        else
            
            @setCurrent @commands[cmdID] if @commands[cmdID]?
            
            li = 0
            for l in str(result).split '\n'
                continue if not l.trim().length and li == 0
                li += 1
                terminal.appendMeta 
                    line: "#{cmdID} ▶"
                    diss: Syntax.dissForTextAndSyntax l, 'coffee'
                    clss: 'coffeeResult'                    
                    
    # 0000000    00000000    0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000 0 000  000       000       
    # 0000000    0000000    000   000  000000000  0000000   0000000   
    # 000   000  000   000  000   000  000   000       000  000       
    # 0000000    000   000   0000000   00     00  0000000   00000000  
    
    onBrowseResult: => @browseObject.apply @, [].slice.call arguments, 0

    browseObject: (obj, args...) =>
        
        @browser.start()
        
        if _.isString obj
            switch obj
                when 'class' then return @browser.loadClasses args
                when 'func'  then return @browser.loadFuncs   args
                when 'word'  then return @browser.loadWords   args
                when 'file'  then return @browser.loadFiles   args

        @browser.loadObject.apply @browser, [obj].concat args

    clear: ->
        return if @browser.cleanUp()
        super()
                
    #  0000000   0000000   00000000  00000000  00000000  00000000  
    # 000       000   000  000       000       000       000       
    # 000       000   000  000000    000000    0000000   0000000   
    # 000       000   000  000       000       000       000       
    #  0000000   0000000   000       000       00000000  00000000  
    
    executeCoffee: (cfg) => 
        
        coffee.eval "cmdID = #{cfg.cmdID}" # ???
        
        if not coffee.eval 'post?'
            restoreCWD = process.cwd()
            process.chdir __dirname
            coffee.eval """                
                {str,clamp,post,slash,noon,fs,_,$} = require 'kxk'
                {max,min,abs,round,ceil,floor,sqrt,pow,exp,log10,sin,cos,tan,acos,asin,atan,PI,E} = Math
                (global[r] = require r for r in ['colors', 'electron'])                    
                Immutable = require 'seamless-immutable'
                log = -> post.emit 'executeResult', [].slice.call(arguments, 0), cmdID
                coffee  = window.commandline.commands.coffee
                browse  = coffee.browseObject
                browser = coffee.browser
                """
            process.chdir restoreCWD
            
        try
            coffee.eval "cmdID = #{@cmdID}" # ???
            result = coffee.eval cfg.command
        catch err
            error "Coffee.executeCoffee --- ", err.stack
            result = error: err.toString()

        if not result?
            result = 'undefined'

        @onResult result, cfg.cmdID   

    #  0000000  000000000   0000000   00000000   000000000  
    # 000          000     000   000  000   000     000     
    # 0000000      000     000000000  0000000       000     
    #      000     000     000   000  000   000     000     
    # 0000000      000     000   000  000   000     000     
    
    start: (name) ->
        super name
        select: true
        do:     'third commandline'

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (rawCommand) ->
        
        @cmdID += 1
        command = rawCommand.trim()
        
        if command == '.'         then command = 'browse ' + (@name == 'coffee' and 'window' or 'global')
        if command.startsWith '.' then command = 'browse ' + command.slice 1
                        
        for w in ['class', 'func', 'word', 'file']
            if command.startsWith "#{w}"
                args = command.split /\s+/
                if args[0] == "#{w}s" then args[0] = w
                break if args[0] != w
                args = args.map (a) -> "'#{a}'"
                args = args.join ', '
                command = "browse #{args}"
                skipName = true

        if not skipName and command.startsWith 'browse '
            if command.split(' ').length == 2
                command += ', name:"' + command.split(' ')[1] + '"'

        @commands[@cmdID] = rawCommand
        terminal = window.terminal
        
        for l in command.split '\n'
            continue if not l.trim().length
            terminal.appendMeta 
                line: "#{@cmdID} ■"
                diss: Syntax.dissForTextAndSyntax l, 'coffee'
                clss: 'coffeeCommand'
                command: command
                click: @onMetaClick
                
        terminal.singleCursorAtPos [0, terminal.numLines()-1]
        
        if @name == 'Coffee'
            post.toMain 'executeCoffee', winID: window.winID, cmdID: @cmdID, command: command
        else
            if command.startsWith 'browse'
                window.split.raise 'area' # need to do this before command execution to allow setting focus
                
            @executeCoffee command: command, cmdID: @cmdID
            
        @hideList()
        
        if command.startsWith 'browse '
            do:    'show area'
            focus: @browser.activeColumnID()
        else
            do: 'show terminal'

    onMetaClick: (meta) => @execute meta[2].command
    
    executeText:       (text) -> @name = 'coffee'; @execute text
    executeTextInMain: (text) -> @name = 'Coffee'; @execute text
    onAreaResized: (w, h) => @browser.resized? w,h

module.exports = Coffee
