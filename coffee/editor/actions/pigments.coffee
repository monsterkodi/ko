
# 00000000   000   0000000   00     00  00000000  000   000  000000000   0000000
# 000   000  000  000        000   000  000       0000  000     000     000     
# 00000000   000  000  0000  000000000  0000000   000 0 000     000     0000000 
# 000        000  000   000  000 0 000  000       000  0000     000          000
# 000        000   0000000   000   000  00000000  000   000     000     0000000 

{ prefs, log
}      = require 'kxk'
matchr = require '../../tools/matchr'

module.exports =
    
    actions:
        pigmentsToggle:
            name:  'pigments'
            text:  'toggle pigments for current file'
            combo: 'command+alt+ctrl+p'

    pigmentsInit: -> @on 'file', @pigmentsFile

    pigmentsFile: (file) ->

        if prefs.get "pigments:#{file}"
            @pigmentsPigmentize()
            
    pigmentsToggle: ->
        
        if prefs.get "pigments:#{@currentFile}"
            @pigmentsDeactivate()
        else
            @pigmentsActivate()
   
    pigmentsDeactivate: ->
        
        prefs.set "pigments:#{@currentFile}"
        @pigmentsClear()
            
    pigmentsActivate: ->
        
        prefs.set "pigments:#{@currentFile}", true
        @pigmentsPigmentize()

    pigmentsClear: -> editor.meta.delClass 'pigment'
    
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
                            