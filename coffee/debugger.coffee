
d = electron.BrowserWindow.fromId(1).webContents.debugger

# d = electron.BrowserWindow.fromId(1).devToolsWebContents.debugger

log "got debugger #{d?} attached #{d.isAttached()}"

scriptMap = {}
if not d.isAttached()
    try
        d.attach '1.2'
        log "isAttached now? #{d.isAttached()}"
    catch err
        error "can't attach!", err

d.on 'message', (event, method, params) ->
    switch method 
        when 'Debugger.scriptParsed' 
            log "script: #{params.sourceMapURL?} #{params.scriptId} -> #{params.url}"
            scriptMap[params.scriptId] = params.url
        when 'Debugger.breakpointResolved' then log 'breakpoint: '+ params
        when 'Debugger.paused' 
            for frame in params.callFrames
                log "#{frame.functionName}", frame.location
            file = params.hitBreakpoints[0]
            log 'file', file
            main.createWindow file:file
            log 'resuming...'
            d.sendCommand 'Debugger.resume'
        else log "method: #{method}"
    
d.sendCommand 'Debugger.enable', (result) -> 
    return error "unable to enable debugger" if not result
    # log 'debugger enabled'
    # d.sendCommand "Debugger.setBreakpointByUrl", {lineNumber:166, url:'/Users/t.kohnhorst/s/ko/coffee/browser/browser.coffee'}, (result) -> 
        # return error "unable to set breakpoint 1" if not result
        # log 'breakpoint 1 set', result
    d.sendCommand "Debugger.setBreakpointByUrl", {lineNumber:250, url:'/Users/t.kohnhorst/s/ko/js/browser/browser.js'}, (result) -> 
        return error "unable to set breakpoint 2" if not result
        log 'breakpoint 2 set', result

# d.sendCommand 'Page.enable'
# d.sendCommand 'Network.enable'

# log "got cri? #{cri?}"
# log 'page?', cri.Page?
# log 'list?', cri.List?

# cri.List (err, res) -> 
    # return error "#{err}" if err
    # # log res
    # cri.Activate {id: res[0].id}, (err) ->
        # error "#{err}" if err
        # log 'activated', res[0]
    
# cri (client) =>
    # log 'got cri client', client?
    # {Page,List,Debugger} = client
    # log 'got page,list,debugger', Page?,List?,Debugger?
    