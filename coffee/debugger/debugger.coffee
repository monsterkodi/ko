
# 0000000    00000000  0000000    000   000   0000000    0000000   00000000  00000000   
# 000   000  000       000   000  000   000  000        000        000       000   000  
# 000   000  0000000   0000000    000   000  000  0000  000  0000  0000000   0000000    
# 000   000  000       000   000  000   000  000   000  000   000  000       000   000  
# 0000000    00000000  0000000     0000000    0000000    0000000   00000000  000   000  

{ joinFilePos, splitFilePos, post, path, log
} = require 'kxk'

electron = require 'electron'
mapSrc   = require './mapsrc'

class WinDbg 
    
    constructor: (@wid) ->
        
        @scriptMap = {}
        
        @dbg = electron.BrowserWindow.fromId(@wid).webContents.debugger

        # log "debugger for win #{wid} #{d?} attached #{d.isAttached()}"
            
        if not @dbg.isAttached()
            try
                @dbg.attach '1.2'
            catch err
                error "can't attach!", err

        @dbg.on 'message', @onMessage

        @dbg.sendCommand 'Debugger.enable', (err,result) => 
            return error "unable to enable debugger" if not _.isEmpty(err) # or not result
            log "debugger enabled for win #{@wid}"
            @enabled = true
            if @breakpoints
                while bp = @breakpoints.shift()
                    @setBreakpoint bp[0], bp[1]
                
    setBreakpoint: (file, line) ->
        
        if not @enabled
            @breakpoints ?= []
            @breakpoints.push [file, line]
            return
            
        if path.extname(file) == '.coffee'
            [jsSource, jsLine] = mapSrc.toJs file, line
        else
            [jsSource, jsLine] = [file, line]
            
        @dbg.sendCommand "Debugger.setBreakpointByUrl", {url:jsSource, lineNumber:jsLine}, (err,result) -> 
            return error "unable to set breakpoint #{jsSource}:#{jsLine}", err if not _.isEmpty(err)
            log "breakpoint set at #{jsSource}:#{jsLine}", result

    onMessage: (event, method, params) =>
        # log 'mssg', method
        switch method 
            when 'Debugger.scriptParsed' 
                # log "script: #{params.sourceMapURL} #{params.scriptId} -> #{params.url}"
                @scriptMap[params.scriptId] = params
            when 'Debugger.breakpointResolved' then log 'breakpoint: '+ params
            when 'Debugger.paused' 
                log 'BREAKPOINT'
                for frame in params.callFrames
                    log "    #{frame.functionName}" #, frame.location
                filePos = params.hitBreakpoints[0]
                log 'BREAK AT', filePos
                [file, pos] = splitFilePos filePos
                [coffeeSource, coffeeLine] = mapSrc.toCoffee file, pos[1]+1
                if coffeeLine
                    filePos = joinFilePos coffeeSource, [0,coffeeLine-1]
                    log 'mapped:', [coffeeSource, coffeeLine], filePos
                main.createWindow file:filePos, debugger:true
                log 'resuming...'
                @dbg.sendCommand 'Debugger.resume'
            else log "method: #{method}"

class Debugger
    
    constructor: ->
        log 'debugger'
        post.on 'breakpoint', @onBreakpoint
        @winDbg = {}
        
    onBreakpoint: (wid, file, line) =>
        line += 1
        log 'onBreakpoint', wid, file, line
        @winDbg[wid] ?= new WinDbg wid
        @winDbg[wid].setBreakpoint file, line
    
module.exports = Debugger

    