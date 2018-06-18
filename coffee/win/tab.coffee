###
000000000   0000000   0000000  
   000     000   000  000   000
   000     000000000  0000000  
   000     000   000  000   000
   000     000   000  0000000  
###

{ post, elem, tooltip, atomic, slash, fs, error, log, _ } = require 'kxk'

render  = require '../editor/render'
syntax  = require '../editor/syntax'

class Tab
    
    constructor: (@tabs) ->
        
        @info = file: null
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div

    foreignChanges: (lineChanges) ->
        
        @foreign ?= []
        @foreign.push lineChanges
        @update @info
        @tabs.update()
        
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
            
            stat = fs.statSync @state.file
            atomic @state.file, @state.state.text(), { encoding: 'utf8', mode: stat.mode }, (err) =>            
                return error "tab.saveChanges failed #{err}" if err
                @revert()
        else
            window.saveChanges()
            
    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
    
    storeState: ->
        
        if window.editor.currentFile
            @state = window.editor.do.tabState()
        
    restoreState: ->
        
        return error 'no file in state?', @state if not @state?.file?
        
        window.editor.do.setTabState @state
        delete @state
        
    # 000   000  00000000   0000000     0000000   000000000  00000000  
    # 000   000  000   000  000   000  000   000     000     000       
    # 000   000  00000000   000   000  000000000     000     0000000   
    # 000   000  000        000   000  000   000     000     000       
    #  0000000   000        0000000    000   000     000     00000000  
    
    update: (info) ->
            
        oldFile = @info?.file
        oldPkg  = @info?.pkg
        
        @info = _.clone info
        
        if @info.file != oldFile
            if @info.file?
                @info.pkg = slash.pkg @info.file
                @info.pkg = slash.basename @info.pkg if @info.pkg?
            else
                delete @info.pkg
        else
            @info.pkg = oldPkg
                        
        @div.innerHTML = ''
        @div.classList.toggle 'dirty', @dirty()
                
        sep = '●'
        sep = '■' if window.editor.newlineCharacters == '\r\n'
        @div.appendChild elem 'span', class:'dot', text:sep
        
        sep = "<span class='dot'>⯈</span>"
        @pkg = elem 'span', class:'pkg', html: @info.pkg and (@info.pkg + sep) or ''
        @div.appendChild @pkg
            
        diss = syntax.dissForTextAndSyntax slash.basename(@file()), 'ko' #, join: true 
        name = elem 'span', class:'name', html:render.line(diss, charWidth:0)
        @div.appendChild name

        @div.appendChild elem 'span', class:'tabdrag'
        
        if @info.file?
            diss = syntax.dissForTextAndSyntax slash.tilde(@file()), 'ko' #, join: true 
            html = render.line(diss, charWidth:0)
            @tooltip = new tooltip elem:name, html:html, x:0
            
        @div.appendChild elem 'span', class:'dot', text:'●' if @dirty()
        @

    file:  -> @info?.file ? 'untitled' 
    index: -> @tabs.tabs.indexOf @
    prev:  -> @tabs.tab @index()-1 if @index() > 0
    next:  -> @tabs.tab @index()+1 if @index() < @tabs.numTabs()-1
    nextOrPrev: -> @next() ? @prev()
    
    dirty: -> 
        return true if @state? 
        return true if @foreign? and @foreign.length > 0 
        return true if @info?.dirty == true
        # return false even if editor has line changes:
        # dirty is reset before changed file is saved
        false
        
    close: ->
        
        @div.remove()
        @tooltip?.del()
        post.emit 'tabClosed', @info.file ? 'untitled'
    
    hidePkg: -> @pkg?.style.display = 'none'
    showPkg: -> @pkg?.style.display = 'initial'
    
    revert: -> 
        delete @info.dirty
        delete @foreign
        delete @state
        @update @info
        @tabs.update()

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: ->
        
        activeTab = @tabs.activeTab()

        if activeTab? and activeTab.dirty()
            activeTab.storeState()
        
        @setActive()
        
        if @state?
            @restoreState()
        else
            post.emit 'jumpToFile', file:@info.file
            # window.loadFile @info.file, dontSave:true
            
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
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
