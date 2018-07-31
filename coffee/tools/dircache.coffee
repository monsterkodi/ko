###
0000000    000  00000000    0000000   0000000    0000000  000   000  00000000
000   000  000  000   000  000       000   000  000       000   000  000     
000   000  000  0000000    000       000000000  000       000000000  0000000 
000   000  000  000   000  000       000   000  000       000   000  000     
0000000    000  000   000   0000000  000   000   0000000  000   000  00000000
###

{ post, slash, log, fs, _ } = require 'kxk'

class DirCache

    @cache   = {}
    @watches = {}
    
    @has: (dir) -> DirCache.cache[dir]?
    @get: (dir) -> DirCache.cache[dir]
    @set: (dir, items) -> 
    
        DirCache.watch dir
        DirCache.cache[dir] = items
        
    @reset: ->
        
        for dir in Object.keys DirCache.cache
            DirCache.unwatch dir
    
    @watch: (dir) -> 
        
        return if DirCache.watches[dir]
        
        watcher = fs.watch dir
        watcher.on 'change', DirCache.changed
        DirCache.watches[dir] = watcher
        
        # log 'DirCache.watch', Object.keys DirCache.cache
        
    @unwatch: (dir) -> 
        
        DirCache.watches[dir]?.close()
            
        delete DirCache.watches[dir]
        delete DirCache.cache[dir]
        
        post.emit 'dircache', dir

    @changed: (changeType, path) ->

        dir = slash.dir path

        if DirCache.cache[dir]
            DirCache.unwatch dir
        
module.exports = DirCache
