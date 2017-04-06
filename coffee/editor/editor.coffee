# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000
{
fileList,
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

    @actions = null

    constructor: () ->

        Editor.initActions() if not Editor.actions?
            
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

    @initActions: ->
        @actions = []
        for actionFile in fileList path.join __dirname, 'actions'
            actions = require actionFile
            for key,value of actions
                if _.isFunction value
                    @prototype[key] = value
                else if key == 'info'
                    @actions.push value
                else if key == 'infos'
                    for k,v of value
                        @actions.push v
                    
        # log @actions

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

    #  0000000   00000000  000000000        000000000  00000000  000   000  000000000  
    # 000        000          000              000     000        000 000      000     
    # 000  0000  0000000      000              000     0000000     00000       000     
    # 000   000  000          000              000     000        000 000      000     
    #  0000000   00000000     000              000     00000000  000   000     000     
                                                
    textOfSelectionForClipboard: -> 
        @selectMoreLines() if @numSelections() == 0
        @textOfSelection()
        
    textOfSelection: ->
        t = []
        for s in @selections
            t.push @textInRange s
        t.join '\n'
            
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

module.exports = Editor