
# 0000000    000  00000000  00000000  0000000     0000000   00000000
# 000   000  000  000       000       000   000  000   000  000   000
# 000   000  000  000000    000000    0000000    000000000  0000000
# 000   000  000  000       000       000   000  000   000  000   000
# 0000000    000  000       000       0000000    000   000  000   000

{ packagePath, fileExists, elem, str, empty, path, fs, error, log, 
}        = require 'kxk'
forkfunc = require 'fork-func'
chokidar = require 'chokidar'

class Diffbar

    constructor: (@editor) ->

        @elem = elem 'canvas', class: 'diffbar'
        @elem.style.position = 'absolute'
        @elem.style.left = '0'
        @elem.style.top  = '0'
        @editor.view.appendChild @elem        
        @editor.on 'file', @onEditorFile
        @watch @editor.currentFile    

    watch: (file) ->
        
        @watcher?.close()
        delete @watcher
        pkgPath = packagePath file
        if pkgPath
            gitFile = path.join pkgPath, '.git', 'HEAD'
            if fileExists gitFile
                refPath = fs.readFileSync gitFile, 'utf8'
                if refPath.startsWith 'ref: '
                    gitFile = path.join pkgPath, '.git', refPath.slice 5
                log 'watching', gitFile
                @watcher = chokidar.watch gitFile #, ignoreInitial: true
                @watcher.on 'change', (p) =>
                    log 'watcher change:', p
                    @update()
                return
        log 'not watching'
    
    updateMetas: ->
        
        @clearMetas()
        
        return if not @changes
        
        for change in @changes.changes
            
            li = change.line-1
            
            if change.mod?
                for mod in change.mod
                    meta = 
                        line: li
                        clss: 'git mod'
                        change: mod
                    @editor.meta.addDiffMeta meta
                    li++
                    
            if change.add?
                for add in change.add
                    meta = 
                        line: li
                        clss: 'git add'
                        change: add
                    @editor.meta.addDiffMeta meta            
                    li++
                    
            else if change.del?
                meta = 
                    line: li
                    clss: 'git del'
                    change: change.del
                @editor.meta.addDiffMeta meta            

    onEditorFile: =>
        
        @watch @editor.currentFile
        @update()

    update: =>
        
        if @editor.currentFile
            forkfunc '../tools/gitdiff', @editor.currentFile, (err, changes) =>
                if not empty err
                    @changes = null
                    return
                if changes.file == @editor.currentFile
                    @changes = changes
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
                    o = 1
                    ctx.fillStyle = "rgba(255,0,0,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh
                    
                if change.add?
                    o = change.add.length
                    ctx.fillStyle = "rgba(160,160,255,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh

    clear: -> 
        
        @clearMetas()
        @elem.width = 2
        
    clearMetas: -> @editor.meta.delClass 'git'

module.exports = Diffbar
