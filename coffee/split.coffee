#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   
{
$,
clamp,
last
}     = require './tools/tools'
log   = require './tools/log'
pos   = require './tools/pos'
drag  = require './tools/drag'
prefs = require './tools/prefs'
event = require 'events'
 
class Split extends event
    
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   
    
    constructor: (wid) ->

        @commandlineHeight = 30
        @handleHeight      = 6
        
        @winID       = wid
        @elem        = $('.split')
        @topHandle   = $('.split-handle.top')
        @botHandle   = $('.split-handle.bot')
        @logHandle   = $('.split-handle.log')
        @topView     = $('.split-top')
        @botView     = $('.split-bot')
        @logView     = $('.split-log')
        @commandLine = $('.commandline')
        @editor      = $('.editor')

        @handles     = [@topHandle, @botHandle, @logHandle]
        @panes       = [@topView, @commandLine, @botView, @logView]
                
        @logVisible = @getState 'logVisible', false
        if @logVisible
            @logView.style.display = 'initial'
        else
            @logView.style.display = 'none'

        @dragTop = new drag
            target: @topHandle
            cursor: 'ns-resize'
            onMove: (drag) => @splitAt 0, drag.cpos.y - @elemTop()
            onStop: (drag) => @snap()
        
        @dragBot = new drag
            target: @botHandle
            cursor: 'ns-resize'
            onMove: (drag) => @splitAt 1, drag.cpos.y - @elemTop()
            onStop: (drag) => @snap()

        @dragLog = new drag
            target: @logHandle
            cursor: 'ns-resize'
            onMove: (drag) => @splitAt 2, drag.cpos.y - @elemTop()
            onStop: (drag) => @snap()

        @constrainDrag()
    
        @applySplit @getState 'split', [0,0,@elemHeight()-@handleHeight]
    
    # 00000000   00000000   0000000  000  0000000  00000000  0000000  
    # 000   000  000       000       000     000   000       000   000
    # 0000000    0000000   0000000   000    000    0000000   000   000
    # 000   000  000            000  000   000     000       000   000
    # 000   000  00000000  0000000   000  0000000  00000000  0000000  
    
    resized: ->
        return if not @dragTop
        
        @constrainDrag()
                
        s = []
        for h in [0...@handles.length]
            s.push clamp 0, @elemHeight(), @splitPosY h
            
        @applySplit s
    
    #  0000000   0000000   000   000   0000000  000000000  00000000    0000000   000  000   000
    # 000       000   000  0000  000  000          000     000   000  000   000  000  0000  000
    # 000       000   000  000 0 000  0000000      000     0000000    000000000  000  000 0 000
    # 000       000   000  000  0000       000     000     000   000  000   000  000  000  0000
    #  0000000   0000000   000   000  0000000      000     000   000  000   000  000  000   000
    
    constrainDrag: ->
        @dragTop.setMinMax pos(0, @elemTop()), pos(0, @elemTop()+@elemHeight()-@commandlineHeight-@handleHeight)
        @dragBot.setMinMax pos(0, @elemTop()), pos(0, @elemTop()+@elemHeight())
        @dragLog.setMinMax pos(0, @elemTop()), pos(0, @elemTop()+@elemHeight())
        
    # 00000000    0000000    0000000          0000000  000  0000000  00000000
    # 000   000  000   000  000         0    000       000     000   000     
    # 00000000   000   000  0000000   00000  0000000   000    000    0000000 
    # 000        000   000       000    0         000  000   000     000     
    # 000         0000000   0000000          0000000   000  0000000  00000000
    
    elemTop:    -> @elem.getBoundingClientRect().top
    elemHeight: -> @elem.getBoundingClientRect().height
    splitPosY:  (i) -> @handles[i].getBoundingClientRect().top - @elemTop()
    paneHeight: (i) -> @panes[i].getBoundingClientRect().height
    
    #  0000000  00000000   000      000  000000000
    # 000       000   000  000      000     000   
    # 0000000   00000000   000      000     000   
    #      000  000        000      000     000   
    # 0000000   000        0000000  000     000   
    
    splitAt: (i, y) ->        
        s = []
        for h in [0...@handles.length]
            if h == i
                s.push y
                if i == 1
                    s[0] = Math.max(0,y - @commandlineHeight - @handleHeight)
            else if i == 0 and h == 1
                s.push s[0] + @commandlineHeight + @handleHeight
            else
                s.push @splitPosY h

        @applySplit s
    
    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000 
    # 000000000  00000000   00000000   000        00000  
    # 000   000  000        000        000         000   
    # 000   000  000        000        0000000     000   
        
    applySplit: (s) ->
        
        if s[1] >= @commandlineHeight + @handleHeight
            s[0] = s[1] - @commandlineHeight - @handleHeight
        for i in [1...s.length]
            s[i] = clamp s[i-1], @elemHeight(), s[i]
            
        if @logVisible
            @setState 'logHeight', s[2]
        else
            s[2] = @elemHeight()
            
        for h in [0...s.length]
            prevY = h > 0 and s[h-1] or 0
            thisY = s[h]
            # oldHeight = parseInt(@panes[h].style.height)
            oldHeight = @panes[h].getBoundingClientRect().height
            @panes[h].style.top    = "#{prevY+(thisY>0 and @handleHeight or 0)}px"
            @handles[h].style.top  = "#{s[h]}px"            
            # log "split.applySplit #{thisY} - #{prevY} - #{@handleHeight}"
            newHeight = thisY-prevY-@handleHeight
            # log "split.applySplit #{oldHeight} #{newHeight}"
            if newHeight != oldHeight
                @panes[h].style.height = "#{newHeight}px"
                @emit 'paneHeight', 
                    paneIndex: h
                    oldHeight: oldHeight
                    newHeight: newHeight
        
        if @logVisible
            @logView.style.top = "#{last(s)+@handleHeight}px"
            
        @setState 'split', s
        
    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
    
    showCommandline: -> @splitAt 0, 0
    hideCommandline: -> @splitAt 1, 0
    
    # 000       0000000    0000000 
    # 000      000   000  000      
    # 000      000   000  000  0000
    # 000      000   000  000   000
    # 0000000   0000000    0000000 
    
    showLog:   -> @setLogVisible true
    hideLog:   -> @setLogVisible false    
    toggleLog: -> @setLogVisible not @logVisible    
    setLogVisible: (v) ->
        @logVisible = v
        @setState 'logVisible', v
        @logView.style.display = v and 'initial' or 'none'
        @splitAt 2, @elemHeight() - (v and Math.max(100, @getState('logHeight', 200)) or 0)
        
    clearLog: -> $('.logview').innerHTML = ""
     
    #  0000000  000   000   0000000   00000000 
    # 000       0000  000  000   000  000   000
    # 0000000   000 0 000  000000000  00000000 
    #      000  000  0000  000   000  000      
    # 0000000   000   000  000   000  000      
    
    snap: ->
        y1 = @splitPosY 1
        if y1 > 0
            if y1 < (@commandlineHeight+@handleHeight)/2
                @splitAt 1, 0
            else if y1 <  (@commandlineHeight+@handleHeight)*2
                @splitAt 0, 0

    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    focusOnEditorOrHistory: ->
        @focusOnEditor()
        
    focusOnEditor: ->
        @hideCommandline()
        @focusEditor()
        
    focusEditor: ->
        @editor.focus()

    #  0000000  000000000   0000000   000000000  00000000
    # 000          000     000   000     000     000     
    # 0000000      000     000000000     000     0000000 
    #      000     000     000   000     000     000     
    # 0000000      000     000   000     000     00000000
            
    setState: (key, value) ->
        if @winID
            prefs.setPath "windows.#{@winID}.#{key}", value
        
    getState: (key, value) ->
        if @winID
            prefs.getPath "windows.#{@winID}.#{key}", value

module.exports = Split