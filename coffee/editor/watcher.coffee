
# 000   000   0000000   000000000   0000000  000   000  00000000  00000000 
# 000 0 000  000   000     000     000       000   000  000       000   000
# 000000000  000000000     000     000       000000000  0000000   0000000  
# 000   000  000   000     000     000       000   000  000       000   000
# 00     00  000   000     000      0000000  000   000  00000000  000   000

{ log, fs
}        = require 'kxk'
chokidar = require 'chokidar'

class Watcher

    constructor: (@editor) ->
        # log 'watcher start', @editor.currentFile
        @w = chokidar.watch @editor.currentFile, ignoreInitial: true
        
        @w.on 'change', (p) =>
            
            # log 'watcher change', p, @editor.currentFile
            window.loadFile @editor.currentFile, reload: true, dontSave: true
            
        @w.on 'unlink', (p) => @editor.setText ""
        
    stop: -> @w.close()

module.exports = Watcher