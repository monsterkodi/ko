###
000  000   000  00000000   0000000   
000  0000  000  000       000   000  
000  000 0 000  000000    000   000  
000  000  0000  000       000   000  
000  000   000  000        0000000   
###

{ childp, empty, slash, str, _ } = require 'kxk'

status = require './status'
diff   = require './diff'

info = (gitDir, cb) ->
    
    if _.isFunction cb

        status gitDir, (stts) ->
            if empty stts
                cb {}
            else
                numFiles = stts.changed.length
                changed = []
                for file in stts.changed
                    
                    pushFile = (file) -> (dsts) -> 
                        changed.push dsts
                        numFiles -= 1
                        if numFiles == 0
                            stts.changed = changed
                            cb stts
                    
                    diff file, pushFile file
    else
        stts = status gitDir
        if empty stts
            return {}
        else
            stts.changed = stts.changed.map (file) -> diff file
            return stts

# 00     00   0000000   0000000    000   000  000      00000000  
# 000   000  000   000  000   000  000   000  000      000       
# 000000000  000   000  000   000  000   000  000      0000000   
# 000 0 000  000   000  000   000  000   000  000      000       
# 000   000   0000000   0000000     0000000   0000000  00000000  

if module.parent
    
    module.exports = info
    
else
    
    if not empty process.argv[2]
        dir = slash.resolve process.argv[2]
    else
        dir = process.cwd()
        
    log info dir
    