
# 00000000   000   0000000   00     00  00000000  000   000  000000000   0000000
# 000   000  000  000        000   000  000       0000  000     000     000
# 00000000   000  000  0000  000000000  0000000   000 0 000     000     0000000
# 000        000  000   000  000 0 000  000       000  0000     000          000
# 000        000   0000000   000   000  00000000  000   000     000     0000000

{ state, log } = require 'kxk'

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

    # 000  000   000   0000000  00000000  00000000   000000000  00000000  0000000
    # 000  0000  000  000       000       000   000     000     000       000   000
    # 000  000 0 000  0000000   0000000   0000000       000     0000000   000   000
    # 000  000  0000       000  000       000   000     000     000       000   000
    # 000  000   000  0000000   00000000  000   000     000     00000000  0000000

    onLineInserted: (li) =>

        line = @editor.line li
        if @test.test line
            rngs = matchr.ranges @regexps, line
            ri = -1
            for rng in rngs
                ri++
                @editor.meta.add
                    line:  li
                    start: line.length + 2 + ri * 3
                    end:   line.length + 2 + ri * 3 + 2
                    clss:  'pigment'
                    style:
                        backgroundColor: rng.match

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    onLineChanged: (li) =>

        metas = @editor.meta.metasAtLineIndex(li).filter (m) -> m[2].clss == 'pigment'
        if metas.length
            for m in metas
                @editor.meta.delMeta m

        @onLineInserted li

    onFile: (file) =>

        if state.get "pigments|#{file}"
            @pigmentize()

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000
    # 000   000  000          000     000  000   000  000   000     000     000
    # 000000000  000          000     000   000 000   000000000     000     0000000
    # 000   000  000          000     000     000     000   000     000     000
    # 000   000   0000000     000     000      0      000   000     000     00000000

    activate: ->

        state.set "pigments:#{@editor.currentFile}", true
        @pigmentize()

    deactivate: ->

        state.set "pigments:#{@editor.currentFile}"
        @clear()

    clear: ->

        @editor.removeListener 'lineChanged',  @onLineChanged
        @editor.removeListener 'lineInserted', @onLineInserted
        @editor.meta.delClass 'pigment'

    # 00000000   000   0000000   00     00  00000000  000   000  000000000  000  0000000  00000000
    # 000   000  000  000        000   000  000       0000  000     000     000     000   000
    # 00000000   000  000  0000  000000000  0000000   000 0 000     000     000    000    0000000
    # 000        000  000   000  000 0 000  000       000  0000     000     000   000     000
    # 000        000   0000000   000   000  00000000  000   000     000     000  0000000  00000000

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
            combo: 'CmdOrCtrl+alt+shift+p'

    initPigments: -> @pigments ?= new Pigments @

    togglePigments: ->

        if state.get "pigments:|#{@currentFile}"
            @pigments.deactivate()
        else
            @pigments.activate()
