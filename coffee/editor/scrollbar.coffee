#  0000000   0000000  00000000    0000000   000      000      0000000     0000000   00000000
# 000       000       000   000  000   000  000      000      000   000  000   000  000   000
# 0000000   000       0000000    000   000  000      000      0000000    000000000  0000000
#      000  000       000   000  000   000  000      000      000   000  000   000  000   000
# 0000000    0000000  000   000   0000000   0000000  0000000  0000000    000   000  000   000

{ stopEvent, clamp, drag, log
} = require 'kxk'

class Scrollbar

    constructor: (@editor) ->
        @editor.scroll.on 'scroll', @update

        @elem = document.createElement 'div'
        @elem.className = 'scrollbar left'
        @editor.view.appendChild @elem

        @handle = document.createElement 'div'
        @handle.className = 'scrollhandle left'
        @elem.appendChild @handle

        @drag = new drag
            target:  @elem
            onStart: @onStart
            onMove:  @onDrag
            cursor:  'ns-resize'

        @elem.addEventListener 'wheel', @onWheel
        @editor.view.addEventListener 'wheel',  @onWheel
        
        @scrollX = @scrollY = 0
        window.requestAnimationFrame @scrollAnim

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
        @editor.scrollTo ly

    # 0000000    00000000    0000000    0000000
    # 000   000  000   000  000   000  000
    # 000   000  0000000    000000000  000  0000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000   0000000

    onDrag: (drag) =>
        delta = (drag.delta.y / (@editor.scroll.viewLines * @editor.scroll.lineHeight)) * @editor.scroll.fullHeight
        @editor.scrollBy delta

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
        
        stopEvent event    
        
    scrollAnim: =>
        if @scrollX or @scrollY
            @editor.scrollBy @scrollY, @scrollX
            @scrollX  = 0
            @scrollY  = 0
        window.requestAnimationFrame @scrollAnim

    onScroll: (event) => @editor.updateScrollOffset()

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

            @handle.style.top     = "#{scrollTop}px"
            @handle.style.height  = "#{scrollHeight}px"
            @handle.style.width   = "2px"
            cf = 1 - clamp 0, 1, (scrollHeight-10)/200
            cs = "rgb(#{parseInt 47+cf*80},#{parseInt 47+cf*80},#{parseInt 47+cf*208})"
            @handle.style.backgroundColor = cs

module.exports = Scrollbar
