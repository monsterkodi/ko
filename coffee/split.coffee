#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   
{
clamp,
last,
$}    = require './tools/tools'
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
    
    constructor: () ->

        @commandlineHeight = 30
        @handleHeight      = 6
        
        @elem        = $('.split')
        @area        = $('.area')
        @titlebar    = $('.titlebar')
        @topPane     = $('.pane.top')
        @topHandle   = $('.handle.top')
        @commandline = $('.commandline')
        @editHandle  = $('.handle.edit')
        @editPane    = $('.pane.edit')
        @logHandle   = $('.handle.log')
        @logPane     = $('.pane.log')
        @editor      = $('.editor')

        @handles     = [@topHandle, @editHandle, @logHandle]
        @panes       = [@topPane, @commandline, @editPane, @logPane]
                            
        @logVisible = false
        @logPane.style.display = 'none'

        @dragTop = new drag
            target: @topHandle
            cursor: 'ns-resize'
            onStop: (drag) => @snap()
            onMove: (drag) => @splitAt 0, drag.pos.y - @elemTop()
        
        @dragBot = new drag
            target: @editHandle
            cursor: 'ns-resize'
            onStop: (drag) => @snap()
            onMove: (drag) => @splitAt 1, drag.pos.y - @elemTop()
            
        @dragLog = new drag
            target: @logHandle
            cursor: 'ns-resize'
            onStop: (drag) => @snap()
            onMove: (drag) => 
                # log "split.dragLog.move #{@paneHeight(2)} #{@splitPosY(2)-@splitPosY(1)}"
                if @splitPosY(2)-@splitPosY(1) < 10
                    @splitAt 1, drag.pos.y - @elemTop()
                    @splitAt 2, drag.pos.y - @elemTop()
                else
                    @splitAt 2, drag.pos.y - @elemTop()

    setWinID: (@winID) ->
        s = @getState 'split', [0,0,@elemHeight()-@handleHeight]        
        @setLogVisible @getState 'logVisible', false
        @applySplit s
    
    # 00000000   00000000   0000000  000  0000000  00000000  0000000  
    # 000   000  000       000       000     000   000       000   000
    # 0000000    0000000   0000000   000    000    0000000   000   000
    # 000   000  000            000  000   000     000       000   000
    # 000   000  00000000  0000000   000  0000000  00000000  0000000  
    
    resized: ->
        
        s = []
        e = @editorHeight()
        for h in [0...@handles.length]
            s.push clamp 0, @elemHeight(), @splitPosY h
        if e == 0 # keep editor closed
            s[1] = s[2] = @elemHeight()
            
        @applySplit s
    
    # 00000000    0000000    0000000          0000000  000  0000000  00000000
    # 000   000  000   000  000         0    000       000     000   000     
    # 00000000   000   000  0000000   00000  0000000   000    000    0000000 
    # 000        000   000       000    0         000  000   000     000     
    # 000         0000000   0000000          0000000   000  0000000  00000000
    
    elemTop:    -> @elem.getBoundingClientRect().top
    elemHeight: -> @elem.getBoundingClientRect().height
    splitPosY:  (i) -> 
        if i < @handles.length
            @handles[i].getBoundingClientRect().top - @elemTop()
        else
            @elemHeight()
            
    paneHeight: (i) -> 
        if i is 0 then @splitPosY 0
        else Math.max 0, @splitPosY(i)-@splitPosY(i-1)-@handleHeight
        
    terminalHeight: -> @paneHeight 0
    editorHeight:   -> @paneHeight 2
    logviewHeight:  -> @paneHeight 3
    
    terminalVisible: -> @terminalHeight() > 0
    hideTerminal:      -> @splitAt 0, 0
    commandlineVisible:  -> @splitPosY(1) > 0

    # 0000000     0000000 
    # 000   000  000   000
    # 000   000  000   000
    # 000   000  000   000
    # 0000000     0000000 
    
    do: (sentence) ->
        words = sentence.split ' '
        action = words[0]
        what = words[1]
        if what? and action in ['maximize', 'enlarge']
            switch action
                when 'maximize' then delta = @elemHeight()
                when 'enlarge'
                    if words[2] == 'by'
                        delta = parseInt words[3]
                    else
                        fh = @terminalHeight() + @commandlineHeight + @editorHeight()
                        delta = parseInt 0.25 * fh #- switch what
                            # when 'editor'   then @editorHeight()
                            # when 'terminal' then @terminalHeight()
                        
            switch what
                when 'editor'   then return @moveCommandLineBy -delta
                when 'terminal' then return @moveCommandLineBy  delta        
            
        log "split.do warning! unhandled do command? #{sentence}?"
        
    # 00     00   0000000   000   000  00000000   0000000  00     00  0000000  
    # 000   000  000   000  000   000  000       000       000   000  000   000
    # 000000000  000   000   000 000   0000000   000       000000000  000   000
    # 000 0 000  000   000     000     000       000       000 0 000  000   000
    # 000   000   0000000       0      00000000   0000000  000   000  0000000  
    
    moveCommandLineBy: (delta) ->
        @splitAt 0, clamp 0, @elemHeight() - @commandlineHeight - @handleHeight, delta + @splitPosY 0       
        
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
        # log "split.applySplit s", s
        if s[1] >= @commandlineHeight + @handleHeight
            s[0] = s[1] - @commandlineHeight - @handleHeight
        for i in [0...s.length]
            s[i] = clamp i and s[i-1] or 0, @elemHeight(), s[i]
            
        if not @logVisible
            s[2] = @elemHeight()
            
        paneHeights = (@paneHeight(i) for i in [0...@panes.length])
        
        # log "split.applySplit paneHeights", paneHeights
        
        paneHeightChanges = []
        for h in [0...@panes.length]
            prevY = h > 0 and s[h-1] or 0
            thisY = last s
            oldHeight = paneHeights[h]
            top = prevY+(h>0 and thisY>0 and @handleHeight or 0)
            @panes[h].style.top    = "#{top}px"
            @handles[h].style.top  = "#{s[h]}px" if h < s.length            
            newHeight = switch
                when h is 0 then s[0]
                when h is s.length then @elemHeight()-last(s)-@handleHeight
                else Math.max 0, s[h]-s[h-1]-@handleHeight

            # log "split.applySplit h #{h} newHeight #{newHeight}"
            if newHeight != oldHeight
                if h == @panes.length-1
                    @logPane.style.top = "#{@elemHeight()-newHeight}px"
                else
                    @panes[h].style.height = "#{newHeight}px"
                paneHeightChanges.push
                    paneIndex: h
                    oldHeight: oldHeight
                    newHeight: newHeight

        for phc in paneHeightChanges
            if phc.paneIndex == 3
                @setLogVisible phc.newHeight > 0
                if phc.newHeight > 0
                    @setState 'logHeight', phc.newHeight
            
            @emit 'paneHeight', phc
            
        @emit 'split', s
        
        @setState 'split', s
        
    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
    
    hideCommandline: -> @splitAt 1, 0
    showCommandline: -> 
        if 0 >= @splitPosY 1
            @splitAt 0, 0
    
    show: (n) ->
        # log "split.show #{n}"
        switch n
            when 'terminal' then @splitAt 0, 0.5*@splitPosY 2 if @paneHeight(0) < 100
            when 'editor'   then @splitAt 1, 0.5*@splitPosY 2 if @paneHeight(2) < 100
            when 'command'  then @splitAt 0, 0                if @paneHeight(1) < @commandlineHeight
            else
                log "split.show warning! unhandled #{n}!"

    # 000       0000000    0000000 
    # 000      000   000  000      
    # 000      000   000  000  0000
    # 000      000   000  000   000
    # 0000000   0000000    0000000 
    
    showLog:   -> @setLogVisible true
    hideLog:   -> @setLogVisible false
    toggleLog: -> @setLogVisible not @logVisible
    setLogVisible: (v) ->
        
        if @logVisible != v
            @logVisible = v
            @setState 'logVisible', v
            @logPane.style.display = v and 'initial' or 'none'
            if v and @logviewHeight() <= 0
                @splitAt 2, @elemHeight() - Math.max(100, @getState('logHeight', 200))-@handleHeight
            else if @logviewHeight() > 0 and not v
                @splitAt 2, @elemHeight()
            
    clearLog: -> window.logview.setText ""
    showOrClearLog: -> 
        if @logVisible
            @clearLog()
        else
            @showLog()
     
    #  0000000  000   000   0000000   00000000 
    # 000       0000  000  000   000  000   000
    # 0000000   000 0 000  000000000  00000000 
    #      000  000  0000  000   000  000      
    # 0000000   000   000  000   000  000      
    
    snap: ->
        y0 = @splitPosY 0
        y1 = @splitPosY 1
        y2 = @splitPosY 2
        if y0 < 0 
            @splitAt 0, 0
        else if y1 > 0
            if y1 < (@commandlineHeight+@handleHeight)/2
                @splitAt 1, 0
            else if y1 <  (@commandlineHeight+@handleHeight)*2
                @splitAt 0, 0
            else if y1 > @splitPosY(2) - 40
                @splitAt 1, @splitPosY(2)
        else if y2 > @elemHeight()
            @splitAt 2, @elemHeight()

    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    focus: (n) -> $(n)?.focus()
        
    reveal: (n) -> @show n
        
    #  0000000  000000000   0000000   000000000  00000000
    # 000          000     000   000     000     000     
    # 0000000      000     000000000     000     0000000 
    #      000     000     000   000     000     000     
    # 0000000      000     000   000     000     00000000
            
    setState: (key, value) ->
        if @winID
            prefs.set "windows:#{@winID}:#{key}", value
        
    getState: (key, value) ->
        if @winID
            prefs.get "windows:#{@winID}:#{key}", value
        else
            value

module.exports = Split