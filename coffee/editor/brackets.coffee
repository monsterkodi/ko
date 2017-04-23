
# 0000000    00000000    0000000    0000000  000   000  00000000  000000000   0000000
# 000   000  000   000  000   000  000       000  000   000          000     000     
# 0000000    0000000    000000000  000       0000000    0000000      000     0000000 
# 000   000  000   000  000   000  000       000  000   000          000          000
# 0000000    000   000  000   000   0000000  000   000  00000000     000     0000000 

{log, _
}      = require 'kxk'
matchr = require '../tools/matchr'

class Brackets
    
    constructor: (@editor) ->
        
        @editor.on 'cursor',          @onCursor
        @editor.on 'fileTypeChanged', @setupConfig
        
        @setupConfig()
            
    setupConfig: => 

        @open   = @editor.bracketCharacters.open
        @config = @editor.bracketCharacters.regexps
        
    onCursor: => 
        if @editor.numHighlights() # don't highlight brackets when other highlights exist
            for h in @editor.highlights()
                return if not h[2]?
                
        cp = @editor.cursorPos()
        [before, after] = @beforeAfterForPos cp

        if after.length or before.length
            if after.length and _.first(after).start == cp[0] and _.first(after).value == 'open' then cp[0] += 1
            if before.length and _.last(before).start == cp[0]-1 and _.last(before).value == 'close' then cp[0] -= 1

        return if @highlightInside cp
                
        @clear()
        @editor.renderHighlights()

    highlightInside: (pos) ->
        stack = []
        pp = pos
        while pp[1] >= 0 # @editor.scroll.top # find last open bracket before
            [before, after] = @beforeAfterForPos pp
            while before.length 
                prev = before.pop()
                if prev.value == 'open'
                    if stack.length
                        if @open[prev.match] == _.last(stack).match
                            stack.pop()                            
                            continue
                        else
                            log "brackets stack mismatch at #{pp[0]} #{pp[1]} stack: #{_.last(stack).match} != prev: #{prev.match}"
                            return # stack mismatch
                    lastOpen = prev
                    break
                else # if prev is 'close'
                    stack.push prev
            
            break if lastOpen?
            return if pp[1] < 1
            pp = [@editor.line(pp[1]-1).length, pp[1]-1]
        
        return if not lastOpen?
        
        stack = []
        pp = pos
        while pp[1] <= @editor.numLines() # @editor.scroll.bot # find first close bracket after
            [before, after] = @beforeAfterForPos pp
            while after.length
                next = after.shift()
                if next.value == 'close'
                    if stack.length
                        if @open[_.last(stack).match] == next.match
                            stack.pop()                            
                            continue
                        else
                            log "brackets stack mismatch at #{pp[0]} #{pp[1]} stack: #{_.last(stack).match} != next: #{next.match}"
                            return # stack mismatch
                    firstClose = next
                    break
                else # if next is 'open'
                    stack.push next
                
            break if firstClose?
            return if pp[1] >= @editor.numLines()-1
            pp = [0, pp[1]+1]
        
        return if not firstClose?
        
        if @open[lastOpen.match] == firstClose.match
            @highlight lastOpen, firstClose
            true
    
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
        while i > 0 #remove trivial: (), {}, []
            if rngs[i-1].value == 'open' and rngs[i].value == 'close' and
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
    
    highlight: (opn, cls) ->
        @clear()
        opn.clss = 'bracketmatch'
        cls.clss = 'bracketmatch'
        @editor.addHighlight [opn.line, [opn.start, opn.start+opn.match.length], opn]
        @editor.addHighlight [cls.line, [cls.start, cls.start+cls.match.length], cls]
        @editor.renderHighlights()

    clear: ->
        @editor.setHighlights @editor.highlights().filter (h) -> h[2]?.clss != 'bracketmatch'

module.exports = Brackets
