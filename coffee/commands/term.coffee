# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000

log      = require '../tools/log'
Command  = require '../commandline/command'
electron = require 'electron'
ipc      = electron.ipcRenderer

class Term extends Command

    constructor: (@commandline) ->
        @shortcuts = ['command+t']
        super
        @maxHistory = 100
        @cmdID = 0
        
    onShellCommandData: (cmdData)  => 
        terminal = window.terminal
        terminal.output cmdData.data
        terminal.scrollCursorToTop 5

    clear: ->
        window.terminal.clear()
        text: ''
        
    execute: (command) ->
        super command
        terminal.appendMeta clss: 'salt', text: command.slice 0, 32
        terminal.singleCursorAtPos [0, terminal.lines.length-2]
        switch command
            when 'history' then window.terminal?.output @history.join '\n'
            when 'clear'   then window.terminal?.clear()
            else
                ipc.send 'shellCommand', winID: window.winID, cmdID: @cmdID, command: command
                @cmdID += 1
        terminal.scrollCursorToTop 5        
        
        text: ''
        reveal: 'terminal'
        
module.exports = Term
