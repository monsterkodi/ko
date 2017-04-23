# 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
# 0000  000  000   000  000   000  000  000        000   000     000     000     
# 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
# 000  0000  000   000     000     000  000   000  000   000     000     000     
# 000   000  000   000      0      000   0000000   000   000     000     00000000

{ clamp, post, log, _
} = require 'kxk'

class Navigate
    
    constructor: (@main) ->
        
        return if not @main? # not very obvious: this is instantiated in main and window processes
        
        post.on 'navigate', @navigate
        @filePositions = []
        @currentIndex = -1
        @navigating = false
        
    # 00     00   0000000   000  000   000    
    # 000   000  000   000  000  0000  000    
    # 000000000  000000000  000  000 0 000    
    # 000 0 000  000   000  000  000  0000    
    # 000   000  000   000  000  000   000    
 
    navigate: (opt) =>
        
        switch opt.action

            when 'backward'
                return if not @filePositions.length
                @currentIndex = clamp 0, @filePositions.length-1, (@filePositions.length + @currentIndex-1) % @filePositions.length
                @navigating = true
                @loadFilePos @filePositions[@currentIndex], opt
                
            when 'forward'
                return if not @filePositions.length
                @currentIndex = clamp 0, @filePositions.length-1, (@currentIndex+1) % @filePositions.length
                @navigating = true
                @loadFilePos @filePositions[@currentIndex], opt
                                
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
                        @loadFilePos @filePositions[@currentIndex], opt
                    else
                        @currentIndex = @filePositions.length

    loadFilePos: (filePos, opt) ->
        # log 'loadFilePos', opt
        if opt?.newWindow
            post.toMain 'newWindowWithFile', "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
        else
            # if not opt.sameWindow                
                # if id = @main.activateWindowWithFile filePos.file
                    # post.toWin id, 'singleCursorAtPos', filePos.pos, extend:opt.extend
                    # return filePos
            error 'no winID?' if not opt?.winID?
            post.toWin opt.winID, 'loadFile', "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
        filePos

    # 000   000  000  000   000    
    # 000 0 000  000  0000  000    
    # 000000000  000  000 0 000    
    # 000   000  000  000  0000    
    # 00     00  000  000   000    
        
    # these are called in window process

    addFilePos: (opt) -> # called on editing
        opt.action = 'addFilePos'
        opt.for = 'edit'
        post.toMain 'navigate', opt
        
    gotoFilePos: (opt) -> # called on jumpTo
        opt.action = 'addFilePos'
        opt.for = 'goto'
        post.toMain 'navigate', opt

    backward: () -> post.toMain 'navigate', action: 'backward', winID: window.winID
    forward:  () -> post.toMain 'navigate', action: 'forward' , winID: window.winID
                
module.exports = Navigate
