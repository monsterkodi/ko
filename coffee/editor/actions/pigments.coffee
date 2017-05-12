
# 00000000   000   0000000   00     00  00000000  000   000  000000000   0000000
# 000   000  000  000        000   000  000       0000  000     000     000     
# 00000000   000  000  0000  000000000  0000000   000 0 000     000     0000000 
# 000        000  000   000  000 0 000  000       000  0000     000          000
# 000        000   0000000   000   000  00000000  000   000     000     0000000 

{ prefs, log
}      = require 'kxk'
matchr = require '../../tools/matchr'

class Pigments
    
    constructor: (@editor) -> 

        @test = /#[a-fA-F0-9]{3}|rgba?/
        trio  = /#[a-fA-F0-9]{3}(?![\w\d])/
        hexa  = /#[a-fA-F0-9]{6}(?![\w\d])/
        rgb   = /rgb\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\)/
        rgba  = /rgba\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\,\s*\d+\.?\d*\s*\)/
        
        @regexps = [[trio, 'trio'], [hexa, 'hexa'], [rgb, 'rgb'], [rgba, 'rgbaa']]
        
        @editor.on 'file', @onFile
    
    del: -> @editor.removeListener 'file', @onFile

    onLineInserted: (li) =>

        line = @editor.line li 
        if @test.test line
            rngs = matchr.ranges @regexps, line
            ri = -1
            for rng in rngs
                ri++
                @editor.meta.addLineMeta 
                    line:  li
                    start: line.length + 2 + ri * 3
                    end:   line.length + 2 + ri * 3 + 2
                    clss:  'pigment'
                    style: 
                        backgroundColor: rng.match

    onLineChanged: (li) =>

        metas = @editor.meta.metasAtLineIndex(li).filter (m) -> m[2].clss == 'pigment'
        if metas.length
            for m in metas
                @editor.meta.delMeta m
                
        @onLineInserted li
                        
    onFile: (file) =>

        if prefs.get "pigments:#{file}"
            @pigmentize()
            
    deactivate: ->
        
        prefs.set "pigments:#{@currentFile}"
        @clear()
            
    activate: ->
        
        prefs.set "pigments:#{@currentFile}", true
        @pigmentize()

    clear: -> 
        
        @editor.removeListener 'lineChanged',  @onLineChanged
        @editor.removeListener 'lineInserted', @onLineInserted    
        @editor.meta.delClass 'pigment'
    
    pigmentize: ->
        
        @clear()

        @editor.on 'lineChanged',  @onLineChanged
        @editor.on 'lineInserted', @onLineInserted
        
        for li in [0...@editor.numLines()]
            @onLineInserted li

module.exports =
    
    actions:
        
        togglePigments:
            name:  'Toggle Pigments'
            text:  'toggle pigments for current file'
            combo: 'command+alt+ctrl+p'

    initPigments: -> @pigments ?= new Pigments @
            
    togglePigments: ->
        
        if prefs.get "pigments:#{@currentFile}"
            @pigments.deactivate()
        else
            @pigments.activate()
                            