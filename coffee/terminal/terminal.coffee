# 000000000  00000000  00000000   00     00  000  000   000   0000000   000    
#    000     000       000   000  000   000  000  0000  000  000   000  000    
#    000     0000000   0000000    000000000  000  000 0 000  000000000  000    
#    000     000       000   000  000 0 000  000  000  0000  000   000  000    
#    000     00000000  000   000  000   000  000  000   000  000   000  0000000

ViewBase  = require '../editor/viewbase'
Numbers   = require '../editor/numbers'
Scrollbar = require '../editor/scrollbar'
Minimap   = require '../editor/minimap'
syntax    = require '../editor/syntax'
ansiDiss  = require '../tools/ansidiss'
log       = require '../tools/log'

class Terminal extends ViewBase

    constructor: (viewElem) ->
        
        @fontSizeDefault = 15
        
        super viewElem
        
        @scrollbar = new Scrollbar @
        @numbers   = new Numbers @
        @minimap   = new Minimap @        
        @ansidiss  = new ansiDiss()    
        
        @setLines @lines   

    #  0000000   000   000  000000000  00000000   000   000  000000000
    # 000   000  000   000     000     000   000  000   000     000   
    # 000   000  000   000     000     00000000   000   000     000   
    # 000   000  000   000     000     000        000   000     000   
    #  0000000    0000000      000     000         0000000      000   

    output: (s) -> 
        for l in s.split '\n'
            [t,d] = @ansidiss.dissect l
            @appendLineDiss t, d
                
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendLineDiss: (text, diss=[]) ->
        # log "terminal.appendLineDiss #{@lines.length}: #{text} diss #{diss.length}" if diss.length

        @syntax.setDiss @lines.length, diss if diss?.length
        
        tail = @cursorPos()[1] == @lines.length-1 and @cursors.length == 1

        @appendText text
                
        if tail
            @singleCursorAtPos [0, @lines.length-1] 
            @scrollTo @scroll.fullHeight
            
    appendDiss: (diss) -> @appendLineDiss syntax.lineForDiss(diss), diss        
            
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  

    changed: (changeInfo) ->        
        
        super changeInfo
        @minimap?.changed changeInfo
        
        if changeInfo.deleted.length or changeInfo.inserted.length
            @scroll.setNumLines @lines.length
            
        if changeInfo.cursor.length
            @renderCursors()

            if delta = @deltaToEnsureCursorsAreVisible()
                @scrollBy delta * @size.lineHeight - @scroll.offsetSmooth 
                
module.exports = Terminal