###
0000000    000  00000000  00000000    
000   000  000  000       000         
000   000  000  000000    000000      
000   000  000  000       000         
0000000    000  000       000         
###

{ childp, slash, valid, empty, str, _ } = require 'kxk'

log       = console.log
stripAnsi = require 'strip-ansi'

gitCmd = (file) -> "git --no-pager diff -U0 \"#{slash.file file}\""
gitOpt = (cwd)  -> cwd:cwd, encoding:'utf8', stdio:['pipe', 'pipe', 'ignore']

diff = (file, cb) ->
    
    file = slash.resolve file

    if _.isFunction cb
        
        slash.isFile file, (stat) ->
            cb({}) if empty stat
            childp.exec gitCmd(file), gitOpt(slash.unslash slash.dir file), (err,r) ->
                if valid err then cb({}) 
                else cb parseResult file, r
    else
    
        return {} if not slash.isFile file
        parseResult file, childp.execSync gitCmd(file), gitOpt(slash.unslash slash.dir file)
    
# 00000000    0000000   00000000    0000000  00000000  
# 000   000  000   000  000   000  000       000       
# 00000000   000000000  0000000    0000000   0000000   
# 000        000   000  000   000       000  000       
# 000        000   000  000   000  0000000   00000000  

parseResult = (file, result) ->
    
    info  = file:file, changes:[]
    lines = (stripAnsi l for l in result.split '\n')

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

# 00     00   0000000   0000000    000   000  000      00000000  
# 000   000  000   000  000   000  000   000  000      000       
# 000000000  000   000  000   000  000   000  000      0000000   
# 000 0 000  000   000  000   000  000   000  000      000       
# 000   000   0000000   0000000     0000000   0000000  00000000  

if module.parent
    
    module.exports = diff
    
else
    
    if not empty process.argv[2]
        file = slash.resolve process.argv[2]
    else
        file = process.cwd()
    
    log diff file
    