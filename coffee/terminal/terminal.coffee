# 000000000  00000000  00000000   00     00  000  000   000   0000000   000    
#    000     000       000   000  000   000  000  0000  000  000   000  000    
#    000     0000000   0000000    000000000  000  000 0 000  000000000  000    
#    000     000       000   000  000 0 000  000  000  0000  000   000  000    
#    000     00000000  000   000  000   000  000  000   000  000   000  0000000

ViewBase  = require '../editor/viewbase'
Numbers   = require '../editor/numbers'
Scrollbar = require '../editor/scrollbar'
Minimap   = require '../editor/minimap'
ansihtml  = require '../tools/ansihtml'
log       = require '../tools/log'

class Terminal extends ViewBase

    constructor: (viewElem) ->
        
        @fontSizeDefault = 13
        
        super viewElem
        
        @scrollbar = new Scrollbar @
        @numbers   = new Numbers @
        @minimap   = new Minimap @        
        @ansihtml  = new ansihtml()        

    #  0000000   000   000  000000000  00000000   000   000  000000000
    # 000   000  000   000     000     000   000  000   000     000   
    # 000   000  000   000     000     00000000   000   000     000   
    # 000   000  000   000     000     000        000   000     000   
    #  0000000    0000000      000     000         0000000      000   

    output: (s) ->
        h = @ansihtml.toHtml s
        @appendText h
                
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendText: (text) ->
        
        tail = @cursorPos()[1] == @lines.length-1 and @cursors.length == 1
        # console.log "terminal.appendText #{tail} #{@lines.length}"
        super text
        if tail
            @singleCursorAtPos [0, @lines.length-1] 
            @scrollTo @scroll.fullHeight
            # console.log "terminal.appendText #{tail} #{@lines.length} #{@cursors}"
            
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