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
                @navigateToFilePos filePos
                
            when 'forward'
                return if not @filePositions.length or @currentIndex == @filePositions.length-1
                @currentIndex += 1
                filePos = @filePositions[@currentIndex]
                @navigateToFilePos filePos
                
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
    
    navigateToFilePos: (filePos) ->
        id = @main.activateWindowWithFile filePos.file
        id = @main.newWindowWithFile filePos.file if not id?
        @main.winWithID(id).send 'singleCursorAtPos', filePos.pos if id?
    
    #  0000000   0000000    0000000          00000000  000  000      00000000        00000000    0000000    0000000
    # 000   000  000   000  000   000        000       000  000      000             000   000  000   000  000     
    # 000000000  000   000  000   000        000000    000  000      0000000         00000000   000   000  0000000 
    # 000   000  000   000  000   000        000       000  000      000             000        000   000       000
    # 000   000  0000000    0000000          000       000  0000000  00000000        000         0000000   0000000 
    
    addFilePos: (opt) -> # called from window on editing
        opt.action = 'addFilePos'
        ipc.send 'navigate', opt

    backward: () -> ipc.send 'navigate', action: 'backward'
    forward:  () -> ipc.send 'navigate', action: 'forward'
                
module.exports = Navigate
