###
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
###

{ slash, post, log, fs } = require 'kxk'

class Watcher

    constructor: (@file) ->

        slash.exists @file, @onExists
                                
    onExists: (@stat) =>
        
        return if not @stat
        
        @w = fs.watch @file
        @w.on 'change', (changeType, p) =>
            
            # log 'watcher changeType:', changeType, p
            if changeType == 'change'
                slash.exists @file, @onChange
            else
                slash.exists @file, @onRename
            
        @w.on 'unlink', (p) => 
            log "watcher.on unlink #{p}"
        
    onChange: (stat) =>
        
        if stat.mtimeMs != @stat.mtimeMs
            post.emit 'reloadFile', @file

    onRename: (stat) =>
        
        if not stat
            log "watcher removeFile #{@file}"
            post.emit 'removeFile', @file
            
    stop: ->
        
        @w?.close()
        delete @w

module.exports = Watcher
