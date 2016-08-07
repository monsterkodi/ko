
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
        log "VoronoiMain.animationStep"
        super @view
        @net = new Net @view
        @animate()

    animationStep: (step) -> @net.step step 
    resized: (w,h) -> @net.layout w,h
        
module.exports = Main
    