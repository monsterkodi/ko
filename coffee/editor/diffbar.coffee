# 0000000    000  00000000  00000000  0000000     0000000   00000000
# 000   000  000  000       000       000   000  000   000  000   000
# 000   000  000  000000    000000    0000000    000000000  0000000
# 000   000  000  000       000       000   000  000   000  000   000
# 0000000    000  000       000       0000000    000   000  000   000

{ elem, elem, str, error, log, 
}        = require 'kxk'
forkfunc = require 'fork-func'

class Diffbar

    constructor: (@editor) ->

        @elem = elem 'canvas', class: 'gitdiff'
        @elem.style.position = 'absolute'
        @elem.style.left = '0'
        @elem.style.top = '0'
        @editor.view.appendChild @elem
        
        @editor.on 'viewHeight', @paint
        @editor.on 'changed',    @update
        @editor.on 'file',       @update
    
    update: =>
        if @editor.currentFile
            # log '@editor.currentFile', @editor.currentFile
            forkfunc '../tools/gitdiff', @editor.currentFile, (err, @changes) =>
                error "gitdiff failed: #{str err}" if err
                @paint()
        else
            @changes = null
            @paint()
            
    paint: =>
        x = 2
        w = 4
        h = Math.min @editor.scroll.fullHeight, @editor.view.clientHeight
        lh = h / @editor.numLines()

        ctx = @elem.getContext '2d'
        @elem.width = w
        @elem.height = h
        return if not @changes
        # log 'paint', @changes, w, h
        for change in @changes.changes
            li = change.line - 1
            if change.new?
                if change.old?
                    ctx.fillStyle = 'rgba(100,100,200,1)'
                else
                    ctx.fillStyle = 'rgba(0,100,0,1)'
                ctx.fillRect x, li * lh, w, change.new.length * lh
            else
                ctx.fillStyle = 'rgba(255,155,0,1)'
                ctx.fillRect x, li * lh, w, lh                    
        
module.exports = Diffbar
