###
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
###

{ log, fs } = require 'kxk'

class Watcher

    constructor: (@editor) ->

        @w = fs.watch @editor.currentFile
        
        @w.on 'change', (changeType, p) =>
            
            if changeType == 'change'
                window.loadFile @editor.currentFile, reload:true
            else
                @editor.setText ""
            
        # @w.on 'unlink', (p) => @editor.setText ""
        
    stop: -> @w.close()

module.exports = Watcher