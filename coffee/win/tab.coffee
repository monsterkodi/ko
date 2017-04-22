# 000000000   0000000   0000000  
#    000     000   000  000   000
#    000     000000000  0000000  
#    000     000   000  000   000
#    000     000   000  0000000  

{ packagePath, elem, post, path, log
}      = require 'kxk'
render = require '../editor/render'
syntax = require '../editor/syntax'

class Tab
    
    constructor: (@tabs) ->
        
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div
    
    update: (@info) ->
        
        title = 'untitled'
        @div.classList.toggle 'dirty', @info.dirty
        if @info.file
            diss = syntax.dissForTextAndSyntax(path.basename(@info.file), 'ko', join: true)
            file = render.line diss, charWidth:0
            dot  = "<span class=\"dot\">●</span>"
                
            if pkgPath = packagePath @info.file
                title = dot+ path.basename(pkgPath) + " ▸ " + file

        @div.innerHTML = title
       
    close:    -> @div.remove() 
    index:    -> @tabs.tabs.indexOf @
    
    activate: -> 
        @setActive()    
        window.loadFile @info?.file

    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        if not @isActive()
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
