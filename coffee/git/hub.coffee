###
000   000  000   000  0000000    
000   000  000   000  000   000  
000000000  000   000  0000000    
000   000  000   000  000   000  
000   000   0000000   0000000    
###

{ valid, empty, error, log, _ } = require 'kxk'

forkfunc = require '../tools/forkfunc'

class Hub
    
    @info: (dirOrFile, cb) ->
        
        log 'hub.info', dirOrFile
        
        forkfunc '../tools/gitinfo', dirOrFile, (err, info) =>
            
            if valid err then error 'hub.info failed', err
            
            cb info
            
module.exports = Hub