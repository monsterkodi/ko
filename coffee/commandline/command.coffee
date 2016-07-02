#  0000000   0000000   00     00  00     00   0000000   000   000  0000000  
# 000       000   000  000   000  000   000  000   000  0000  000  000   000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000  
{
clamp
}     = require '../tools/tools'
log   = require '../tools/log'
prefs = require '../tools/prefs'
_     = require 'lodash'

class Command

    constructor: ->
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    start: -> 
        @loadState()
        text: @last()
        select: true
    
    changed: (command) ->
        
    cancel: ->
        # @setText ''
        text: ''
        focus: @focus   
        
    clear: ->
        text: ''
        focus: @focus
                
    execute: (command) -> @setCurrent command
    
    # 000   000  000   0000000  000000000   0000000   00000000   000   000
    # 000   000  000  000          000     000   000  000   000   000 000 
    # 000000000  000  0000000      000     000   000  0000000      00000  
    # 000   000  000       000     000     000   000  000   000     000   
    # 000   000  000  0000000      000      0000000   000   000     000   
    
    setCurrentText: (command) -> 
        @setCurrent command
        @setText    command
        
    setCurrent: (command) -> 
        _.pull @history, command
        @history.push command
        @index = @history.length-1
        @setState 'history', @history
        @setState 'index', @index
        
    current: -> @history[@index]    

    prev: -> 
        @index = clamp 0, @history.length-1, @index-1
        @history[@index]
        
    next: -> 
        @index = clamp 0, @history.length-1, @index+1
        @history[@index]
        
    last: ->
        @index = @history.length-1
        @history[@index]
        
    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   
    
    setText: (t) -> 
        @commandline.setText t
        @commandline.selectAll()
        
    getText: ->
        @commandline.lines[0]
    
    setName: (n) ->
        @name = n
        @commandline.setName n

    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    grabFocus: -> @commandline.focus()
    setFocus: (focus) -> @focus = focus ? '.editor'
    onBlur: ->

    #  0000000  000000000   0000000   000000000  00000000
    # 000          000     000   000     000     000     
    # 0000000      000     000000000     000     0000000 
    #      000     000     000   000     000     000     
    # 0000000      000     000   000     000     00000000

    setPrefsID: (id) ->
        @prefsID = id
        @loadState()
        
    loadState: ->
        @index   = @getState 'index', 0
        @history = @getState 'history', ['']

    setState: (key, value) ->
        return if not @prefsID
        if @prefsID
            prefs.set "command:#{@prefsID}:#{key}", value
        
    getState: (key, value) ->
        return value if not @prefsID
        prefs.get "command:#{@prefsID}:#{key}", value
        
    delState: (key) ->
        return if not @prefsID
        prefs.del "command:#{@prefsID}:#{key}"

    handleModKeyComboEvent: (mod, key, combo, event) -> 'unhandled'

module.exports = Command
