###
 0000000   000  000000000   0000000  000000000   0000000   000000000  000   000   0000000  
000        000     000     000          000     000   000     000     000   000  000       
000  0000  000     000     0000000      000     000000000     000     000   000  0000000   
000   000  000     000          000     000     000   000     000     000   000       000  
 0000000   000     000     0000000      000     000   000     000      0000000   0000000   
###

{ childp, empty, slash, str, _ } = require 'kxk'

log     = console.log
gitRoot = require './gitroot'

gitStatus = (fileOrDir) ->

    root = gitRoot fileOrDir
    if not root
        # log 'no git!', fileOrDir
        return

    gitDir = slash.unslash root

    if not gitDir? or not slash.isDir gitDir
        # log 'no git?', fileOrDir, gitDir
        return 
    
    result = childp.execSync 'git status --porcelain', 
        cwd:      gitDir
        encoding: 'utf8'
    
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
    return info

if module.parent
    module.exports = gitStatus
else
    if not empty process.argv[2]
        dir = slash.resolve process.argv[2]
    else
        dir = process.cwd()
    
    log gitStatus dir
    