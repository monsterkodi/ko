if module.parent

    # 00     00   0000000   000  000   000
    # 000   000  000   000  000  0000  000
    # 000000000  000000000  000  000 0 000
    # 000 0 000  000   000  000  000  0000
    # 000   000  000   000  000  000   000

    CP   = require 'child_process'
    Path = require 'path'

    forkfunc = (path, args..., callback) ->
        
        opts = parse path
        call opts.path, opts.name, args, callback, false

    forkfunc.async = (path, args..., callback) ->
        
        opts = parse path
        call opts.path, opts.name, args, callback, true

    call = (path, name, args, callback, async) ->
        
        try

            onMessage = (msg) ->
                
                if msg.error
                    msg.error = JSON.parse msg.error

                callback msg.error, msg.result

            onError = (err) -> callback err

            onExit = () ->
                cp.removeListener 'message'     , onMessage
                cp.removeListener 'error'       , onError
                cp.removeListener 'exit'        , onExit

            cp = CP.fork __filename, stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            cp.on 'message', onMessage
            cp.on 'error'  , onError
            cp.on 'exit'   , onExit

            cp.send
                path:  path
                name:  name
                args:  args
                async: async

        catch err
            callback err, null
            
        cp

    parse = (path) ->
        
        if /^[.]?\.\//.test path
            stack = new Error().stack.split /\r\n|\n/
            path  = Path.join Path.dirname(/\((.*?):/.exec(stack[3])[1]), path

        name = null
        args = /(.*)::(.*)/.exec path
        if args and args.length
            path = args[1]
            name = args[2]

        path: path
        name: name

    module.exports = forkfunc

else

    #  0000000  000   000  000  000      0000000  
    # 000       000   000  000  000      000   000
    # 000       000000000  000  000      000   000
    # 000       000   000  000  000      000   000
    #  0000000  000   000  000  0000000  0000000

    call = (msg) ->
        
        try
            
            func = require msg.path
            func = func[msg.name] if msg.name
            msg.args.push ready if msg.async
            result = func.apply null, msg.args
            ready null, result if not msg.async
            
        catch error
            
            ready JSON.stringify
                name:    error.name
                message: error.message
                stack:   error.stack
                
        null

    ready = (error, result) ->
        
        process.removeListener 'message', call
        process.send
            error:  error
            result: result

    process.on 'message', call

