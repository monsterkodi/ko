#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   
{
clamp,
sh,sw, 
prefs,
drag, 
last,
pos,
log,
$}    = require 'kxk'
_     = require 'lodash'
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
        @logVisible        = undefined
        
        @elem        = $('.split'      )
        @titlebar    = $('.titlebar'   )
        @topHandle   = $('.handle.top' )
        @editHandle  = $('.handle.edit')
        @logHandle   = $('.handle.log' )
        @terminal    = $('.terminal'   )
        @area        = $('.area'       )
        @commandline = $('.commandline')
        @editor      = $('.editor'     )
        @logview     = $('.logview'    )

        @splitPos    = [-@handleHeight,0,@elemHeight()]

        @handles     = [@topHandle, @editHandle, @logHandle]
        @panes       = [@terminal, @commandline, @editor, @logview]
                            
        @dragTop = new drag
            target: @topHandle
            cursor: 'ns-resize'
            onStop: (drag) => @snap()
            onMove: (drag) => @splitAt 0, drag.pos.y - @elemTop() - @handleHeight/2, animate:0
        
        @dragBot = new drag
            target: @editHandle
            cursor: 'ns-resize'
            onStop: (drag) => @snap()
            onMove: (drag) => @splitAt 1, drag.pos.y - @elemTop() - @handleHeight/2, animate:0
            
        @dragLog = new drag
            target: @logHandle
            cursor: 'ns-resize'
            onStop: (drag) => @snap()
            onMove: (drag) => 
                if @splitPosY(2)-@splitPosY(1) < 10
                    @splitAt 1, drag.pos.y - @elemTop() - @handleHeight/2, animate:0
                    @splitAt 2, drag.pos.y - @elemTop() - @handleHeight/2, animate:0
                else
                    @splitAt 2, drag.pos.y - @elemTop() - @handleHeight/2, animate:0

    #  0000000  00000000  000000000  000   000  000  000   000  000  0000000    
    # 000       000          000     000 0 000  000  0000  000  000  000   000  
    # 0000000   0000000      000     000000000  000  000 0 000  000  000   000  
    #      000  000          000     000   000  000  000  0000  000  000   000  
    # 0000000   00000000     000     00     00  000  000   000  000  0000000    
    
    setWinID: (@winID) ->
        # log 'setWinID', @winID
        @logVisible = false
        height = sh()-@titlebar.getBoundingClientRect().height
        @editor.style.height = "#{height}px"
        log '@editorHeight', @editorHeight()
        @splitPos = [-@handleHeight,0,height]
        @resized()
        s = @getState 'split', @splitPos
        @logVisible = s[2] < @elemHeight()
        display = @logVisible and 'inherit' or 'none'
        @logview.style.display = display
        @logHandle.style.display = display        
        @applySplit s

    #  0000000  00000000   000      000  000000000
    # 000       000   000  000      000     000   
    # 0000000   00000000   000      000     000   
    #      000  000        000      000     000   
    # 0000000   000        0000000  000     000   
    
    splitAt: (i, y, opt) -> 
        return if not @winID
        # log "Split.splitAt i:#{i} y:#{y}"
        s = []
        for h in [0...@handles.length]
            if h == i
                s.push y
            else
                s.push @splitPosY h
        
        if i == 0 then s[1] = s[0] + @commandlineHeight + @handleHeight
        if i == 1 then s[0] = s[1] - @commandlineHeight - @handleHeight
                
        @applySplit s, opt ? animate:200
    
    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000 
    # 000000000  00000000   00000000   000        00000  
    # 000   000  000        000        000         000   
    # 000   000  000        000        0000000     000   
        
    applySplit: (s, opt) ->
        return if not @winID
        # log "Split.applySplit s:#{s} opt:#{opt}"
        if opt?.animate
            emitSplit = => 
                @emit 'split', s
                @emitSplitFrame = window.requestAnimationFrame emitSplit
            @emitSplitFrame = window.requestAnimationFrame emitSplit
            resetTrans = => 
                p.style.transition = 'initial' for p in @panes
                @emit 'split', s
                window.cancelAnimationFrame @emitSplitFrame
            setTimeout resetTrans, opt.animate
        
        for i in [0...s.length]
            s[i] = clamp (i and s[i-1] or -@handleHeight), @elemHeight(), s[i]

        @handles[0].style.height = "#{clamp 0, @handleHeight, @handleHeight+s[0]}px"
            
        if not @logVisible
            s[2] = @elemHeight()
            
        @splitPos = _.clone s
        
        for h in [0...@panes.length]
            newHeight = Math.max 0, switch
                when h is 0 then s[0]
                when h is s.length then @logVisible and @elemHeight()-last(s)-@handleHeight or 0
                else s[h]-s[h-1]-@handleHeight

            if opt?.animate
                @panes[h].style.transition = "height #{opt.animate/1000}s" 
            else
                @panes[h].style.transition = "" 
                
            @panes[h].style.height = "#{newHeight}px" 
            
            if h == 3
                if newHeight > 0 
                    @setState 'logHeight', newHeight
                else
                    @setLogVisible false if @logVisible
                    
        @elem.scrollTop = 0
        @setState 'split', s
        @emit     'split', s
        
    # 00000000   00000000   0000000  000  0000000  00000000  0000000  
    # 000   000  000       000       000     000   000       000   000
    # 0000000    0000000   0000000   000    000    0000000   000   000
    # 000   000  000            000  000   000     000       000   000
    # 000   000  00000000  0000000   000  0000000  00000000  0000000  
    
    resized: => 
        return if not @winID
        height = sh()-@titlebar.getBoundingClientRect().height
        width  = sw()
        @elem.style.height = "#{height}px"
        @elem.style.width  = "#{width}px"
        s = []
        e = @editorHeight()
        log 'resized', width, height, @elemHeight(), e
        for h in [0...@handles.length]
            s.push clamp -@handleHeight, @elemHeight(), @splitPosY h
        if e == 0 and not @logVisible # keep editor closed
            s[1] = s[2] = @elemHeight()  
            s[0] = s[1] - @commandlineHeight - @handleHeight
        @applySplit s
    
    # 00000000    0000000    0000000          0000000  000  0000000  00000000
    # 000   000  000   000  000         0    000       000     000   000     
    # 00000000   000   000  0000000   00000  0000000   000    000    0000000 
    # 000        000   000       000    0         000  000   000     000     
    # 000         0000000   0000000          0000000   000  0000000  00000000
    
    elemTop:    -> @elem.getBoundingClientRect().top
    elemHeight: -> @elem.getBoundingClientRect().height - @handleHeight
    
    splitPosY:  (i) -> if i < @splitPos.length then @splitPos[i] else @elemHeight()
    paneHeight: (i) -> @panes[i].getBoundingClientRect().height
        
    terminalHeight: -> @paneHeight 0
    editorHeight:   -> @paneHeight 2
    logviewHeight:  -> @paneHeight 3
    
    hideTerminal:   -> @splitAt 0, 0
    hideEditor:     -> @splitAt 1, @elemHeight()
    
    commandlineVisible: -> @splitPosY(1)     > 0
    terminalVisible:    -> @terminalHeight() > 0 and @terminal.style.display != 'none'
    editorVisible:      -> @editorHeight()   > 0

    termEditHeight: -> @terminalHeight() + @commandlineHeight + @editorHeight()

    # 0000000     0000000 
    # 000   000  000   000
    # 000   000  000   000
    # 000   000  000   000
    # 0000000     0000000 
    
    do: (sentence) ->
        # log "do #{sentence}"
        sentence = sentence.trim()
        return if not sentence.length
        words = sentence.split /\s+/
        action = words[0]
        what = words[1]
        switch action
            when 'focus'    then return @focus what
            when 'reveal'   then return @reveal what
            when 'half'     then delta = @elemHeight()/2 - @splitPosY(0) - @handleHeight - 2
            when 'maximize' then delta = @elemHeight()
            when 'minimize' then delta = -@elemHeight()
            when 'enlarge'
                if words[2] == 'by'
                    delta = parseInt words[3]
                else
                    delta = parseInt 0.25 * @termEditHeight()
            when 'reduce'
                if words[2] == 'by'
                    delta = - parseInt words[3]
                else
                    delta = - parseInt 0.25 * @termEditHeight()
                    
        switch what
            when 'editor' then return @moveCommandLineBy -delta
            when 'terminal', 'area'
                @raise what
                @moveCommandLineBy delta if delta?
                return 
                
        alert "split.do warning! unhandled do command? #{sentence}?"
        throw new Error

    #  0000000  000   000   0000000   000   000  
    # 000       000   000  000   000  000 0 000  
    # 0000000   000000000  000   000  000000000  
    #      000  000   000  000   000  000   000  
    # 0000000   000   000   0000000   00     00  

    reveal: (n) -> @show n    
    show: (n) ->
        switch n
            when 'terminal', 'area' then @do "#{@paneHeight(0) < @termEditHeight()/2 and 'half' or 'raise'} #{n}"
            when 'editor'           then @splitAt 1, 0.5*@splitPosY 2 if @paneHeight(2) < 100
            when 'command'          then @splitAt 0, 0                if @paneHeight(1) < @commandlineHeight
            when 'logview'          then @showLog()
            else log "split.show warning! unhandled #{n}!"

    raise: (n) ->
        switch n
            when 'terminal'
                if @panes[0] != @terminal
                    @terminal.style.height  = @area.style.height                    
                    @area.style.display     = 'none'
                    @terminal.style.display = 'block'
                    @panes[0] = @terminal
            when 'area'
                if @panes[0] != @area
                    @area.style.height      = @terminal.style.height
                    @terminal.style.display = 'none'
                    @area.style.display     = 'block'
                    @panes[0] = @area

    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
    
    moveCommandLineBy: (delta) ->
        @splitAt 0, clamp 0, @elemHeight() - @commandlineHeight - @handleHeight, delta + @splitPosY 0       
        
    isCommandlineVisible: -> @splitPosY(1) > @commandlineHeight 
    
    hideCommandline: -> 
        @splitAt 1, 0, animate:0
        @emit 'commandline', 'hidden'
        
    showCommandline: -> 
        if 0 >= @splitPosY 1
            @splitAt 0, 0, animate:0
            @emit 'commandline', 'shown'

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
            if v and @logviewHeight() <= 0
                @splitAt 2, @elemHeight() - Math.max(100, @getState('logHeight', 200))-@handleHeight
            else if @logviewHeight() > 0 and not v
                @splitAt 2, @elemHeight()
            display = v and 'inherit' or 'none'
            @logview.style.display   = display
            @logHandle.style.display = display            
            window.logview.resized()
            
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
        if y0 < -@handleHeight
            @splitAt 0, -@handleHeight
        else if y1 < 0
            @splitAt 1, 0
        else if y1 > 0
            if y1 < (@commandlineHeight+@handleHeight)/2
                @splitAt 1, 0
            else if y1 <  (@commandlineHeight+@handleHeight)*2
                @splitAt 0, 0
            else if y1 > y2 - 40
                @splitAt 1, y2
        else if y2 > @elemHeight()
            @splitAt 2, @elemHeight()

    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    focus: (n) -> 
        if n[0] != '.'
            n  = n == 'commandline' and '.commandline-editor' or '.' + n
        $(n)?.focus()
            
    focusAnything: ->
        return @focus '.editor'   if @editorVisible()
        return @focus '.terminal' if @terminalVisible()
        @focus '.commandline-editor'
        
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
