###
 0000000  00000000   000      000  000000000
000       000   000  000      000     000   
0000000   00000000   000      000     000   
     000  000        000      000     000   
0000000   000        0000000  000     000   
###

{ post, kerror, $ } = require 'kxk'

Flex = require './flex/flex'

class Split
    
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   
    
    @: ->

        @commandlineHeight = 30
        @handleHeight      = 6
        
        @elem        =$ 'split'
        @terminal    =$ 'terminal'
        @browser     =$ 'browser'
        @commandline =$ 'commandline'
        @editor      =$ 'editor'

        post.on 'focus'   @focus
        post.on 'stash'   @stash
        post.on 'restore' @restore

        @flex = new Flex
            panes: [
                    div:        @terminal
                    collapsed:  true
                ,
                    div:        @commandline
                    fixed:      @commandlineHeight
                ,
                    div:        @editor
            ]
            direction:  'vertical'
            handleSize: @handleHeight
            onDrag:     @onDrag
            onDragEnd:  @onDrag
            onPaneSize: @onDrag
            snapFirst:  20
            snapLast:   100
            
    onDrag: => if @flex? then @emitSplit()
    
    emitSplit: => post.emit 'split' @flex.panePositions()
    
    #  0000000  000000000   0000000    0000000  000   000  
    # 000          000     000   000  000       000   000  
    # 0000000      000     000000000  0000000   000000000  
    #      000     000     000   000       000  000   000  
    # 0000000      000     000   000  0000000   000   000  
    
    stash: => 
        
        window.stash.set 'split|flex' @flex.getState()
        window.stash.set 'split|browser' @flex.panes[0].div == @browser
        
    restore: => 

        if state = window.stash.get 'split|flex'
            @flex.restoreState state
            @emitSplit()
        else
            @do 'maximize editor'
            
        if @flex.panes[0].div != @browser and window.stash.get 'split|browser'
            @raise 'browser'
                
    # 0000000     0000000 
    # 000   000  000   000
    # 000   000  000   000
    # 000   000  000   000
    # 0000000     0000000 
    
    do: (sentence) ->
        
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
            when 'terminal', 'browser', 'commandline'
                @raise what if what != 'commandline'
                if delta? then @moveCommandLineBy delta
                if pos? then @flex.moveHandleToPos @flex.handles[0], pos
                return 
                
        error "Split.do -- unhandled do command? #{sentence}?"

    maximizeEditor: -> 
        
        @focus 'editor'
        @flex.expand 'editor'
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

        switch n
            when 'terminal' 'browser' then @raise n
            when 'editor'     
                
                @flex.expand 'editor'
                if @editorHeight() < @flex.size()/3
                    if @flex.handles[1]?.pos() > @flex.size()/3
                        @flex.moveHandleToPos @flex.handles[1], @flex.size()/3
                    if @flex.handles[2]?.pos() < 2*@flex.size()/3
                        @flex.moveHandleToPos @flex.handles[2], 2*@flex.size()/3
                        
            when 'command' then @flex.expand 'commandline'
            else error "split.show -- unhandled: #{n}!"

    hideEditor:     => @flex.collapse 'editor'
    hideTerminal:   => @flex.collapse 'terminal'
            
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

        switch n
            when 'terminal' then @swap @browser, @terminal
            when 'browser'  then @swap @terminal, @browser
            
        @flex.calculate()

        if n == 'editor'
            if @editorHeight() < @flex.size()/8
                @flex.moveHandleToPos @flex.handles[0], 3*@flex.size()/4
        else
            if @terminalHeight() < @flex.size()/8
                @flex.moveHandleToPos @flex.handles[0], @flex.size()/4

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
            post.emit 'commandline', 'hidden'
        
    showCommandline: ->
        
        if @flex.isCollapsed 'commandline'
            @flex.expand 'commandline'
            post.emit 'commandline', 'shown'

    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    focus: (n) ->
        
        n = 'commandline-editor' if n == 'commandline'
        if n == '.' or not $(n)?
            return kerror "Split.focus -- can't find element '#{n}'"
            
        window.setLastFocus n if $(n)?.focus?
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
    termEditHeight: -> @terminalHeight() + @commandlineHeight + @editorHeight()
        
    commandlineVisible: -> not @flex.isCollapsed 'commandline'
    terminalVisible:    -> not @flex.isCollapsed 'terminal'
    editorVisible:      -> not @flex.isCollapsed 'editor'
        
module.exports = Split
