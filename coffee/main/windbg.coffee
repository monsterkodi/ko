
# 000   000  000  000   000  0000000    0000000     0000000   
# 000 0 000  000  0000  000  000   000  000   000  000        
# 000000000  000  000 0 000  000   000  0000000    000  0000  
# 000   000  000  000  0000  000   000  000   000  000   000  
# 00     00  000  000   000  0000000    0000000     0000000   

{ joinFileLine, samePath, splitFileLine, unresolve, post, path, empty, log, _
}        = require 'kxk'
electron = require 'electron'
srcmap   = require '../tools/srcmap'

class WinDbg 
    
    constructor: (@debugger, @wid) ->
        
        @status      = 'running'
        @scripts     = {}
        @scriptMap   = {}
        @breakpoints = {}
        @stacktrace  = {}
        
        @dbg = electron.BrowserWindow.fromId(@wid).webContents.debugger

        if not @dbg.isAttached()
            try
                @dbg.attach '1.2'
            catch err
                log "can't attach debugger!", err

        @dbg.on 'message', @onMessage

        @dbg.sendCommand 'Debugger.enable', (err,result) => 
            return log "can't enable debugger!" if not empty err # or not result
            
            @enabled = true
            
            if @breakdelay
                while bp = @breakdelay.shift()
                    @setBreakpoint.apply @, bp
                delete @breakdelay
            
            for k,s of @scriptMap
                s.file = unresolve s.url
                if s.sourceMapURL and s.sourceMapURL.length
                    coffeeSrc = srcmap.toCoffee s.url
                    if not empty coffeeSrc
                        s.file = unresolve coffeeSrc
                @scripts[s.file] = s
    
    # 0000000    00000000  000      
    # 000   000  000       000      
    # 000   000  0000000   000      
    # 000   000  000       000      
    # 0000000    00000000  0000000  
    
    del: ->
        
        if @dbg
            @dbg.removeListener 'message', @onMessage
            @dbg.detach()
            delete @dbg
            
    # 000  000   000  00000000   0000000   
    # 000  0000  000  000       000   000  
    # 000  000 0 000  000000    000   000  
    # 000  000  0000  000       000   000  
    # 000  000   000  000        0000000   
    
    info: ->
        
        info = breakpoints: _.map @breakpoints, (v,k) -> 
            name:  '⦿ '+path.basename joinFileLine v.file, v.line
            file:   v.file
            line:   v.line
            status: v.status
        
        info.stacktrace = @stacktrace if @status == 'paused'
        if @status == 'paused'
            [file, line, col] = splitFileLine @fileLine
            info[@status] = []
            info[@status].push name:'⦿ '+path.basename(@fileLine), file:file, line:line
        else 
            info[@status] =  true
        info
        
    # 0000000    00000000   00000000   0000000   000   000  
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    0000000    0000000   000000000  0000000    
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    000   000  00000000  000   000  000   000  
    
    setBreakpoint: (file, line, status) ->
        
        log "WinDbg.setBreakpoint #{file}:#{line} status:#{status}"
        
        if not @enabled
            @breakdelay ?= []
            @breakdelay.push [file, line, status]
            return
            
        if path.extname(file) == '.coffee'
            [jsFile, jsLine, jsCol] = srcmap.toJs file, line
            if not jsFile
                return log "no js source line for #{file}:#{line}"
                    
            [backFile, backLine, backCol] = srcmap.toCoffee jsFile, jsLine, jsCol
            return log "can't remap fileLine #{backFile}:#{backLine}:#{backCol} - #{jsFile}:#{jsLine}:#{jsCol} - #{file}:#{line}" if backFile != file or backLine != line
        else
            [jsFile, jsLine] = [file, line]
        
        jsFile = unresolve jsFile
        breakKey = joinFileLine jsFile, jsLine, jsCol
        breakpoint = @breakpoints[breakKey]
        
        if breakpoint and status in ['toggle', 'inactive', 'remove']

            if status in ['toggle', 'remove']
                breakpoint.status = 'remove'
                delete @breakpoints[breakKey]

            @dbg.sendCommand "Debugger.removeBreakpoint", {breakpointId:breakpoint.id}, (err,result) => 
                return log "unable to remove breakpoint #{breakKey}", err if not empty err
                post.toWin @wid, 'setBreakpoint', breakpoint
                post.toWins 'debuggerChanged'
            
        else

            if status == 'toggle' then status = 'active'
            
            breakLoc = 
                url:  resolve jsFile 
                lineNumber:   jsLine
                columnNumber: jsCol

            @dbg.sendCommand "Debugger.setBreakpointByUrl", breakLoc, (err,result) => 
                
                return log "unable to set breakpoint #{breakKey}", err if not empty err
                
                if result.locations.length
                    breakpoint = file:file, line:line, status:status, id:result.breakpointId
                    @breakpoints[breakKey] = breakpoint
                    log 'post', breakpoint
                    post.toWin @wid, 'setBreakpoint', breakpoint
                    post.toWins 'debuggerChanged'
                else
                    log "no location for #{breakKey}?"

    breakpointsForFile: (file) ->
        
        bpts = []
        for k,v of @breakpoints
            if samePath v.file, file
                bpts.push v
        bpts        

    #  0000000   0000000          000  00000000   0000000  000000000  00000000   00000000    0000000   00000000    0000000  
    # 000   000  000   000        000  000       000          000     000   000  000   000  000   000  000   000  000       
    # 000   000  0000000          000  0000000   000          000     00000000   0000000    000   000  00000000   0000000   
    # 000   000  000   000  000   000  000       000          000     000        000   000  000   000  000             000  
    #  0000000   0000000     0000000   00000000   0000000     000     000        000   000   0000000   000        0000000   
    
    objectProps: (objectId, cb) ->
        
        @dbg.sendCommand "Runtime.getProperties", objectId: objectId, (err,result) => 
            return log "unable to get object properties #{objectId}", err if not empty err            
            prepItem = (p) ->
                name = p.name
                v = p.value
                if not v? then return type: 'nil', name: name, obj: null 
                if v.subtype? and v.subtype == 'null' 
                    return type: 'nil', name: name, obj: null
                switch v.type
                    when 'number'    then type: 'float',  name:name, obj: v.value
                    when 'boolean'   then type: 'bool',   name:name, obj: v.value
                    when 'string'    then type: 'string', name:name, obj: v.value
                    when 'function'  then type: 'func',   name:name, obj: v.description
                    when 'object'    then type: 'obj',    name:name, obj: objectId: v.objectId
                    when 'undefined' then type: 'nil',    name:name, obj: undefined
                    else
                        log "unhandled value type #{v.type}", v
                        type: 'nil', name: name, obj: v.type
            items = result.result.map (p) -> prepItem p
            cb _browse_items_:items
        
    # 00     00  00000000   0000000   0000000   0000000    0000000   00000000  
    # 000   000  000       000       000       000   000  000        000       
    # 000000000  0000000   0000000   0000000   000000000  000  0000  0000000   
    # 000 0 000  000            000       000  000   000  000   000  000       
    # 000   000  00000000  0000000   0000000   000   000   0000000   00000000  
    
    onMessage: (event, method, params) =>

        switch method 
            
            when 'Debugger.scriptParsed' then @scriptMap[params.scriptId] = params
            when 'Debugger.breakpointResolved' then log 'breakpoint: '+ params # never happens?
            when 'Debugger.paused' 

                @buildStackTrace params.callFrames
                    
                if params.hitBreakpoints[0]
                    log 'BREAK', params.hitBreakpoints[0]
                    [file,line,col] = splitFileLine params.hitBreakpoints[0]
                    fileLine = joinFileLine.apply joinFileLine, srcmap.toCoffee file, line, col
                    
                    wtf = @fileLocation params.callFrames[0].location
                    if wtf != unresolve fileLine then log 'breakpoint and stacktrace differ?', wtf, unresolve fileLine
                else
                    fileLine = @fileLocation params.callFrames[0].location
                    
                [file, line, col] = splitFileLine fileLine
                if path.extname(file) != '.coffee'
                    @debugCommand 'step'
                else
                    @fileLine = fileLine
                    @status = 'paused'
                    @sendFileLine()                
                    
            when 'Debugger.resumed'
                
                @status = 'running'
                delete @fileLine
                post.toWins 'debuggerChanged'

    sendFileLine: -> @debugger.sendFileLine winID: @wid, fileLine:@fileLine

    #  0000000  000000000   0000000    0000000  000   000  000000000  00000000    0000000    0000000  00000000  
    # 000          000     000   000  000       000  000      000     000   000  000   000  000       000       
    # 0000000      000     000000000  000       0000000       000     0000000    000000000  000       0000000   
    #      000     000     000   000  000       000  000      000     000   000  000   000  000       000       
    # 0000000      000     000   000   0000000  000   000     000     000   000  000   000   0000000  00000000  
    
    buildStackTrace: (frames) ->
        
        @stacktrace = {}
        i = 0
        for frame in frames
            file = @fileLocation frame.location
            name = frame.functionName
            name = path.basename file if not name?.length
            name = "⦿ " + name
            scope = @buildScope frame.scopeChain
            local = scope.shift()
            global = scope.pop()
            @stacktrace[name] = 
                index:  i
                file:   file
                local:  objectId: local.obj.objectId
                global: objectId: global.obj.objectId
                scope:  _browse_items_: scope
                this:   frame.this
            i++
            
    #  0000000   0000000   0000000   00000000   00000000  
    # 000       000       000   000  000   000  000       
    # 0000000   000       000   000  00000000   0000000   
    #      000  000       000   000  000        000       
    # 0000000    0000000   0000000   000        00000000  
    
    buildScope: (scopeChain) ->
        
        scopes = []
        for s in scopeChain
            name = s.name ? s.object.description
            if name == 'Object'
                [file] = splitFileLine @fileLocation s.startLocation  
                name = path.basename file
            scopes.push
                type:   'obj'
                obj:    objectId: s.object.objectId
                name:   name
        scopes
        
    # 000       0000000    0000000   0000000   000000000  000   0000000   000   000  
    # 000      000   000  000       000   000     000     000  000   000  0000  000  
    # 000      000   000  000       000000000     000     000  000   000  000 0 000  
    # 000      000   000  000       000   000     000     000  000   000  000  0000  
    # 0000000   0000000    0000000  000   000     000     000   0000000   000   000  
    
    fileLocation: (location) ->
        if @scriptMap[location?.scriptId]?
            jsFile = @scriptMap[location.scriptId].url
            jsLine = Math.max location.lineNumber, 1
            jsCol  = location.columnNumber
            [coffeeFile, coffeeLine, coffeeCol] = srcmap.toCoffee jsFile, jsLine, jsCol
            if coffeeLine
                return unresolve joinFileLine coffeeFile, coffeeLine, coffeeCol
            else
                return unresolve joinFileLine jsFile, jsLine, jsCol
        null
        
    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    
    
    debugCommand: (command) ->
        
        map = 
            step:  'stepOver'
            into:  'stepInto'
            out:   'stepOut'
            cont:  'resume'
            pause: 'pause'
            
        if map[command]?

            @dbg.sendCommand "Debugger.#{map[command]}"

module.exports = WinDbg
