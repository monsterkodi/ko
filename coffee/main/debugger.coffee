
# 0000000    00000000  0000000    000   000   0000000    0000000   00000000  00000000   
# 000   000  000       000   000  000   000  000        000        000       000   000  
# 000   000  0000000   0000000    000   000  000  0000  000  0000  0000000   0000000    
# 000   000  000       000   000  000   000  000   000  000   000  000       000   000  
# 0000000    00000000  0000000     0000000    0000000    0000000   00000000  000   000  

{ post, path, log, _
}       = require 'kxk'
WinDbg  = require './windbg'

class Debugger
    
    constructor: ->

        @winDbg = {}
        @dbgWin = null        

        post.onGet 'dbgInfo',     @onDbgInfo
        post.on 'setBreakpoint',  @onSetBreakpoint
        post.on 'getBreakpoints', @onGetBreakpoints
        post.on 'getObjectProps', @onGetObjectProps
        post.on 'debugCommand',   @onDebugCommand
        post.on 'winClosed',      @onWinClosed

    onWinClosed: (wid) =>
        
        if wid == @dbgWin?.id
            delete @dbgWin
            
        @winDbg[wid]?.del()
        delete @winDbg[wid]
        
        post.toWins 'debuggerChanged'
    
    onDbgInfo: =>
        
        info = {}
        for wid,dbg of @winDbg
            info[wid] = dbg.info()
        info
        
    onSetBreakpoint: (wid, file, line, col=0, status='toggle') =>
        
        return error 'wrong file type' if path.extname(file) not in ['.js', '.coffee']
        @winDbg[wid] ?= new WinDbg @, wid
        @winDbg[wid].setBreakpoint file, line, col, status

    onGetBreakpoints: (sendToWin, file, breakWin) =>
        
        breakWin ?= sendToWin
        
        if @winDbg[breakWin]?
            for breakpoint in @winDbg[breakWin].breakpointsForFile file
                log breakpoint.file
                post.toWin sendToWin, 'setBreakpoint', breakpoint            

    onGetObjectProps: (sendToWin, objectId, breakWin) =>
        
        if @winDbg[breakWin]?
            @winDbg[breakWin].objectProps objectId, (props) ->
                # log 'objectProps', props
                post.toWin sendToWin, 'objectProps', breakWin, objectId, props
                
    onDebugCommand: (wid, cmd) =>
        
        # log 'onDebugCommand', wid, cmd
        @winDbg[wid] ?= new WinDbg @, wid
        @winDbg[wid].debugCommand cmd
        
    sendFileLine: (info) ->
        
        if not @dbgWin or not main.activateWindowWithID @dbgWin.id
            @dbgWin = main.createWindow file:info.fileLine, debugFileLine:info
        else
            post.toWin @dbgWin.id, 'debugFileLine', info
        

module.exports = Debugger
    