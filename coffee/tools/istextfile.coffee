
# 000   0000000  000000000  00000000  000   000  000000000  00000000  000  000      00000000  
# 000  000          000     000        000 000      000     000       000  000      000       
# 000  0000000      000     0000000     00000       000     000000    000  000      0000000   
# 000       000     000     000        000 000      000     000       000  000      000       
# 000  0000000      000     00000000  000   000     000     000       000  0000000  00000000  

{ slash, _ } = require 'kxk'

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
    return true if slash.extname(f) and textext[slash.extname f]? 
    return true if textbase[slash.basename(f).toLowerCase()]
    return false if not slash.isFile f
    return not isBinary.sync f

module.exports = isTextFile
