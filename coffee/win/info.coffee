
# 000  000   000  00000000   0000000 
# 000  0000  000  000       000   000
# 000  000 0 000  000000    000   000
# 000  000  0000  000       000   000
# 000  000   000  000        0000000 

{ shortCount, post, elem, log, $, _
} = require 'kxk'
Tooltip = require '../tools/tooltip'

class Info
    
    constructor: (editor) ->                  
        
        window.editor.on   'focus', @setEditor
        window.logview.on  'focus', @setEditor
        window.terminal.on 'focus', @setEditor

        tooltip = (e,t) -> new Tooltip elem:e, text:t, x:0, y:1, textSize: 11, keep:true
                
        @elem =$ 'info' 
        
        # 000000000   0000000   00000000 
        #    000     000   000  000   000
        #    000     000   000  00000000 
        #    000     000   000  000      
        #    000      0000000   000      
        
        @topline = elem class: "info-line top"
        
        @cursorColumn = elem 'span', class: "info-cursor-column"
        @cursorColumn.onclick = => @editor.focus() + @editor.singleCursorAtPos [0, @editor.cursorPos()[1]]
        @topline.appendChild @cursorColumn
        tooltip @cursorColumn, 'x'

        @sticky = elem 'span', class: "info-sticky empty"
        @sticky.innerHTML = '○'
        @topline.appendChild @sticky

        @cursors = elem 'span', class: "info-cursors"
        @cursors.onclick = => @editor.focus() + @editor.clearCursors()
        @topline.appendChild @cursors
        tooltip @cursors, 'cursors'
        
        @selecti = elem 'span', class: "info-selections"
        @selecti.onclick = => @editor.focus() + @editor.selectNone()
        @topline.appendChild @selecti
        tooltip @selecti, 'selections'

        @highlig = elem 'span', class: "info-highlights"
        @highlig.onclick = => @editor.focus() + @editor.clearHighlights()
        @topline.appendChild @highlig
        tooltip @highlig, 'highlights'
        
        @classes = elem 'span', class: "info-classes empty"
        @classes.onclick = (e) => @onClick e, 'class'
        @topline.appendChild @classes
        tooltip @classes, 'classes'

        @funcs = elem 'span', class: "info-funcs empty"
        @funcs.onclick = (e) => @onClick e, 'func'
        @topline.appendChild @funcs
        tooltip @funcs, 'funcs'
        
        post.on 'classesCount', (count) => @onClassesCount count
        post.on 'funcsCount', (count) => @onFuncsCount count

        @elem.appendChild @topline

        # 0000000     0000000   000000000
        # 000   000  000   000     000   
        # 0000000    000   000     000   
        # 000   000  000   000     000   
        # 0000000     0000000      000   
        
        @botline = elem class: "info-line bot"
        
        @cursorLine = elem 'span', class: "info-cursor-line"
        @cursorLine.onclick = => @editor.focus() + @editor.singleCursorAtPos [0, 0]
        @botline.appendChild @cursorLine
        tooltip @cursorLine, 'y'
        
        @lines = elem 'span', class: "info-lines"
        @lines.onclick = => @editor.focus() + @editor.singleCursorAtPos [0, @editor.numLines()]
        @botline.appendChild @lines
        tooltip @lines, 'lines'

        @files = elem 'span', class: "info-files"
        @files.onclick = (e) => @onClick e, 'file'
        @botline.appendChild @files
        tooltip @files, 'files'
        
        @words = elem 'span', class: "info-words empty"
        @words.onclick = (e) => @onClick e, 'word'
        @botline.appendChild @words
        tooltip @words, 'words'
        
        post.on 'filesCount', (count) => @onFilesCount count
        window.editor.autocomplete.on 'wordCount', @onWordCount # use post

        @elem.appendChild @botline
        
        @setEditor editor        

    onClick: (event, cmd) ->
        if event.metaKey
            window.commandline.commands.term.execute cmd
        else
            window.commandline.commands.coffee.execute cmd

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
        
        @onNumLines @editor.numLines()

    # 00000000   00000000  000       0000000    0000000   0000000  
    # 000   000  000       000      000   000  000   000  000   000
    # 0000000    0000000   000      000   000  000000000  000   000
    # 000   000  000       000      000   000  000   000  000   000
    # 000   000  00000000  0000000   0000000   000   000  0000000  
    
    reload: =>
        @onClassesCount _.size post.get 'indexer', 'classes'
        @onFuncsCount   _.size post.get 'indexer', 'funcs'
        @onFilesCount   _.size post.get 'indexer', 'files'

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
        @cursorLine.textContent = @editor.mainCursor()[1]+1
        @cursorColumn.textContent = @editor.mainCursor()[0]
        @cursors.textContent = @editor.numCursors()
        @cursorColumn.classList.toggle 'virtual', @editor.isCursorVirtual()
        @cursors.classList.toggle 'empty', @editor.numCursors() == 1
        @sticky.classList.toggle 'empty', not @editor.stickySelection
        
    onSelection: =>
        @selecti.textContent = @editor.numSelections()
        @selecti.classList.toggle 'empty', @editor.numSelections() == 0
        @sticky.classList.toggle 'empty', not @editor.stickySelection
        
    onHighlight: =>
        @highlig.textContent = @editor.numHighlights()
        @highlig.classList.toggle 'empty', @editor.numHighlights() == 0
    
module.exports = Info

