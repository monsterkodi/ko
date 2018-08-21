###
00000000   00000000    0000000         000  00000000   0000000  000000000   0000000  
000   000  000   000  000   000        000  000       000          000     000       
00000000   0000000    000   000        000  0000000   000          000     0000000   
000        000   000  000   000  000   000  000       000          000          000  
000        000   000   0000000    0000000   00000000   0000000     000     0000000   
###

{ post, valid, empty, slash, error, log, _ } = require 'kxk'

files    = {}
numFiles = 0

class Projects
    
    @refresh: -> 
        
        files = {}
        
    @onIndexed: (info) ->
        
        if valid info.files
            files[info.dir] = info.files
            numFiles += info.files.length
            # log 'Projects.onIndexed', info.dir, info.files.length, numFiles
        
    @files: (file) ->
        
        if not file
            log 'project.files without file?'
            return []
        
        for dir,list of files
            if file.startsWith(dir)
                return list
            
        if dir = slash.pkg file
            if info = post.get 'indexer', 'project', dir
                Projects.onIndexed info
                return files[info.dir]
                
        log "no project files for file #{file}", Object.keys files
        []
 
post.on 'projectIndexed', Projects.onIndexed
        
module.exports = Projects
