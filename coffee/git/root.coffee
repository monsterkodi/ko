###
 0000000   000  000000000  00000000    0000000    0000000   000000000  
000        000     000     000   000  000   000  000   000     000     
000  0000  000     000     0000000    000   000  000   000     000     
000   000  000     000     000   000  000   000  000   000     000     
 0000000   000     000     000   000   0000000    0000000      000     
###

{ valid, empty, slash, childp, fs, _ } = require 'kxk'

log     = console.log

fixPath = (p) ->
    
    p = p.trim()
    if p[0] == p[2] == '/'
        p = p[1].toUpperCase() + ':' + p.slice 2
    return slash.resolve p    

gitCmd  = 'git rev-parse --show-toplevel'
execOpt = (cwd) -> cwd:cwd, encoding:'utf8', stdio:['pipe', 'pipe', 'ignore']
    
gitRoot = (pth, cb) ->

    pth = slash.resolve pth
    
    if _.isFunction cb
        
        return cb('') if empty pth
        
        pth = slash.unslash pth
        
        slash.dirExists pth, (stat) ->
            pth = if valid(stat) then slash.unslash(pth) else slash.dir(pth)
            return cb('') if empty pth
            childp.exec gitCmd, execOpt(pth), (err,r) ->
                return cb('') if valid err
                cb fixPath r
    else
    
        return '' if empty pth
        
        try
            pth = if slash.dirExists(pth) then slash.unslash(pth) else slash.dir(pth)
            return '' if empty pth
            return fixPath childp.execSync gitCmd, execOpt(pth)
            
        catch err
            return ''

# 00     00   0000000   0000000    000   000  000      00000000  
# 000   000  000   000  000   000  000   000  000      000       
# 000000000  000   000  000   000  000   000  000      0000000   
# 000 0 000  000   000  000   000  000   000  000      000       
# 000   000   0000000   0000000     0000000   0000000  00000000  

if module.parent
    
    module.exports = gitRoot
    
else
    if not empty process.argv[2]
        dir = slash.resolve process.argv[2]
    else
        dir = process.cwd()
        
    log gitRoot dir
    