###
0000000    000  00000000    0000000   0000000    0000000  000   000  00000000
000   000  000  000   000  000       000   000  000       000   000  000     
000   000  000  0000000    000       000000000  000       000000000  0000000 
000   000  000  000   000  000       000   000  000       000   000  000     
0000000    000  000   000   0000000  000   000   0000000  000   000  00000000
###

{ post, slash, watch, log, _ } = require 'kxk'

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
        
        watcher = watch.dir dir
        watcher.on 'change', DirCache.onChange
        watcher.on 'error', (err) -> log "watch.error #{err}"
        DirCache.watches[dir] = watcher
        
    @unwatch: (dir) -> 
        
        DirCache.watches[dir]?.close()
            
        delete DirCache.watches[dir]
        delete DirCache.cache[dir]
        
        post.emit 'dircache', dir

    @onChange: (info) ->

        dir = info.dir

        if DirCache.cache[dir]
            DirCache.unwatch dir
            
module.exports = DirCache
