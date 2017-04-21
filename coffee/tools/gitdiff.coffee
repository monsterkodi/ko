#  0000000   000  000000000  0000000    000  00000000  00000000    
# 000        000     000     000   000  000  000       000         
# 000  0000  000     000     000   000  000  000000    000000      
# 000   000  000     000     000   000  000  000       000         
#  0000000   000     000     0000000    000  000       000         

{ escapePath, childp, path, str, log, _
}      = require 'kxk'
colors = require 'colors'

module.exports = (file) ->
    
    gitCommand = "git --no-pager diff -U0 \"#{escapePath file}\""

    try    
        result = childp.execSync gitCommand, 
            cwd:        path.dirname file
            encoding:   'utf8' 
        # log str result
        # log "----------"
    catch err
        log "error #{err}"
        return error: err
    
    info  = changes:[]
    lines = (colors.strip l for l in result.split '\n')
    
    while line = lines.shift()

        if line.startsWith '@@'
            [x, before, after] = line.split ' ' 
            afterSplit = after.split ','
            
            numOld = parseInt(before.split(',')[1] ? 1)
            numNew = parseInt(afterSplit[1] ? 1)
            change = line: parseInt(afterSplit[0]) 

            oldLines = []
            for i in [0...numOld]
                oldLines.push lines.shift().slice 1
            lines.shift() while _.first(lines)[0] == '\\'
    
            newLines = []
            for i in [0...numNew]
                newLines.push lines.shift().slice 1
            lines.shift() while _.first(lines)[0] == '\\'

            change.old = oldLines if oldLines.length
            change.new = newLines if newLines.length
    
            info.changes.push change

    # log info        
    return info
    