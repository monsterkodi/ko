#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   

{ post, prefs, error, log, $, _
}     = require 'kxk'
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

        post.on 'focus', @focus

        @flex = new Flex
            panes: [
                    div:        @terminal
                    collapsed:  true
                ,
                    div:        @commandline
                    fixed:      @commandlineHeight
                    collapsed:  true
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
        @onDrag()
        
    onDrag: => if @flex? then @emit 'split', @flex.panePositions()
                
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
            when 'half'     then pos = @flex.size()/2
            when 'third'    then pos = @flex.size()/3
            when 'quart'    then pos = @flex.size()/4
            when 'maximize' then delta = @flex.size()
            when 'minimize' then delta = -@flex.size()
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
            when 'terminal', 'area'
                @raise what
                if delta? then @moveCommandLineBy delta
                if pos? then @flex.moveHandleToPos @flex.handles[0], pos
                return 
                
        error "Split.do -- unhandled do command? #{sentence}?"

    maximizeEditor: -> 
        @focus 'editor'
        @flex.expand 'editor'
        @hideLog()
        @hideCommandline()
        @flex.resized()

    #  0000000  000   000   0000000   000   000  
    # 000       000   000  000   000  000 0 000  
    # 0000000   000000000  000   000  000000000  
    #      000  000   000  000   000  000   000  
    # 0000000   000   000   0000000   00     00  

    show: (n) ->
        switch n
            when 'terminal', 'area' then @raise n
            when 'editor'           then @flex.expand 'editor'
            when 'command'          then @flex.expand 'commandline'
            when 'logview'          then @showLog()
            else error "split.show -- unhandled: #{n}!"

    # 00000000    0000000   000   0000000  00000000  
    # 000   000  000   000  000  000       000       
    # 0000000    000000000  000  0000000   0000000   
    # 000   000  000   000  000       000  000       
    # 000   000  000   000  000  0000000   00000000  
    
    raise: (n) ->

        swap = (old, nju) =>
            if @flex.panes[0].div != nju
                nju.style.height   = "#{@flex.sizeOfPane 0}px"
                nju.style.width    = old.style.width
                old.style.display  = 'none'
                nju.style.display  = 'block'
                @flex.panes[0].div = nju
                @flex.calculate()
                
        switch n
            when 'terminal' then swap @area, @terminal
            when 'area'     then swap @terminal, @area
            
        @flex.expand 'terminal', 0.33

    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
    
    moveCommandLineBy: (delta) ->
        @flex.moveHandle index:1, pos:@flex.posOfHandle(1) + delta
        
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
        n = 'commandline-editor' if n == 'commandline'
        if n == '.' or not $(n)?
            return error "Split.focus -- can't find element '#{n}'"
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
        @elem.style.width = "#{main.clientWidth}px"
        @elem.style.height = "#{main.clientHeight}px"
        @flex.resized()
        @emit 'split', @flex.panePositions()
    
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
