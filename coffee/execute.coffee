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
pty      = require 'pty.js'

class Execute
        
    constructor: (cfg={}) -> 
        @childp  = null
        @winID   = cfg?.winID
        @cmdID   = cfg?.cmdID
        @command = cfg?.command
        @cwd     = cfg?.cwd ? process.cwd()
        @rest    = ''
        if @command?
            @shell @command

    execute: (code) =>
        try
            return coffee.eval code
        catch e
            console.error colors.red.bold '[ERROR]', colors.red e

    shell: (command) =>
        @childp = pty.spawn '/usr/local/bin/bash', [], 
            name: 'xterm-color'
            cwd: @cwd
            env: process.env
        @childp.write command # + '\n'
        @childp.on 'data', @onShellData
        
    onShellData: (data) =>
        log "onShellData |#{data}|"
        data = @rest+data
        @rest = ''
        if not data.endsWith '\n'
            lastIndex = data.lastIndexOf '\n'
            log "lastIndex #{lastIndex}"
            if lastIndex < 0
                @rest += data
                return
            @rest = data.slice lastIndex+1
            data = data.slice 0, lastIndex        
            log "rest #{@rest}"
        else 
            data = data.slice 0,data.length-2
            
        electron.BrowserWindow.fromId(@winID).webContents.send 'shellCommandData', cmd: @cmdID, data: data

module.exports = Execute

