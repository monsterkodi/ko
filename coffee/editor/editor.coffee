# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000
{
extName,
clamp,
first,
last,
log,
str,
$}      = require 'kxk'
salt    = require '../tools/salt'
watcher = require './watcher'
Buffer  = require './buffer'
Syntax  = require './syntax'
undo    = require './undo'
path    = require 'path'
fs      = require 'fs'
_       = require 'lodash'

class Editor extends Buffer

    constructor: () ->
        @surroundStack      = []
        @surroundCharacters = []
        @surroundPairs      = Object.create null
        @currentFile        = null
        @indentString       = _.padStart "", 4
        @stickySelection    = false
        @watch              = null
        @dbg                = false
        super
        @do                 = new undo @
        @setupFileType()

    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000 
    # 000000000  00000000   00000000   000        00000  
    # 000   000  000        000        000         000   
    # 000   000  000        000        0000000     000   
    
    applyForeignLineChanges: (lineChanges) =>

        @do.start()
        for change in lineChanges
            switch change.change
                when 'changed'  then @do.change change.doIndex, change.after
                when 'inserted' then @do.insert change.doIndex, change.after
                when 'deleted'  then @do.delete change.doIndex
                else
                    log "[WARNING] editor.applyForeignLineChanges wtf?"
        @do.end foreign: true

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    stopWatcher: ->
        if @watch?
            @watch?.stop()
            @watch = null

    setCurrentFile: (file, opt) ->
        @setSalterMode false
        @stopWatcher()
        @currentFile = file
        if not opt?.keepUndo? or opt.keepUndo == false
            @do.reset()
        @updateTitlebar()
        if file?
            @watch = new watcher @
            @setText fs.readFileSync file, encoding: 'utf8'
        else
            @watch = null
            @setLines []
        @setupFileType()

    # 000000000  000   000  00000000   00000000
    #    000      000 000   000   000  000     
    #    000       00000    00000000   0000000 
    #    000        000     000        000     
    #    000        000     000        00000000
    
    setupFileType: ->
        oldType   = @fileType
        @fileType = 'txt'
        @fileType = Syntax.shebang @lines[0] if @numLines()
        if @fileType == 'txt' and @currentFile?
            ext = extName @currentFile
            if ext in Syntax.syntaxNames
                @fileType = ext
                
        # _______________________________________________________________ strings
        
        @stringCharacters =
            "'":  'single'
            '"':  'double'
        switch @fileType
            when 'md' then @stringCharacters['*'] = 'bold'
            when 'noon' then @stringCharacters['|'] = 'pipe'

        # _______________________________________________________________ brackets
        
        @bracketCharacters = 
            open:
                '[': ']'
                '{': '}'
                '(': ')'
            close: {} # reverse map, not needed?
            regexps: []
                
        switch @fileType
            when 'html' then @bracketCharacters.open['<'] = '>'

        for k,v of @bracketCharacters.open
            @bracketCharacters.close[v] = k
        
        @bracketCharacters.regexp = []
        for key in ['open', 'close']
            cstr = _.keys(@bracketCharacters[key]).join ''
            reg = new RegExp "[#{_.escapeRegExp cstr}]"
            @bracketCharacters.regexps.push [reg, key]
        
        # _______________________________________________________________ surround
        
        @surroundPairs = 
            '[': ['[', ']']
            ']': ['[', ']']
            '{': ['{', '}']
            '}': ['{', '}']
            '(': ['(', ')']
            ')': ['(', ')']
            '<': ['<', '>']
            '>': ['<', '>']
            '#': ['#{', '}']
            "'": ["'", "'"]
            '"': ['"', '"']
            '*': ['*', '*']                    
        
        @surroundCharacters = "{}[]()\"'".split ''
        switch @fileType
            when 'html'   then @surroundCharacters = @surroundCharacters.concat ['<','>']
            when 'coffee' then @surroundCharacters.push '#'
            when 'md'     
                @surroundCharacters = @surroundCharacters.concat ['*','<']
                @surroundPairs['<'] = ['<!---', '--->']
            
        # _______________________________________________________________ indent
        
        @indentNewLineMore = null
        @indentNewLineLess = null
        @insertIndentedEmptyLineBetween = '{}'
        
        switch @fileType
            when 'coffee' 
                @indentNewLineMore = 
                    lineEndsWith: ['->', '=>', ':', '=']
                    beforeRegExp: /(^|\s)(else\s*$|switch\s|for\s|while\s|class\s)/
                    lineRegExp:   /^(\s+when|\s*if|\s*else\s+if\s+)(?!.*\sthen\s)/
                @indentNewLineLess = 
                    beforeRegExp: /^s+return/
                
        # _______________________________________________________________ comment
        
        @lineComment = switch @fileType
            when 'cpp', 'cc', 'hpp', 'h', 'styl', 'pug' then '//'
            else '#'  
            
        if oldType != @fileType
            @emit 'fileTypeChanged', @fileType
                
    #  0000000  00000000  000000000         000      000  000   000  00000000   0000000  
    # 000       000          000            000      000  0000  000  000       000       
    # 0000000   0000000      000            000      000  000 0 000  0000000   0000000   
    #      000  000          000            000      000  000  0000  000            000  
    # 0000000   00000000     000            0000000  000  000   000  00000000  0000000   

    setText: (text="") -> 
        rgx = new RegExp '\t', 'g'
        indent = @indentString
        @setLines text.split(/\n/).map (l) -> l.replace rgx, indent

    setLines: (lines) ->
        super lines
        @emit 'linesSet', @lines
        
    #  0000000   0000000   000      000000000  00000000  00000000   
    # 000       000   000  000         000     000       000   000  
    # 0000000   000000000  000         000     0000000   0000000    
    #      000  000   000  000         000     000       000   000  
    # 0000000   000   000  0000000     000     00000000  000   000  
    
    startSalter: (opt) ->
        cp = @cursorPos()
        if not opt?.word and rgs = @salterRangesAtPos() # edit existing header
            cols = @columnsInSalt (@textInRange r for r in rgs)
            ci = 0
            while ci < cols.length and cp[0] > cols[ci]
                ci += 1
            col = cols[ci]
            @do.start()
            newCursors = ([col, r[0]] for r in rgs)
            @do.cursor newCursors, main: 'last'
            @do.end()
        else # create new header
            word = opt?.word ? @selectionTextOrWordAtCursor().trim()
            if @textInRange(@rangeForLineAtIndex cp[1]).trim().length
                indt = _.padStart '', @indentationAtLineIndex cp[1]
            else
                indt = @indentStringForLineAtIndex cp[1]
            stxt = word.length and salt(word).split('\n') or ['', '', '', '', '']
            stxt = ("#{indt}#{@lineComment} #{s}  " for s in stxt)
            @do.start()
            newCursors = []
            @do.insert cp[1], indt
            li = cp[1]+1
            for s in stxt
                @do.insert li, s
                newCursors.push [s.length, li]
                li += 1
            @do.cursor newCursors, main: 'last'
            @do.select []
            @do.end()
        @setSalterMode true
    
    insertSalterCharacter: (ch) ->
        if ch == ' '
            char = ['    ', '    ', '    ', '    ', '    ']
        else
            char = salt(ch).split '\n'
        if char.length == 5
            @paste ("#{s}  " for s in char).join '\n'
        else
            @setSalterMode false
        true
    
    deleteSalterCharacter: ->
        return if not @salterMode
        cp = @cursorPos()
        if rgs = @salterRangesAtPos()
            cols = @columnsInSalt (@do.textInRange r for r in rgs)
            ci = cols.length-1
            while ci > 0 and cols[ci-1] >= cp[0]
                ci -= 1
            if ci > 0
                length = cols[ci]-cols[ci-1]
                for r in rgs
                    @do.change r[0], @lines[r[0]].splice cols[ci-1], length
                @do.cursor ([cols[ci-1], r[0]] for r in rgs)
    
    checkSalterMode: ->        
        return if not @salterMode
        @setSalterMode false
        return if @numCursors() != 5
        cp = @cursors[0]
        for c in @cursors.slice 1
            return if c[0] != cp[0]
            return if c[1] != cp[1]+1
            cp = c
        rgs = @salterRangesAtPos()
        return if not rgs? or rgs[0][0] != @cursors[0][1]
        cols = @columnsInSalt (@textInRange r for r in rgs)
        return if @cursors[0][0] < cols[0]
        @setSalterMode true
    
    columnsInSalt: (salt) ->
        min = _.min (s.search /0/ for s in salt)
        max = _.max (s.length for s in salt)
        cols = [min]
        for col in [min..max]
            s = 0
            for i in [0...5]
                s += 1 if salt[i].slice(col-2, col) in ['  ', '# ']
            cols.push col if s == 5
        cols.push max
        cols
    
    salterRangesAtPos: (p=@cursorPos()) ->
        salterRegExp = new RegExp("^\\s*#{@lineComment}[0\\s]+$")
        rgs = []
        li = p[1]
        while rgs.length < 5 and li < @numLines() and salterRegExp.test @lines[li]
            rgs.push @rangeForLineAtIndex li
            li += 1
        return if not rgs.length
        li = p[1]-1
        while rgs.length < 5 and li >= 0 and salterRegExp.test @lines[li]
            rgs.unshift @rangeForLineAtIndex li
            li -= 1
        return rgs if rgs.length == 5
      
    setSalterMode: (active=true) ->
        @salterMode = active
        @layerDict?['cursors']?.classList.toggle "salterMode", active
                            
    #  0000000  000  000   000   0000000   000      00000000
    # 000       000  0000  000  000        000      000     
    # 0000000   000  000 0 000  000  0000  000      0000000 
    #      000  000  000  0000  000   000  000      000     
    # 0000000   000  000   000   0000000   0000000  00000000
    
    singleCursorAtPos: (p, opt = extend:false) ->
        if @numLines() == 0
            @do.start()
            @do.insert 0, ''
            @do.end()
        p = @clampPos p
        @do.start()
        @startSelection opt
        @do.cursor [[p[0], p[1]]]
        @endSelection opt
        @do.end()
        
    selectSingleRange: (r, opt) ->
        if not r?
            log "[WARNING] editor.#{name}.selectSingleRange -- undefined range!"
            return
        @do.start()
        @do.cursor [[opt?.before and r[1][0] or r[1][1], r[0]]]
        @do.select [r]
        @do.end()
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    startStickySelection: () -> 
        @stickySelection = true
        @updateTitlebar?()
        @emit 'selection'

    endStickySelection: () ->
        @stickySelection = false
        @updateTitlebar?()
        @emit 'selection'

    startSelection: (opt = extend:false) ->
        if opt?.extend 
            if not @startSelectionCursors
                @startSelectionCursors = @do.cursors()
                if not @stickySelection
                    @do.select @rangesFromPositions @startSelectionCursors
        else
            @startSelectionCursors = null
            if not @stickySelection
                @do.select []
                    
    endSelection: (opt = extend:false) ->
        if not opt?.extend
            if @do.numSelections() and not @stickySelection
                @selectNone()
            @startSelectionCursors = null
        else
            oldCursors = @startSelectionCursors ? @state.cursors()
            newSelection = @stickySelection and @do.selections() or []            
            newCursors = @do.cursors()
            
            if oldCursors.length != newCursors.length
                log "[WARNING] editor.#{@name}.endSelection -- oldCursors.size != newCursors.size", oldCursors.length, newCursors.length
            
            for ci in [0...@do.numCursors()]
                oc = oldCursors[ci]
                nc = newCursors[ci]
                ranges = @rangesBetweenPositions oc, nc, true #< extend to full lines if cursor at start of line                
                newSelection = newSelection.concat ranges

            @do.select newSelection
            
        @checkSalterMode()      

    textOfSelectionForClipboard: -> 
        @selectMoreLines() if @numSelections() == 0
        @textOfSelection()
        
    textOfSelection: ->
        t = []
        for s in @selections
            t.push @textInRange s
        t.join '\n'

    #  0000000   0000000    0000000         00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000       000   000  000   000  0000  000  000        000     
    # 000000000  000   000  000   000       0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000       000   000  000   000  000  0000  000   000  000     
    # 000   000  0000000    0000000         000   000  000   000  000   000   0000000   00000000
    
    addRangeToSelection: (range) ->
        @do.start()
        newSelections = @do.selections()
        newSelections.push range
        newCursors = (@rangeEndPos(r) for r in newSelections)
        @do.cursor newCursors, main:'last'
        @do.select newSelections
        @do.end()

    removeFromSelection: (sel) ->
        @do.start()
        si = @selections.indexOf sel
        newSelections = @do.selections()
        newSelections.splice si, 1
        if newSelections.length
            newCursors = (@rangeEndPos(r) for r in newSelections)
            @do.cursor newCursors, main:(newCursors.length+si-1) % newCursors.length
        @do.select newSelections
        @do.end()        

    selectNone: => 
        @do.start()
        @do.select []
        @do.end()
        
    selectAll: => 
        @do.start()
        @do.select @rangesForAllLines()
        @do.end()
        
    selectInverted: => 
        invertedRanges = []        
        sc = @selectedAndCursorLineIndices()
        for li in [0...@numLines()]
            if li not in sc
                invertedRanges.push @rangeForLineAtIndex li
        if invertedRanges.length
            @do.start()
            @do.cursor [@rangeStartPos first invertedRanges]
            @do.select invertedRanges
            @do.end()
    
    # 00000000  000   000  000      000            000      000  000   000  00000000   0000000
    # 000       000   000  000      000            000      000  0000  000  000       000     
    # 000000    000   000  000      000            000      000  000 0 000  0000000   0000000 
    # 000       000   000  000      000            000      000  000  0000  000            000
    # 000        0000000   0000000  0000000        0000000  000  000   000  00000000  0000000 

    selectMoreLines: ->
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()
        
        selectCursorLineAtIndex = (c,i) =>
            range = [i, [0, @do.line(i).length]] 
            newSelections.push range
            @cursorSet c, @rangeEndPos range
            
        start = false
        for c in newCursors
            if not @isSelectedLineAtIndex c[1]
                selectCursorLineAtIndex c, c[1]
                start = true
                
        if not start
            for c in newCursors
                selectCursorLineAtIndex c, c[1]+1 if c[1] < @numLines()-1
                
        @do.select newSelections
        @do.cursor newCursors
        @do.end()       

    selectLessLines: -> 
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()
        
        for c in newCursors.reversed()
            thisSel = @selectionsInLineAtIndex(c[1])
            if thisSel.length
                if @isSelectedLineAtIndex c[1]-1
                    s = @selectionsInLineAtIndex(c[1]-1)[0]
                    @cursorSet c, s[1][1], s[0]
                newSelections.splice @indexOfSelection(thisSel[0]), 1

        @do.select newSelections
        @do.cursor newCursors
        @do.end()       

    moveLines: (dir='down') ->
        
        csr = @continuousCursorAndSelectedLineIndexRanges()
        
        return if not csr.length
        return if dir == 'up' and first(csr)[0] == 0
        return if dir == 'down' and last(csr)[1] == @numLines()-1
        
        d = dir == 'up' and -1 or 1
        
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()

        for r in csr.reversed()
            ls = []
            for li in [r[0]..r[1]]
                ls.push @do.line(li)
            
            switch dir 
                when 'up'   then (si = r[0]-1) ; ls.push @do.line(si)
                when 'down' then (si = r[0])   ; ls.unshift @do.line(r[1]+1)

            for i in [0...ls.length]
                @do.change si+i, ls[i]

        for ns in newSelections
            ns[0] += d
            
        for nc in newCursors
            @cursorDelta nc, 0, d
                
        @do.select newSelections
        @do.cursor newCursors
        @do.end()       

    duplicateLines: (dir='down') ->
        
        csr = @continuousCursorAndSelectedLineIndexRanges()
        
        return if not csr.length
        
        @do.start()
        newCursors = @do.cursors()

        for r in csr.reversed()
            ls = []
            for li in [r[0]..r[1]]
                ls.push @do.line(li)
            
            for i in [0...ls.length]
                @do.insert r[1]+1+i, ls[i]
                
            for nc in @positionsBelowLineIndexInPositions r[1]+1, newCursors
                @cursorDelta nc, 0, ls.length # move cursors below inserted lines down
                
            if dir == 'down'
                for i in [0...ls.length]
                    for nc in @positionsForLineIndexInPositions r[0]+i, newCursors
                        @cursorDelta nc, 0, ls.length # move cursors in inserted lines down

        @do.select []
        @do.cursor newCursors
        @do.end()       
            
    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000
    # 000   000  000  000        000   000  000      000  000        000   000     000   
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000   
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000   
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000   

    highlightText: (text, opt) -> # called from find command
        hls = @rangesForText text, opt
        if hls.length
            switch opt?.select
                when 'after'  then @selectSingleRange @rangeAfterPosInRanges(@cursorPos(), hls) ? first hls
                when 'before' then @selectSingleRange @rangeBeforePosInRanges(@cursorPos(), hls) ? first hls
                when 'first'  then @selectSingleRange first hls
            @scrollCursorToTop() if not opt?.noScroll
        @setHighlights hls
        @renderHighlights()
        @emit 'highlight'

    highlightTextOfSelectionOrWordAtCursor: -> # command+e       
            
        if @numSelections() == 0
            srange = @rangeForWordAtPos @cursorPos()
            @selectSingleRange srange
            
        text = @textInRange @selections[0]
        if text.length
            
            if @numHighlights()
                if text == @textInRange first @highlights # see if we can grow the current selection
                    largerRange = [@selections[0][0], [@selections[0][1][0]-1, @selections[0][1][1]]]
                    largerText = @textInRange largerRange
                    if largerText[0] in "@#$%&*+-!?:.'\"/" or /[A-Za-z]/.test largerText[0]
                        if largerText[0] in "'\"" # grow strings in both directions
                            nr = [@selections[0][0], [@selections[0][1][0]-1, @selections[0][1][1]+1]] 
                            nt = @textInRange nr
                            if nt[nt.length-1] == largerText[0]
                                largerText = nt
                                largerRange = nr
                        else if /[A-Za-z]/.test largerText[0] # grow whole words
                            while largerRange[1][0] > 0 and /[A-Za-z]/.test @lines[largerRange[0]][largerRange[1][0]-1]
                                largerRange[1][0] -= 1
                                largerText = @textInRange largerRange
                        text = largerText                        
                        @selectSingleRange largerRange if @numSelections() == 1
            
            @setHighlights @rangesForText text, max:9999
            @renderHighlights()
            @emit 'highlight'
            
            # this should be done somewhere else (commandline or find/search commands)
            if window.split.commandlineVisible()
                window.commandline.startCommand 'find' if window.commandline.command?.prefsID not in ['search', 'find']
            window.commandline.commands.find.currentText = text
            window.commandline.commands.search.currentText = text
            window.commandline.setText text
            
            @focus()

    clearHighlights: ->
        if @numHighlights()
            @setHighlights []
            @emit 'highlight'

    highlightsSurroundingCursor: ->
        if @numHighlights() % 2 == 0
            @sortRanges @highlights
            if @numHighlights() == 2
                return @highlights
            else if @numHighlights() == 4
                if @areSameRanges [@highlights[1], @highlights[2]], @selections
                    return [@highlights[0], @highlights[3]]
                else
                    return [@highlights[1], @highlights[2]]

    selectBetweenSurround: ->
        if surr = @highlightsSurroundingCursor()
            @do.start()
            start = @rangeEndPos surr[0] 
            end = @rangeStartPos surr[1]
            s = @rangesBetweenPositions start, end
            s = @cleanRanges s
            if s.length
                @do.select s
                if @do.numSelections()
                    @do.cursor [@rangeEndPos(last s)], Main: 'closest'
            @do.end()
            
    selectSurround: ->
        if surr = @highlightsSurroundingCursor()
            @do.start()
            @do.select surr
            if @do.numSelections()
                @do.cursor (@rangeEndPos(r) for r in @do.selections()), main: 'closest'
            @do.end()

    selectAllHighlights: ->
        @do.start()
        if not @numHighlights()
            @highlightTextOfSelectionOrWordAtCursor()
        @do.select @do.highlights()
        if @do.numSelections()
            @do.cursor (@rangeEndPos(r) for r in @do.selections()), main: 'closest'
        @do.end()
    
    selectNextHighlight: -> # command+g
        if not @numHighlights()
            searchText = window.commandline.commands.find?.currentText
            @highlightText searchText if searchText?.length
        return if not @numHighlights()
        r = @rangeAfterPosInRanges @cursorPos(), @highlights
        r ?= first @highlights
        if r?
            @selectSingleRange r, before: r[2]?.value == 'close'
            @scrollCursorIntoView()

    selectPrevHighlight: -> # command+shift+g
        if not @numHighlights()
            searchText = window.commandline.commands.find?.currentText
            @highlightText searchText if searchText?.length
        return if not @numHighlights()
        r = @rangeBeforePosInRanges @cursorPos(), @highlights
        r ?= last @highlights
        @selectSingleRange r if r?

    highlightWordAndAddToSelection: -> # command+d
        cp = @cursorPos()
        if not @posInHighlights cp
            @highlightTextOfSelectionOrWordAtCursor() # this also selects
        else
            @do.start()
            sr = @rangeAtPosInRanges cp, @selections
            if sr # cursor in selection -> select next highlight
                r = @rangeAfterPosInRanges cp, @highlights
            else # select current highlight first
                r = @rangeAtPosInRanges cp, @highlights
            r ?= first @highlights
            @addRangeToSelection r
            @scrollCursorToTop()
            @do.end()
            
    removeSelectedHighlight: -> # command+shift+d
        cp = @cursorPos()
        sr = @rangeAtPosInRanges cp, @selections
        hr = @rangeAtPosInRanges cp, @highlights        
        @removeFromSelection sr if sr and hr

    # 00000000  00     00  000  000000000       00000000  0000000    000  000000000
    # 000       000   000  000     000          000       000   000  000     000   
    # 0000000   000000000  000     000          0000000   000   000  000     000   
    # 000       000 0 000  000     000          000       000   000  000     000   
    # 00000000  000   000  000     000          00000000  0000000    000     000   

    emitEdit: (action) ->
        mc = @mainCursor()
        @emit 'edit',
            action: action
            line:   @lines[mc[1]]
            before: @lines[mc[1]].slice 0, mc[0]
            after:  @lines[mc[1]].slice mc[0]
            cursor: mc
                    
    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000
    
    setCursor: (c,l) ->
        @do.start()
        @do.cursor [c,l]
        @do.end()
        
    toggleCursorAtPos: (p) ->
        if @isPosInPositions p, @state.cursors()
            @delCursorAtPos p
        else
            @addCursorAtPos p
        
    addCursorAtPos: (p) ->
        @do.start()
        newCursors = @do.cursors()
        newCursors.push p
        @do.cursor newCursors, main:'last'
        @do.end()
        
    delCursorAtPos: (p) ->
        oldCursors = @state.cursors()
        c = @posInPositions p, oldCursors
        if c and @numCursors() > 1
            @do.start()
            newCursors = @do.cursors()
            newCursors.splice oldCursors.indexOf(c), 1
            @do.cursor newCursors, main:'closest'
            @do.end()
           
    addCursors: (dir='down') ->
        return if @numCursors() >= 999
        @do.start()
        d = switch dir
            when 'up'    then -1
            when 'down'  then +1
        oldCursors = @state.cursors()
        newCursors = @do.cursors()
        for c in oldCursors
            if not @isPosInPositions [c[0], c[1]+d], oldCursors               
                newCursors.push [c[0], c[1]+d]
                break if newCursors.length >= 999
        @sortPositions newCursors
        main = switch dir
            when 'up'    then 'first'
            when 'down'  then 'last'
        @do.cursor newCursors, main:main
        @do.end()

    alignCursorsAndText: ->
        @do.start()
        newCursors = @do.cursors()
        newX = _.max (c[0] for c in newCursors)
        lines = {}
        for nc in newCursors
            lines[nc[1]] = nc[0]
            @cursorSet nc, newX, c[1]
        for li, cx of lines
            @do.change li, @lines[li].slice(0, cx) + _.padStart('', newX-cx) + @lines[li].slice(cx)
        @do.cursor newCursors
        @do.end()

    alignCursors: (dir='down') ->
        @do.start()
        newCursors = @do.cursors()
        charPos = switch dir
            when 'up'    then first(newCursors)[0]
            when 'down'  then last(newCursors)[0]
            when 'left'  then _.min (c[0] for c in newCursors)
            when 'right' then _.max (c[0] for c in newCursors)
        for c in newCursors
            @cursorSet c, charPos, c[1]
        main = switch dir
            when 'up'    then 'first'
            when 'down'  then 'last'
        @do.cursor newCursors, main:main
        @do.end()
        
    setCursorsAtSelectionBoundary: (leftOrRight='right') ->
        @do.start()
        i = leftOrRight == 'right' and 1 or 0
        newCursors = []
        main = 'last'
        for s in @selections
            p = @rangeIndexPos s,i
            newCursors.push p
            if @isCursorInRange s
                main = newCursors.indexOf p
        @do.cursor newCursors, main:main
        @do.end()       

    delCursors: (dir='up') ->
        @do.start()
        oldCursors = @state.cursors()
        newCursors = @do.cursors()
        main = null
        d = switch dir
            when 'up' 
                for c in oldCursors.reversed()
                    if @isPosInPositions([c[0], c[1]-1], oldCursors) and not @isPosInPositions [c[0], c[1]+1], oldCursors
                        ci = oldCursors.indexOf c
                        if @isSamePos @do.mainCursor(), newCursors[ci]
                            main = @posInPositions [c[0], c[1]-1], newCursors  
                        newCursors.splice ci, 1
            when 'down' 
                for c in oldCursors.reversed()
                    if @isPosInPositions([c[0], c[1]+1], oldCursors) and not @isPosInPositions [c[0], c[1]-1], oldCursors
                        ci = oldCursors.indexOf c
                        if @isSamePos @do.mainCursor(), newCursors[ci]
                            main = @posInPositions [c[0], c[1]+1], newCursors  
                        newCursors.splice ci, 1
        @do.cursor newCursors, main:main
        @do.end()
        
    clearCursors: () -> 
        @do.start()
        @do.cursor [@mainCursor()]
        @do.end()

    clearCursorsAndHighlights: () ->
        @clearCursors()
        @clearHighlights()
        
    clearSelections: () ->
        @do.start()
        @do.select []
        @do.end()

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000

    moveAllCursors: (func, opt = extend:false, keepLine:true) ->        
        @do.start()
        @startSelection opt
        newCursors = @do.cursors()
        oldMain = @mainCursor()
        mainLine = oldMain[1]
        if newCursors.length > 1
            for c in newCursors
                newPos = func c 
                if newPos[1] == c[1] or not opt.keepLine
                    mainLine = newPos[1] if @isSamePos oldMain, c
                    @cursorSet c, newPos
        else
            @cursorSet newCursors[0], func newCursors[0] 
            mainLine = newCursors[0][1]
        main = switch opt.main
            when 'top'   then 'first'
            when 'bot'   then 'last'
            when 'left'  then newCursors.indexOf first @positionsForLineIndexInPositions mainLine, newCursors
            when 'right' then newCursors.indexOf last  @positionsForLineIndexInPositions mainLine, newCursors
            
        @do.cursor newCursors, main:main
        @endSelection opt
        @do.end()
        true

    moveMainCursor: (dir='down', opt = erase:false) ->
        @do.start()
        [dx, dy] = switch dir
            when 'up'    then [0,-1]
            when 'down'  then [0,+1]
            when 'left'  then [-1,0]
            when 'right' then [+1,0]
        newCursors = @do.cursors()
        oldMain = @mainCursor()
        newMain = [oldMain[0]+dx, oldMain[1]+dy]
        _.remove newCursors, (c) => 
            if opt?.erase
                @isSamePos(c, oldMain) or @isSamePos(c, newMain) 
            else
                @isSamePos(c, newMain) 
        newCursors.push newMain
        @do.cursor newCursors, main:newMain
        @do.end()
        
    moveCursorsToLineBoundary: (leftOrRight, e) ->
        f = switch leftOrRight
            when 'right' then (c) => [@lines[c[1]].length, c[1]]
            when 'left'  then (c) => 
                if @lines[c[1]].slice(0,c[0]).trim().length == 0
                    [0, c[1]]
                else
                    d = @lines[c[1]].length - @lines[c[1]].trimLeft().length
                    [d, c[1]]
        @moveAllCursors f, extend:e, keepLine:true
        true
    
    moveCursorsToWordBoundary: (leftOrRight, e) ->
        f = switch leftOrRight
            when 'right' then @endOfWordAtCursor
            when 'left'  then @startOfWordAtCursor
        @moveAllCursors f, extend:e, keepLine:true
        true
    
    moveCursorsUp: (e, n=1) ->                 
        @moveAllCursors ((n)->(c)->[c[0],c[1]-n])(n), extend:e, main: 'top'
                        
    moveCursorsRight: (e, n=1) ->
        moveRight = (n) -> (c) -> [c[0]+n, c[1]]
        @moveAllCursors moveRight(n), extend:e, keepLine:true, main: 'right'
    
    moveCursorsLeft: (e, n=1) ->
        moveLeft = (n) -> (c) -> [Math.max(0,c[0]-n), c[1]]
        @moveAllCursors moveLeft(n), extend:e, keepLine:true, main: 'left'
        
    moveCursorsDown: (e, n=1) ->
        if e and @numSelections() == 0 # selecting lines down
            if 0 == _.max (c[0] for c in @cursors) # all cursors in first column
                @do.start()
                @do.select @rangesForCursorLines() # select lines without moving cursors
                @do.end()
                return
        else if e and @stickySelection and @numCursors() == 1
            if @mainCursor()[0] == 0 and not @isSelectedLineAtIndex @mainCursor()[1]
                @do.start()
                newSelections = @do.selections()
                newSelections.push @rangeForLineAtIndex @mainCursor()[1]
                @do.select newSelections
                @do.end()
                return
            
        @moveAllCursors ((n)->(c)->[c[0],c[1]+n])(n), extend:e, main: 'bot'
        
    moveCursors: (direction, e) ->
        switch direction
            when 'left'  then @moveCursorsLeft  e
            when 'right' then @moveCursorsRight e
            when 'up'    then @moveCursorsUp    e
            when 'down'  then @moveCursorsDown  e

    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   

    deIndent: -> 
        @do.start()
        newSelections = @do.selections()
        newCursors    = @do.cursors()
        for i in @selectedAndCursorLineIndices()
            if @lines[i].startsWith @indentString
                @do.change i, @lines[i].substr @indentString.length
                lineCursors = @positionsForLineIndexInPositions i, newCursors 
                for nc in lineCursors
                    @cursorDelta nc, -@indentString.length
                for ns in @rangesForLineIndexInRanges i, newSelections
                    ns[1][0] -= @indentString.length
                    ns[1][1] -= @indentString.length
        @do.select newSelections
        @do.cursor newCursors
        @do.end()
        
    indent: ->
        @do.start()
        newSelections = @do.selections()
        newCursors    = @do.cursors()
        for i in @selectedAndCursorLineIndices()
            @do.change i, @indentString + @lines[i]
            for nc in @positionsForLineIndexInPositions i, newCursors
                @cursorDelta nc, @indentString.length
            for ns in @rangesForLineIndexInRanges i, newSelections
                ns[1][0] += @indentString.length
                ns[1][1] += @indentString.length
        @do.select newSelections
        @do.cursor newCursors
        @do.end()

    indentStringForLineAtIndex: (li) -> 
        if li < @numLines()
            il = 0
            thisIndent = @indentationAtLineIndex li
            indentLength = @indentString.length
            
            if @indentNewLineMore?
                if @indentNewLineMore.lineEndsWith?.length
                    for e in @indentNewLineMore.lineEndsWith
                        if @lines[li].endsWith e
                            il = thisIndent + indentLength
                            break
                if il == 0
                    if @indentNewLineMore.lineRegExp? and @indentNewLineMore.lineRegExp.test @lines[li]
                        il = thisIndent + indentLength
                        
            il = thisIndent if il == 0
            il = Math.max il, @indentationAtLineIndex li+1
            
            _.padStart "", il
        else
            ''
           
    #  0000000   0000000   00     00  00     00  00000000  000   000  000000000
    # 000       000   000  000   000  000   000  000       0000  000     000   
    # 000       000   000  000000000  000000000  0000000   000 0 000     000   
    # 000       000   000  000 0 000  000 0 000  000       000  0000     000   
    #  0000000   0000000   000   000  000   000  00000000  000   000     000   

    toggleComment: ->
        
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()
        
        moveInLine = (i, d) => 
            for s in @selectionsInLineAtIndex i
                newSelections[@selections.indexOf s][1][0] += d
                newSelections[@selections.indexOf s][1][1] += d
            for c in @positionsForLineIndexInPositions i, newCursors
                @cursorDelta c, d
                
        mainCursorLine = @do.line @mainCursor()[1]
        cs = mainCursorLine.indexOf @lineComment
        uncomment = cs >= 0 and mainCursorLine.substr(0,cs).trim().length == 0
        
        for i in @selectedAndCursorLineIndices()
            cs = @do.line(i).indexOf @lineComment
            if uncomment 
                if cs >= 0 and @do.line(i).substr(0,cs).trim().length == 0
                    # remove comment
                    @do.change i, @do.line(i).splice cs, @lineComment.length
                    moveInLine i, -@lineComment.length
                    si = @indentationInLine @do.line(i)
                    if si % @indentString.length == 1 # remove space after indent
                        @do.change i, @do.line(i).splice si-1, 1
                        moveInLine i, -1
            else # insert comment
                si = @indentationInLine @do.line(i)
                if @do.line(i).length > si
                    l = (@lineComment + " ").length
                    @do.change i, @do.line(i).splice si, 0, @lineComment + " "
                    moveInLine i, l
        @do.select newSelections
        @do.cursor newCursors
        @do.end()
 
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
        
    insertUserCharacter: (ch) ->
        return if @salterMode and @insertSalterCharacter ch
        
        @do.start()
        @clampCursorOrFillVirtualSpaces()
        
        if ch in @surroundCharacters
            if @insertSurroundCharacter ch
                @do.end()
                return

        if ch == '\n'
            doIndent = not @isCursorInIndent()
            @insertNewline indent:doIndent
            @do.end()
            return
    
        if ch == '>' and @numCursors() == 1 and @lineComment?
            cp = @cursorPos()
            cl = @lineComment.length
            if cp[0] >= cl and @do.line(cp[1]).slice(cp[0]-cl, cp[0]) == @lineComment
                ws = @wordStartPosAfterPos()
                if ws?
                    @do.delete cp[1]
                    @do.end()
                    @startSalter ws
                    return
        
        @deleteSelection()

        newCursors = @do.cursors()
        for cc in newCursors
            @do.change cc[1], @do.line(cc[1]).splice cc[0], 0, ch
            for nc in @positionsForLineIndexInPositions cc[1], newCursors
                if nc[0] >= cc[0]
                    nc[0] += 1
        
        @do.cursor newCursors
        @do.end()
        @emitEdit 'insert'

    clampCursorOrFillVirtualSpaces: ->
        @do.start()
        if @do.numCursors() == 1
            cursor = @do.state.cursors()[0]
            y = clamp 0, @do.numLines()-1, cursor[1]
            lineLength = @do.numLines() and @do.line(cursor[1]).length or 0
            x = clamp 0, lineLength, cursor[0]
            @do.cursor [[x,y]]
        else # fill spaces between line ends and cursors
            for c in @cursors 
                if c[0] > @do.line(c[1]).length
                    @do.change c[1], @do.line(c[1]).splice c[0], 0, _.padStart '', c[0]-@do.line(c[1]).length
        @do.end()

    insertTab: ->
        if @numSelections()
            @indent()
        else
            @do.start()
            newCursors = @do.cursors()
            il = @indentString.length
            for c in newCursors
                n = 4-(c[0]%il)
                @do.change c[1], @do.line(c[1]).splice c[0], 0, _.padStart "", n
                @cursorDelta c, n
            @do.cursor newCursors
            @do.end()   
        
    # 000   000  00000000  000   000  000      000  000   000  00000000
    # 0000  000  000       000 0 000  000      000  0000  000  000     
    # 000 0 000  0000000   000000000  000      000  000 0 000  0000000 
    # 000  0000  000       000   000  000      000  000  0000  000     
    # 000   000  00000000  00     00  0000000  000  000   000  00000000
        
    insertNewline: (opt) ->
                    
        @surroundStack = []
        @deleteSelection()
        @do.start()
        
        if @salterMode
            newCursors = [@rangeEndPos @rangeForLineAtIndex @mainCursor()[1]]
            @setSalterMode false
        else
            newCursors = @do.cursors()
        
        for c in @cursors.reversed()
        
            after  = @do.line(c[1]).substr c[0]
            after  = after.trimLeft() if opt?.indent
            before = @do.line(c[1]).substr 0, c[0]
        
            if opt?.indent
                line = before.trimRight()
                il = 0
                thisIndent = @indentationInLine @do.line(c[1])
                indentLength = @indentString.length
                
                if @indentNewLineMore?
                    if @indentNewLineMore.lineEndsWith?.length
                        for e in @indentNewLineMore.lineEndsWith
                            if line.endsWith e
                                il = thisIndent + indentLength
                                break
                    if il == 0
                        if @indentNewLineMore.beforeRegExp? and @indentNewLineMore.beforeRegExp.test before
                            il = thisIndent + indentLength
                        else if @indentNewLineMore.lineRegExp? and @indentNewLineMore.lineRegExp.test line
                            il = thisIndent + indentLength
                            
                if il == 0
                    il = thisIndent
                                
                if il >= indentLength and @indentNewLineLess?
                    if @indentNewLineLess.beforeRegExp? and @indentNewLineLess.beforeRegExp.test before
                        il = -indentLength
                    else if @indentNewLineLess.afterRegExp? and @indentNewLineLess.afterRegExp.test after
                        il = -indentLength
                                
                if @fileType == 'coffee' 
                    if /(when|if)/.test before 
                        if after.startsWith 'then '
                            after = after.slice(4).trimLeft() # remove then
                        else if before.trim().endsWith 'then'
                            before = before.trimRight()
                            before = before.slice 0, before.length-4 # remove then                            
                
                il = Math.max il, @indentationInLine @do.line c[1]+1
                indent = _.padStart "", il
            else if opt?.keepIndent
                indent = _.padStart "", @indentationInLine @do.line c[1] # keep indentation
            else
                if c[0] <= @indentationInLine @do.line c[1]
                    indent = @do.line(c[1]).slice 0,c[0]
                else
                    indent = ''

            bl = c[0]
            
            if c[0] >= @do.line(c[1]).length # cursor at end of line
                @do.insert c[1]+1, indent
            else
                @do.insert c[1]+1, indent + after
                if @insertIndentedEmptyLineBetween?
                    if (before.trimRight().endsWith @insertIndentedEmptyLineBetween[0]) and (after.trimLeft().startsWith @insertIndentedEmptyLineBetween[1])
                        indent += @indentString
                        @do.insert c[1]+1, indent
                @do.change c[1], before

            # move cursors in and below inserted line down
            for nc in @positionsFromPosInPositions c, newCursors
                @cursorDelta nc, nc[1] == c[1] and indent.length - bl or 0, 1
        
        @do.cursor newCursors
        @do.end()
        
    # 00000000    0000000    0000000  000000000  00000000
    # 000   000  000   000  000          000     000     
    # 00000000   000000000  0000000      000     0000000 
    # 000        000   000       000     000     000     
    # 000        000   000  0000000      000     00000000
        
    paste: (text) ->
        
        @deleteSelection()
        @do.start()        
        @clampCursorOrFillVirtualSpaces()
        
        newCursors = @do.cursors()

        l = text.split '\n'
        if newCursors.length > 1 and l.length == 1
            l = (l[0] for c in newCursors)
                    
        if newCursors.length > 1 or l.length == 1 and (newCursors[0] > 0 or not text.endsWith '\n')
            for ci in [newCursors.length-1..0]
                c = newCursors[ci]
                insert = l[ci % l.length]
                @do.change c[1], @lines[c[1]].splice c[0], 0, insert
                for c in @positionsAfterLineColInPositions c[1], c[0], newCursors
                    @cursorDelta c, insert.length
        else
            cp = newCursors[0]
            li = cp[1]
            newSelections = []
            newCursors = []
            if cp[0] > 0
                rest   = @do.line(li).substr(cp[0]).trimLeft()
                indt   = _.padStart "", @indentationInLine @do.line cp[1] 
                before = @do.line(cp[1]).substr 0, cp[0]
                if before.trim().length
                    @do.change li, before
                    li += 1
                    if (indt + rest).trim().length
                        l.push indt + rest
                        newCursors = [[0,li+l.length-1]]
                    else
                        newCursors = null
            else 
                newCursors = null
            for line in l
                @do.insert li, line
                newSelections.push [li, [0,line.length]]
                li += 1
            newCursors = [[0, li]] if not newCursors?
            @do.select newSelections if newSelections.length > 1
                
        @do.cursor newCursors
        @do.end()
    
    #  0000000  000   000  00000000   00000000    0000000   000   000  000   000  0000000  
    # 000       000   000  000   000  000   000  000   000  000   000  0000  000  000   000
    # 0000000   000   000  0000000    0000000    000   000  000   000  000 0 000  000   000
    #      000  000   000  000   000  000   000  000   000  000   000  000  0000  000   000
    # 0000000    0000000   000   000  000   000   0000000    0000000   000   000  0000000  
        
    isUnbalancedSurroundCharacter: (ch) ->
        return false if ch in ["#"]
        [cl,cr] = @surroundPairs[ch]
        return false if cl.length > 1
        for cursor in @cursors
            count = 0
            for c in @lines[cursor[1]]
                if c == cl
                    count += 1
                else if c == cr
                    count -= 1
            if ((cl == cr) and (count % 2)) or ((cl != cr) and count)
                return true
        return false
    
    selectionContainsOnlyQuotes: ->
        for c in @textOfSelection()
            continue if c == '\n'
            if c not in ['"', "'"]
                return false
        true
        
    insertSurroundCharacter: (ch) ->

        if @isUnbalancedSurroundCharacter ch
            return false 
        
        if @numSelections() and ch in ['"', "'"] and @selectionContainsOnlyQuotes()
            return false
        
        newCursors = @do.cursors()
        
        if @surroundStack.length
            if last(@surroundStack)[1] == ch
                for c in newCursors
                    if @do.line(c[1])[c[0]] != ch
                        @surroundStack = []
                        break
                if @surroundStack.length and last(@surroundStack)[1] == ch
                    @do.start()
                    @selectNone()
                    @deleteForward()
                    @do.end()
                    @surroundStack.pop()
                    return false 
        
        if ch == '#' and @fileType == 'coffee' # check if any cursor or selection is inside a string
            found = false
            for s in @selections
                if @isRangeInString s
                    found = true
                    break
                    
            if not found
                for c in newCursors
                    if @isRangeInString @rangeForPos c
                        found = true
                        break
            return false if not found
            
        if ch == "'" and not @numSelections() # check if any alpabetical character is before any cursor
            for c in newCursors
                if c[0] > 0 and /[A-Za-z]/.test @do.line(c[1])[c[0]-1] 
                    return false
        
        @do.start()
        if @do.numSelections() == 0
            newSelections = @rangesFromPositions newCursors
        else
            newSelections = @do.selections()
            
        [cl,cr] = @surroundPairs[ch]
            
        @surroundStack.push [cl,cr]

        for ns in newSelections.reversed()
                                    
            if cl == '#{' # convert single string to double string
                if sr = @rangeOfStringSurroundingRange ns
                    if @do.line(sr[0])[sr[1][0]] == "'"
                        @do.change ns[0], @do.line(ns[0]).splice sr[1][0], 1, '"'
                    if @do.line(sr[0])[sr[1][1]-1] == "'"
                        @do.change ns[0], @do.line(ns[0]).splice sr[1][1]-1, 1, '"'
                        
            else if @fileType == 'coffee' and cl == '(' and @lengthOfRange(ns) > 0 # remove space after callee
                before = @do.line(ns[0]).slice 0, ns[1][0]
                after  = @do.line(ns[0]).slice ns[1][0]
                trimmed = before.trimRight()
                beforeGood = /\w$/.test(trimmed) and not /(if|when|in|and|or|is|not|else|return)$/.test trimmed
                afterGood = after.trim().length and not after.startsWith ' '
                if beforeGood and afterGood
                    spaces = before.length-trimmed.length
                    @do.change ns[0], @do.line(ns[0]).splice trimmed.length, spaces
                    ns[1][0] -= spaces
                    ns[1][1] -= spaces
                    
            @do.change ns[0], @do.line(ns[0]).splice ns[1][1], 0, cr
            @do.change ns[0], @do.line(ns[0]).splice ns[1][0], 0, cl
            
            for c in @positionsAfterLineColInPositions ns[0], ns[1][0], newCursors
                @cursorDelta c, cl.length
                
            for c in @positionsAfterLineColInPositions ns[0], ns[1][1], newCursors
                if c[0] > ns[1][1]+1
                    @cursorDelta c, cr.length
            
            for os in @rangesAfterLineColInRanges ns[0], ns[1][1], newSelections
                os[1][0] += cr.length
                os[1][1] += cr.length
                
            for os in @rangesAfterLineColInRanges ns[0], ns[1][0], newSelections
                os[1][0] += cl.length
                os[1][1] += cl.length
            
        @do.select @rangesNotEmptyInRanges newSelections
        @do.cursor newCursors
        @do.end()
        return true

    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLines: ->
        @do.start()
        newCursors = []
        for c in @cursors.reversed()
            if not @isCursorInLastLine c
                before = @do.line(c[1]).trimRight() + " "
                after  = @do.line(c[1]+1).trimLeft()
                
                if @fileType == 'coffee' 
                    if /(when|if)/.test before 
                        bt = before.trim()
                        if not bt.endsWith 'then' and
                            not bt.endsWith 'and' and not bt.endsWith 'or' and
                                not after.trim().startsWith 'then'
                                    after = 'then ' + after
                            
                @do.change c[1], before + after
                @do.delete c[1]+1
                newCursors.push [before.length, c[1]]
                for nc in @positionsForLineIndexInPositions c[1]+1, newCursors 
                    @cursorDelta nc, before.length, -1
                for nc in @positionsBelowLineIndexInPositions c[1], newCursors 
                    @cursorDelta nc, 0, -1
        @do.cursor newCursors, main: 0
        @do.end()
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
    
    deleteSelection: ->
        return if not @numSelections()
        @do.start()
        newCursors = @do.cursors()
        joinLines = []
        for c in @cursors.reversed()
            csel = @continuousSelectionAtPos c
            if csel?
                [sp, ep] = csel
                for nc in @positionsBetweenPosAndPosInPositions sp, ep, newCursors
                    @cursorSet nc, sp[0], sp[1]
                if sp[1] < ep[1] and sp[0] > 0 and ep[0] < @lines[ep[1]].length 
                    # selection spans multiple lines and first and last line are cut
                    joinLines.push sp[1] 
                    for nc in @positionsAfterLineColInPositions ep[1], ep[0], newCursors
                        # set cursors after selection in last joined line
                        @cursorSet nc, sp[0]+nc[0]-ep[0], sp[1]
                        
        for s in @reversedSelections()
            continue if s[0] >= @do.numLines()
            lineSelected = s[1][0] == 0 and s[1][1] == @do.line(s[0]).length
            if lineSelected and @do.numLines() > 1
                @do.delete s[0]
                for nc in @positionsBelowLineIndexInPositions s[0], newCursors
                    @cursorDelta nc, 0, -1 # move cursors below deleted line up
            else
                continue if s[0] >= @do.numLines()
                @do.change s[0], @do.line(s[0]).splice s[1][0], s[1][1]-s[1][0]
                for nc in @positionsAfterLineColInPositions s[0], s[1][1], newCursors
                    @cursorDelta nc, -(s[1][1]-s[1][0]) # move cursors after deletion in same line left

            if s[0] in joinLines
                @do.change s[0], @do.line(s[0]) + @do.line(s[0]+1)
                @do.delete s[0]+1
                for nc in @positionsBelowLineIndexInPositions s[0], newCursors
                    @cursorDelta nc, 0, -1 # move cursors below deleted line up
                _.pull joinLines, s[0]
        
        @do.select []
        @do.cursor newCursors
        @do.end()
        @checkSalterMode()
        
    deleteTab: ->
        if @numSelections()
            @deIndent()
        else
            @do.start()
            newCursors = @do.cursors()
            for c in newCursors
                if c[0]
                    n = (c[0] % @indentString.length) or @indentString.length
                    t = @do.textInRange [c[1], [c[0]-n, c[0]]]
                    if t.trim().length == 0
                        @do.change c[1], @do.line(c[1]).splice c[0]-n, n
                        @cursorDelta c, -n
            @do.cursor newCursors
            @do.end()
    
    # 00000000   0000000   00000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  000 0 000  000   000  000   000  000   000
    # 000000    000   000  0000000    000000000  000000000  0000000    000   000
    # 000       000   000  000   000  000   000  000   000  000   000  000   000
    # 000        0000000   000   000  00     00  000   000  000   000  0000000  
    
    deleteForward: ->
        if @numSelections()
            @deleteSelection()
        else
            @do.start()
            newCursors = @do.cursors()
            for c in newCursors.reversed()
            
                if @isCursorAtEndOfLine c # cursor at end of line
                    if not @isCursorInLastLine c # cursor not in first line
                    
                        ll = @lines[c[1]].length
                    
                        @do.change c[1], @lines[c[1]] + @lines[c[1]+1]
                        @do.delete c[1]+1
                                    
                        # move cursors in joined line
                        for nc in @positionsForLineIndexInPositions c[1]+1, newCursors
                            @cursorDelta nc, ll, -1
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1]+1, newCursors
                            @cursorDelta nc, 0, -1
                else
                    @do.change c[1], @lines[c[1]].splice c[0], 1
                    for nc in @positionsForLineIndexInPositions c[1], newCursors
                        if nc[0] > c[0]
                            @cursorDelta nc, -1

            @do.cursor newCursors
            @do.end()
     
    # 0000000     0000000    0000000  000   000  000   000   0000000   00000000   0000000  
    # 000   000  000   000  000       000  000   000 0 000  000   000  000   000  000   000
    # 0000000    000000000  000       0000000    000000000  000000000  0000000    000   000
    # 000   000  000   000  000       000  000   000   000  000   000  000   000  000   000
    # 0000000    000   000   0000000  000   000  00     00  000   000  000   000  0000000  
    
    deleteBackward: (opt) ->
        
        @do.start()
        if @do.numSelections()
            @deleteSelection()
        else if @do.numCursors() == 1 and not @isSamePos @do.mainCursor(), @cursorPos()
            log "[???WTF???] editor.#{@name}.deleteBackward -- what is this doing ???"
            @do.cursor [@cursorPos()]
        else if @salterMode
            @deleteSalterCharacter()
        else            
            if @surroundStack.length
                so = last(@surroundStack)[0]
                sc = last(@surroundStack)[1]
                for c in @cursors
                    prv = ''
                    prv = @do.line(c[1]).slice c[0]-so.length, c[0] if c[0] >= so.length
                    nxt = @do.line(c[1]).slice c[0], c[0]+sc.length
                    if prv != so or nxt != sc
                        @surroundStack = []
                        break
                if @surroundStack.length                
                    for i in [0...so.length]            
                        @deleteCharacterBackward opt    
                    for i in [0...sc.length]            
                        @deleteForward()                
                    @surroundStack.pop()                
                    @do.end()
                    return
            
            @deleteCharacterBackward opt
        @do.end()

    deleteCharacterBackward: (opt) ->
        newCursors = @do.cursors()
        
        removeNum = switch
            when opt?.singleCharacter    then 1
            when opt?.ignoreLineBoundary then -1 # delete spaces to line start or line end
            when opt?.ignoreTabBoundary # delete space columns
                Math.max 1, _.min @cursors.map (c) => 
                    t = @do.textInRange [c[1], [0, c[0]]]
                    n = t.length - t.trimRight().length
                    n += c[0] - @do.line(c[1]).length if @isCursorVirtual c
                    Math.max 1, n
            else # delete spaces to previous tab column
                Math.max 1, _.min @cursors.map (c) =>                       
                    n = (c[0] % @indentString.length) or @indentString.length  
                    t = @do.textInRange [c[1], [Math.max(0, c[0]-n), c[0]]]  
                    n -= t.trimRight().length
                    Math.max 1, n
            
        for c in newCursors.reversed()
            if c[0] == 0 # cursor at start of line
                if opt?.ignoreLineBoundary or @do.numCursors() == 1
                    if c[1] > 0 # cursor not in first line
                        ll = @do.line(c[1]-1).length
                        @do.change c[1]-1, @do.line(c[1]-1) + @do.line(c[1])
                        @do.delete c[1]
                        # move cursors in joined line
                        for nc in @positionsForLineIndexInPositions c[1], newCursors
                            @cursorDelta nc, ll, -1
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1], newCursors
                            @cursorDelta nc, 0, -1
            else
                if removeNum < 1 # delete spaces to line start or line end
                    t = @do.textInRange [c[1], [0, c[0]]]
                    n = t.length - t.trimRight().length
                    n += c[0] - @do.line(c[1]).length if @isCursorVirtual c
                    n = Math.max 1, n
                else
                    n = removeNum
                @do.change c[1], @do.line(c[1]).splice c[0]-n, n
                for nc in @positionsForLineIndexInPositions c[1], newCursors
                    if nc[0] >= c[0]
                        @cursorDelta nc, -n
        @do.cursors newCursors
        @do.cursor newCursors
        
module.exports = Editor