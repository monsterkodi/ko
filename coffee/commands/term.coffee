# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000
{
$
}             = require '../tools/tools'
log           = require '../tools/log'
child_process = require 'child_process'
Terminal      = require 'terminal.js'
Command       = require '../commandline/command'
_             = require 'lodash'

class Term extends Command

    constructor: ->
        
        @shortcuts = ['command+t']
        @childp    = child_process.spawn '/usr/local/bin/bash', []
        @childp.on 'exit', @onExit
        @childp.on 'close', @onExit
        @childp.on 'disconnect', @onExit
        @childp.stdout.on 'data', @onData
        @childp.stdout.on 'end', @onEnd        
        @childp.stdin.write 'echo hello\n'
        @term = new Terminal columns: 100, rows: 20
        # log "Term.constructor", @childp
        # @child_pty.stdout.pipe(stream).pipe(pty.stdin);
        log "Term.constructor", @childp.connected
        super
    
    onExit: (code) =>
        log "Term.onExit #{code}"
    
    onEnd: () =>
        log "Term.onEnd"
        
    onData: (out) =>        
        @term.write out.toString()
        log @term.toString "html"
        # log "Term.onData", out.toString()
        
    execute: (command) ->
        
        log "term.execute command #{command}"
        @childp.stdin.write "#{command}\n"
        text: ''
        
module.exports = Term