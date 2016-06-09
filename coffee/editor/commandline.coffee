
#  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
# 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000

ViewBase  = require './viewbase'
log       = require '../tools/log'
split     = require '../split'

class Commandline extends ViewBase
    
    constructor: (viewElem) ->
            
        @fontSizeDefault = 24
        @fontSizeKey     = 'commandlineFontSize'
        
        super viewElem
                
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) =>

        switch combo
            when 'enter'
                log 'enter'
                return
            when 'esc' then return split.focusOnEditorOrHistory()
            when 'tab', 'shift+tab' then return
        
        # log "commandline key:", key, "mod:", mod, "combo:", combo        
        return 'unhandled'
    
module.exports = Commandline