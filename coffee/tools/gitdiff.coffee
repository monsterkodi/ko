
#  0000000   000  000000000  0000000    000  00000000  00000000    
# 000        000     000     000   000  000  000       000         
# 000  0000  000     000     000   000  000  000000    000000      
# 000   000  000     000     000   000  000  000       000         
#  0000000   000     000     0000000    000  000       000         

{ escapePath, childp, path, str, log, _
}      = require 'kxk'
chalk  = require 'chalk'

module.exports = (file) ->

    gitCommand = "git --no-pager diff -U0 \"#{escapePath file}\""

    result = childp.execSync gitCommand, 
        cwd: path.dirname file
        encoding: 'utf8' 
    
    info  = file:file, changes:[]
    lines = (chalk.stripColor l for l in result.split '\n')

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
            
            if numOld and numNew
                change.mod = []
                for i in [0...Math.min numOld, numNew]
                    change.mod.push old:change.old[i], new:change.new[i]
                
            if numOld > numNew
                change.del = [] 
                for i in [numNew...numOld]
                    change.del.push old:change.old[i]
                    
            else if numNew > numOld
                change.add = []
                for i in [numOld...numNew]
                    change.add.push new:change.new[i]
    
            info.changes.push change

    return info
    