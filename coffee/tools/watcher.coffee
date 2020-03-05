###
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
###

{ fs, klog, post, slash } = require 'kxk'

class Watcher

    @id: 0
    
    @: (@file) ->

        @id = Watcher.id++
        slash.exists @file, @onExists
        
    onExists: (stat) =>
        
        return if not stat
        return if not @id
        @mtime = stat.mtimeMs
        
        @w = fs.watch @file
        @w.on 'change' (changeType, p) =>
            
            if changeType == 'change'
                slash.exists @file, @onChange
            else
                setTimeout (=> slash.exists @file, @onRename), 200
        
        @w.on 'unlink' (p) => klog "unlink #{@id}", slash.basename(@file)
    
    onChange: (stat) =>
        
        if stat.mtimeMs != @mtime
            @mtime = stat.mtimeMs
            post.emit 'reloadFile' @file

    onRename: (stat) =>
        
        if not stat
            @stop()
            post.emit 'removeFile' @file
    
    stop: ->

        @w?.close()
        delete @w
        @id = 0

# 00000000  000  000      00000000  000   000   0000000   000000000   0000000  000   000  00000000  00000000   
# 000       000  000      000       000 0 000  000   000     000     000       000   000  000       000   000  
# 000000    000  000      0000000   000000000  000000000     000     000       000000000  0000000   0000000    
# 000       000  000      000       000   000  000   000     000     000       000   000  000       000   000  
# 000       000  0000000  00000000  00     00  000   000     000      0000000  000   000  00000000  000   000  

class FileWatcher
    
    @: ->
        
        @watchers = {}
        post.on 'watch'   @onWatch
        post.on 'unwatch' @onUnwatch
        
    onWatch: (file) =>
        
        file = slash.resolve file
        
        if not @watchers[file]?
            @watchers[file] = new Watcher file
        
    onUnwatch: (file) =>

        file = slash.resolve file
        
        @watchers[file]?.stop()
        delete @watchers[file]
        
module.exports = FileWatcher
