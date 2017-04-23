# 000000000   0000000   0000000  
#    000     000   000  000   000
#    000     000000000  0000000  
#    000     000   000  000   000
#    000     000   000  0000000  

{ packagePath, unresolve, elem, post, path, log, _
}       = require 'kxk'
render  = require '../editor/render'
syntax  = require '../editor/syntax'
Tooltip = require '../tools/tooltip'

class Tab
    
    constructor: (@tabs) ->
        
        @info = file: null
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div
    
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
        @div.classList.toggle 'dirty', info.dirty ? false
                        
        @div.appendChild elem 'span', class:'dot', text:'●'
        
        @pkg = elem 'span', class:'pkg', text: info.pkg and (info.pkg + " ▸ ") or ''
        @div.appendChild @pkg
            
        diss = syntax.dissForTextAndSyntax(path.basename(@file()), 'ko', join: true)
        name = elem 'span', html:render.line(diss, charWidth:0)
        @div.appendChild name

        if info.file?
            diss = syntax.dissForTextAndSyntax(unresolve(@file()), 'ko', join: true)
            html = render.line(diss, charWidth:0)
            new Tooltip elem:name, html:html, x:0
            
        @div.appendChild elem 'span', class:'dot', text:'●' if info.dirty
        @

    file:  -> @info?.file ? 'untitled' 
    close: -> @div.remove() 
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
        @setActive()
        window.loadFile @info.file
        @tabs.update()

    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        if not @isActive()
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
