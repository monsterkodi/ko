# 0000000    00000000    0000000   000   000   0000000  00000000  
# 000   000  000   000  000   000  000 0 000  000       000       
# 0000000    0000000    000   000  000000000  0000000   0000000   
# 000   000  000   000  000   000  000   000       000  000       
# 0000000    000   000   0000000   00     00  0000000   00000000  

{ process, log, str
}        = require 'kxk'
Command  = require '../commandline/command'
Browser  = require '../browser/browser'

class Browse extends Command
    
    constructor: (@commandline) ->
        
        @cmdID      = 0
        @area       = window.area
        @browser    = new Browser @area.view
        @commands   = Object.create null
        @shortcuts  = ['command+.', 'command+shift+.']
        @names      = ["browse", "Browse"]
        @area.on 'resized', @onAreaResized
        
        super @commandline

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (combo) ->
        
        @browser.start()
        
        if window.editor.currentFile?
            log 'load file', window.editor.currentFile
            @browser.loadFile window.editor.currentFile 
        else 
            log 'load dir', process.cwd()
            @browser.loadDir process.cwd()

        super combo
        
        text:   @last()
        select: true
        do:     'show area'

    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Browse
