#  0000000   0000000   00000000  00000000  00000000  00000000
# 000       000   000  000       000       000       000     
# 000       000   000  000000    000000    0000000   0000000 
# 000       000   000  000       000       000       000     
#  0000000   0000000   000       000       00000000  00000000

log      = require '../tools/log'
str      = require '../tools/str'
Syntax   = require '../editor/syntax'
Command  = require '../commandline/command'
electron = require 'electron'

ipc = electron.ipcRenderer

class Coffee extends Command
    
    constructor: (@commandline) ->
        @cmdID      = 0
        @commands   = Object.create null
        @shortcuts  = ['command+.', 'command+shift+.']
        @names      = ["coffee", "Coffee"]
        super @commandline
        ipc.on 'executeResult', @onResult
    
    #  0000000   000   000        00000000   00000000   0000000  000   000  000      000000000
    # 000   000  0000  000        000   000  000       000       000   000  000         000   
    # 000   000  000 0 000        0000000    0000000   0000000   000   000  000         000   
    # 000   000  000  0000        000   000  000            000  000   000  000         000   
    #  0000000   000   000        000   000  00000000  0000000    0000000   0000000     000  
    
    onResult: (event,result,cmdID) =>
        terminal = window.terminal
        if result.error?
            terminal.appendMeta 
                line: "#{cmdID} ⚡"
                diss: Syntax.dissForTextAndSyntax str(result.error), 'coffee'
                clss: 'coffeeResult'
        else
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

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        @cmdID += 1
        command = command.trim()
        @commands[@cmdID] = command
        terminal = window.terminal
        terminal.appendMeta clss: 'spacer'
        for l in command.split '\n'
            continue if not l.trim().length
            terminal.appendMeta 
                line: "#{@cmdID} ●"
                diss: Syntax.dissForTextAndSyntax l, 'coffee'
                clss: 'coffeeCommand'
        terminal.singleCursorAtPos [0, terminal.lines.length-1]
        ipc.send 'executeCoffee', winID: window.winID, cmdID: @cmdID, command: command        
        @hideList()
        do: (@name == 'Coffee' and 'maximize' or 'reveal') + ' terminal'
    
    executeText: (text) -> @execute text
    
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
            
module.exports = Coffee
