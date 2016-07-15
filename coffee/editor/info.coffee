# 000  000   000  00000000   0000000 
# 000  0000  000  000       000   000
# 000  000 0 000  000000    000   000
# 000  000  0000  000       000   000
# 000  000   000  000        0000000 
{
shortCount,
$} = require '../tools/tools'
log = require '../tools/log'
electron = require 'electron'
ipc = electron.ipcRenderer

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
        @lines.style.cursor = 'pointer'
        @lines.onclick = => @editor.singleCursorAtPos [0, @editor.lines.length]
        @botline.appendChild @lines

        @words = document.createElement 'span'
        @words.className = "info-words empty"
        @words.style.cursor = 'pointer'
        @words.onclick = => 
            log window.editor.autocomplete.wordlist
            window.split.show 'logview'
        @botline.appendChild @words
        window.editor.autocomplete.on 'wordCount', @onWordCount

        @funcs = document.createElement 'span'
        @funcs.className = "info-funcs empty"
        @funcs.style.cursor = 'pointer'
        @funcs.onclick = => 
            log "funcs:", ipc.sendSync 'indexer', 'funcs'
            window.split.show 'logview'
        @botline.appendChild @funcs
        ipc.on 'funcsCount', (event, count) => @onFuncsCount count

        @files = document.createElement 'span'
        @files.className = "info-files"
        @files.style.cursor = 'pointer'
        @files.onclick = => #log "files:", ipc.sendSync 'indexer', 'files'
            log "files:", (k for k,v of ipc.sendSync('indexer', 'files'))
            window.split.show 'logview'
        @botline.appendChild @files
        ipc.on 'filesCount', (event, count) => @onFilesCount count
        
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
        
        @onNumLines @editor.lines.length

    onNumLines: (lc) => 
        @lines.textContent = shortCount lc ? 0
        
    onWordCount: (wc) =>
        @words.textContent = shortCount wc
        @words.classList.toggle 'empty', wc == 0

    onFuncsCount: (fc) =>
        @funcs.textContent = shortCount fc
        @funcs.classList.toggle 'empty', fc == 0

    onFilesCount: (fc) =>
        @files.textContent = shortCount fc
        @files.classList.toggle 'empty', fc == 0
    
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

