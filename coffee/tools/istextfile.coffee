
# 000   0000000  000000000  00000000  000   000  000000000  00000000  000  000      00000000  
# 000  000          000     000        000 000      000     000       000  000      000       
# 000  0000000      000     0000000     00000       000     000000    000  000      0000000   
# 000       000     000     000        000 000      000     000       000  000      000       
# 000  0000000      000     00000000  000   000     000     000       000  0000000  00000000  

path = require 'path'
_    = require 'lodash'

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

isTextFile = (f) -> path.extname(f) and textext[path.extname f]? or textbase[path.basename(f).toLowerCase()]

module.exports = isTextFile
