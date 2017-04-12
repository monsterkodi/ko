# 0000000    000  00000000   000      000   0000000  000000000  
# 000   000  000  000   000  000      000  000          000     
# 000   000  000  0000000    000      000  0000000      000     
# 000   000  000  000   000  000      000       000     000     
# 0000000    000  000   000  0000000  000  0000000      000     

{ resolve, relative, fs, path, error, log, _  
}       = require 'kxk'
walkdir = require 'walkdir'
textext = require 'textextensions'
textmap = _.reduce textext, (map, ext) ->
        map[".#{ext}"] = ext
        map

#   directory list
#
#   callbacks with a list of objects for files and directories in dirPath
#       [
#           type: file|dir
#           rel:  relative path
#           abs:  absolute path
#       ]
#
###           
    opt:  
          ignoreHidden: true # skip files that starts with a dot
          logError:     true # print message to console.log if a path doesn't exits
          matchExt:     null # only include files that match the extension of the option's value
###

dirList = (dirPath, opt, cb) ->
    
    cb ?= opt.cb
    if _.isFunction(opt) and not cb? then cb = opt
    opt ?= {}
    
    opt.ignoreHidden ?= true
    opt.logError     ?= true
    dirs    = []
    files   = []
    dirPath = resolve dirPath
    
    isTextFile = (f) -> textmap[path.extname f]?

    filter = (p) ->
        if opt.ignoreHidden and path.basename(p).startsWith '.'
            return true
        else if opt.matchExt? 
            if path.extname(p) != path.extname opt.matchExt
                return true
        false
    
    onDir = (d) -> 
        if not filter(d) 
            dir = type: 'dir',  abs: d, name: path.basename d # relative d, dirPath 
            dirs.push  dir
            
    onFile = (f) -> 
        if not filter(f) 
            file = type: 'file', abs: f, name: path.basename f # relative f, dirPath
            file.textFile = true if isTextFile
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
