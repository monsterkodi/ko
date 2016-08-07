#  0000000   00000000   00000000   0000000 
# 000   000  000   000  000       000   000
# 000000000  0000000    0000000   000000000
# 000   000  000   000  000       000   000
# 000   000  000   000  00000000  000   000
{
sw,
$} = require '../tools/tools'
log = require '../tools/log'
event = require 'events'

class Area extends event
    
    constructor: (viewElem) ->
        @view = $(viewElem)
        @view.style.display = 'none'
        
    # 00000000   00000000   0000000  000  0000000  00000000
    # 000   000  000       000       000     000   000     
    # 0000000    0000000   0000000   000    000    0000000 
    # 000   000  000            000  000   000     000     
    # 000   000  00000000  0000000   000  0000000  00000000

    resized: -> 
        vh = parseInt split.splitPosY 0
        vw = sw()-12
        @view.style.height = "#{vh}px"
        @view.style.width  = "#{vw}px"
        @emit 'resized', vw, vh

module.exports = Area
