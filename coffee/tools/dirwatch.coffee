###
0000000    000  00000000   000   000   0000000   000000000   0000000  000   000  
000   000  000  000   000  000 0 000  000   000     000     000       000   000  
000   000  000  0000000    000000000  000000000     000     000       000000000  
000   000  000  000   000  000   000  000   000     000     000       000   000  
0000000    000  000   000  00     00  000   000     000      0000000  000   000  
###

{ klog, post, watch } = require 'kxk'

class DirWatch
       
    @watches = {}
        
    @watch: (dir) ->
        
        return if DirWatch.watches[dir]
        klog "watch #{dir}"
        
        watcher = watch.dir dir
        watcher.on 'change' (info) -> 
            if info.change != 'change'
                klog 'info' info.change, info.path
                post.emit 'dirChanged' info.dir
        watcher.on 'error' (err) -> error "watch.error #{err}"
        DirWatch.watches[dir] = watcher
        
    @unwatch: (dir) -> 
        
        klog "unwatch #{dir}"
        DirWatch.watches[dir]?.close()
        delete DirWatch.watches[dir]

module.exports = DirWatch
