# 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000  
# 000   000  000  000        000   000  000      000  000        000   000     000     
# 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     
# 000   000  000  000   000  000   000  000      000  000   000  000   000     000     
# 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     
{
first
} = require 'kxk'

module.exports = 

    infos:
        highlightWordAndAddToSelection:
            name: 'highlight and select word'
            text: 'highlights all occurrences of text in selection or word at cursor and selects the first|next highlight.'
            combo: 'command+d'
        removeSelectedHighlight:
            name: 'remove highlighted word from the selection'
            text: "does the inverse of 'highlight and select' word"
            combo: 'command+shift+d'
        highlightTextOfSelectionOrWordAtCursor:
            name: 'highlight and select word'
            text: 'highlights all occurrences of text in selection or word at cursor and selects it. expands to the left if already selected.'
            combo: 'command+e'

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
    
    highlightWordAndAddToSelection: -> # command+d
        cp = @cursorPos()
        if not @posInHighlights cp
            @highlightTextOfSelectionOrWordAtCursor() # this also selects
        else
            @do.start()
            sr = @rangeAtPosInRanges cp, @do.selections()
            if sr # cursor in selection -> select next highlight
                r = @rangeAfterPosInRanges cp, @do.highlights()
            else # select current highlight first
                r = @rangeAtPosInRanges cp, @do.highlights()
            r ?= @do.highlight(0)
            @addRangeToSelection r
            @scrollCursorToTop()
            @do.end()

    highlightTextOfSelectionOrWordAtCursor: -> # command+e       
            
        if @numSelections() == 0
            srange = @rangeForWordAtPos @cursorPos()
            @selectSingleRange srange
        
        sel = @selection 0     
        text = @textInRange sel
        if text.length
            
            if @numHighlights()
                if text == @textInRange first @highlights # see if we can grow the current selection
                    largerRange = [sel[0], [sel[1][0]-1, sel[1][1]]]
                    largerText = @textInRange largerRange
                    if largerText[0] in "@#$%&*+-!?:.'\"/" or /[A-Za-z]/.test largerText[0]
                        if largerText[0] in "'\"" # grow strings in both directions
                            nr = [sel[0], [sel[1][0]-1, sel[1][1]+1]] 
                            nt = @textInRange nr
                            if nt[nt.length-1] == largerText[0]
                                largerText = nt
                                largerRange = nr
                        else if /[A-Za-z]/.test largerText[0] # grow whole words
                            while largerRange[1][0] > 0 and /[A-Za-z]/.test @line(largerRange[0])[largerRange[1][0]-1]
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
            
    removeSelectedHighlight: -> # command+shift+d
        cp = @cursorPos()
        sel = @selections()
        sr = @rangeAtPosInRanges cp, sel
        hr = @rangeAtPosInRanges cp, @highlights()        
        if sr and hr
            @removeSelectionAtIndex sel.indexOf sr 
