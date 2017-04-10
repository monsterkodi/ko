
# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{log} = require 'kxk'
Stage = require '../area/stage'

class Browser extends Stage
    
    constructor: (@view) ->
        log 'Browser.constructor'
        super @view
        
    start: ->
        @view.style.background = "#000"
        @view.style.color = "#fff"
        @elem = document.createElement 'div'
        @elem.style.fontSize = "30px"
        @elem.style.position = 'absolute'
        @elem.style.textAlign = 'center'
        @elem.style.bottom = '50%'
        @elem.style.right = '20%'
        @elem.style.left = '20%'
        @elem.style.top = '40%'
        @elem.textContent = 'hello browser!'
        @view.appendChild @elem
    
    reset: -> @elem.style.display = 'block'
    stop:  -> @elem.style.display = 'none'

module.exports = Browser
