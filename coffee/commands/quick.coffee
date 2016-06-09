#  0000000   000   000  000   0000000  000   000
# 000   000  000   000  000  000       000  000 
# 000 00 00  000   000  000  000       0000000  
# 000 0000   000   000  000  000       000  000 
#  00000 00   0000000   000   0000000  000   000

{
fileExists
}       = require '../tools/tools'
log     = require '../tools/log'
Command = require '../commandline/command'
path    = require 'path'

class Quick extends Command

    constructor: ->
        
        @shortcut = 'command+p'
        
        super
        
    start: -> 
        log 'Quick.start', @current(), window.editor.currentFile
        
    execute: (command) ->
        
        super command
        
        file = path.join path.dirname(window.editor.currentFile), command
        log file
        if not fileExists file
            if '' == path.extname file
                if fileExists file + '.coffee'
                    file += '.coffee'
        window.loadFile file
        if window.editor.currentFile == file
            return 'editor'
        
module.exports = Quick