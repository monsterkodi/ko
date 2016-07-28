#    0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000   0000000  000000000
#   000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  000          000   
#   000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  0000000      000   
#   000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000       000     000   
#    0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  0000000      000   

ViewBase = require '../editor/viewbase'
Syntax   = require '../editor/syntax'
matchr   = require '../tools/matchr'
salt     = require '../tools/salt'
log      = require '../tools/log'

class CommandList extends ViewBase

    constructor: (viewElem) ->
        
        @fontSizeDefault = 19
        @metaQueue = []
        
        super viewElem, 
            features: ['Scrollbar', 'Numbers', 'Meta']
            lineHeight: 1.4

        @numbers.elem.style.fontSize = "#{@fontSizeDefault}px"
        @setLines @lines

    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendLineDiss: (text, diss=[]) ->
        @syntax.setDiss @lines.length, diss if diss?.length
        @appendText text
            
    # 00     00  00000000  000000000   0000000 
    # 000   000  000          000     000   000
    # 000000000  0000000      000     000000000
    # 000 0 000  000          000     000   000
    # 000   000  00000000     000     000   000
    
    appendMeta: (meta) ->
        if not meta?
            alert('no meta?')
            throw new Error
        @meta.append meta
        del1st = @lines.length == 1 and @lines[0].length == 0
        if meta.diss?
            @appendLineDiss Syntax.lineForDiss(meta.diss), meta.diss 
        else if meta.text? and meta.text.trim().length
            r = meta.rngs ? []
            text = meta.text.trim()
            rngs = r.concat Syntax.rangesForTextAndSyntax text, meta.type or 'ko'
            matchr.sortRanges rngs
            diss = matchr.dissect rngs, join:true
            @appendLineDiss text, diss 
        else    
            @appendLineDiss ''
        if del1st
            @do.start()
            @do.delete 0 
            @do.end()
        
    queueMeta: (meta) ->
        @metaQueue.push meta
        clearTimeout @metaTimer
        @metaTimer = setTimeout @dequeueMeta, 0
        
    dequeueMeta: =>
        count = 0
        while meta = @metaQueue.shift()
            @appendMeta meta
            count += 1
            break if count > 20
        clearTimeout @metaTimer
        @metaTimer = setTimeout @dequeueMeta, 0 if @metaQueue.length
           
    clear: ->
        @meta.clear()
        super
            
module.exports = CommandList
