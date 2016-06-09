#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   

{
$,sw,sh
}     = require './tools/tools'
log   = require './tools/log'
pos   = require './tools/pos'
drag  = require './tools/drag'
prefs = require './tools/prefs'
 
class Split

    @commandlineHeight = 30
    @titlebarHeight    = 23
    @handleHeight      = 6
    
    @init: (wid) ->
        
        @winID = wid
                
        @dragBot = new drag
            target: $('.split-handle.bot')
            cursor: 'ns-resize'
            onMove: (drag) => @splitAt drag.cpos.y
            onStop: (drag) => @snap()

        @dragTop = new drag
            target: $('.split-handle.top')
            cursor: 'ns-resize'
            onMove: (drag) => @splitAt drag.cpos.y + 40
            onStop: (drag) => @snap()
    
        @splitAt @getState 'split', @titlebarHeight
    
    @resized: ->
        @dragTop.setMinMax pos(0, @titlebarHeight), pos(0, sh()-@commandlineHeight-2*@handleHeight)
        @dragBot.setMinMax pos(0, @titlebarHeight), pos(0, sh()-@handleHeight)        
        if @dragBot.target.getBoundingClientRect().bottom > sh()
            @splitAt sh()-@handleHeight
    
    @splitAt: (y) ->
        $('.split-top')         .style.height = "#{y-@commandlineHeight}px"
        $('.split-handle.top' ) .style.top = "#{y-@commandlineHeight-@handleHeight}px"
        $('.commandline')       .style.top = "#{y-@commandlineHeight}px"
        $('.split-handle.bot' ) .style.top = "#{y-2}px"
        $('.split-bot')         .style.top = "#{y+@handleHeight-2}px"
        @dragTop.setMinMax pos(0, @titlebarHeight), pos(0, sh()-@commandlineHeight-2*@handleHeight)
        @dragBot.setMinMax pos(0, @titlebarHeight), pos(0, sh()-@handleHeight)
        @setState 'split', y

    @showCommandline: ->
        if @dragTop.target.getBoundingClientRect().top < 0
            @splitAt @titlebarHeight+@commandlineHeight+@handleHeight

    @hideCommandline: ->
        if @dragBot.target.getBoundingClientRect().top > @titlebarHeight
            @splitAt @titlebarHeight+2
        
    @snap: ->
        log 'snap'
        t = @dragBot.target.getBoundingClientRect().top
        if t > @titlebarHeight
            if t < @titlebarHeight+(@commandlineHeight+@handleHeight)/2
                @splitAt @titlebarHeight+2
            else if t <  @titlebarHeight+(@commandlineHeight+@handleHeight)*2
                @splitAt @titlebarHeight+@commandlineHeight+@handleHeight

    @focusOnEditorOrHistory: ->
        @focusOnEditor()
        
    @focusOnEditor: ->
        @hideCommandline()
        $('.editor').focus()

    #  0000000  000000000   0000000   000000000  00000000
    # 000          000     000   000     000     000     
    # 0000000      000     000000000     000     0000000 
    #      000     000     000   000     000     000     
    # 0000000      000     000   000     000     00000000
            
    @setState: (key, value) ->
        if @winID
            prefs.setPath "windows.#{@winID}.#{key}", value
        
    @getState: (key, value) ->
        if @winID
            prefs.getPath "windows.#{@winID}.#{key}", value

module.exports = Split