
# 0000000    000  00000000   000      000   0000000  000000000  
# 000   000  000  000   000  000      000  000          000     
# 000   000  000  0000000    000      000  0000000      000     
# 000   000  000  000   000  000      000       000     000     
# 0000000    000  000   000  0000000  000  0000000      000     

{ fs, walkdir, slash, error, log, _ } = require 'kxk'

isTextFile = require './istextfile'

#   directory list
#
#   callbacks with a list of objects for files and directories in dirPath
#       [
#           type: file|dir
#           name: basename
#           file: absolute path
#       ]
#
#   opt:  
#          ignoreHidden: true # skip files that starts with a dot
#          logError:     true # print message to console.log if a path doesn't exits

dirList = (dirPath, opt, cb) ->
    
    cb ?= opt.cb
    if _.isFunction(opt) and not cb? then cb = opt
    opt ?= {}
    
    opt.ignoreHidden ?= true
    opt.logError     ?= true
    dirs    = []
    files   = []
    dirPath = slash.resolve dirPath
    
    filter = (p) ->
        
        base = slash.file p
        if base.startsWith '.'
            
            if opt.ignoreHidden
                return true
                
            if base in ['.DS_Store', '.git']
                return true
                
        if base == 'Icon\r'
            return true
            
        if base.toLowerCase().startsWith 'ntuser.'
            return true
            
        if base.toLowerCase().startsWith '$recycle'
            return true
        
        false
    
    onDir = (d) -> 
        if not filter(d) 
            dir = 
                type: 'dir'
                file: slash.path d
                name: slash.basename d
            dirs.push  dir
            
    onFile = (f) -> 
        if not filter(f) 
            file = 
                type: 'file'
                file: slash.path f
                name: slash.basename f
            file.textFile = true if isTextFile f
            files.push file

    try
        fileSort = (a,b) -> a.name.localeCompare b.name
        walker = walkdir.walk dirPath, no_recurse: true
        walker.on 'directory', onDir
        walker.on 'file',      onFile
        walker.on 'end',         -> cb null, dirs.sort(fileSort).concat files.sort(fileSort)
        walker.on 'error', (err) -> cb err
        walker
    catch err
        cb err

module.exports = dirList
