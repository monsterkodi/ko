# 000  000   000  00000000   0000000 
# 000  0000  000  000       000   000
# 000  000 0 000  000000    000   000
# 000  000  0000  000       000   000
# 000  000   000  000        0000000 
{
$} = require '../tools/tools'
log = require '../tools/log'

class Info
    
    constructor: (editor) ->                  
        
        window.editor.on   'focus', @setEditor
        window.logview.on  'focus', @setEditor
        window.terminal.on 'focus', @setEditor
                
        @elem = $('.info')

        @topline = document.createElement 'div'
        @topline.className = "info-line top"
        
        @cursorColumn = document.createElement 'span'
        @cursorColumn.className = "info-cursor-column"
        @topline.appendChild @cursorColumn

        @sticky = document.createElement 'span'
        @sticky.className = "info-sticky empty"
        @sticky.innerHTML = '○'
        @topline.appendChild @sticky

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
        
        @setEditor editor        

    setEditor: (editor) =>
        
        return if editor == @editor         
        
        if @editor?
            @editor.removeListener 'numLines',     @onNumLines
            @editor.removeListener 'lineInserted', @onNumLines
            @editor.removeListener 'lineDeleted',  @onNumLines
            @editor.removeListener 'selection',    @onSelection
            @editor.removeListener 'highlight',    @onHighlight
            @editor.removeListener 'cursor',       @onCursor
                
        @editor = editor
        
        @editor.on 'numLines',     @onNumLines
        @editor.on 'lineInserted', @onNumLines
        @editor.on 'lineDeleted',  @onNumLines
        @editor.on 'selection',    @onSelection
        @editor.on 'highlight',    @onHighlight
        @editor.on 'cursor',       @onCursor
        
        @onNumLines()

    onNumLines: => @lines.textContent = @editor.lines.length
    
    onCursor: => 
        @cursorLine.textContent = @editor.mainCursor[1]+1
        @cursorColumn.textContent = @editor.mainCursor[0]
        @cursors.textContent = @editor.cursors.length
        @cursorColumn.classList.toggle 'virtual', @editor.isCursorVirtual()
        @cursors.classList.toggle 'empty', @editor.cursors.length == 1
        @sticky.classList.toggle 'empty', not @editor.stickySelection
        
    onSelection: =>
        @selections.textContent = @editor.selections?.length
        @selections.classList.toggle 'empty', @editor.selections?.length == 0
        @sticky.classList.toggle 'empty', not @editor.stickySelection
        
    onHighlight: =>
        @highlights.textContent = @editor.highlights?.length
        @highlights.classList.toggle 'empty', @editor.highlights?.length == 0
    
module.exports = Info

