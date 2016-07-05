# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000

log           = require '../tools/log'
child_process = require 'child_process'
Command       = require '../commandline/command'

class Term extends Command

    constructor: (@commandline) ->
        
        @shortcuts = ['command+t']
        @childp    = child_process.spawn '/usr/local/bin/bash', []
        @childp.on 'exit', @onExit
        @childp.on 'close', @onExit
        @childp.on 'disconnect', @onExit
        @childp.stdout.on 'data', @onData
        @childp.stdout.on 'end', @onEnd        
        super
    
    onExit: (code) => log "Term.onExit #{code}"
    onEnd:         => log "Term.onEnd"
    onData: (out)  => 
        terminal = window.terminal
        terminal.output out.toString()
        terminal.scrollCursorToTop 5

    clear: ->
        window.terminal.clear()
        text: ''
        
    execute: (command) ->
        # log "term.execute command #{command}"
        super command
        terminal.appendMeta clss: 'salt', text: command.slice 0, 14
        terminal.singleCursorAtPos [0, terminal.lines.length-2]
        switch command
            when 'history' then window.terminal?.output @history.join '\n'
            when 'clear'   then window.terminal?.clear()
            else
                @childp.stdin.write "#{command}\n"
        terminal.scrollCursorToTop 5        
        text: ''
        reveal: 'terminal'
        
module.exports = Term
