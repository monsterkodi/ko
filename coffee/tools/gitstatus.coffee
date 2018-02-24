
#  0000000   000  000000000   0000000  000000000   0000000   000000000  000   000   0000000  
# 000        000     000     000          000     000   000     000     000   000  000       
# 000  0000  000     000     0000000      000     000000000     000     000   000  0000000   
# 000   000  000     000          000     000     000   000     000     000   000       000  
#  0000000   000     000     0000000      000     000   000     000      0000000   0000000   

{ escapePath, childp, dirExists, path, str, log, _ } = require 'kxk'

gitRoot = require './gitroot'

gitStatus = (fileOrDir) ->

    gitDir = gitRoot fileOrDir

    return if not gitDir?
    
    result = childp.execSync 'git status -s', 
        cwd: gitDir
        encoding: 'utf8' 
    
    lines = result.split '\n'

    info = 
        changed: []
        deleted: []
        added:   []
        
    dirSet = new Set
    
    while line = lines.shift()
        rel    = line.slice 3
        file   = path.join gitDir, line.slice 3
        while (rel = path.dirname rel) != '.'
            dirSet.add rel
            
        header = line.slice 0,2
        switch header
            when ' D' then info.deleted.push file
            when ' M' then info.changed.push file
            when '??' then info.added  .push file
            
    info.dirs = Array.from(dirSet).map (d) -> path.join gitDir, d
    
    return info

if module.parent
    module.exports = gitStatus
else
    gitStatus process.cwd()
    