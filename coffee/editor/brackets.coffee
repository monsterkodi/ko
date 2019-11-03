###
0000000    00000000    0000000    0000000  000   000  00000000  000000000   0000000
000   000  000   000  000   000  000       000  000   000          000     000     
0000000    0000000    000000000  000       0000000    0000000      000     0000000 
000   000  000   000  000   000  000       000  000   000          000          000
0000000    000   000  000   000   0000000  000   000  00000000     000     0000000 
###

{ matchr, _ } = require 'kxk'

class Brackets
    
    @: (@editor) ->
        
        @editor.on 'cursor',          @onCursor
        @editor.on 'fileTypeChanged', @setupConfig
        
        @setupConfig()
            
    setupConfig: => 

        @open   = @editor.bracketCharacters.open
        @config = @editor.bracketCharacters.regexps
        
    #  0000000   000   000       0000000  000   000  00000000    0000000   0000000   00000000   
    # 000   000  0000  000      000       000   000  000   000  000       000   000  000   000  
    # 000   000  000 0 000      000       000   000  0000000    0000000   000   000  0000000    
    # 000   000  000  0000      000       000   000  000   000       000  000   000  000   000  
    #  0000000   000   000       0000000   0000000   000   000  0000000    0000000   000   000  
    
    onCursor: => 

        if @editor.numHighlights() # don't highlight brackets when other highlights exist
            for h in @editor.highlights()
                return if not h[2]?
                
        cp = @editor.cursorPos()
        [before, after] = @beforeAfterForPos cp

        if after.length or before.length
            if after.length and _.first(after).start == cp[0] and _.first(after).clss == 'open' then cp[0] += 1
            if before.length and _.last(before).start == cp[0]-1 and _.last(before).clss == 'close' then cp[0] -= 1

        if @highlightInside cp
            return
            
        @clear()
        @editor.renderHighlights()

    # 000  000   000   0000000  000  0000000    00000000  
    # 000  0000  000  000       000  000   000  000       
    # 000  000 0 000  0000000   000  000   000  0000000   
    # 000  000  0000       000  000  000   000  000       
    # 000  000   000  0000000   000  0000000    00000000  
    
    highlightInside: (pos) ->
        
        stack = []
        pp    = pos
        cnt   = 0
        while pp[1] >= 0 # find last open bracket before
            [before, after] = @beforeAfterForPos pp
            while before.length 
                prev = before.pop()
                if prev.clss == 'open'
                    if stack.length
                        if @open[prev.match] == _.last(stack).match
                            stack.pop()                            
                            continue
                        else
                            return # stack mismatch
                    lastOpen = prev
                    break
                else # if prev is 'close'
                    stack.push prev
            
            break if lastOpen?
            return if pp[1] < 1
            return if cnt++ > 1000 # maximum number of lines exceeded
            pp = [@editor.line(pp[1]-1).length, pp[1]-1]
        
        return if not lastOpen?
        
        stack = []
        pp = pos
        while pp[1] <= @editor.numLines() # find first close bracket after
            [before, after] = @beforeAfterForPos pp
            while after.length
                next = after.shift()
                if next.clss == 'close'
                    if stack.length
                        if @open[_.last(stack).match] == next.match
                            stack.pop()                            
                            continue
                        else
                            return # stack mismatch
                    firstClose = next
                    break
                else # if next is 'open'
                    stack.push next
                
            break if firstClose?
            return if pp[1] >= @editor.numLines()-1
            return if cnt++ > 1000 # maximum number of lines exceeded
            pp = [0, pp[1]+1]
        
        return if not firstClose?
        
        if @open[lastOpen.match] == firstClose.match
            @highlight lastOpen, firstClose
            true
    
    # 0000000    00000000  00000000   0000000   00000000   00000000   0000000   00000000  000000000  00000000  00000000   
    # 000   000  000       000       000   000  000   000  000       000   000  000          000     000       000   000  
    # 0000000    0000000   000000    000   000  0000000    0000000   000000000  000000       000     0000000   0000000    
    # 000   000  000       000       000   000  000   000  000       000   000  000          000     000       000   000  
    # 0000000    00000000  000        0000000   000   000  00000000  000   000  000          000     00000000  000   000  
    
    beforeAfterForPos: (pos) ->
        
        [cp, li] = pos
        line = @editor.line(li)
        rngs = matchr.ranges @config, line     
        
        i = rngs.length-1
        while i >= 0 # remove escaped
            if rngs[i].start > 0 and line[rngs[i].start-1] == '\\'
                rngs.splice i, 1
            i -= 1
                    
        i = rngs.length-1 
        while i > 0 # remove trivial: (), {}, []
            if rngs[i-1].clss == 'open' and rngs[i].clss == 'close' and
                @open[rngs[i-1].match] == rngs[i].match and 
                    rngs[i-1].start == rngs[i].start - 1
                        rngs.splice i-1, 2
                        i -= 1
            i -= 1
                            
        if rngs.length
            r.line = li for r in rngs
            lst = _.last rngs
            fst = _.first rngs
            for firstAfterIndex in [0...rngs.length]
                break if rngs[firstAfterIndex].start >= cp
            before = rngs.slice 0, firstAfterIndex
            after  = rngs.slice firstAfterIndex
            return [before, after]
        [[],[]]
    
    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000  
    # 000   000  000  000        000   000  000      000  000        000   000     000     
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000     
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     
    
    highlight: (opn, cls) ->
        
        @clear()
        opn.clss = 'bracketmatch'
        cls.clss = 'bracketmatch'
        @editor.addHighlight [opn.line, [opn.start, opn.start+opn.match.length], opn]
        @editor.addHighlight [cls.line, [cls.start, cls.start+cls.match.length], cls]
        @editor.renderHighlights()

    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: ->
        
        @editor.setHighlights @editor.highlights().filter (h) -> h[2]?.clss != 'bracketmatch'

module.exports = Brackets
