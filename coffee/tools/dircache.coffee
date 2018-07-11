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
        
        watcher = watch.watch dir, ignoreInitial:true, depth:0
        watcher.on 'add',       DirCache.changed
        watcher.on 'change',    DirCache.changed
        watcher.on 'unlink',    DirCache.changed
        watcher.on 'addDir',    DirCache.changed
        watcher.on 'unlinkDir', DirCache.changed
        DirCache.watches[dir] = watcher
        
        # log 'DirCache.watch', Object.keys DirCache.cache
        
    @unwatch: (dir) -> 
        
        DirCache.watches[dir]?.close()
            
        delete DirCache.watches[dir]
        delete DirCache.cache[dir]
        
        post.emit 'dircache', dir

    @changed: (path) ->

        dir = slash.dir path

        if DirCache.cache[dir]
            DirCache.unwatch dir
        
module.exports = DirCache
