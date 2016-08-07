
#00     00   0000000   000  000   000
#000   000  000   000  000  0000  000
#000000000  000000000  000  000 0 000
#000 0 000  000   000  000  000  0000
#000   000  000   000  000  000   000

log   = require '../../tools/log'
Stage = require '../stage'
Net   = require './net'

class Main extends Stage
    
    constructor: (@view) ->
        super @view
        @net = new Net @view
        @animate()

    animationStep: (step) -> @net.step step 
    resized: (w,h) -> @net.layout w,h
    reset: ->
        @net.s.node.style.display = 'initial'
        @resume()
        
    stop: ->
        @net.s.node.style.display = 'none'
        @pause()
        
module.exports = Main
    