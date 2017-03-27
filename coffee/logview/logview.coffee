# 000       0000000    0000000   000   000  000  00000000  000   000
# 000      000   000  000        000   000  000  000       000 0 000
# 000      000   000  000  0000   000 000   000  0000000   000000000
# 000      000   000  000   000     000     000  000       000   000
# 0000000   0000000    0000000       0      000  00000000  00     00
{
post,
$}        = require 'kxk'
ViewBase  = require '../editor/viewbase'

class LogView extends ViewBase

    constructor: (viewElem) ->
        @fontSizeDefault = 12
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap']
        @setLines @lines
        post.on 'log', @appendText
                
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendText: (text) =>
        
        tail = @cursorPos()[1] == @lines.length-1 and @cursors.length == 1
        super text
        if tail
            @singleCursorAtPos [0, @lines.length-1] 
            @scrollTo @scroll.fullHeight
            
module.exports = LogView
