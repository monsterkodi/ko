###
 0000000  00000000   000      000  000000000
000       000   000  000      000     000   
0000000   00000000   000      000     000   
     000  000        000      000     000   
0000000   000        0000000  000     000   
###

{ post, error, log, $, _ } = require 'kxk'

event = require 'events'
Flex  = require './flex/flex'

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

        post.on 'focus',   @focus
        post.on 'stash',   @stash
        post.on 'restore', @restore

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
            snapFirst:  20
            snapLast:   100
            
    onDrag: => if @flex? then @emitSplit()
    emitSplit: => @emit 'split', @flex.panePositions() 
    
    stash: => window.stash.set 'split', @flex.getState()
    restore: => 

        @flex.restoreState window.stash.get 'split'
        @emitSplit()    
                
    # 0000000     0000000 
    # 000   000  000   000
    # 000   000  000   000
    # 000   000  000   000
    # 0000000     0000000 
    
    do: (sentence) ->
        
        # log "Split.do #{sentence}"
        
        sentence = sentence.trim()
        return if not sentence.length
        words  = sentence.split /\s+/
        action = words[0]
        what   = words[1]
        switch action
            when 'show'     then return @show  what
            when 'focus'    then return @focus what
            when 'half'     then pos   =  @flex.size()/2
            when 'third'    then pos   =  @flex.size()/3
            when 'quart'    then pos   =  @flex.size()/4
            when 'maximize' 
                if what == 'editor' then return @maximizeEditor()
                delta =  @flex.size()
            when 'minimize' 
                if what == 'editor' then return @minimizeEditor()
                delta = -@flex.size()
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
            else return error "Split.do -- unknown action '#{action}'"
                    
        switch what
            when 'editor' then return @moveCommandLineBy -delta
            when 'terminal', 'area', 'commandline'
                @raise what if what != 'commandline'
                if delta? then @moveCommandLineBy delta
                if pos? then @flex.moveHandleToPos @flex.handles[0], pos
                return 
                
        error "Split.do -- unhandled do command? #{sentence}?"

    maximizeEditor: -> 
        
        # log "Split.maximizeEditor"
        @focus 'editor'
        @flex.expand 'editor'
        @hideLog()
        @hideCommandline()
        @flex.resized()

    minimizeEditor: ->
        
        @showCommandline()
        @focus 'commandline'
        @flex.moveHandleToPos @flex.handles[1], @flex.size()
                
    #  0000000  000   000   0000000   000   000  
    # 000       000   000  000   000  000 0 000  
    # 0000000   000000000  000   000  000000000  
    #      000  000   000  000   000  000   000  
    # 0000000   000   000   0000000   00     00  

    show: (n) ->
        # log "Split.show #{n}"
        switch n
            when 'terminal', 'area' then @raise n
            when 'editor'     
                
                @flex.expand 'editor'
                if @editorHeight() < @flex.size()/3
                    if @flex.handles[1].pos() > @flex.size()/3
                        @flex.moveHandleToPos @flex.handles[1], @flex.size()/3
                    if @flex.handles[2].pos() < 2*@flex.size()/3
                        @flex.moveHandleToPos @flex.handles[2], 2*@flex.size()/3
                        
            when 'command'          then @flex.expand 'commandline'
            when 'logview'          then @showLog()
            else error "split.show -- unhandled: #{n}!"

    # 00000000    0000000   000   0000000  00000000  
    # 000   000  000   000  000  000       000       
    # 0000000    000000000  000  0000000   0000000   
    # 000   000  000   000  000       000  000       
    # 000   000  000   000  000  0000000   00000000  

    swap: (old, nju) ->
        
        if @flex.panes[0].div != nju
            nju.style.height   = "#{@flex.sizeOfPane 0}px"
            old.style.display  = 'none'
            nju.style.display  = 'block'
            @flex.panes[0].div = nju

    raise: (n) ->
        # log "Split.raise #{n}"   
        switch n
            when 'terminal' then @swap @area, @terminal
            when 'area'     then @swap @terminal, @area
            
        @flex.calculate()
        @flex.expand 'terminal', 0.33
        if @terminalHeight() < @flex.size()/2
            @flex.moveHandleToPos @flex.handles[0], @flex.size()/2

    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
    
    moveCommandLineBy: (delta) ->
        
        @flex.moveHandle index:1, pos:@flex.posOfHandle(1) + delta
        
    hideCommandline: -> 
        
        if not @flex.isCollapsed 'commandline'
            @flex.collapse 'terminal'
            @flex.collapse 'commandline'
            @emit 'commandline', 'hidden'
        
    showCommandline: ->
        
        if @flex.isCollapsed 'commandline'
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
        
        n = 'commandline-editor' if n == 'commandline'
        if n == '.' or not $(n)?
            return log "[WARNING] Split.focus -- can't find element '#{n}'"
        $(n)?.focus?()
            
    focusAnything: ->
        
        return @focus 'editor'   if @editorVisible()
        return @focus 'terminal' if @terminalVisible()
        @focus 'commandline-editor'

    # 00000000   00000000   0000000  000  0000000  00000000  0000000  
    # 000   000  000       000       000     000   000       000   000
    # 0000000    0000000   0000000   000    000    0000000   000   000
    # 000   000  000            000  000   000     000       000   000
    # 000   000  00000000  0000000   000  0000000  00000000  0000000  
    
    resized: =>
        
        main =$ 'main'
        @elem.style.width  = "#{main.clientWidth}px"
        @elem.style.height = "#{main.clientHeight}px"
        @flex.resized()
        @emitSplit()
    
    # 00000000    0000000    0000000          0000000  000  0000000  00000000
    # 000   000  000   000  000         0    000       000     000   000     
    # 00000000   000   000  0000000   00000  0000000   000    000    0000000 
    # 000        000   000       000    0         000  000   000     000     
    # 000         0000000   0000000          0000000   000  0000000  00000000
    
    elemHeight: -> @elem.getBoundingClientRect().height - @handleHeight
    
    splitPosY:  (i) -> @flex.posOfHandle i
    terminalHeight: -> @flex.sizeOfPane 0
    editorHeight:   -> @flex.sizeOfPane 2
    logviewHeight:  -> @flex.sizeOfPane 3
    termEditHeight: -> @terminalHeight() + @commandlineHeight + @editorHeight()
    
    hideTerminal:   -> @flex.collapse 'terminal'
    hideEditor:     -> @flex.collapse 'editor'
    
    commandlineVisible: -> not @flex.isCollapsed 'commandline'
    terminalVisible:    -> not @flex.isCollapsed 'terminal'
    editorVisible:      -> not @flex.isCollapsed 'editor'
        
module.exports = Split
