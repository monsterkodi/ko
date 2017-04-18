# 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
# 0000  000  000   000  000   000  000  000        000   000     000     000     
# 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
# 000  0000  000   000     000     000  000   000  000   000     000     000     
# 000   000  000   000      0      000   0000000   000   000     000     00000000

{ clamp, post, log, _
} = require 'kxk'

class Navigate
    
    constructor: (@main) ->
        
        return if not @main? # this is not very obvious
        
        post.on 'navigate', @action
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
        # log 'navigateToFilePos', filePos, id, opt
        if id?
            post.toWin id, 'singleCursorAtPos', filePos.pos, extend:opt.extend
        else
            if opt?.newWindow
                @main.loadFile "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
            else if opt?.winID?
                post.toWin opt.winID, 'loadFile', "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
        filePos
    
    #  0000000   0000000    0000000          00000000  000  000      00000000        00000000    0000000    0000000
    # 000   000  000   000  000   000        000       000  000      000             000   000  000   000  000     
    # 000000000  000   000  000   000        000000    000  000      0000000         00000000   000   000  0000000 
    # 000   000  000   000  000   000        000       000  000      000             000        000   000       000
    # 000   000  0000000    0000000          000       000  0000000  00000000        000         0000000   0000000 
    
    addFilePos: (opt) -> # called from window on editing
        opt.action = 'addFilePos'
        opt.for = 'edit'
        post.toMain 'navigate', opt
        
    gotoFilePos: (opt) -> # called from window jumpTo
        opt.action = 'addFilePos'
        opt.for = 'goto'
        post.toMain 'navigate', opt

    backward: () -> post.toMain 'navigate', action: 'backward', winID: window.winID
    forward:  () -> post.toMain 'navigate', action: 'forward' , winID: window.winID
                
module.exports = Navigate
