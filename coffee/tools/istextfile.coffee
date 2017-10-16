
# 000   0000000  000000000  00000000  000   000  000000000  00000000  000  000      00000000  
# 000  000          000     000        000 000      000     000       000  000      000       
# 000  0000000      000     0000000     00000       000     000000    000  000      0000000   
# 000       000     000     000        000 000      000     000       000  000      000       
# 000  0000000      000     00000000  000   000     000     000       000  0000000  00000000  

{ path, _ } = require 'kxk'

isBinary = require 'isbinaryfile'

textext = _.reduce require('textextensions'), (map, ext) ->
    map[".#{ext}"] = true
    map
, {}

textext['.crypt']  = true
textext['.bashrc'] = true
textext['.svg']    = true
textext['.csv']    = true

textbase = 
    profile:1
    license:1
    '.gitignore':1
    '.npmignore':1

isTextFile = (f) -> 
    return true if path.extname(f) and textext[path.extname f]? 
    return true if textbase[path.basename(f).toLowerCase()]
    return not isBinary.sync f

module.exports = isTextFile
