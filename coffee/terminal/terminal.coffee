# 000000000  00000000  00000000   00     00  000  000   000   0000000   000    
#    000     000       000   000  000   000  000  0000  000  000   000  000    
#    000     0000000   0000000    000000000  000  000 0 000  000000000  000    
#    000     000       000   000  000 0 000  000  000  0000  000   000  000    
#    000     00000000  000   000  000   000  000  000   000  000   000  0000000

ViewBase  = require '../editor/viewbase'
syntax    = require '../editor/syntax'
ansiDiss  = require '../tools/ansidiss'
salt      = require '../tools/salt'
log       = require '../tools/log'

class Terminal extends ViewBase

    constructor: (viewElem) ->
        
        @fontSizeDefault = 15
        
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap', 'Meta']

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
    
    # 00     00  00000000  000000000   0000000 
    # 000   000  000          000     000   000
    # 000000000  0000000      000     000000000
    # 000 0 000  000          000     000   000
    # 000   000  00000000     000     000   000
    
    appendMeta: (meta) -> 
        @meta.append meta
        if meta.diss?
            @appendLineDiss syntax.lineForDiss(meta.diss), meta.diss 
        else if meta.clss == 'salt'
            @appendMeta clss: 'spacer'
            for l in salt(meta.text).split '\n'
                @appendMeta clss: 'spacer', diss: syntax.dissForTextAndSyntax l, 'ko'
            @appendMeta clss: 'spacer'
        else
            @appendLineDiss ''
           
    clear: ->
        @meta.clear()
        super
            
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) ->
        
        switch combo
            when 'enter'
                if href = @meta.hrefAtLineIndex @cursorPos()[1]
                    window.loadFile "#{href}" 
                return
            when 'command+enter'
                if href = @meta.hrefAtLineIndex @cursorPos()[1]
                    window.loadFile "#{href}" 
                    window.editor.focus()
                return
            when 'command+s'
                return if @meta.saveChanges()
                
        return 'unhandled'
                
module.exports = Terminal