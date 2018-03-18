###
000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
0000  000  000   000  000   000  000  000        000   000     000     000
000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
000  0000  000   000     000     000  000   000  000   000     000     000
000   000  000   000      0      000   0000000   000   000     000     00000000
###

{ clamp, slash, prefs, post, log, _ } = require 'kxk'

class Navigate

    constructor: (@main) ->

        return if not @main? # not very obvious: this is instantiated in main and window processes

        post.onGet 'navigate', @onGet
        post.on 'navigate', @navigate
        @filePositions = []
        @currentIndex = -1
        @navigating = false

    # 00     00   0000000   000  000   000
    # 000   000  000   000  000  0000  000
    # 000000000  000000000  000  000 0 000
    # 000 0 000  000   000  000  000  0000
    # 000   000  000   000  000  000   000

    onGet: (key) => @[key]

    addToHistory: (file, pos) ->
        
        return if not @main
        
        if file and pos
            
            _.pullAllWith @filePositions, [file:file, pos:pos], (a,b) ->
                return a.file == b.file
            
            filePos = slash.tilde slash.joinFilePos file, pos
            @filePositions.push
                file:   file
                pos:    pos
                line:   pos[1]+1
                column: pos[0]
                name:   filePos
                text:   slash.basename filePos
    
        while @filePositions.length > prefs.get 'navigateHistoryLength', 10
            @filePositions.shift()
                
    navigate: (opt) =>

        switch opt.action

            when 'clear'
                @filePositions = []
                @currentIndex = -1

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

            when 'delFilePos'
                _.pullAllWith @filePositions, [opt.item], (a,b) -> 
                    pull = a.file == b.file and a.line == b.line and a.column == b.column
                    pull

            when 'addFilePos'
                
                return if not opt?.file?.length
                
                # log 'add', @navigating, opt.file, opt.oldFile
                
                @addToHistory opt.oldFile, opt.oldPos
                                
                hasFile = _.find @filePositions, (v) -> v.file == opt.file
                
                if opt?.for in ['edit', 'goto'] or not @navigating or not hasFile
                    
                    @navigating = false if opt?.for in ['edit', 'goto']
                    
                    # if @currentIndex != @filePositions.length-1
                        # @filePositions = @filePositions.slice(@currentIndex).concat @filePositions.slice 0, @currentIndex

                    # @filePositions = @filePositions.filter (filePos) ->
                        # not (filePos.file == opt.file and Math.abs(filePos.pos[1] - opt.pos[1]) < 2)

                    @addToHistory opt.file, opt.pos
                    # filePos = slash.tilde slash.joinFilePos opt.file, opt.pos
                    # @filePositions.push
                        # file:   opt.file
                        # pos:    opt.pos
                        # line:   opt.pos[1]+1
                        # column: opt.pos[0]
                        # name:   filePos
                        # text:   slash.basename filePos
                                                
                    @currentIndex = @filePositions.length-1
                    
                    # log 'addFilePos', @filePositions[@currentIndex]
                    
                    if opt?.for == 'goto'
                        @loadFilePos @filePositions[@currentIndex], opt
                    else
                        @currentIndex = @filePositions.length
                        
                    post.toWins 'navigateHistoryChanged', @filePositions, @currentIndex
                    
    loadFilePos: (filePos, opt) ->

        if opt?.newWindow
            post.toMain 'newWindowWithFile', "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
        else
            error 'no winID?' if not opt?.winID?
            post.toWin opt.winID, 'loadFile', "#{filePos.file}:#{filePos.pos[1]+1}:#{filePos.pos[0]}"
        filePos

    # 000   000  000  000   000
    # 000 0 000  000  0000  000
    # 000000000  000  000 0 000
    # 000   000  000  000  0000
    # 00     00  000  000   000

    # these are called in window process

    delFilePos: (item) -> 
        post.toMain 'navigate', action:'delFilePos', winID: window.winID, item:item

    addFilePos: (opt) -> # called on editing
        log 'addFilePos', opt.file
        opt.action = 'addFilePos'
        opt.for = 'edit'
        post.toMain 'navigate', opt

    gotoFilePos: (opt) -> # called on jumpTo
        log 'gotoFilePos', opt.file
        opt.action = 'addFilePos'
        opt.for = 'goto'
        post.toMain 'navigate', opt

    backward: () -> post.toMain 'navigate', action: 'backward', winID: window.winID
    forward:  () -> post.toMain 'navigate', action: 'forward',  winID: window.winID
    clear:    () -> post.toMain 'navigate', action: 'clear',    winID: window.winID

module.exports = Navigate
