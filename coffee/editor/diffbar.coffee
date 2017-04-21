# 0000000    000  00000000  00000000  0000000     0000000   00000000
# 000   000  000  000       000       000   000  000   000  000   000
# 000   000  000  000000    000000    0000000    000000000  0000000
# 000   000  000  000       000       000   000  000   000  000   000
# 0000000    000  000       000       0000000    000   000  000   000

{ elem, str, error, log, 
}        = require 'kxk'
forkfunc = require 'fork-func'

class Diffbar

    constructor: (@editor) ->

        @elem = elem 'canvas', class: 'diffbar'
        @elem.style.position = 'absolute'
        @elem.style.left = '0'
        @elem.style.top  = '0'
        @editor.view.appendChild @elem
        
        @editor.on 'viewHeight', @paint
        @editor.on 'file',       @update
        @editor.on 'save',       @update
    
    updateMetas: ->
        
        @editor.meta.clear()
        return if not @changes
        
        for change in @changes.changes
            
            li = change.line-1
            
            if change.mod?
                for mod in change.mod
                    meta = 
                        line: li
                        clss: 'git mod'
                    @editor.meta.addDiffMeta meta
                    li++
                    
            if change.add?
                for add in change.add
                    meta = 
                        line: li
                        clss: 'git add'
                    @editor.meta.addDiffMeta meta            
                    li++
                    
            else if change.del?
                meta = 
                    line: li
                    clss: 'git del'
                @editor.meta.addDiffMeta meta            

    update: =>
        
        if @editor.currentFile
            forkfunc '../tools/gitdiff', @editor.currentFile, (err, @changes) =>
                error "gitdiff failed: #{str err}" if err
                @paint()
        else
            @changes = null
            @paint()
            
    paint: =>
        
        @updateMetas()
        
        w  = 2
        h  = Math.min @editor.scroll.fullHeight, @editor.view.clientHeight
        lh = h / @editor.numLines()

        ctx = @elem.getContext '2d'
        @elem.width  = w
        @elem.height = h
        
        alpha = (o) -> 0.5 + Math.max 0, (16-o*lh)*(0.5/16)

        if @changes

            for change in @changes.changes
                
                li = change.line - 1
                
                if change.mod?
                    o = change.mod.length
                    ctx.fillStyle = "rgba(0,255,0,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh
                    li += o
                    
                if change.del?
                    o = change.del.length
                    ctx.fillStyle = "rgba(255,0,0,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh
                    
                if change.add?
                    o = change.add.length
                    ctx.fillStyle = "rgba(160,160,255,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh
        
module.exports = Diffbar
