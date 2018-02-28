
# 0000000    000  00000000   000      000   0000000  000000000  
# 000   000  000  000   000  000      000  000          000     
# 000   000  000  0000000    000      000  0000000      000     
# 000   000  000  000   000  000      000       000     000     
# 0000000    000  000   000  0000000  000  0000000      000     

{ fs, slash, error, log, _ } = require 'kxk'

walkdir    = require 'walkdir'
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
#          matchExt:     null # only include files that match the extension of the option's value

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
        
        if slash.basename(p).startsWith '.'
            
            if opt.ignoreHidden
                return true
                
            if slash.basename(p) in ['.DS_Store', '.git']
                return true
                
        else if opt.matchExt? 
            
            if slash.extname(p) != slash.extname opt.matchExt
                return true
                
        if slash.basename(p) == 'Icon\r'
            return true
            
        if slash.basename(p).toLowerCase().startsWith 'ntuser.'
            return true
        
        false
    
    onDir = (d) -> 
        if not filter(d) 
            dir = type: 'dir', file: d, name: slash.basename d # relative d, dirPath 
            dirs.push  dir
            
    onFile = (f) -> 
        if not filter(f) 
            file = type: 'file', file: f, name: slash.basename f # relative f, dirPath
            file.textFile = true if isTextFile f
            files.push file

    try
        fileSort = (a,b) -> a.name.localeCompare b.name
        walker = walkdir.walk dirPath, no_recurse: true
        walker.on 'directory', onDir
        walker.on 'file',      onFile
        walker.on 'end',         -> cb null, dirs.sort(fileSort).concat files.sort(fileSort)
        walker.on 'error', (err) -> cb err
        
    catch err
        cb err

module.exports = dirList
