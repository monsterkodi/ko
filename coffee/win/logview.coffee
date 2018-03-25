###
000       0000000    0000000   000   000  000  00000000  000   000
000      000   000  000        000   000  000  000       000 0 000
000      000   000  000  0000   000 000   000  0000000   000000000
000      000   000  000   000     000     000  000       000   000
0000000   0000000    0000000       0      000  00000000  00     00
###

{ popup, post, pos, log } = require 'kxk'

electron   = require 'electron'
TextEditor = require '../editor/texteditor'

class LogView extends TextEditor

    constructor: (viewElem) ->
        
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap'], fontSize: 12, syntaxName: 'logview'
        
        @view.addEventListener "contextmenu", @onContextMenu
                
        @setLines ['']
        
        post.on 'error', (text) ->
            if post.get 'debugMode'
                window.split.do 'show logview'
                
        post.on 'slog', (text) =>
            @appendText text
            # post.toMain 'winlog', window.winID, text
                
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
        
    # 00000000    0000000   00000000   000   000  00000000     
    # 000   000  000   000  000   000  000   000  000   000    
    # 00000000   000   000  00000000   000   000  00000000     
    # 000        000   000  000        000   000  000          
    # 000         0000000   000         0000000   000          

    onContextMenu: (event) => @showContextMenu pos event
              
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = pos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [
            text:   'Clear'
            combo:  'alt+k' 
            cb:     @clear
        ,
            text:   'Close'
            combo:  'alt+ctrl+k'
            cb:     window.split.hideLog
        ]
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt
        
module.exports = LogView
