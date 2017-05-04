
# 00000000  000   000  00000000   0000000  000   000  000000000  00000000
# 000        000 000   000       000       000   000     000     000     
# 0000000     00000    0000000   000       000   000     000     0000000 
# 000        000 000   000       000       000   000     000     000     
# 00000000  000   000  00000000   0000000   0000000      000     00000000

{ noon, str, post, error, log, _
}        = require 'kxk'
colors   = require 'colors'
coffee   = require 'coffee-script'
pty      = require 'node-pty'

class Execute
        
    constructor: (cfg={}) -> 
        @childp  = null
        @main    = cfg?.main
        @winID   = cfg?.winID
        @cmdID   = cfg?.cmdID
        @command = cfg?.command
        @cwd     = cfg?.cwd ? process.cwd()
        @rest    = ''
        @shell() if cfg?.winID
        if @command?
            @term cfg
        else if @main?
            @initCoffee()
    
    #  0000000   0000000   00000000  00000000  00000000  00000000
    # 000       000   000  000       000       000       000     
    # 000       000   000  000000    000000    0000000   0000000 
    # 000       000   000  000       000       000       000     
    #  0000000   0000000   000       000       00000000  00000000
    
    initCoffee: =>
        try
            post.on 'executeCoffee', @executeCoffee
            global.main = @main
            restoreCWD = process.cwd()
            process.chdir __dirname
            coffee.eval """                
                {str,clamp,fileExists,dirExists,resolve,unresolve,post,path,fs,_} = require 'kxk'
                coffee = require 'coffee-script'
                cri = require 'chrome-remote-interface'
                {max,min,abs,round,ceil,floor,sqrt,pow,exp,log10,sin,cos,tan,acos,asin,atan,PI,E} = Math
                {str,clamp,fileExists,dirExists,post,path,noon,fs,_,$} = require 'kxk'
                (global[r] = require r for r in ['colors', 'electron'])                    
                log = -> 
                    console.log.apply console, [].slice.call(arguments, 0)
                    if winID? then post.toWin winID, 'executeResult', [].slice.call(arguments, 0), cmdID
                error = -> 
                    console.log.apply console, ['[ERROR]'].concat [].slice.call(arguments, 0)
                    if winID? then post.toWin winID, 'executeResult', ['[ERROR]'].concat([].slice.call(arguments, 0)), cmdID
                browse = ->
                    if winID? then post.toWin.apply post, [winID, 'browseResult'].concat [].slice.call arguments, 0
                """
            process.chdir restoreCWD
        catch err
            error "Execute.initCoffee -- #{err}"
    
    execute: (code) ->
        try
            coffee.eval code
        catch err
            error "Execute.execute -- #{err}"
            error: err.toString()
            
    executeCoffee: (cfg) =>
        
        coffee.eval "winID = #{cfg.winID}"
        coffee.eval "cmdID = #{cfg.cmdID}"
        try
            result = @execute cfg.command
        catch err
            errMsg = "[ERROR] coffee command '#{cfg.command}' failed:" + str err
            log errMsg
            result = error:errMsg
        if not result?
            result = 'undefined'
        else if typeof(result) != 'object' or not result.error? and _.size(result) == 1
            result = str result
        post.toWin cfg.winID, 'executeResult', result, cfg.cmdID

    #  0000000  000   000  00000000  000      000    
    # 000       000   000  000       000      000    
    # 0000000   000000000  0000000   000      000    
    #      000  000   000  000       000      000    
    # 0000000   000   000  00000000  0000000  0000000
    
    shell: () =>
        @childp = pty.spawn '/usr/local/bin/bash', ['--init-file', "#{__dirname}/../bin/bash.sh"],
            name: 'xterm-color'
            cwd: @cwd
            env: process.env
            cols: 1000
        @childp.on 'data', @onShellData
      
    term: (cfg) =>
        @rest  = ''
        @cmdID = cfg?.cmdID
        @childp.write cfg.command + '\n'
        if cfg.command != 'pwd'
            @childp.write "echo ko_term_done #{@cmdID}\n"
        
    restartShell: =>
        @childp.destroy()
        @shell()
                
    onShellData: (data) =>
        oRest = @rest
        @rest = ''
        if not data.endsWith '\n'
            lastIndex = data.lastIndexOf '\n'
            if lastIndex < 0
                @rest = oRest+data
                return
            @rest = data.slice lastIndex+1
            data = data.slice 0, lastIndex        
        else 
            data = data.slice 0,data.length-2
        data = oRest+data    
        post.toWin @winID, 'shellCommandData', cmd: @cmdID, data: data

module.exports = Execute