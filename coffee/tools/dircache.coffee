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
    @set: (dir, items) -> DirCache.cache[dir] = items
    @reset: -> 
        dirs = Object.keys DirCache.cache
        DirCache.cache = {}
        for dir in dirs
            post.emit 'dircache', dir
    
    @watch: (dir) -> 
        
        return if DirCache.watches[dir]
        
        watcher = watch.watch dir, ignoreInitial:true, depth:0
        watcher.on 'add',       DirCache.changed
        watcher.on 'change',    DirCache.changed
        watcher.on 'unlink',    DirCache.changed
        watcher.on 'addDir',    DirCache.changed
        watcher.on 'unlinkDir', DirCache.changed
        DirCache.watches[dir] = watcher
        log "watch", Object.keys DirCache.watches
        
    @unwatch: (dir) -> 
        
        if DirCache.watches[dir]
            DirCache.watches[dir].close()
            
        delete DirCache.watches[dir]
        log "unwatch", Object.keys DirCache.watches

    @changed: (path) ->
        
        dir = slash.dir path
        log "Dircache.changed #{dir}",  Object.keys DirCache.cache
        log "Dircache.changed watches", Object.keys DirCache.watches
        if DirCache.cache[dir]
            delete DirCache.cache[dir]
            post.emit 'dircache', dir
        
module.exports = DirCache
