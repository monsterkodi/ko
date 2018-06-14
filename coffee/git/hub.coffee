###
000   000  000   000  0000000    
000   000  000   000  000   000  
000000000  000   000  0000000    
000   000  000   000  000   000  
000   000   0000000   0000000    
###

{ valid, empty, error, log, _ } = require 'kxk'

watch    = require './watch'
status   = require './status'
diff     = require './diff'
info     = require './info'
root     = require './root'

watchers = {}
roots    = {}

class Hub
    
    @watch: (gitRoot) ->
        
        watchers[gitRoot] = new watch gitRoot
            
    # 0000000    000  00000000  00000000  
    # 000   000  000  000       000       
    # 000   000  000  000000    000000    
    # 000   000  000  000       000       
    # 0000000    000  000       000       
    
    @diff: (file, cb) ->
                
        log 'hub.diff', file
        diff file, (changes) => cb changes
    
    #  0000000  000000000   0000000   000000000  000   000   0000000  
    # 000          000     000   000     000     000   000  000       
    # 0000000      000     000000000     000     000   000  0000000   
    #      000     000     000   000     000     000   000       000  
    # 0000000      000     000   000     000      0000000   0000000   
    
    @status: (file, cb) ->
        
        log 'hub.status', file
        status file, (info) => cb info
                    
    # 000  000   000  00000000   0000000   
    # 000  0000  000  000       000   000  
    # 000  000 0 000  000000    000   000  
    # 000  000  0000  000       000   000  
    # 000  000   000  000        0000000   
    
    @info: (dirOrFile, cb) ->
        
        log 'hub.info', dirOrFile
        info dirOrFile, (info) => cb info
            
module.exports = Hub