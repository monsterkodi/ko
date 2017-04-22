# 000000000   0000000   0000000  
#    000     000   000  000   000
#    000     000000000  0000000  
#    000     000   000  000   000
#    000     000   000  0000000  

{ elem, path, log
} = require 'kxk'

class Tab
    
    constructor: (@tabs) ->
        
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div
    
    update: (info) ->
        log 'update', @info
        text = info.file and path.basename(info.file) or 'untitled'
        @div.innerHTML = text
        
    index: -> @tabs.tabs.indexOf @
    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        if not @isActive()
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
