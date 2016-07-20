# 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
# 0000  000  000   000  000   000  000  000        000   000     000     000     
# 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
# 000  0000  000   000     000     000  000   000  000   000     000     000     
# 000   000  000   000      0      000   0000000   000   000     000     00000000
{last
}        = require './tools/tools'
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
 
    #  0000000    0000000  000000000  000   0000000   000   000
    # 000   000  000          000     000  000   000  0000  000
    # 000000000  000          000     000  000   000  000 0 000
    # 000   000  000          000     000  000   000  000  0000
    # 000   000   0000000     000     000   0000000   000   000

    action: (opt) =>
        switch opt.action
            
            when 'backward'
                return if not @filePositions.length or @currentIndex == 0
                @currentIndex -= 1
                filePos = @filePositions[@currentIndex]
                @navigateToFilePos filePos, opt
                
            when 'forward'
                return if not @filePositions.length or @currentIndex == @filePositions.length-1
                @currentIndex += 1
                filePos = @filePositions[@currentIndex]
                @navigateToFilePos filePos, opt
                                
            when 'gotoFilePos'
                @filePositions = @filePositions.filter (filePos) -> not (filePos.file == opt.file and filePos.pos[1] == opt.pos[1])
                @filePositions.push 
                    file: opt.file
                    pos:  opt.pos
                    
                @currentIndex = @filePositions.length-1
                @navigateToFilePos @filePositions[@currentIndex], opt

            when 'addFilePos'
                @filePositions = @filePositions.filter (filePos) -> not (filePos.file == opt.file and filePos.pos[1] == opt.pos[1])
                @filePositions.push 
                    file: opt.file
                    pos:  opt.pos
                    
                @currentIndex = @filePositions.length-1

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000     
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
    # 000  0000  000   000     000     000  000   000  000   000     000     000     
    # 000   000  000   000      0      000   0000000   000   000     000     00000000
    
    navigateToFilePos: (filePos, opt) ->
        id = @main.activateWindowWithFile filePos.file
        if id?
            @main.winWithID(id).webContents.send 'singleCursorAtPos', filePos.pos
        else
            if opt?.newWindow
                @main.loadFile "#{filePos.file}:#{filePos.pos[1]}:#{filePos.pos[0]}"
        filePos
    
    #  0000000   0000000    0000000          00000000  000  000      00000000        00000000    0000000    0000000
    # 000   000  000   000  000   000        000       000  000      000             000   000  000   000  000     
    # 000000000  000   000  000   000        000000    000  000      0000000         00000000   000   000  0000000 
    # 000   000  000   000  000   000        000       000  000      000             000        000   000       000
    # 000   000  0000000    0000000          000       000  0000000  00000000        000         0000000   0000000 
    
    addFilePos: (opt) -> # called from window on editing
        opt.action = 'addFilePos'
        ipc.send 'navigate', opt
        
    gotoFilePos: (opt) -> # called from window jumpTo
        opt.action = 'gotoFilePos'
        r = ipc.sendSync 'navigate', opt
        if r? and r.file? and r.pos?
            window.openFile r.file
            window.editor.singleCursorAtPos r.pos
        else
            alert("wrong file pos? #{r}")
            throw new Error

    backward: () -> ipc.send 'navigate', action: 'backward'
    forward:  () -> ipc.send 'navigate', action: 'forward'
                
module.exports = Navigate
