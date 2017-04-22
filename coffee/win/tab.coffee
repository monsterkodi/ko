# 000000000   0000000   0000000  
#    000     000   000  000   000
#    000     000000000  0000000  
#    000     000   000  000   000
#    000     000   000  0000000  

{ packagePath, elem, path, log
} = require 'kxk'
render = require '../editor/render'
syntax = require '../editor/syntax'

class Tab
    
    constructor: (@tabs) ->
        
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div
    
    update: (@info) ->
        
        title = 'untitled'
        if @info.file
            diss  = syntax.dissForTextAndSyntax(path.basename(@info.file), 'ko', join: true)
            title = render.line diss, charWidth:0
            ic    = @info.focus and " focus" or ""
            dc    = @info.dirty and " dirty" or "clean"
            db    = "<span class=\"dot #{dc}#{ic}\">●</span>"
                
            if pkgPath = packagePath @info.file
                title = db + path.basename(pkgPath) + "<span class='#{ic}'> ▸ </span>" + title

        @div.innerHTML = title
       
    close:    -> @div.remove() 
    index:    -> @tabs.tabs.indexOf @
    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        if not @isActive()
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
