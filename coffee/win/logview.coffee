
# 000       0000000    0000000   000   000  000  00000000  000   000
# 000      000   000  000        000   000  000  000       000 0 000
# 000      000   000  000  0000   000 000   000  0000000   000000000
# 000      000   000  000   000     000     000  000       000   000
# 0000000   0000000    0000000       0      000  00000000  00     00

{ post, log } = require 'kxk'

TextEditor = require '../editor/texteditor'

class LogView extends TextEditor

    constructor: (viewElem) ->
        
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap'], fontSize: 12
        
        @syntaxName = 'logview'
        
        @setLines ['']
        
        post.on 'error', (text) ->
            if post.get 'debugMode'
                window.split.do 'show logview'
                
        post.on 'slog', (text) =>
            @appendText text
            post.toMain 'winlog', window.winID, text
        # log 'happy logging!'
                
    #  0000000   00000000   00000000   00000000  000   000  0000000    
    # 000   000  000   000  000   000  000       0000  000  000   000  
    # 000000000  00000000   00000000   0000000   000 0 000  000   000  
    # 000   000  000        000        000       000  0000  000   000  
    # 000   000  000        000        00000000  000   000  0000000    
                
    appendText: (text) =>
        
        tail = @cursorPos()[1] == @numLines()-1 and @numCursors() == 1
        super text
        if tail
            @singleCursorAtPos [0, @numLines()-1] 
            @scroll.to @scroll.fullHeight

    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    clickAtPos: (p, event) ->
        
        @jumpToFileAtPos p
        
        super p, event
            
module.exports = LogView
