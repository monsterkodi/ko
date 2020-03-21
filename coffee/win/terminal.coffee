###
000000000  00000000  00000000   00     00  000  000   000   0000000   000    
   000     000       000   000  000   000  000  0000  000  000   000  000    
   000     0000000   0000000    000000000  000  000 0 000  000000000  000    
   000     000       000   000  000 0 000  000  000  0000  000   000  000    
   000     00000000  000   000  000   000  000  000   000  000   000  0000000
###

{ kerror, kpos, popup, post, stopEvent } = require 'kxk'

salt       = require '../tools/salt'
TextEditor = require '../editor/texteditor'
syntax     = require '../editor/syntax'

class Terminal extends TextEditor

    @: (viewElem) ->
        
        super viewElem, features: ['Scrollbar' 'Numbers' 'Minimap' 'Meta'], fontSize: 15
        
        @view.addEventListener "contextmenu" @onContextMenu
        
        @metaQueue = []
        
        @initInvisibles()
        @setLines ['']
                
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendLineDiss: (text, diss=[]) ->
        
        @syntax.setDiss @numLines(), diss if diss?.length
        tail = @cursorPos()[1] == @numLines()-1 and @numCursors() == 1
        @appendText text
        if tail
            @singleCursorAtPos [0, @numLines()-1] 
            @scroll.to @scroll.fullHeight
            
    appendDiss: (diss) -> @appendLineDiss syntax.lineForDiss(diss), diss        
    
    # 00     00  00000000  000000000   0000000 
    # 000   000  000          000     000   000
    # 000000000  0000000      000     000000000
    # 000 0 000  000          000     000   000
    # 000   000  00000000     000     000   000
    
    appendMeta: (meta) ->
        
        if not meta?
            return kerror 'Terminal.appendMeta -- no meta?'
            
        @meta.append meta
        
        if meta.diss?
            
            @appendLineDiss syntax.lineForDiss(meta.diss), meta.diss 
                        
        else if meta.clss == 'salt'
            
            @appendMeta clss: 'spacer'
            for l in salt(meta.text).split '\n'
                @appendMeta clss:'spacer' text:'# '+l
            @appendMeta clss: 'spacer'
            
        else if meta.clss == 'termCommand'
            
            @appendLineDiss meta.command, syntax.dissForTextAndSyntax meta.command, 'term'

        else if meta.text?
            
            @appendLineDiss meta.text
            
        else
            
            @appendLineDiss ''
        
    queueMeta: (meta) ->
        
        @metaQueue.push meta
        clearTimeout @metaTimer
        @metaTimer = setTimeout @dequeueMeta, 0
        
    dequeueMeta: =>
        
        count = 0
        while meta = @metaQueue.shift()
            @appendMeta meta
            count += 1
            break if count > 20
        clearTimeout @metaTimer
        @metaTimer = setTimeout @dequeueMeta, 0 if @metaQueue.length
           
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: ->
        @meta.clear()
        @singleCursorAtPos [0,0]
        super()

    # 00000000    0000000   00000000   000   000  00000000     
    # 000   000  000   000  000   000  000   000  000   000    
    # 00000000   000   000  00000000   000   000  00000000     
    # 000        000   000  000        000   000  000          
    # 000         0000000   000         0000000   000          

    onContextMenu: (event) => stopEvent event, @showContextMenu kpos event
              
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = kpos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [
            text:   'Clear'
            combo:  'alt+k' 
            cb:     @clear
        ,
            text:   'Close'
            combo:  'alt+ctrl+k'
            cb:     window.split.hideTerminal
        ]
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt
    
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboCharEvent: (mod, key, combo, char, event) ->
        
        return if 'unhandled' != super mod, key, combo, char, event
        
        switch combo
            when 'enter'
                if href = @meta.hrefAtLineIndex @cursorPos()[1]
                    post.emit 'loadFile' "#{href}" 
                return
            when 'ctrl+enter' 'command+enter'
                if href = @meta.hrefAtLineIndex @cursorPos()[1]
                    post.emit 'loadFile' "#{href}" 
                    window.editor.focus()
                return
            when 'ctrl+s' 'command+s'
                return if @meta.saveChanges()
            when 'esc'
                split = window.split
                split.focus 'commandline-editor'
                split.do    'enlarge editor'
                return
                
        'unhandled'

module.exports = Terminal
