###
00000000   0000000   00000000   000   000  00000000  000   000  000   000   0000000    
000       000   000  000   000  000  000   000       000   000  0000  000  000         
000000    000   000  0000000    0000000    000000    000   000  000 0 000  000         
000       000   000  000   000  000  000   000       000   000  000  0000  000         
000        0000000   000   000  000   000  000        0000000   000   000   0000000    
###

if module.parent

    # 00     00   0000000   000  000   000
    # 000   000  000   000  000  0000  000
    # 000000000  000000000  000  000 0 000
    # 000 0 000  000   000  000  000  0000
    # 000   000  000   000  000  000   000

    { childp, slash, log } = require 'kxk'

    forkfunc = (file, args..., callback) ->
        
        parse = ->
            
            if /^[.]?\.\//.test file
                stack   = new Error().stack.split /\r\n|\n/
                regx    = /\(([^\)]*)\)/
                match   = regx.exec stack[3]
                dirname = slash.dir match[1]
                file    = slash.join dirname, file
            
        parse()
        
        try
            cp = childp.fork __filename
            
            onExit = ->
                cp.removeListener 'message', onResult
                cp.removeListener 'exit',    onExit
                cp.disconnect() if cp.connected
                cp.kill()
                
            onResult = (msg) -> 
                result = msg
                callback result.err, result.result
                onExit()
                
            cp.on 'error',   (err) -> callback err, null
            cp.on 'message', onResult
            cp.on 'exit',    onExit

            cp.send
                file:  file
                args:  args

        catch err
            
            callback err, null
            
        cp

    module.exports = forkfunc

else

    #  0000000  000   000  000  000      0000000  
    # 000       000   000  000  000      000   000
    # 000       000000000  000  000      000   000
    # 000       000   000  000  000      000   000
    #  0000000  000   000  000  0000000  0000000

    { log } = require 'kxk'
    
    sendResult = (err, result) ->
        
        process.removeListener 'message', callFunc
        process.send {err:err, result:result}, ->
            process.disconnect() if process.connected
            process.exit 0
        
    callFunc = (msg) ->
        
        try
            
            func = require msg.file
            result = func.apply func, msg.args
            sendResult null, result
            
        catch err
            
            sendResult err.stack

    process.on 'message', callFunc
