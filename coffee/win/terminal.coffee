###
000000000  00000000  00000000   00     00  000  000   000   0000000   000    
   000     000       000   000  000   000  000  0000  000  000   000  000    
   000     0000000   0000000    000000000  000  000 0 000  000000000  000    
   000     000       000   000  000 0 000  000  000  0000  000   000  000    
   000     00000000  000   000  000   000  000  000   000  000   000  0000000
###

{ reversed, stopEvent, prefs, pos, popup, childp, empty, error, log, _  } = require 'kxk'

salt       = require '../tools/salt'
TextEditor = require '../editor/texteditor'
syntax     = require '../editor/syntax'
ansiDiss   = require '../tools/ansidiss'

class Terminal extends TextEditor

    constructor: (viewElem) -> 
        
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap', 'Meta'], fontSize: 15
        
        @view.addEventListener "contextmenu", @onContextMenu
        
        @metaQueue = []
        
        @initInvisibles()
        @ansidiss = new ansiDiss()    
        @setLines ['']

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
                    cid = parseInt _.last t.split ' '
                    for meta in reversed @meta.metas
                        if meta[2].cmdID == cid
                            meta[2].span?.innerHTML = "■"
                            break
                continue
            skip = false
            for meta in reversed @meta.metas
                if meta[2].command == t 
                    if t != 'pwd'
                        spinningCog = '<i class="fa fa-cog fa-spin fa-1x fa-fw"></i>'
                        meta[2].span?.innerHTML = spinningCog
                        stopSpin = ->
                            if meta[2].span?.innerHTML == spinningCog
                                meta[2].span?.innerHTML = '<i class="fa fa-cog fa-1x fa-fw"></i>'
                        setTimeout stopSpin, 3000
                    skip = true
                    break
            continue if skip
            [text,diss] = @ansidiss.dissect l
            @syntax.setDiss @numLines(), diss if diss?.length
            @appendText text
                
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
            return error 'Terminal.appendMeta -- no meta?'
            
        @meta.append meta
        
        if meta.diss?
            
            @appendLineDiss syntax.lineForDiss(meta.diss), meta.diss 
                        
        else if meta.clss == 'salt'
            
            @appendMeta clss: 'spacer'
            for l in salt(meta.text).split '\n'
                @appendMeta clss: 'spacer', text: '# '+l
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

    setAutoClear: (state) -> prefs.set 'terminal:autoclear', state
    getAutoClear: -> prefs.get 'terminal:autoclear', true

    setHeader: (state) -> prefs.set 'terminal:header', state
    getHeader: -> prefs.get 'terminal:header', true
    
    doAutoClear: -> if @getAutoClear() then @clear()

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    # execute: (cmmd) ->
        
    # 00000000    0000000   00000000   000   000  00000000     
    # 000   000  000   000  000   000  000   000  000   000    
    # 00000000   000   000  00000000   000   000  00000000     
    # 000        000   000  000        000   000  000          
    # 000         0000000   000         0000000   000          

    onContextMenu: (event) => stopEvent event, @showContextMenu pos event
              
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
                    window.loadFile "#{href}" 
                return
            when 'ctrl+enter', 'command+enter'
                if href = @meta.hrefAtLineIndex @cursorPos()[1]
                    window.loadFile "#{href}" 
                    window.editor.focus()
                return
            when 'ctrl+s', 'command+s'
                return if @meta.saveChanges()
            when 'esc'
                split = window.split
                split.focus 'commandline-editor'
                split.do    'enlarge editor'
                return
                
        'unhandled'

module.exports = Terminal
