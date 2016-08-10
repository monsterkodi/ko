
#   000000000  00000000   0000000  000000000
#      000     000       000          000   
#      000     0000000   0000000      000   
#      000     000            000     000   
#      000     00000000  0000000      000   

Stage = require '../stage'

class Test extends Stage
    
    constructor: (@view) ->
        super @view
        
    start: ->
        @view.style.background = "#030"
        @view.style.color = "#ff0"
        @elem = document.createElement 'div'
        @elem.style.fontSize = "30px"
        @elem.style.position = 'absolute'
        @elem.style.textAlign = 'center'
        @elem.style.bottom = '50%'
        @elem.style.right = '20%'
        @elem.style.left = '20%'
        @elem.style.top = '40%'
        @elem.textContent = 'hello world!'
        @view.appendChild @elem
    
    reset: -> @elem.style.display = 'block'
    stop:  -> @elem.style.display = 'none'

module.exports = Test
