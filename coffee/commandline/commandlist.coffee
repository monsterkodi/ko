###
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000   0000000  000000000
000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  000          000
000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  0000000      000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000       000     000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  0000000      000
###

{ matchr, kerror } = require 'kxk'

TextEditor = require '../editor/texteditor'
Syntax     = require '../editor/syntax'
salt       = require '../tools/salt'

class CommandList extends TextEditor

    @: (@command, viewElem, opt) ->

        super viewElem,
            features: ['Scrollbar' 'Numbers' 'Meta']
            lineHeight: 1.4
            fontSize:   19
            syntaxName: opt.syntaxName ? 'ko'
            scrollOffset: 0

        @name      = 'commandlist-editor'
        @items     = []
        @maxLines  = 17
        @metaQueue = []

        @numbers.elem.style.fontSize = '19px'

    #  0000000   0000000    0000000    000  000000000  00000000  00     00   0000000
    # 000   000  000   000  000   000  000     000     000       000   000  000
    # 000000000  000   000  000   000  000     000     0000000   000000000  0000000
    # 000   000  000   000  000   000  000     000     000       000 0 000       000
    # 000   000  0000000    0000000    000     000     00000000  000   000  0000000

    addItems: (items) ->

        @clear()
        index = 0
        
        viewHeight = @size.lineHeight * Math.min @maxLines, items.length
        @view.style.height = "#{viewHeight}px"
        if viewHeight != @scroll.viewHeight
            @resized()

        for item in items
            continue if not item?
            text = (item.text ? item).trim?()
            continue if not text?.length
            
            @items.push item
            
            rngs = item.rngs ? []

            if item.clss?
                rngs.push
                    match: text
                    start: 0
                    clss:  item.clss
                    index: 0

            @appendMeta
                line: item.line ? ' '
                text: text
                rngs: rngs
                type: item.type ? @config.syntaxName
                clss: 'commandlistItem'
                index: index
                click: @onMetaClick

            index += 1            

    onMetaClick: (meta) =>

        @command.listClick meta[2].index

    #  0000000   00000000   00000000   00000000  000   000  0000000
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000

    appendLineDiss: (text, diss=[]) ->

        @syntax.setDiss @numLines(), diss if diss?.length
        @appendText text

    # 00     00  00000000  000000000   0000000
    # 000   000  000          000     000   000
    # 000000000  0000000      000     000000000
    # 000 0 000  000          000     000   000
    # 000   000  00000000     000     000   000
    
    appendMeta: (meta) ->

        if not meta?
            return kerror 'CommandList.appendMeta -- no meta?'
            
        @meta.addDiv @meta.append meta

        if meta.diss?
            @appendLineDiss Syntax.lineForDiss(meta.diss), meta.diss
        else if meta.text? and meta.text.trim().length
            r    = meta.rngs ? []
            text = meta.text.trim()
            rngs = r.concat Syntax.rangesForTextAndSyntax text, meta.type or 'ko'
            matchr.sortRanges rngs
            diss = matchr.dissect rngs, join:true
            @appendLineDiss text, diss            

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
        
        @items = []
        @meta.clear()
        super()

module.exports = CommandList
