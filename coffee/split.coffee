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
pos,
error,
log,
$}    = require 'kxk'
_     = require 'lodash'
event = require 'events'
Flex  = require './tools/flex'

class Split extends event
    
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   
    
    constructor: () ->

        @commandlineHeight = 30
        @handleHeight      = 6
        
        @elem        =$ 'split'      
        @terminal    =$ 'terminal'   
        @area        =$ 'area'       
        @commandline =$ 'commandline'
        @editor      =$ 'editor'     
        @logview     =$ 'logview'    

        @flex = new Flex
            panes: [
                    div:        @terminal
                    collapsed:  true
                ,
                    div:        @commandline
                    fixed:      @commandlineHeight
                ,
                    div:        @editor
                ,
                    div:        @logview
                    collapsed:  true
            ]
            direction:  'vertical'
            handleSize: @handleHeight
            onDrag:     @onDrag
            onDragEnd:  @onDrag
            onPaneSize: @onDrag
        @onDrag()
        
    onDrag: =>
        if @flex?
            s = @flex.handlePositions()
            @setState 'split', s
            @emit 'split', s
                
    #  0000000  00000000  000000000  000   000  000  000   000  000  0000000    
    # 000       000          000     000 0 000  000  0000  000  000  000   000  
    # 0000000   0000000      000     000000000  000  000 0 000  000  000   000  
    #      000  000          000     000   000  000  000  0000  000  000   000  
    # 0000000   00000000     000     00     00  000  000   000  000  0000000    
    
    setWinID: (@winID) -> log 'setWinID', @winID

    #  0000000  00000000   000      000  000000000
    # 000       000   000  000      000     000   
    # 0000000   00000000   000      000     000   
    #      000  000        000      000     000   
    # 0000000   000        0000000  000     000   
    
    splitAt: (i, y, opt) -> 
        return if not @winID
        log "Split.splitAt i:#{i} y:#{y}"
    
    # 00000000   00000000   0000000  000  0000000  00000000  0000000  
    # 000   000  000       000       000     000   000       000   000
    # 0000000    0000000   0000000   000    000    0000000   000   000
    # 000   000  000            000  000   000     000       000   000
    # 000   000  00000000  0000000   000  0000000  00000000  0000000  
    
    resized: =>
        main =$ 'main'
        @elem.style.width = "#{sw()}px"
        @elem.style.height = "#{main.clientHeight}px"
        log "elem width #{@elem.style.width} height #{@elem.style.height}"
        @elem.scrollTop = 0
        @flex.resized()
        s = @flex.handlePositions()
        @setState 'split', s
        @emit 'split', s
    
    # 00000000    0000000    0000000          0000000  000  0000000  00000000
    # 000   000  000   000  000         0    000       000     000   000     
    # 00000000   000   000  0000000   00000  0000000   000    000    0000000 
    # 000        000   000       000    0         000  000   000     000     
    # 000         0000000   0000000          0000000   000  0000000  00000000
    
    elemTop:    -> @elem.getBoundingClientRect().top
    elemHeight: -> @elem.getBoundingClientRect().height - @handleHeight
    
    paneHeight: (i) -> @flex.getSizes()[i]
    splitPosY:  (i) -> @flex.positionOfHandleAtIndex i
        
    terminalHeight: -> @paneHeight 0
    editorHeight:   -> @paneHeight 2
    logviewHeight:  -> @paneHeight 3
    termEditHeight: -> @terminalHeight() + @commandlineHeight + @editorHeight()
    
    hideTerminal:   -> @flex.collapse 'terminal'
    hideEditor:     -> @flex.collapse 'editor'
    
    commandlineVisible: -> not @flex.isCollapsed 'commandline'
    terminalVisible:    -> not @flex.isCollapsed 'terminal'
    editorVisible:      -> not @flex.isCollapsed 'editor'

    # 0000000     0000000 
    # 000   000  000   000
    # 000   000  000   000
    # 000   000  000   000
    # 0000000     0000000 
    
    do: (sentence) ->
        # log "Split.do #{sentence}"
        sentence = sentence.trim()
        return if not sentence.length
        words = sentence.split /\s+/
        action = words[0]
        what = words[1]
        switch action
            when 'show'     then return @show what
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
                
        error "Split.do -- unhandled do command? #{sentence}?"

    #  0000000  000   000   0000000   000   000  
    # 000       000   000  000   000  000 0 000  
    # 0000000   000000000  000   000  000000000  
    #      000  000   000  000   000  000   000  
    # 0000000   000   000   0000000   00     00  

    reveal: (n) -> @show n    
    show: (n) ->
        log "Split.show #{n}"
        switch n
            when 'terminal', 'area' then @do "#{@paneHeight(0) < @termEditHeight()/2 and 'half' or 'raise'} #{n}"
            when 'editor'           then @flex.expand 'editor'
            when 'command'          then @flex.expand 'commandline'
            when 'logview'          then @showLog()
            else log "split.show warning! unhandled #{n}!"

    raise: (n) ->
        log "Split.raise #{n}"
        switch n
            when 'terminal'
                if @flex.panes[0].div != @terminal
                    @terminal.style.height  = @area.style.height                    
                    @area.style.display     = 'none'
                    @terminal.style.display = 'block'
                    @flex.panes[0].div = @terminal
            when 'area'
                if @flex.panes[0].div != @area
                    @area.style.height      = @terminal.style.height
                    @terminal.style.display = 'none'
                    @area.style.display     = 'block'
                    @flex.panes[0].div = @area
        @flex.expand n

    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
    
    moveCommandLineBy: (delta) ->
        @flex.panes[0].size += delta
        @flex.panes[2].size -= delta
        @flex.calculateSizes()
        
    hideCommandline: -> 
        @flex.collapse 'terminal'
        @flex.collapse 'commandline'
        @emit 'commandline', 'hidden'
        
    showCommandline: -> 
        @flex.expand 'commandline'
        @emit 'commandline', 'shown'

    # 000       0000000    0000000 
    # 000      000   000  000      
    # 000      000   000  000  0000
    # 000      000   000  000   000
    # 0000000   0000000    0000000 
    
    showLog:   -> @setLogVisible true
    hideLog:   -> @setLogVisible false
    toggleLog: -> @setLogVisible not @isLogVisible()
    isLogVisible: -> not @flex.isCollapsed 'logview'
    setLogVisible: (v) ->
        if @isLogVisible() != v
            if not v
                @flex.collapse 'logview'
            else
                @flex.expand 'logview'
            
    clearLog: -> window.logview.setText ""
    showOrClearLog: -> 
        if @isLogVisible()
            @clearLog()
        else
            @showLog()
     
    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    focus: (n) -> 
        if n[0] != '.'
            n = n == 'commandline' and 'commandline-editor' or n
        $(n)?.focus() if n != '.'
            
    focusAnything: ->
        return @focus 'editor'   if @editorVisible()
        return @focus 'terminal' if @terminalVisible()
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
