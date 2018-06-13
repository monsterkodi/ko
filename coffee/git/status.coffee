###
 0000000  000000000   0000000   000000000  000   000   0000000  
000          000     000   000     000     000   000  000       
0000000      000     000000000     000     000   000  0000000   
     000     000     000   000     000     000   000       000  
0000000      000     000   000     000      0000000   0000000   
###

{ childp, valid, empty, slash, str, _ } = require 'kxk'

log  = console.log
root = require './root'

gitCmd = 'git status --porcelain'
gitOpt = (gitDir) -> encoding: 'utf8', cwd: slash.unslash gitDir

status = (fileOrDir, cb) ->

    if _.isFunction cb
        
        root fileOrDir, (gitDir) ->
            
            if empty gitDir
                cb {}
            else
                childp.exec gitCmd, gitOpt(gitDir), (err,r) ->
                    if valid err
                        cb {}
                    else
                        cb parseResult gitDir, r
    else
        gitDir = root fileOrDir
        return {} if empty gitDir
        parseResult gitDir, childp.execSync gitCmd, gitOpt gitDir
    
# 00000000    0000000   00000000    0000000  00000000  
# 000   000  000   000  000   000  000       000       
# 00000000   000000000  0000000    0000000   0000000   
# 000        000   000  000   000       000  000       
# 000        000   000  000   000  0000000   00000000  

parseResult = (gitDir, result) ->
    
    lines = result.split '\n'

    info = 
        gitDir:  gitDir
        changed: []
        deleted: []
        added:   []
        
    dirSet = new Set
    
    while line = lines.shift()
        rel    = line.slice 3
        file   = slash.join gitDir, line.slice 3
        while (rel = slash.dir rel) != ''
            dirSet.add rel
            
        header = line.slice 0,2
        switch header
            when ' D' then info.deleted.push file
            when ' M' then info.changed.push file
            when '??' then info.added  .push file
            
    info.dirs = Array.from(dirSet).map (d) -> slash.join gitDir, d
    info

# 00     00   0000000   0000000    000   000  000      00000000  
# 000   000  000   000  000   000  000   000  000      000       
# 000000000  000   000  000   000  000   000  000      0000000   
# 000 0 000  000   000  000   000  000   000  000      000       
# 000   000   0000000   0000000     0000000   0000000  00000000  

if module.parent
    
    module.exports = status
    
else
    if not empty process.argv[2]
        dir = slash.resolve process.argv[2]
    else
        dir = process.cwd()
    
    log status dir
    