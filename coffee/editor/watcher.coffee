###
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
###

{ watch, log, fs } = require 'kxk'

class Watcher

    constructor: (@editor) ->

        @w = watch.watch @editor.currentFile, ignoreInitial: true
        
        @w.on 'change', (p) =>
            
            window.loadFile @editor.currentFile, reload:true
            
        @w.on 'unlink', (p) => @editor.setText ""
        
    stop: -> @w.close()

module.exports = Watcher