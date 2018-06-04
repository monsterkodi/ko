###
 0000000   000  000000000  00000000    0000000    0000000   000000000  
000        000     000     000   000  000   000  000   000     000     
000  0000  000     000     0000000    000   000  000   000     000     
000   000  000     000     000   000  000   000  000   000     000     
 0000000   000     000     000   000   0000000    0000000      000     
###

{ empty, slash, childp, fs } = require 'kxk'

gitRoot = (pth, cb) ->

    pth = slash.resolve pth
    
    if cb?
        
        return cb(null) if empty pth
        
        pth = slash.unslash(pth)
        
        fs.stat pth, (err, stat) ->
            return cb(null) if err
            if stat.isDirectory()
                childp.exec 'git rev-parse --show-toplevel', {cwd: pth, encoding: 'utf8'}, (err,stdout) ->
                    return cb(null) if err
                    cb stdout.trim()
            else
                gitRoot slash.dir(pth), cb
    else
    
        try
            cwd = slash.dirExists(pth) and slash.unslash(pth) or slash.dir(pth)
            r = childp.execSync 'git rev-parse --show-toplevel',
                cwd:      cwd
                encoding: 'utf8'
            return r.trim()
            
        catch err
            return null

module.exports = gitRoot