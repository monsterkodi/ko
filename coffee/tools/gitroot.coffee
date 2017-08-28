
#  0000000   000  000000000  00000000    0000000    0000000   000000000  
# 000        000     000     000   000  000   000  000   000     000     
# 000  0000  000     000     0000000    000   000  000   000     000     
# 000   000  000     000     000   000  000   000  000   000     000     
#  0000000   000     000     000   000   0000000    0000000      000     

{ empty, dirExists, childp, path, fs
} = require 'kxk'

gitRoot = (pth, cb) ->

    if cb?
        
        return cb(null) if empty pth
        
        fs.stat pth, (err, stat) ->
            return cb(null) if err
            if stat.isDirectory()
                childp.exec 'git rev-parse --show-toplevel', {cwd: pth, encoding: 'utf8'}, (err,stdout) ->
                    return cb(null) if err
                    cb stdout.trim()
            else
                gitRoot path.dirname(pth), cb
    else
    
        try
            cwd = dirExists(pth) and pth or path.dirname(pth)
            r = childp.execSync 'git rev-parse --show-toplevel',
                cwd:      cwd
                encoding: 'utf8'
            return r.trim()
            
        catch err
            return null

module.exports = gitRoot