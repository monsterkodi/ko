# 000000000   0000000   0000000  
#    000     000   000  000   000
#    000     000000000  0000000  
#    000     000   000  000   000
#    000     000   000  0000000  

{ elem, log
} = require 'kxk'

class Tab
    
    constructor: (@tabs) ->
        
        @div = elem class: 'tab', text: 'untitled'
        @tabs.div.appendChild @div
        
module.exports = Tab
