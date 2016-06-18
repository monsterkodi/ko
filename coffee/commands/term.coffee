# 000000000  00000000  00000000   00     00
#    000     000       000   000  000   000
#    000     0000000   0000000    000000000
#    000     000       000   000  000 0 000
#    000     00000000  000   000  000   000
{
$}            = require '../tools/tools'
log           = require '../tools/log'
child_process = require 'child_process'
ansihtml      = require '../tools/ansihtml'
Command       = require '../commandline/command'

class Term extends Command

    constructor: ->
        
        @shortcuts = ['command+t']
        @childp    = child_process.spawn '/usr/local/bin/bash', []
        @childp.on 'exit', @onExit
        @childp.on 'close', @onExit
        @childp.on 'disconnect', @onExit
        @childp.stdout.on 'data', @onData
        @childp.stdout.on 'end', @onEnd        
        @ansihtml = new ansihtml()
        # log "Term.constructor"
        super
    
    onExit: (code) =>
        log "Term.onExit #{code}"
    
    onEnd: () =>
        log "Term.onEnd"
        
    onData: (out) =>        
        s = out.toString()
        log s
        h = @ansihtml.toHtml s
        log h
        $('.pinboard').innerHTML += h
        
    execute: (command) ->
        log "term.execute command #{command}"
        @childp.stdin.write "#{command}\n"
        text: ''
        
module.exports = Term
