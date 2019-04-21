###
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
###

{ slash, log, fs } = require 'kxk'

class Watcher

    constructor: (editor) ->

        @file = editor.currentFile
        @w = fs.watch @file
        
        slash.exists @file, @onExists
        
        @w.on 'change', (changeType, p) =>
            
            # log 'watcher changeType:', changeType, p
            if changeType == 'change'
                if not @stat
                    log "watcher +++++++++++++ IGNORE: #{@file}"
                else
                    slash.exists @file, @onChange
            else
                log "watcher ?????? changeType #{changeType}"
            
        @w.on 'unlink', (p) => 
            log "watcher.on unlink #{p}"
            
    onChange: (stat) =>
        
        if stat.mtimeMs != @stat.mtimeMs
            window.reloadFile()
        
    onExists: (@stat) =>
        
    stop: ->
        
        @w?.close()
        @w = null

module.exports = Watcher
