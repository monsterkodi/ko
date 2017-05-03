
#  0000000   000  000000000   0000000  000000000   0000000   000000000  000   000   0000000  
# 000        000     000     000          000     000   000     000     000   000  000       
# 000  0000  000     000     0000000      000     000000000     000     000   000  0000000   
# 000   000  000     000          000     000     000   000     000     000   000       000  
#  0000000   000     000     0000000      000     000   000     000      0000000   0000000   

{ escapePath, childp, dirExists, process, path, str, log, _
} = require 'kxk'

gitRoot = (pth) ->
    
    try
        cwd = dirExists(pth) and pth or path.dirname(pth)
        r = childp.execSync 'git rev-parse --show-toplevel',
            cwd: cwd
            encoding: 'utf8'
        return r.trim()
    catch err
        return null

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
    
    while line = lines.shift()
        file   = path.join gitDir, line.slice 3
        header = line.slice 0,2
        switch header
            when ' D' then info.deleted.push file
            when ' M' then info.changed.push file
            when '??' then info.added  .push file
    
    # log info
    return info

if module.parent
    module.exports = gitStatus
else
    gitStatus process.cwd()
    