###
0000000    000  00000000    0000000   0000000    0000000  000   000  00000000
000   000  000  000   000  000       000   000  000       000   000  000     
000   000  000  0000000    000       000000000  000       000000000  0000000 
000   000  000  000   000  000       000   000  000       000   000  000     
0000000    000  000   000   0000000  000   000   0000000  000   000  00000000
###

{ post, slash, watch, log, _ } = require 'kxk'

watch = require 'wt'

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
        return if slash.ext(dir) == 'asar'
        
        watcher = watch.watch [dir], ignoreHidden:false
        watcher.on 'all', DirCache.onChange
        watcher.on 'error', (err) -> log "wt.error #{err}"
        DirCache.watches[dir] = watcher
        
    @unwatch: (dir) -> 
        
        DirCache.watches[dir]?.close()
            
        delete DirCache.watches[dir]
        delete DirCache.cache[dir]
        
        post.emit 'dircache', dir

    @onChange: (info) ->

        if info.isDirectory
            dir = slash.path info.path
        else
            dir = slash.dir info.path

        if DirCache.cache[dir]
            DirCache.unwatch dir
            
        if info.remove and DirCache.cache[slash.path info.path]
            DirCache.unwatch slash.path info.path
            
module.exports = DirCache
