
#  0000000   000  000000000  00000000    0000000    0000000   000000000  
# 000        000     000     000   000  000   000  000   000     000     
# 000  0000  000     000     0000000    000   000  000   000     000     
# 000   000  000     000     000   000  000   000  000   000     000     
#  0000000   000     000     000   000   0000000    0000000      000     

{ dirExists, childp, path
} = require 'kxk'

gitRoot = (pth) ->
    
    try
        cwd = dirExists(pth) and pth or path.dirname(pth)
        r = childp.execSync 'git rev-parse --show-toplevel',
            cwd:      cwd
            encoding: 'utf8'
        return r.trim()
        
    catch err
        return null

module.exports = gitRoot