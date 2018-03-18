###
 0000000   0000000  00000000    0000000   000      000      0000000     0000000   00000000
000       000       000   000  000   000  000      000      000   000  000   000  000   000
0000000   000       0000000    000   000  000      000      0000000    000000000  0000000
     000  000       000   000  000   000  000      000      000   000  000   000  000   000
0000000    0000000  000   000   0000000   0000000  0000000  0000000    000   000  000   000
###

{ stopEvent, elem, clamp, drag, log } = require 'kxk'

scheme = require '../tools/scheme'

class Scrollbar

    constructor: (@editor) ->

        @editor.scroll.on 'scroll',     @update
        @editor.on 'linesShown',        @update
        @editor.on 'viewHeight',        @update

        @elem = elem class: 'scrollbar left'
        @editor.view.appendChild @elem

        @handle = elem class: 'scrollhandle left'
        @elem.appendChild @handle

        @scrollX  = 0
        @scrollY  = 0

        @drag = new drag
            target:  @elem
            onStart: @onStart
            onMove:  @onDrag
            cursor:  'ns-resize'

        @elem       .addEventListener 'wheel', @onWheel
        @editor.view.addEventListener 'wheel', @onWheel

    del: ->
        
        @elem       .removeEventListener 'wheel', @onWheel
        @editor.view.removeEventListener 'wheel', @onWheel

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000
    # 0000000      000     000000000  0000000       000
    #      000     000     000   000  000   000     000
    # 0000000      000     000   000  000   000     000

    onStart: (drag, event) =>

        br = @elem.getBoundingClientRect()
        sy = clamp 0, @editor.scroll.viewHeight, event.clientY - br.top
        ln = parseInt @editor.scroll.numLines * sy/@editor.scroll.viewHeight
        ly = (ln - @editor.scroll.viewLines / 2) * @editor.scroll.lineHeight
        @editor.scroll.to ly

    # 0000000    00000000    0000000    0000000
    # 000   000  000   000  000   000  000
    # 000   000  0000000    000000000  000  0000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000   0000000

    onDrag: (drag) =>

        delta = (drag.delta.y / (@editor.scroll.viewLines * @editor.scroll.lineHeight)) * @editor.scroll.fullHeight
        @editor.scroll.by delta

    # 000   000  000   000  00000000  00000000  000
    # 000 0 000  000   000  000       000       000
    # 000000000  000000000  0000000   0000000   000
    # 000   000  000   000  000       000       000
    # 00     00  000   000  00000000  00000000  0000000

    onWheel: (event) =>

        scrollFactor = ->
            f  = 1
            f *= 1 + 1 * event.shiftKey
            f *= 1 + 3 * event.metaKey
            f *= 1 + 7 * event.altKey

        if Math.abs(event.deltaX) >= 2*Math.abs(event.deltaY) or Math.abs(event.deltaY) == 0
            @scrollX += event.deltaX
        else
            @scrollY += event.deltaY * scrollFactor()

        if @scrollX or @scrollY
            window.requestAnimationFrame @wheelScroll

        stopEvent event

    wheelScroll: =>

        @editor.scroll.by @scrollY, @scrollX
        @scrollX = @scrollY = 0

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    update: =>

        if @editor.numLines() * @editor.size.lineHeight < @editor.viewHeight()
            
            @handle.style.top     = "0"
            @handle.style.height  = "0"
            @handle.style.width   = "0"
            
        else
            
            bh           = @editor.numLines() * @editor.size.lineHeight
            vh           = Math.min (@editor.scroll.viewLines * @editor.scroll.lineHeight), @editor.viewHeight()
            scrollTop    = parseInt (@editor.scroll.scroll / bh) * vh
            scrollHeight = parseInt ((@editor.scroll.viewLines * @editor.scroll.lineHeight) / bh) * vh
            scrollHeight = Math.max scrollHeight, parseInt @editor.size.lineHeight/4
            scrollTop    = Math.min scrollTop, @editor.viewHeight()-scrollHeight
            scrollTop    = Math.max 0, scrollTop

            @handle.style.top    = "#{scrollTop}px"
            @handle.style.height = "#{scrollHeight}px"
            @handle.style.width  = "2px"

            cf = 1 - clamp 0, 1, (scrollHeight-10)/200
            longColor  = scheme.colorForClass 'scrollbar long'
            shortColor = scheme.colorForClass 'scrollbar short'
            cs = scheme.fadeColor longColor, shortColor, cf
            @handle.style.backgroundColor = cs

module.exports = Scrollbar
