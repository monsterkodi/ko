
# 000000000   0000000   0000000  
#    000     000   000  000   000
#    000     000000000  0000000  
#    000     000   000  000   000
#    000     000   000  0000000  

{ packagePath, unresolve, elem, post, path, fs, log, _
}       = require 'kxk'
render  = require '../editor/render'
syntax  = require '../editor/syntax'
Tooltip = require '../tools/tooltip'
atomic  = require 'write-file-atomic'

class Tab
    
    constructor: (@tabs) ->
        
        @info = file: null
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div

    saveChanges: ->
        
        if @state
            stat = fs.statSync @state.file
            atomic @state.file, @state.state.text(), { encoding: 'utf8', mode: stat.mode }, (err) ->            
                return error "tab.saveChanges failed #{err}" if err
        else
            window.saveChanges()
            
    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
    
    storeState: ->
        
        @state = window.editor.do.tabState()
        log 'tab.storeState', @state.file, @info
        
    restoreState: ->
        
        log 'tab.restoreState', @state.file, @info
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
                @info.pkg = packagePath @info.file
                @info.pkg = path.basename @info.pkg if @info.pkg?
            else
                delete @info.pkg
        else
            @info.pkg = oldPkg
                        
        @div.innerHTML = ''
        @div.classList.toggle 'dirty', @dirty()
                        
        @div.appendChild elem 'span', class:'dot', text:'●'
        
        @pkg = elem 'span', class:'pkg', text: @info.pkg and (@info.pkg + " ▸ ") or ''
        @div.appendChild @pkg
            
        diss = syntax.dissForTextAndSyntax(path.basename(@file()), 'ko', join: true)
        name = elem 'span', class:'name', html:render.line(diss, charWidth:0)
        @div.appendChild name

        if @info.file?
            diss = syntax.dissForTextAndSyntax(unresolve(@file()), 'ko', join: true)
            html = render.line(diss, charWidth:0)
            @tooltip = new Tooltip elem:name, html:html, x:0
            
        @div.appendChild elem 'span', class:'dot', text:'●' if @dirty()
        @

    dirty: -> @state? or @info?.dirty == true
    file:  -> @info?.file ? 'untitled' 
    close: -> @div.remove(); @tooltip.del() 
    index: -> @tabs.tabs.indexOf @
    prev:  -> @tabs.tab @index()-1 if @index() > 0
    next:  -> @tabs.tab @index()+1 if @index() < @tabs.numTabs()-1
    nextOrPrev: -> @next() ? @prev()
    
    hidePkg: -> @pkg.style.display = 'none'
    showPkg: -> @pkg.style.display = 'initial'
    
    revert: -> 
        delete @info.dirty
        @update @info
        @tabs.update()

    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
    
    activate: ->
        
        if @tabs.activeTab().dirty()
            log 'store active tab'
            @tabs.activeTab().storeState()
        
        @setActive()
        
        if @state?
            log 'have state'
            @restoreState()
        else
            window.loadFile @info.file, dontSave:true
            
        @tabs.update()

    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        if not @isActive()
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
