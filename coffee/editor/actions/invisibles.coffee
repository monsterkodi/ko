
# 000  000   000  000   000  000   0000000  000  0000000    000      00000000   0000000
# 000  0000  000  000   000  000  000       000  000   000  000      000       000
# 000  000 0 000   000 000   000  0000000   000  0000000    000      0000000   0000000
# 000  000  0000     000     000       000  000  000   000  000      000            000
# 000  000   000      0      000  0000000   000  0000000    0000000  00000000  0000000

{ state, error, log } = require 'kxk'

matchr = require '../../tools/matchr'
   
class Invisibles

    constructor: (@editor) -> @editor.on 'file', @onFile

    del: -> @editor.removeListener 'file', @onFile

    onFile: (file) =>

        if state.get "invisibles|#{file}"
            @show()
        else
            @clear()

    # 000  000   000   0000000  00000000  00000000   000000000  
    # 000  0000  000  000       000       000   000     000     
    # 000  000 0 000  0000000   0000000   0000000       000     
    # 000  000  0000       000  000       000   000     000     
    # 000  000   000  0000000   00000000  000   000     000     
    
    onLineInserted: (li) =>

        line = @editor.line li
        kind = line.endsWith(' ') and 'trailing' or 'newline'
        @editor.meta.add
            line:  li
            html:  '&#9687'
            start: line.length
            end:   line.length
            clss:  'invisible ' + kind
            
        ti = 0
        for range in matchr.ranges /\t/, line
            @editor.meta.add
                line:  li
                html:  '&#9656'
                start: range.start+ti*3
                end:   range.start+ti*3
                clss:  'invisible'
            ti++

    #  0000000  000   000   0000000   000   000   0000000   00000000  
    # 000       000   000  000   000  0000  000  000        000       
    # 000       000000000  000000000  000 0 000  000  0000  0000000   
    # 000       000   000  000   000  000  0000  000   000  000       
    #  0000000  000   000  000   000  000   000   0000000   00000000  
    
    onLineChanged: (li) =>

        metas = @editor.meta.metasAtLineIndex(li).filter (m) -> m[2].clss.startsWith 'invisible'
        return error "no invisible meta at line #{li}?" if not metas.length
        @editor.meta.delMeta metas[0]
        @onLineInserted li

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: ->

        state.set "invisibles:#{@editor.currentFile ? @editor.name}", true
        @show()
        
    deactivate: ->

        state.set "invisibles:#{@editor.currentFile}"
        @clear()


    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: ->

        @editor.removeListener 'lineChanged',  @onLineChanged
        @editor.removeListener 'lineInserted', @onLineInserted
        @editor.meta.delClass 'invisible'

    #  0000000  000   000   0000000   000   000  
    # 000       000   000  000   000  000 0 000  
    # 0000000   000000000  000   000  000000000  
    #      000  000   000  000   000  000   000  
    # 0000000   000   000   0000000   00     00  
    
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

        return if not @invisibles
        if state.get "invisibles|#{@currentFile ? @name}"
            @invisibles.deactivate()
        else
            @invisibles.activate()

    initInvisibles: -> @invisibles ?= new Invisibles @
