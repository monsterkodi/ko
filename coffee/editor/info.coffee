# 000  000   000  00000000   0000000 
# 000  0000  000  000       000   000
# 000  000 0 000  000000    000   000
# 000  000  0000  000       000   000
# 000  000   000  000        0000000 
{
$} = require '../tools/tools'

class Info
    
    constructor: (@editor) ->                  
        
        @elem = $('.info')
        @editor.on 'numLines',     @onNumLines
        @editor.on 'lineInserted', @onNumLines
        @editor.on 'lineDeleted',  @onNumLines
        @editor.on 'selection',    @onSelection
        @editor.on 'cursorMoved',  @onCursor

        @topline = document.createElement 'div'
        @topline.className = "info-line top"
        
        @cursorColumn = document.createElement 'span'
        @cursorColumn.className = "info-cursor-column"
        @topline.appendChild @cursorColumn

        @cursors = document.createElement 'span'
        @cursors.className = "info-cursors"
        @topline.appendChild @cursors

        @selections = document.createElement 'span'
        @selections.className = "info-selections"
        @topline.appendChild @selections

        @highlights = document.createElement 'span'
        @highlights.className = "info-highlights"
        @topline.appendChild @highlights
        
        @elem.appendChild @topline

        @botline = document.createElement 'div'
        @botline.className = "info-line bot"
        
        @cursorLine = document.createElement 'span'
        @cursorLine.className = "info-cursor-line"
        @botline.appendChild @cursorLine
        
        @lines = document.createElement 'span'
        @lines.className = "info-lines"
        @botline.appendChild @lines
        
        @elem.appendChild @botline

    onNumLines: => @lines.textContent = @editor.lines.length
    
    onCursor: => 
        @cursorLine.textContent = @editor.mainCursor[1]+1
        @cursorColumn.textContent = @editor.mainCursor[0]
        @cursors.textContent = @editor.cursors.length
        @cursorColumn.classList.toggle 'virtual', @editor.isCursorVirtual()
        @cursors.classList.toggle 'single', @editor.cursors.length == 1
        
    onSelection: =>
        @selections.textContent = @editor.selections?.length
        @selections.classList.toggle 'empty', @editor.selections?.length == 0
        @highlights.textContent = @editor.highlights?.length
        @highlights.classList.toggle 'empty', @editor.highlights?.length == 0
    
module.exports = Info

