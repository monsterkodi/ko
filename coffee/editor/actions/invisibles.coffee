
# 000  000   000  000   000  000   0000000  000  0000000    000      00000000   0000000
# 000  0000  000  000   000  000  000       000  000   000  000      000       000
# 000  000 0 000   000 000   000  0000000   000  0000000    000      0000000   0000000
# 000  000  0000     000     000       000  000  000   000  000      000            000
# 000  000   000      0      000  0000000   000  0000000    0000000  00000000  0000000

{ prefs, error, log
} = require 'kxk'

class Invisibles

    constructor: (@editor) -> @editor.on 'file', @onFile

    del: -> @editor.removeListener 'file', @onFile

    onFile: (file) =>

        if prefs.get "invisibles:#{file}"
            @show()
        else
            @clear()

    onLineInserted: (li) =>

        line = @editor.line li
        kind = line.endsWith(' ') and 'trailing' or 'newline'
        @editor.meta.addLineMeta
            line:  li
            html:  '&#9687'
            start: line.length
            end:   line.length
            clss:  'invisible ' + kind

    onLineChanged: (li) =>

        metas = @editor.meta.metasAtLineIndex(li).filter (m) -> m[2].clss.startsWith 'invisible'
        return error "no invisible meta at line #{li}?" if not metas.length
        @editor.meta.delMeta metas[0]
        @onLineInserted li

    deactivate: ->

        prefs.set "invisibles:#{@editor.currentFile}"
        @clear()

    activate: ->

        prefs.set "invisibles:#{@editor.currentFile}", true
        @show()

    clear: ->

        @editor.removeListener 'lineChanged',  @onLineChanged
        @editor.removeListener 'lineInserted', @onLineInserted
        @editor.meta.delClass 'invisible'

    show: ->

        @clear()

        @editor.on 'lineChanged',  @onLineChanged
        @editor.on 'lineInserted', @onLineInserted

        for li in [0...@editor.numLines()]
            @onLineInserted li

module.exports =

    actions:

        toggleInvisibles:
            name:  'Toggle Invisibles'
            text:  'toggle invisibles for current file'
            combo: 'ctrl+i'

    toggleInvisibles: ->

        if prefs.get "invisibles:#{@currentFile}"
            @invisibles.deactivate()
        else
            @invisibles.activate()

    initInvisibles: -> @invisibles ?= new Invisibles @
