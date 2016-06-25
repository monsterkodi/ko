# 000       0000000    0000000   000   000  000  00000000  000   000
# 000      000   000  000        000   000  000  000       000 0 000
# 000      000   000  000  0000   000 000   000  0000000   000000000
# 000      000   000  000   000     000     000  000       000   000
# 0000000   0000000    0000000       0      000  00000000  00     00
{
$}        = require '../tools/tools'
ViewBase  = require '../editor/viewbase'
log       = require '../tools/log'

class LogView extends ViewBase

    constructor: (viewElem) ->
        
        @fontSizeDefault = 12
        
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap']
        
        @setLines @lines
                
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendText: (text) ->
        
        tail = @cursorPos()[1] == @lines.length-1 and @cursors.length == 1
        # console.log "logview.appendText #{tail} #{@lines.length}"
        super text
        if tail
            @singleCursorAtPos [0, @lines.length-1] 
            @scrollTo @scroll.fullHeight
            # console.log "logview.appendText #{tail} #{@lines.length} #{@cursors}"
            
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
                
module.exports = LogView