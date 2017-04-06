# 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000  
# 000   000  000  000        000   000  000      000  000        000   000     000     
# 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     
# 000   000  000  000   000  000   000  000      000  000   000  000   000     000     
# 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     
{
first
} = require 'kxk'

module.exports = 

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
            sr = @rangeAtPosInRanges cp, @selections
            if sr # cursor in selection -> select next highlight
                r = @rangeAfterPosInRanges cp, @highlights
            else # select current highlight first
                r = @rangeAtPosInRanges cp, @highlights
            r ?= first @highlights
            @addRangeToSelection r
            @scrollCursorToTop()
            @do.end()

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
            
    removeSelectedHighlight: -> # command+shift+d
        cp = @cursorPos()
        sr = @rangeAtPosInRanges cp, @selections
        hr = @rangeAtPosInRanges cp, @highlights        
        @removeFromSelection sr if sr and hr
