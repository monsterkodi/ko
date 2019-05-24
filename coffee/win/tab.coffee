###
000000000   0000000   0000000  
   000     000   000  000   000
   000     000000000  0000000  
   000     000   000  000   000
   000     000   000  0000000  
###

{ post, tooltip, slash, elem, kerror, _ } = require 'kxk'

File    = require '../tools/file'
Watcher = require '../tools/watcher'
render  = require '../editor/render'
syntax  = require '../editor/syntax'

class Tab
    
    constructor: (@tabs, @file) ->
        
        @dirty = false
        @div = elem class: 'tab', text: ''
        @tabs.div.appendChild @div

        if not @file.startsWith 'untitled'
            @pkg = slash.pkg @file
            @pkg = slash.basename @pkg if @pkg?
        
        @update()
        
        @watcher = new Watcher @file

    foreignChanges: (lineChanges) ->
        
        @foreign ?= []
        @foreign.push lineChanges
        @update()        
        
    reload: ->
        
        delete @state
        @dirty = false
        @update()
        
    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000     
    # 0000000   000000000   000 000   0000000 
    #      000  000   000     000     000     
    # 0000000   000   000      0      00000000
    
    saveChanges: ->
        
        if @state
            
            if @foreign?.length
                for changes in @foreign
                    for change in changes
                        switch change.change
                            when 'changed'  then @state.state = @state.state.changeLine change.doIndex, change.after
                            when 'inserted' then @state.state = @state.state.insertLine change.doIndex, change.after
                            when 'deleted'  then @state.state = @state.state.deleteLine change.doIndex
            
            if @state.state 
                File.save @state.file, @state.state.text(), (err) =>
                    return kerror "tab.saveChanges failed #{err}" if err
                    @revert()
            else
                kerror 'tab.saveChanges -- nothing to save?'
        else
            post.emit 'saveChanges'
            
    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
    
    storeState: ->
        
        if window.editor.currentFile
            @state = window.editor.do.tabState()
        
    restoreState: ->
        
        return kerror 'no file in state?', @state if not @state?.file?
        window.editor.do.setTabState @state
        delete @state
        
    # 000   000  00000000   0000000     0000000   000000000  00000000  
    # 000   000  000   000  000   000  000   000     000     000       
    # 000   000  00000000   000   000  000000000     000     0000000   
    # 000   000  000        000   000  000   000     000     000       
    #  0000000   000        0000000    000   000     000     00000000  
    
    update: ->
           
        @div.innerHTML = ''
        @div.classList.toggle 'dirty', @dirty 
                
        sep = '●'
        sep = '■' if window.editor.newlineCharacters == '\r\n'
        @div.appendChild elem 'span', class:'dot', text:sep
        
        sep = "<span class='dot'>►</span>"
        @pkgDiv = elem 'span', class:'pkg', html: @pkg and (@pkg + sep) or ''
        @div.appendChild @pkgDiv
            
        diss = syntax.dissForTextAndSyntax slash.basename(@file), 'ko' #, join: true 
        name = elem 'span', class:'name', html:render.line diss, charWidth:0
        @div.appendChild name

        @div.appendChild elem 'span', class:'tabdrag'
        
        if @file?
            diss = syntax.dissForTextAndSyntax slash.tilde(@file), 'ko' #, join: true 
            html = render.line diss, charWidth:0
            @tooltip = new tooltip elem:name, html:html, x:0
            
        @div.appendChild elem 'span', class:'dot', text:'●' if @dirty # @isDirty()
        @

    index: -> @tabs.tabs.indexOf @
    prev:  -> @tabs.tab @index()-1 if @index() > 0
    next:  -> @tabs.tab @index()+1 if @index() < @tabs.numTabs()-1
    nextOrPrev: -> @next() ? @prev()
            
    close: ->
        
        @watcher.stop()
        
        if @dirty
            @saveChanges()
            
        @div.remove()
        @tooltip?.del()
        post.emit 'tabClosed', @file
        @
    
    hidePkg: -> @pkgDiv?.style.display = 'none'
    showPkg: -> @pkgDiv?.style.display = 'initial'
    
    # 0000000    000  00000000   000000000  000   000  
    # 000   000  000  000   000     000      000 000   
    # 000   000  000  0000000       000       00000    
    # 000   000  000  000   000     000        000     
    # 0000000    000  000   000     000        000     
            
    setDirty: (dirty) ->
        
        if @dirty != dirty
            @dirty = dirty
            @update()
    
    # 00000000   00000000  000   000  00000000  00000000   000000000  
    # 000   000  000       000   000  000       000   000     000     
    # 0000000    0000000    000 000   0000000   0000000       000     
    # 000   000  000          000     000       000   000     000     
    # 000   000  00000000      0      00000000  000   000     000     
    
    revert: ->
        
        delete @foreign
        delete @state
        @dirty = false
        @update()
        @tabs.update()

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: -> 
        
        post.emit 'jumpToFile', file:@file
        
    finishActivation: ->
        
        @setActive()
        
        if @state?
            @restoreState()
            
        if @foreign?.length
            for changes in @foreign
                window.editor.do.foreignChanges changes
            delete @foreign
            
        @tabs.update()

    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
    
    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        
        if not @isActive()
            @div.classList.add 'active'
            
    clearActive: ->
        
        @div.classList.remove 'active'
        
module.exports = Tab
