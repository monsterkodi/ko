###
 0000000   000  000000000  000  000   000  00000000   0000000   
000        000     000     000  0000  000  000       000   000  
000  0000  000     000     000  000 0 000  000000    000   000  
000   000  000     000     000  000  0000  000       000   000  
 0000000   000     000     000  000   000  000        0000000   
###

{ childp, empty, slash, str, _ } = require 'kxk'

gitStatus = require './gitstatus'
gitDiff   = require './gitdiff'

gitInfo = (fileOrDir) ->

    info = gitStatus fileOrDir
    
    info.changed = info.changed.map (file) -> gitDiff file
    
    return info

if module.parent
    module.exports = gitInfo
else
    if not empty process.argv[2]
        dir = slash.resolve process.argv[2]
    else
        dir = process.cwd()
    console.log gitInfo dir
    