# 000   000   0000000   000000000   0000000  000   000  00000000  00000000 
# 000 0 000  000   000     000     000       000   000  000       000   000
# 000000000  000000000     000     000       000000000  0000000   0000000  
# 000   000  000   000     000     000       000   000  000       000   000
# 00     00  000   000     000      0000000  000   000  00000000  000   000

fs       = require 'fs'
log      = require '../tools/log'
chokidar = require 'chokidar'

class watcher

    constructor: (@editor) ->
        # log 'watcher', @editor?, @editor?.currentFile
        @w = chokidar.watch @editor.currentFile, 
            ignoreInitial: true
        @w.on 'change', (p) => #@editor.setText fs.readFileSync p, encoding: 'UTF8'
            window.loadFile @editor.currentFile
        @w.on 'unlink', (p) => @editor.setText ""
        
    stop: -> @w.close()

module.exports = watcher