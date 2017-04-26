
#  0000000   0000000   00000000  00000000  00000000  00000000
# 000       000   000  000       000       000       000     
# 000       000   000  000000    000000    0000000   0000000 
# 000       000   000  000       000       000       000     
#  0000000   0000000   000       000       00000000  00000000

{ post, str, error, log
}             = require 'kxk'
Syntax        = require '../editor/syntax'
Command       = require '../commandline/command'
ObjectBrowser = require '../browser/objectbrowser'
coffee        = require 'coffee-script'

class Coffee extends Command
    
    constructor: (@commandline) ->
        @cmdID      = 0
        @browser    = null
        @commands   = Object.create null
        @shortcuts  = ['alt+c', 'alt+shift+c']
        @names      = ["coffee", "Coffee"]
        super @commandline
        @maxHistory = 99
        @syntaxName = 'coffee'
        post.on 'executeResult', @onResult
    
    #  0000000   000   000        00000000   00000000   0000000  000   000  000      000000000
    # 000   000  0000  000        000   000  000       000       000   000  000         000   
    # 000   000  000 0 000        0000000    0000000   0000000   000   000  000         000   
    # 000   000  000  0000        000   000  000            000  000   000  000         000   
    #  0000000   000   000        000   000  00000000  0000000    0000000   0000000     000  
    
    onResult: (result,cmdID) =>
        
        terminal = window.terminal
        
        if result.error?
            terminal.appendMeta 
                line: "#{cmdID} ⚡"
                diss: Syntax.dissForTextAndSyntax str(result.error), 'coffee'
                clss: 'coffeeResult'
        else
            # log cmdID, result
            @setCurrent @commands[cmdID] if @commands[cmdID]?
            terminal.appendMeta 
                line: "#{cmdID} ▶"
                diss: Syntax.dissForTextAndSyntax '', 'coffee'
                clss: 'coffeeResult'
            li = 0
            for l in str(result).split '\n'
                continue if not l.trim().length and li == 0
                li += 1
                terminal.appendMeta 
                    line: li
                    diss: Syntax.dissForTextAndSyntax l, 'coffee'
                    clss: 'coffeeResult'                    
            terminal.appendMeta 
                line: "#{cmdID} ◀"
                diss: Syntax.dissForTextAndSyntax '', 'coffee'
                clss: 'coffeeResult'

    # 0000000    00000000    0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000 0 000  000       000       
    # 0000000    0000000    000   000  000000000  0000000   0000000   
    # 000   000  000   000  000   000  000   000       000  000       
    # 0000000    000   000   0000000   00     00  0000000   00000000  
    
    browseObject: (obj, opt) =>
        
        log 'coffee browse'
        if not @browser
            @browser = new ObjectBrowser window.area.view
            @browser.start()
            
        @browser.loadObject obj, opt

    clear: ->
        return if @browser.cleanUp()
        super
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000

    executeCoffee: (cfg) => 
        
        coffee.eval "cmdID = #{cfg.cmdID}"
        
        if not coffee.eval 'post?'
            restoreCWD = process.cwd()
            process.chdir __dirname
            coffee.eval """                
                {str,clamp,fileExists,dirExists,post,path,noon,fs,_,$} = require 'kxk'
                cri = require 'chrome-remote-interface'
                {max,min,abs,round,ceil,floor,sqrt,pow,exp,log10,sin,cos,tan,acos,asin,atan,PI,E} = Math
                (global[r] = require r for r in ['colors', 'electron'])                    
                log = -> post.emit 'executeResult', [].slice.call(arguments, 0), cmdID
                browse = window.commandline.commands.coffee.browseObject
                """
            process.chdir restoreCWD
        try
            coffee.eval "cmdID = #{@cmdID}"
            result = coffee.eval cfg.command
        catch err
            error "Coffee.executeCoffee -- #{err}"
            result = error: err.toString()

        if not result?
            result = 'undefined'

        @onResult result, cfg.cmdID   
        
    execute: (command) ->
        
        @cmdID += 1
        command = command.trim()
        
        if command == '.'          then command = 'browse window'
        if command.startsWith '.'  then command = 'browse ' + command.slice 1
        if command.startsWith 'browse '
            if command.split(' ').length == 2
                command += ', name:"' + command.split(' ')[1] + '"'

        @commands[@cmdID] = command
        terminal = window.terminal
        
        for l in command.split '\n'
            continue if not l.trim().length
            terminal.appendMeta 
                line: "#{@cmdID} ●"
                diss: Syntax.dissForTextAndSyntax l, 'coffee'
                clss: 'coffeeCommand'
                
        terminal.singleCursorAtPos [0, terminal.numLines()-1]
        
        if @name == 'Coffee'
            post.toMain 'executeCoffee', winID: window.winID, cmdID: @cmdID, command: command
        else
            if command.startsWith 'browse'
                window.split.raise 'area' # need to do this before command execution to allow setting focus
            @executeCoffee command: command, cmdID: @cmdID
            
        @hideList()
        
        if command.startsWith 'browse'
            do:    'show area'
            focus: @browser.activeColumnID()
        else
            do: 'show terminal'
    
    executeText:       (text) -> @name = 'coffee'; @execute text
    executeTextInMain: (text) -> @name = 'Coffee'; @execute text
    
module.exports = Coffee
