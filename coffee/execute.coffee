#00000000  000   000  00000000   0000000  000   000  000000000  00000000
#000        000 000   000       000       000   000     000     000     
#0000000     00000    0000000   000       000   000     000     0000000 
#000        000 000   000       000       000   000     000     000     
#00000000  000   000  00000000   0000000   0000000      000     00000000

noon     = require 'noon'
colors   = require 'colors'
coffee   = require 'coffee-script'
electron = require 'electron'
log      = require './tools/log'
str      = require './tools/str'
pty      = require 'pty.js'

class Execute
        
    constructor: (cfg={}) -> 
        
        @main    = cfg?.main
        
        @childp  = null
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
            global.main = @main
            coffee.eval """
                str    = require './js/tools/str'
                _      = require 'lodash'
                coffee = require 'coffee-script'
                {sqrt,pow,sin,cos,PI} = Math
                (global[r] = require r for r in ['path', 'fs', 'noon', 'colors', 'electron'])                    
                ipc           = electron.ipcMain
                BrowserWindow = electron.BrowserWindow
                log = -> BrowserWindow.fromId(winID).webContents.send 'executeResult', [].slice.call(arguments, 0), cmdID
                """
        catch e
            console.error colors.red.bold '[ERROR]', colors.red e
    
    execute: (code) =>
        try
            coffee.eval code
        catch e
            console.error colors.red.bold '[ERROR]', colors.red e
            error: e.toString()
            
    executeCoffee: (cfg) => 
        coffee.eval "winID = #{cfg.winID}"
        coffee.eval "cmdID = #{cfg.cmdID}"
        result = @execute cfg.command
        result = str(result) if not result.error?
        # log "send result #{result} to #{cfg.winID}"
        @main.winWithID(cfg.winID).webContents.send 'executeResult', result, cfg.cmdID

    #  0000000  000   000  00000000  000      000    
    # 000       000   000  000       000      000    
    # 0000000   000000000  0000000   000      000    
    #      000  000   000  000       000      000    
    # 0000000   000   000  00000000  0000000  0000000
    
    shell: (command) =>
        @childp = pty.spawn '/usr/local/bin/bash', ['-i'], 
            name: 'xterm-color'
            cwd: @cwd
            env: process.env
        @childp.on 'data', @onShellData
      
    # 000000000  00000000  00000000   00     00
    #    000     000       000   000  000   000
    #    000     0000000   0000000    000000000
    #    000     000       000   000  000 0 000
    #    000     00000000  000   000  000   000
        
    term: (cfg) =>
        @rest    = ''
        @cmdID   = cfg?.cmdID
        @childp.write cfg.command + '\n'
        
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
        electron.BrowserWindow.fromId(@winID).webContents.send 'shellCommandData', cmd: @cmdID, data: data

module.exports = Execute
