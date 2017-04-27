
# 0000000    00000000  0000000    000   000   0000000    0000000  000000000  00000000   000    
# 000   000  000       000   000  000   000  000        000          000     000   000  000    
# 000   000  0000000   0000000    000   000  000  0000  000          000     0000000    000    
# 000   000  000       000   000  000   000  000   000  000          000     000   000  000    
# 0000000    00000000  0000000     0000000    0000000    0000000     000     000   000  0000000

{ upAttr, empty, elem, post, log, $, _
} = require 'kxk'

class DebugCtrl
    
    constructor: (@debugCommand) ->
        
        @div = elem id:'debugCtrl'
            
        @ctrl 'play',  icon: 'play'        
        @ctrl 'step',  icon: 'step-forward'
        @ctrl 'into',  icon: 'level-down'
        @ctrl 'out',   icon: 'level-up'
        
        @div.addEventListener 'click', @onClick

    onClick: (event) => 
        
        id = event.target.id
        id = upAttr event.target, 'id' if empty id
        if id == 'play'
            id = @debugCommand.isPaused() and 'cont' or 'pause'

        @debugCommand.execute id

    setPlayState: (state) ->
        
        play =$ 'play'
        return if not play
        @div.classList.toggle 'running', state == 'running'
        play.firstChild.remove()
        icon = state == 'paused' and 'play' or 'pause'
        play.appendChild elem 'span', class: "fa fa-#{icon}"

    ctrl: (id, opt) ->
        
        bttn = elem id: id, class: "ctrl"
        if opt.icon
            bttn.appendChild elem 'span', class: "fa fa-#{opt.icon}"
        @div.appendChild bttn
        bttn
        
    start: ->
        
        info =$ 'info'
        info.appendChild @div
        
    cancel: -> @div.remove()

module.exports = DebugCtrl
