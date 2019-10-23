###
000   000  000   000  0000000    
000   000  000   000  000   000  
000000000  000   000  0000000    
000   000  000   000  000   000  
000   000   0000000   0000000    
###

{ post, valid, empty, filter, _ } = require 'kxk'

watch    = require './watch'
status   = require './status'
diff     = require './diff'
info     = require './info'
root     = require './root'

watchers = {}
roots    = {}
stati    = {}
diffs    = {}

class Hub
    
    @refresh: -> 
        
        stati = {}
        roots = {}
        diffs = {}
    
    # 000   000   0000000   000000000   0000000  000   000  
    # 000 0 000  000   000     000     000       000   000  
    # 000000000  000000000     000     000       000000000  
    # 000   000  000   000     000     000       000   000  
    # 00     00  000   000     000      0000000  000   000  
    
    @watch: (gitDir) ->
        
        return if watchers[gitDir]
        watchers[gitDir] = new watch gitDir, Hub.onGitRefChanged
            
    @onGitRefChanged: (gitDir) ->
        
        delete stati[gitDir]
        
        diffs = filter diffs, (v,k) -> 
            not k.startsWith? gitDir
            
        Hub.status gitDir, (status) -> 
            post.emit 'gitStatus' gitDir, status
        
    @onSaved: (file) ->
        
        if diffs[file]
            delete diffs[file]
            Hub.diff file, (changes) -> 
                post.emit 'gitDiff' file, changes
                
        Hub.applyRoot file, (gitDir) ->
            Hub.onGitRefChanged gitDir if gitDir
        
    # 0000000    000  00000000  00000000  
    # 000   000  000  000       000       
    # 000   000  000  000000    000000    
    # 000   000  000  000       000       
    # 0000000    000  000       000       
    
    @diff: (file, cb) ->
               
        if diffs[file]
            cb diffs[file]
        else
            diff file, (changes) -> 
                diffs[file] = changes
                cb changes
    
    #  0000000  000000000   0000000   000000000  000   000   0000000  
    # 000          000     000   000     000     000   000  000       
    # 0000000      000     000000000     000     000   000  0000000   
    #      000     000     000   000     000     000   000       000  
    # 0000000      000     000   000     000      0000000   0000000   
    
    @status: (dirOrFile, cb) ->
        
        rootStatus = (cb) -> (gitDir) ->
            if stati[gitDir]
                cb stati[gitDir]
            else
                status gitDir, (info) -> 
                    stati[gitDir] = info
                    cb info
                    
        Hub.applyRoot dirOrFile, rootStatus cb
              
    @statusFiles: (status) ->
        
        files = {}
        for key in ['changed', 'added', 'dirs']
            if valid status[key]
                for file in status[key]
                    files[file] = key
        files
        
    # 000  000   000  00000000   0000000   
    # 000  0000  000  000       000   000  
    # 000  000 0 000  000000    000   000  
    # 000  000  0000  000       000   000  
    # 000  000   000  000        0000000   
    
    @info: (dirOrFile, cb) ->
        
        rootInfo = (cb) -> (gitDir) -> info gitDir, (info) -> cb info
        
        Hub.applyRoot dirOrFile, rootInfo cb
        
    #  0000000   00000000   00000000   000      000   000   00000000    0000000    0000000   000000000  
    # 000   000  000   000  000   000  000       000 000    000   000  000   000  000   000     000     
    # 000000000  00000000   00000000   000        00000     0000000    000   000  000   000     000     
    # 000   000  000        000        000         000      000   000  000   000  000   000     000     
    # 000   000  000        000        0000000     000      000   000   0000000    0000000      000     
    
    @applyRoot: (dirOrFile, cb) ->
        
        if roots[dirOrFile]
            cb roots[dirOrFile]
        else
            root dirOrFile, (gitDir) ->
                roots[dirOrFile] = gitDir
                roots[gitDir]    = gitDir
                Hub.watch gitDir
                cb gitDir   
            
post.on 'saved' Hub.onSaved
        
module.exports = Hub
