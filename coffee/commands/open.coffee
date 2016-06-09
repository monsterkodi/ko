#  0000000   00000000   00000000  000   000
# 000   000  000   000  000       0000  000
# 000   000  00000000   0000000   000 0 000
# 000   000  000        000       000  0000
#  0000000   000        00000000  000   000

{
fileExists
}       = require '../tools/tools'
log     = require '../tools/log'
Command = require '../commandline/command'
path    = require 'path'
_       = require 'lodash'

class Open extends Command

    constructor: ->
        
        @shortcut = 'command+p'
        
        super
        
    start: -> log 'Open.start', @current(), window.editor.currentFile
        
    execute: (command) ->

        super command
        
        log 'command', command
        
        files = _.words command, new RegExp "[^, ]+", 'g'
        
        log 'files', files
        
        for i in [0...files.length]
            file = files[i]
            file = path.join path.dirname(window.editor.currentFile), file
            if not fileExists file
                if '' == path.extname file
                    if fileExists file + '.coffee'
                        file += '.coffee'
            files.splice i, 1, file
        
        log 'files after', files    
        opened = window.openFiles files
        if opened?.length
            return 'editor'
        
module.exports = Open