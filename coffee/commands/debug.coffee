
# 0000000    00000000  0000000    000   000   0000000   
# 000   000  000       000   000  000   000  000        
# 000   000  0000000   0000000    000   000  000  0000  
# 000   000  000       000   000  000   000  000   000  
# 0000000    00000000  0000000     0000000    0000000   

{ dirExists, process, unresolve, resolve, post, log, str, $
}             = require 'kxk'
Command       = require '../commandline/command'
ObjectBrowser = require '../browser/objectbrowser'

class Debug extends Command
    
    constructor: (@commandline) ->
        
        @cmdID      = 0
        @area       = window.area
        @browser    = new ObjectBrowser @area.view
        @commands   = Object.create null
        @shortcuts  = ['alt+d']
        @names      = ["debug"]
        
        post.on 'debug', @onDebug        
        
        @area.on 'resized', @onAreaResized
                
        super @commandline
        @syntaxName = 'browser'
        
    restoreState: (state) ->         
        super state
        window.split.swap $('terminal'), $('area')
    
    onDebug: (debugInfo) =>
        
        log "onDebug", debugInfo.winID
        if @commandline.command != @
            @commandline.startCommand 'debug'
        @browser.column(0)?.row("#{debugInfo.winID}")?.activate()

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (@combo) ->
        
        @browser.start()
        
        for k,v of post.get 'dbgInfo'
            @browser.loadObject v, name:k

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
        cmd = command.trim()
        return error "no cmd?" if not cmd.length
        log 'debug execute command', cmd
        @cmdID += 1
        switch cmd
            when 'step', 'into', 'out', 'cont', 'pause' then post.toMain 'debugCommand', window.winID, cmd
    
    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Debug
