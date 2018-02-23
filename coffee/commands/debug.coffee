
# 0000000    00000000  0000000    000   000   0000000   
# 000   000  000       000   000  000   000  000        
# 000   000  0000000   0000000    000   000  000  0000  
# 000   000  000       000   000  000   000  000   000  
# 0000000    00000000  0000000     0000000    0000000   

{ dirExists, stopEvent, samePath, process, post, str, error, log, $ } = require 'kxk'

Command       = require '../commandline/command'
ObjectBrowser = require '../browser/objectbrowser'
DebugCtrl     = require '../win/debugctrl'

class Debug extends Command
    
    constructor: (commandline) ->
        
        super commandline
        
        @cmdID      = 0
        @browser    = new ObjectBrowser window.area.view
        @debugCtrl  = new DebugCtrl @
        @commands   = Object.create null
        @shortcuts  = ['alt+d']
        @names      = ["debug"]
        
        post.on 'debugFileLine',   @onDebugFileLine
        post.on 'objectProps',     @onObjectProps
        
        @browser.name = 'DebugBrowser'
        @browser.on 'itemActivated', @onItemActivated
        @browser.on 'willRemoveRow', @onWillRemoveRow
        window.area.on 'resized', @onAreaResized
                
        @syntaxName = 'browser'
        
    restoreState: (state) ->         
        
        super state
        window.split.swap $('terminal'), $('area')

    onObjectProps: (winID, objectId, props) =>
        
        activeColumn = @browser.activeColumn()
        activeItem = activeColumn.activeRow().item
        if activeItem.obj.objectId == objectId and props?._browse_items_?.length
            @browser.loadObject props, 
                column: activeColumn.index + 1
                parent: activeItem
                sort:   true
        
    onDebuggerChanged: =>
        
        activeItemName = @activeItem()?.name
        if @commandline.command == @
            @loadDbgInfo()
        r  = @browser.column(0)?.row activeItemName
        r ?= 0
        @browser.column(0)?.row(r)?.activate()
        @updateInstructionPointer()

    onDebugFileLine: (@debugInfo) =>
        
        if @commandline.command != @
            @commandline.startCommand 'debug'
        
        @loadDbgInfo()    

        @browser.navigatePath ["#{@debugInfo.winID}", 'stacktrace', 0]
        
        if @debugInfo.fileLine
            post.emit 'jumpToFile', file:@debugInfo.fileLine
            
        @debugCtrl.setPlayState @state()
        @updateInstructionPointer()
        
    onEditorFile: (file) => @updateInstructionPointer()
        
    updateInstructionPointer: ->
        
        window.editor.meta.delClass 'dbg'
        
        file = window.editor.currentFile
        return if not file?
        
        return if not @dbgInfo?
        
        post.toMain 'getBreakpoints', window.winID, file, @activeWid()
        
        if @dbgInfo[@activeWid()]?.paused?
            if samePath @dbgInfo[@activeWid()].paused[0].file, file
                window.editor.meta.addDbgMeta 
                    line: @dbgInfo[@activeWid()].paused[0].line-1
                    clss: 'dbg pointer'

    activeItem: -> return null if not @isActive(); @browser.column(0)?.activeRow()?.item
    activeWid:  -> parseInt @activeItem()?.name ? window.winID
    state:      -> @activeItem()?.obj['paused']? and 'paused' or 'running'
    isPaused:   -> @state() == 'paused'
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (@combo) ->
        
        window.editor.on 'file',   @onEditorFile
        post.on 'debuggerChanged', @onDebuggerChanged
                
        @browser.start()
        @debugCtrl.start()
        @loadDbgInfo()
            
        @browser.column(0).row(0)?.activate()
        @debugCtrl.setPlayState @state()
        @updateInstructionPointer()
        
        super @combo
        
        select: true
        do:     @name == 'Browse' and 'half area' or 'quart area'

    loadDbgInfo: ->
        
        @browser.clear()
        @dbgInfo = post.get 'dbgInfo'
        for k,v of @dbgInfo
            @browser.loadObject v, name:k
        
    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: ->
        
        window.editor.meta.delClass 'dbg'
        window.editor.removeListener 'file', @onEditorFile
        post.removeListener 'debuggerChanged', @onDebuggerChanged
        
        @debugCtrl.cancel()
        super()
        
    clear: ->
        return if @browser.cleanUp()
        super()

    onItemActivated: (item) => 
        
        if item.obj?.objectId?
            post.toMain 'getObjectProps', window.winID, item.obj.objectId, @activeWid()
        
        @debugCtrl.setPlayState @state()
        
    onWillRemoveRow: (row, column) =>
        
        if column.prevColumn().activeRow().item.name == 'breakpoints'
            post.toMain 'setBreakpoint', @activeWid(), row.item.obj.file, row.item.obj.line, 'remove'

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
        @cmdID += 1
        switch cmd
            when 'step', 'into', 'out', 'cont', 'pause' then post.toMain 'debugCommand', wid, cmd
        @
    
    onAreaResized: (w, h) => @browser.resized? w,h
    
    globalModKeyComboEvent: (mod, key, combo, event) -> 
        
        switch combo
            when 'f7'  then return window.editor.toggleBreakpoint()
            when 'f8'  then return @execute 'step'
            when 'f9'  then return @execute 'cont'
            when 'f10' then return @execute 'into'
            when 'f11' then return @execute 'out'
        
        super mod, key, combo, event
                
module.exports = Debug
