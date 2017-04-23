# 000000000   0000000   0000000  
#    000     000   000  000   000
#    000     000000000  0000000  
#    000     000   000  000   000
#    000     000   000  0000000  

{ packagePath, unresolve, elem, post, path, log
}      = require 'kxk'
render = require '../editor/render'
syntax = require '../editor/syntax'
Tooltip = require '../tools/tooltip'

class Tab
    
    constructor: (@tabs) ->
        
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div
    
    # 000   000  00000000   0000000     0000000   000000000  00000000  
    # 000   000  000   000  000   000  000   000     000     000       
    # 000   000  00000000   000   000  000000000     000     0000000   
    # 000   000  000        000   000  000   000     000     000       
    #  0000000   000        0000000    000   000     000     00000000  
    
    update: (info) ->
        
        if info.file != @info?.file
            if info.file?
                info.pkgPath = packagePath info.file
                info.pkgPath = path.basename info.pkgPath if info.pkgPath?
                
        @info = info
        
        @div.innerHTML = ''
        @div.classList.toggle 'dirty', info.dirty ? false
                        
        @div.appendChild elem 'span', class:'dot', text:'●'
        
        if info.pkgPath and info.pkgPath != @prev()?.info.pkgPath
            @div.appendChild elem 'span', text:info.pkgPath + " ▸ "
            
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
    
    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
    
    activate: -> 
        @setActive()    
        window.loadFile @info?.file
        @tabs.update()

    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        if not @isActive()
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
