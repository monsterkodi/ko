
# 0000000    00000000  0000000    000   000   0000000   
# 000   000  000       000   000  000   000  000        
# 000   000  0000000   0000000    000   000  000  0000  
# 000   000  000       000   000  000   000  000   000  
# 0000000    00000000  0000000     0000000    0000000   

{ dirExists, process, unresolve, resolve, post, str, error, log, $
}             = require 'kxk'
Command       = require '../commandline/command'
ObjectBrowser = require '../browser/objectbrowser'
DebugCtrl     = require '../win/debugctrl'

class Debug extends Command
    
    constructor: (@commandline) ->
        
        @cmdID      = 0
        @area       = window.area
        @browser    = new ObjectBrowser @area.view
        @debugCtrl  = new DebugCtrl @
        @commands   = Object.create null
        @shortcuts  = ['alt+d']
        @names      = ["debug"]
        
        post.on 'debugFileLine',   @onDebugFileLine
        post.on 'debuggerChanged', @onDebuggerChanged
        
        @browser.name = 'DebugBrowser'
        @browser.on 'itemActivated', @onItemActivated
        @area.on 'resized', @onAreaResized
                
        super @commandline
        @syntaxName = 'browser'
        
    restoreState: (state) ->         
        
        super state
        window.split.swap $('terminal'), $('area')
    
    onDebuggerChanged: =>
        activeItemName = @activeItem()?.name
        if @commandline.command == @
            @loadDbgInfo()
        r  = @browser.column(0)?.row activeItemName
        r ?= 0
        @browser.column(0)?.row(r)?.activate()

    onDebugFileLine: (@debugInfo) =>
        
        log "onDebug", @debugInfo.winID, @debugInfo.fileLine
        
        if @commandline.command != @
            @commandline.startCommand 'debug'
        
        @loadDbgInfo()    
        @browser.column(0)?.row("#{@debugInfo.winID}")?.activate()
        
        if @debugInfo.fileLine
            post.emit 'jumpToFile', file:@debugInfo.fileLine
            
        @debugCtrl.setPlayState @state()

    activeItem: -> @browser.column(0)?.activeRow()?.item
    activeWid:  -> parseInt @activeItem()?.name ? window.winID
    state:      -> @activeItem()?.obj['paused']? and 'paused' or 'running'
    isPaused:   -> @state() == 'paused'
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (@combo) ->
        
        @browser.start()
        @debugCtrl.start()
        @loadDbgInfo()
            
        @browser.column(0).row(0)?.activate()
        @debugCtrl.setPlayState @state()
        
        super @combo
        
        select: true
        do:     @name == 'Browse' and 'half area' or 'quart area'

    loadDbgInfo: ->
        @browser.clear()
        for k,v of post.get 'dbgInfo'
            @browser.loadObject v, name:k
        
    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: ->
        @debugCtrl.cancel()
        super
        
    clear: ->
        return if @browser.cleanUp()
        super

    onItemActivated: (item) => @debugCtrl.setPlayState @state()

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    execute: (command) ->
        return error "no command?" if not command?
        cmd = command.trim()
        return error "no cmd?" if not cmd.length
        wid = @activeWid()
        log 'debug execute command', wid, cmd
        @cmdID += 1
        switch cmd
            when 'step', 'into', 'out', 'cont', 'pause' then post.toMain 'debugCommand', wid, cmd
    
    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Debug
