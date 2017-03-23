# 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
# 0000  000  000   000  000   000  000  000        000   000     000     000     
# 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
# 000  0000  000   000     000     000  000   000  000   000     000     000     
# 000   000  000   000      0      000   0000000   000   000     000     00000000
{
clamp,
last
}        = require 'kxk'
log      = require './tools/log'
_        = require 'lodash'
electron = require 'electron'

ipc           = electron.ipcRenderer
BrowserWindow = electron.BrowserWindow

class Navigate
    
    constructor: (@main) ->
        
        return if not @main?
        @filePositions = []
        @currentIndex = -1
        @navigating = false
 
    #  0000000    0000000  000000000  000   0000000   000   000
    # 000   000  000          000     000  000   000  0000  000
    # 000000000  000          000     000  000   000  000 0 000
    # 000   000  000          000     000  000   000  000  0000
    # 000   000   0000000     000     000   0000000   000   000

    action: (opt) =>
        switch opt.action

            when 'backward'
                return if not @filePositions.length
                @currentIndex = clamp 0, @filePositions.length-1, (@filePositions.length + @currentIndex-1) % @filePositions.length
                @navigating = true
                @navigateToFilePos @filePositions[@currentIndex], opt
                
            when 'forward'
                return if not @filePositions.length
                @currentIndex = clamp 0, @filePositions.length-1, (@currentIndex+1) % @filePositions.length
                @navigating = true
                @navigateToFilePos @filePositions[@currentIndex], opt
                                
            when 'addFilePos'
                return if not opt?.file?.length
                # log "navigate.action addFilePos @currentIndex #{@currentIndex} #{@navigating}", opt
                hasFile = _.find @filePositions, (v) -> v.file == opt.file
                if opt?.for in ['edit', 'goto'] or not @navigating or not hasFile
                    @navigating = false if opt?.for in ['edit', 'goto']
                    if @currentIndex != @filePositions.length-1
                        @filePositions = @filePositions.slice(@currentIndex).concat @filePositions.slice 0, @currentIndex 
                        
                    @filePositions = @filePositions.filter (filePos) -> not (filePos.file == opt.file and Math.abs(filePos.pos[1] - opt.pos[1]) < 2)
                    @filePositions.push 
                        file: opt.file
                        pos:  opt.pos  
                    @currentIndex = @filePositions.length-1
                    if opt?.for == 'goto'
                        @navigateToFilePos @filePositions[@currentIndex], opt
                    else
                        @currentIndex = @filePositions.length

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000     
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
    # 000  0000  000   000     000     000  000   000  000   000     000     000     
    # 000   000  000   000      0      000   0000000   000   000     000     00000000
    
    navigateToFilePos: (filePos, opt) ->
        id = @main.activateWindowWithFile filePos.file
        if id?
            @main.winWithID(id).webContents.send 'singleCursorAtPos', filePos.pos, opt.select
        else
            if opt?.newWindow
                @main.loadFile "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
            else if opt?.winID?
                win = @main.winWithID opt.winID
                win?.webContents.send 'loadFile', "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
        filePos
    
    #  0000000   0000000    0000000          00000000  000  000      00000000        00000000    0000000    0000000
    # 000   000  000   000  000   000        000       000  000      000             000   000  000   000  000     
    # 000000000  000   000  000   000        000000    000  000      0000000         00000000   000   000  0000000 
    # 000   000  000   000  000   000        000       000  000      000             000        000   000       000
    # 000   000  0000000    0000000          000       000  0000000  00000000        000         0000000   0000000 
    
    addFilePos: (opt) -> # called from window on editing
        opt.action = 'addFilePos'
        opt.for = 'edit'
        ipc.send 'navigate', opt
        
    gotoFilePos: (opt) -> # called from window jumpTo
        opt.action = 'addFilePos'
        opt.for = 'goto'
        ipc.send 'navigate', opt

    backward: () -> ipc.send 'navigate', action: 'backward', winID: window.winID
    forward:  () -> ipc.send 'navigate', action: 'forward' , winID: window.winID
                
module.exports = Navigate
