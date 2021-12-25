// monsterkodi/kode 0.223.0

var _k_

var callFunc, forkfunc, sendResult

if (module.parent)
{
    forkfunc = function (file, ...args)
    {
        var callback, childp, cp, dirname, match, onExit, onResult, regx, slash, stack

        callback = args.pop()
        if (/^[.]?\.\//.test(file))
        {
            slash = require('kslash')
            stack = new Error().stack.split(/\r\n|\n/)
            regx = /\(([^\)]*)\)/
            match = regx.exec(stack[3])
            dirname = slash.dir(match[1])
            file = slash.join(dirname,file)
        }
        try
        {
            childp = require('child_process')
            cp = childp.fork(__filename)
            onExit = function ()
            {
                cp.removeListener('message',onResult)
                cp.removeListener('exit',onExit)
                if (cp.connected)
                {
                    cp.disconnect()
                }
                return cp.kill()
            }
            onResult = function (msg)
            {
                var result

                result = msg
                callback(result.err,result.result)
                return onExit()
            }
            cp.on('error',function (err)
            {
                return callback(err,null)
            })
            cp.on('message',onResult)
            cp.on('exit',onExit)
            cp.send({file:file,args:args})
        }
        catch (err)
        {
            callback(err,null)
        }
        return cp
    }
    module.exports = forkfunc
}
else
{
    sendResult = function (err, result)
    {
        process.removeListener('message',callFunc)
        return process.send({err:err,result:result},function ()
        {
            if (process.connected)
            {
                process.disconnect()
            }
            return process.exit(0)
        })
    }
    callFunc = function (msg)
    {
        var func, result

        try
        {
            func = require(msg.file)
            result = func.apply(func,msg.args)
            return sendResult(null,result)
        }
        catch (err)
        {
            return sendResult(err.stack)
        }
    }
    process.on('message',callFunc)
}