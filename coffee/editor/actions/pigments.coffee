
# 00000000   000   0000000   00     00  00000000  000   000  000000000   0000000
# 000   000  000  000        000   000  000       0000  000     000     000     
# 00000000   000  000  0000  000000000  0000000   000 0 000     000     0000000 
# 000        000  000   000  000 0 000  000       000  0000     000          000
# 000        000   0000000   000   000  00000000  000   000     000     0000000 

{ log
}      = require 'kxk'
matchr = require '../../tools/matchr'

module.exports =
    
    actions:
        pigments:
            name:  'pigments'
            combo: 'command+alt+ctrl+p'

    pigments: ->
        
        if @pigmentsActive
            @pigmentsDeactivate()
        else
            @pigmentsActivate()

    pigmentsClear: -> editor.meta.delClass 'pigment'

    pigmentsReactivate: (file) ->
        
        @pigmentsDeactivate()
        @pigments()
   
    pigmentsDeactivate: ->
        
        if @pigmentsActive
            @pigmentsClear()
            @pigmentsActive = false
            @removeListener 'file', @pigmentsReactivate
            
    pigmentsActivate: ->
        
        if not @pigmentsActive
            @pigmentsActive = true
            @on 'file', @pigmentsReactivate
            @pigmentsPigmentize()

    pigmentsPigmentize: ->
        
        @pigmentsClear()
        
        test = /#[a-fA-F0-9]{3}|rgba?/
        trio = /#[a-fA-F0-9]{3}(?![\w\d])/
        hexa = /#[a-fA-F0-9]{6}(?![\w\d])/
        rgb  = /rgb\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\)/
        rgba = /rgba\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\,\s*\d+\.?\d*\s*\)/

        for li in [0...@numLines()]
            line = @line li 
            if test.test line
                rngs = matchr.ranges [[trio, 'trio'], [hexa, 'hexa'], [rgb, 'rgb'], [rgba, 'rgbaa']], line
                ri = -1
                for rng in rngs
                    ri++
                    @meta.addLineMeta 
                        line:  li
                        start: line.length + 2 + ri * 3
                        end:   line.length + 2 + ri * 3 + 2
                        clss:  'pigment'
                        style: 
                            backgroundColor: rng.match
                            