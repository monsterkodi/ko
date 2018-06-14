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
stati    = {}

class Hub
    
    @watch: (gitDir) ->
        
        return if watchers[gitDir]
        log 'hub.watch', gitDir
        watchers[gitDir] = new watch gitDir, Hub.onGitRefChanged
            
    @onGitRefChanged: (gitDir) ->
        
        log 'hub.onGitRefChanged', gitDir
        delete stati[gitDir]
        
    # 0000000    000  00000000  00000000  
    # 000   000  000  000       000       
    # 000   000  000  000000    000000    
    # 000   000  000  000       000       
    # 0000000    000  000       000       
    
    @diff: (file, cb) ->
                
        # log 'hub.diff', file
        diff file, (changes) => cb changes
    
    #  0000000  000000000   0000000   000000000  000   000   0000000  
    # 000          000     000   000     000     000   000  000       
    # 0000000      000     000000000     000     000   000  0000000   
    #      000     000     000   000     000     000   000       000  
    # 0000000      000     000   000     000      0000000   0000000   
    
    @status: (dirOrFile, cb) ->
        
        rootStatus = (gitRoot) ->
            if stati[gitRoot]
                cb stati[gitRoot]
            else
                log 'hub get status', gitRoot
                status gitRoot, (info) => 
                    stati[gitRoot] = info
                    cb info
        
        if roots[dirOrFile]
            rootStatus roots[dirOrFile]
        else
            root dirOrFile, (gitDir) ->
                roots[dirOrFile] = gitDir
                Hub.watch gitDir
                rootStatus gitDir            
                    
    # 000  000   000  00000000   0000000   
    # 000  0000  000  000       000   000  
    # 000  000 0 000  000000    000   000  
    # 000  000  0000  000       000   000  
    # 000  000   000  000        0000000   
    
    @info: (dirOrFile, cb) ->
        
        log 'hub.info', dirOrFile
        info dirOrFile, (info) => cb info
            
module.exports = Hub