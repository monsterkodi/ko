###
000000000   0000000   0000000  
   000     000   000  000   000
   000     000000000  0000000  
   000     000   000  000   000
   000     000   000  0000000  
###

{ post, tooltip, slash, elem, error, log, _ } = require 'kxk'

File    = require '../tools/file'
render  = require '../editor/render'
syntax  = require '../editor/syntax'

class Tab
    
    constructor: (@tabs, file) ->
        
        @info = file:file, dirty:false
        @div = elem class: 'tab', text: ''
        @tabs.div.appendChild @div

        if not @info.file.startsWith 'untitled'
            @info.pkg = slash.pkg @info.file
            @info.pkg = slash.basename @info.pkg if @info.pkg?
        
        @update()

    foreignChanges: (lineChanges) ->
        
        log 'tab.foreignChanges'
        @foreign ?= []
        @foreign.push lineChanges
        @update()        
        
    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000     
    # 0000000   000000000   000 000   0000000 
    #      000  000   000     000     000     
    # 0000000   000   000      0      00000000
    
    saveChanges: ->
        
        # log 'tab.saveChanges info:', @info
        # log 'tab.saveChanges state:', @state
        
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
                    return error "tab.saveChanges failed #{err}" if err
                    @revert()
            else
                log 'tab.saveChanges -- nothing to save?'
        else
            window.saveChanges()
            
    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
    
    storeState: ->
        
        # log 'tab.storeState', @info
        
        if window.editor.currentFile
            if @info.file != window.editor.currentFile
                log 'tab.storeState editor.currentFile', window.editor.currentFile, '@info.file', @info.file
            @state = window.editor.do.tabState()
            # log 'tab.storeState @state', @state
        
    restoreState: ->
        
        # log 'tab.restoreState', @info.file
        # log 'tab.restoreState', @state
        return error 'no file in state?', @state if not @state?.file?
        window.editor.do.setTabState @state
        delete @state
        
    # 000   000  00000000   0000000     0000000   000000000  00000000  
    # 000   000  000   000  000   000  000   000     000     000       
    # 000   000  00000000   000   000  000000000     000     0000000   
    # 000   000  000        000   000  000   000     000     000       
    #  0000000   000        0000000    000   000     000     00000000  
    
    update: ->
           
        @div.innerHTML = ''
        @div.classList.toggle 'dirty', @dirty()
                
        sep = '●'
        sep = '■' if window.editor.newlineCharacters == '\r\n'
        @div.appendChild elem 'span', class:'dot', text:sep
        
        sep = "<span class='dot'>►</span>"
        @pkg = elem 'span', class:'pkg', html: @info.pkg and (@info.pkg + sep) or ''
        @div.appendChild @pkg
            
        diss = syntax.dissForTextAndSyntax slash.basename(@file()), 'ko' #, join: true 
        name = elem 'span', class:'name', html:render.line diss, charWidth:0
        @div.appendChild name

        @div.appendChild elem 'span', class:'tabdrag'
        
        if @info.file?
            diss = syntax.dissForTextAndSyntax slash.tilde(@file()), 'ko' #, join: true 
            html = render.line diss, charWidth:0
            @tooltip = new tooltip elem:name, html:html, x:0
            
        @div.appendChild elem 'span', class:'dot', text:'●' if @dirty()
        @

    file:  -> @info.file
    index: -> @tabs.tabs.indexOf @
    prev:  -> @tabs.tab @index()-1 if @index() > 0
    next:  -> @tabs.tab @index()+1 if @index() < @tabs.numTabs()-1
    nextOrPrev: -> @next() ? @prev()
            
    close: ->
        if @dirty()
            @saveChanges()
        @div.remove()
        @tooltip?.del()
        post.emit 'tabClosed', @info.file
    
    hidePkg: -> @pkg?.style.display = 'none'
    showPkg: -> @pkg?.style.display = 'initial'
    
    # 0000000    000  00000000   000000000  000   000  
    # 000   000  000  000   000     000      000 000   
    # 000   000  000  0000000       000       00000    
    # 000   000  000  000   000     000        000     
    # 0000000    000  000   000     000        000     
    
    dirty: ->
        return true if @state? 
        return true if @foreign? and @foreign.length > 0 
        return true if @info.dirty == true
        # return false even if editor has line changes:
        # dirty is reset before changed file is saved
        # log 'tab.dirty == false', @info
        false
        
    setDirty: (dirty) ->
        
        if @info.dirty != dirty
            @info.dirty = dirty
            @update()
    
    # 00000000   00000000  000   000  00000000  00000000   000000000  
    # 000   000  000       000   000  000       000   000     000     
    # 0000000    0000000    000 000   0000000   0000000       000     
    # 000   000  000          000     000       000   000     000     
    # 000   000  00000000      0      00000000  000   000     000     
    
    revert: ->
        
        delete @foreign
        delete @state
        @info.dirty = false
        @update()
        @tabs.update()

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: -> 
        
        post.emit 'jumpToFile', file:@info.file
        
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
