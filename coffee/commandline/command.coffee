#  0000000   0000000   00     00  00     00   0000000   000   000  0000000  
# 000       000   000  000   000  000   000  000   000  0000  000  000   000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000  

{
clamp
}   = require '../tools/tools'
log = require '../tools/log'
_   = require 'lodash'

class Command

    constructor: (@commandline) ->
    
        @index = 0
        @history = ['']
        
    start: -> @last()
    cancel: ->
    changed: (command) ->
        
    current: -> @history[@index]
        
    execute: (command) ->
    
        _.pull @history, command
        @history.push command
        @index = @history.length-1
    
    prev: -> 
        @index = clamp 0, @history.length-1, @index-1
        @history[@index]
        
    next: -> 
        @index = clamp 0, @history.length-1, @index+1
        @history[@index]
        
    last: ->
        @index = @history.length-1
        @history[@index]
        
    setText: (t) -> 
        @commandline.setText t
        @commandline.selectAll()
        

module.exports = Command