###
000000     0000000   000   000  000   000  000       0000000    0000000   0000000  
00   000  000   000  000 0 000  0000  000  000      000   000  000   000  000   000
00   000  000   000  000000000  000 0 000  000      000   000  000000000  000   000
00   000  000   000  000   000  000  0000  000      000   000  000   000  000   000
000000     0000000   00     00  000   000  0000000   0000000   000   000  0000000  
###

{ fs, slash, childp, log } = require 'kxk'

download = require 'download'
mount    = require 'dmg'

version  = require('../package.json').version
app      = "/Applications/ko.app"
dmg      = "#{__dirname}/ko-#{version}.dmg"

open = () ->
    log "open #{app}"
    args = process.argv.slice(2).join " "
    childp.exec "open -a #{app} " + args

unpack = () ->
    log "mounting #{dmg} ..."
    mount.mount dmg, (err, dmgPath) ->
        if err
            log err
        else
            src = slash.join dmgPath, "ko.app"
            log "copy #{src} to #{app}"
            fs.copy src, app, (err) =>
                if err?
                    log err 
                else
                    log "unmounting #{dmgPath} ..."
                    mount.unmount dmgPath, (err) => 
                        if err?
                            log err 
                        else                            
                            open()

if not fs.existsSync app
    log 'app not found ...'
    if not fs.existsSync dmg        
        src = "https://github.com/monsterkodi/ko/releases/download/v#{version}/ko-#{version}.dmg"
        log "downloading from github (this might take a while) ..."
        log src
        download(src, __dirname).then () => 
            unpack()
    else
        unpack()
else
    open()
    