# 000000000   0000000   0000000     0000000
#    000     000   000  000   000  000     
#    000     000000000  0000000    0000000 
#    000     000   000  000   000       000
#    000     000   000  0000000    0000000 

{ elem, log, _
} = require 'kxk'

Tab = require './tab'

class Tabs
    
    constructor: (view) ->
        
        @tabs = []
        @div = elem class: 'tabs'
        view.appendChild @div
        
    newTab: -> 
        
        log 'new tab'
        @tabs.push new Tab @

    navigate: (key) -> log 'navigate', key
    closeOthers: -> log 'closeOthers'
        
        
module.exports = Tabs
