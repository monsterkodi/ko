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
        
        # 000000000   0000000   00000000         000      000  000   000  00000000
        #    000     000   000  000   000        000      000  0000  000  000     
        #    000     000   000  00000000         000      000  000 0 000  0000000 
        #    000     000   000  000              000      000  000  0000  000     
        #    000      0000000   000              0000000  000  000   000  00000000
        
        @topline = document.createElement 'div'
        @topline.className = "info-line top"
        
        @cursorColumn = document.createElement 'span'
        @cursorColumn.className = "info-cursor-column"
        @cursorColumn.onclick = => @editor.focus() + @editor.singleCursorAtPos [0, @editor.cursorPos()[1]]
        @topline.appendChild @cursorColumn

        @sticky = document.createElement 'span'
        @sticky.className = "info-sticky empty"
        @sticky.innerHTML = '○'
        @topline.appendChild @sticky

        @cursors = document.createElement 'span'
        @cursors.className = "info-cursors"
        @cursors.onclick = => @editor.focus() + @editor.clearCursors()
        @topline.appendChild @cursors
        
        @selections = document.createElement 'span'
        @selections.className = "info-selections"
        @selections.onclick = => @editor.focus() + @editor.clearSelections()
        @topline.appendChild @selections

        @highlights = document.createElement 'span'
        @highlights.className = "info-highlights"
        @highlights.onclick = => @editor.focus() + @editor.clearHighlights()
        @topline.appendChild @highlights
        
        @classes = document.createElement 'span'
        @classes.className = "info-classes empty"
        @classes.onclick = => @termCommand 'classes'
        @topline.appendChild @classes
        ipc.on 'classesCount', (event, count) => @onClassesCount count

        @funcs = document.createElement 'span'
        @funcs.className = "info-funcs empty"
        @funcs.onclick = => @termCommand 'funcs'
        @topline.appendChild @funcs
        ipc.on 'funcsCount', (event, count) => @onFuncsCount count

        @elem.appendChild @topline

        # 0000000     0000000   000000000        000      000  000   000  00000000
        # 000   000  000   000     000           000      000  0000  000  000     
        # 0000000    000   000     000           000      000  000 0 000  0000000 
        # 000   000  000   000     000           000      000  000  0000  000     
        # 0000000     0000000      000           0000000  000  000   000  00000000
        
        @botline = document.createElement 'div'
        @botline.className = "info-line bot"
        
        @cursorLine = document.createElement 'span'
        @cursorLine.className = "info-cursor-line"
        @cursorLine.onclick = => @editor.focus() + @editor.singleCursorAtPos [0, 0]
        @botline.appendChild @cursorLine
        
        @lines = document.createElement 'span'
        @lines.className = "info-lines"
        @lines.onclick = => @editor.focus() + @editor.singleCursorAtPos [0, @editor.lines.length]
        @botline.appendChild @lines

        @files = document.createElement 'span'
        @files.className = "info-files"
        @files.onclick = => @termCommand 'files'
        @botline.appendChild @files
        ipc.on 'filesCount', (event, count) => @onFilesCount count
        
        @words = document.createElement 'span'
        @words.className = "info-words empty"
        @words.onclick = => @termCommand 'words'
        @botline.appendChild @words
        window.editor.autocomplete.on 'wordCount', @onWordCount

        @elem.appendChild @botline
        
        @setEditor editor        

    termCommand: (cmmd) ->
        window.split.do 'reveal terminal'
        window.commandline.commands.term.execute cmmd

    #  0000000  00000000  000000000        00000000  0000000    000  000000000   0000000   00000000 
    # 000       000          000           000       000   000  000     000     000   000  000   000
    # 0000000   0000000      000           0000000   000   000  000     000     000   000  0000000  
    #      000  000          000           000       000   000  000     000     000   000  000   000
    # 0000000   00000000     000           00000000  0000000    000     000      0000000   000   000
    
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

    #  0000000   000   000                     
    # 000   000  0000  000                     
    # 000   000  000 0 000                     
    # 000   000  000  0000        000  000  000
    #  0000000   000   000        000  000  000
    
    onNumLines: (lc) => 
        @lines.textContent = shortCount lc ? 0
        
    onWordCount: (wc) =>
        @words.textContent = shortCount wc
        @words.classList.toggle 'empty', wc == 0

    onClassesCount: (cc) =>
        @classes.textContent = shortCount cc
        @classes.classList.toggle 'empty', cc == 0

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

