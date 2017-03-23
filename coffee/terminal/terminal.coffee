# 000000000  00000000  00000000   00     00  000  000   000   0000000   000    
#    000     000       000   000  000   000  000  0000  000  000   000  000    
#    000     0000000   0000000    000000000  000  000 0 000  000000000  000    
#    000     000       000   000  000 0 000  000  000  0000  000   000  000    
#    000     00000000  000   000  000   000  000  000   000  000   000  0000000
{
last
}         = require 'kxk'
salt      = require '../tools/salt'
log       = require '../tools/log'
ViewBase  = require '../editor/viewbase'
syntax    = require '../editor/syntax'
ansiDiss  = require '../tools/ansidiss'

class Terminal extends ViewBase

    constructor: (viewElem) ->
        
        @fontSizeDefault = 15
        @metaQueue = []
        
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap', 'Meta']

        @ansidiss = new ansiDiss()    
        
        @setLines @lines

    #  0000000   000   000  000000000  00000000   000   000  000000000
    # 000   000  000   000     000     000   000  000   000     000   
    # 000   000  000   000     000     00000000   000   000     000   
    # 000   000  000   000     000     000        000   000     000   
    #  0000000    0000000      000     000         0000000      000   

    output: (s) ->
        for l in s.split '\n'
            t = l.trim()
            if /ko_term_done/.test t
                if /^ko_term_done\s\d+$/.test t
                    cid = parseInt last t.split ' '
                    for meta in @meta.metas.reversed()
                        if meta[2].cmdID == cid
                            meta[2].span?.innerHTML = "■"
                            break
                continue
            skip = false
            for meta in @meta.metas.reversed()
                if meta[2].cmmd == t
                    meta[2].span?.innerHTML = '<i class="fa fa-cog fa-spin fa-1x fa-fw"></i>'
                    skip = true
                    break
            continue if skip
            [text,diss] = @ansidiss.dissect l
            @syntax.setDiss @lines.length, diss if diss?.length
            @appendText text
                
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendLineDiss: (text, diss=[]) ->
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
        if not meta?
            alert('no meta?')
            throw new Error
        @meta.append meta
        if meta.diss?
            @appendLineDiss syntax.lineForDiss(meta.diss), meta.diss 
        else if meta.clss == 'salt'
            @appendMeta clss: 'spacer'
            for l in salt(meta.text).split '\n'
                @appendMeta clss: 'spacer', diss: syntax.dissForTextAndSyntax l, 'ko'
            @appendMeta clss: 'spacer'
        else if meta.clss == 'termCommand'
            @appendLineDiss meta.cmmd
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
           
    clear: ->
        @meta.clear()
        super
            
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) ->
        return if 'unhandled' != super mod, key, combo, event
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
            when 'esc'
                split = window.split
                split.focus '.commandline-editor'
                split.do    'enlarge editor'
                return
                
        'unhandled'

module.exports = Terminal
