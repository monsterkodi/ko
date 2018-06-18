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
        
        files[info.dir] = info.files
        numFiles += info.files.length
        log 'Projects.onIndexed', info.dir, info.files.length, numFiles
        
    @files: (file) ->
        
        for dir,files of files
            if file.startsWith dir
                return files
 
post.on 'projectIndexed', Projects.onIndexed
        
module.exports = Projects
