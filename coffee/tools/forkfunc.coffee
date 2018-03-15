
# 00000000   0000000   00000000   000   000  00000000  000   000  000   000   0000000    
# 000       000   000  000   000  000  000   000       000   000  0000  000  000         
# 000000    000   000  0000000    0000000    000000    000   000  000 0 000  000         
# 000       000   000  000   000  000  000   000       000   000  000  0000  000         
# 000        0000000   000   000  000   000  000        0000000   000   000   0000000    

if module.parent

    # 00     00   0000000   000  000   000
    # 000   000  000   000  000  0000  000
    # 000000000  000000000  000  000 0 000
    # 000 0 000  000   000  000  000  0000
    # 000   000  000   000  000  000   000

    { childp, slash, log } = require 'kxk'

    forkfunc = (file, args..., callback) ->
        
        opts = parse file
        # log 'forkfunc', file, args, opts
        forkChild opts.file, opts.name, args, callback, false

    forkfunc.async = (file, args..., callback) ->
        
        opts = parse file
        forkChild opts.file, opts.name, args, callback, true

    forkChild = (file, name, args, callback, async) ->
        
        try
            cp = childp.fork __filename, stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            
            onExit = ->
                cp.removeListener 'message', onResult
                cp.removeListener 'exit',    onExit
                
            onResult = (msg) -> 
                result = JSON.parse msg
                callback result.err, result.result
                onExit()
                
            cp.on 'message', onResult
            cp.on 'exit',    onExit

            cp.send
                file:  file
                name:  name
                args:  args
                async: async

        catch err
            
            callback err, null
            
        cp

    parse = (file) ->
        
        if /^[.]?\.\//.test file
            stack = new Error().stack.split /\r\n|\n/
            file  = slash.join slash.dirname(/\((.*?):/.exec(stack[3])[1]), file

        name = null
        args = /(.*)::(.*)/.exec file
        if args and args.length
            file = args[1]
            name = args[2]

        file: file
        name: name

    module.exports = forkfunc

else

    #  0000000  000   000  000  000      0000000  
    # 000       000   000  000  000      000   000
    # 000       000000000  000  000      000   000
    # 000       000   000  000  000      000   000
    #  0000000  000   000  000  0000000  0000000

    { log 
    } = require 'kxk'
    
    sendResult = (err, result) ->
        
        process.removeListener 'message', callFunc
        process.send JSON.stringify err:err, result:result
        
    callFunc = (msg) ->
        
        try
            
            func = require msg.file
            func = func[msg.name] if msg.name
            msg.args.push ready if msg.async
            result = func.apply func, msg.args
            
        catch err
            
            sendResult err.stack
            return
                
        sendResult null, result if not msg.async        

    process.on 'message', callFunc
