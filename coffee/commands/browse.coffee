
# 0000000    00000000    0000000   000   000   0000000  00000000  
# 000   000  000   000  000   000  000 0 000  000       000       
# 0000000    0000000    000   000  000000000  0000000   0000000   
# 000   000  000   000  000   000  000   000       000  000       
# 0000000    000   000   0000000   00     00  0000000   00000000  

{ dirExists, process, unresolve, resolve, post, str, log, $ } = require 'kxk'

Command     = require '../commandline/command'
FileBrowser = require '../browser/filebrowser'

class Browse extends Command
    
    constructor: (@commandline) ->
        
        @cmdID     = 0
        @browser   = new FileBrowser window.area.view
        @commands  = Object.create null
        @shortcuts = ['command+.', 'command+shift+.']
        @names     = ["browse", "Browse"]
        
        window.area.on 'resized', @onAreaResized
        
        @browser.on 'itemActivated', @onItemActivated
        
        super @commandline
        @syntaxName = 'browser'
        
    restoreState: (state) -> 
        
        super state
        @browser.start()
        @browser.loadFile state.text, focus:false, dontJump:true
        window.split.swap $('terminal'), $('area')

    clear: ->
        return if @browser.cleanUp()
        super
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (@combo) ->
        
        @browser.start()
        
        if window.editor.currentFile?
            @browser.loadFile window.editor.currentFile 
        else 
            @browser.loadDir process.cwd()

        super @combo
        
        select: true
        do:     @name == 'Browse' and 'half area' or 'quart area'

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    execute: (command) ->
        
        return error "no command?" if not command?
        
        @cmdID += 1
        cmd = command.trim()
        if cmd.length 
            if dirExists cmd
                @browser.browse cmd
    
    onItemActivated: (item) =>
        
        if item.file 
            pth = unresolve item.file
            if item.type == 'dir' then pth += '/'
            @commandline.setText pth

    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Browse
