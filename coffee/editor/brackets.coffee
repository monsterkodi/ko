
# 0000000    00000000    0000000    0000000  000   000  00000000  000000000   0000000
# 000   000  000   000  000   000  000       000  000   000          000     000     
# 0000000    0000000    000000000  000       0000000    0000000      000     0000000 
# 000   000  000   000  000   000  000       000  000   000          000          000
# 0000000    000   000  000   000   0000000  000   000  00000000     000     0000000 
{
first,
last
}      = require '../tools/tools'
log    = require '../tools/log'
matchr = require '../tools/matchr'

class Brackets
    
    constructor: (@editor) ->
        
        @editor.on 'cursor', @onCursor
        @close = 
            '[': ']'
            '{': '}'
            '(': ')'
        @open = 
            ']': '['
            '}': '{'
            ')': '('
        @config = matchr.config 
            "[\\{\\[\\(]":   'open'
            "[\\}\\]\\)]":   'close'
        
    onCursor: => 
        if @editor.highlights.length # don't highlight brackets when other highlights exist
            for h in @editor.highlights
                return if h[2] != 'bracketmatch'
                
        cp = @editor.cursorPos()
        [before, after] = @beforeAfterForPos cp

        if after.length or before.length
            if after.length and first(after).start == cp[0] and first(after).value == 'open' then cp[0] += 1
            if before.length and last(before).start == cp[0]-1 and last(before).value == 'close' then cp[0] -= 1

        return if @highlightInside cp
                
        @clear()
        @editor.renderHighlights()

    highlightInside: (pos) ->
        stack = []
        pp = pos
        while pp[1] >= @editor.scroll.top # find last open bracket before
            [before, after] = @beforeAfterForPos pp
            while before.length 
                prev = before.pop()
                if prev.value == 'open'
                    if stack.length
                        if @open[last(stack).match] == prev.match
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
            pp = [@editor.lines[pp[1]-1].length, pp[1]-1]
        
        return if not lastOpen?
        
        stack = []
        pp = pos
        while pp[1] <= @editor.scroll.bot # find first close bracket after
            [before, after] = @beforeAfterForPos pp
            while after.length
                next = after.shift()
                if next.value == 'close'
                    if stack.length
                        if @close[last(stack).match] == next.match
                            stack.pop()                            
                            continue
                        else
                            return # stack mismatch
                    firstClose = next
                    break
                else # if next is 'open'
                    stack.push next
                
            break if firstClose?
            return if pp[1] >= @editor.lines.length-1
            pp = [0, pp[1]+1]
        
        return if not firstClose?
        
        if @close[lastOpen.match] == firstClose.match
            @highlight lastOpen, firstClose
            true
    
    beforeAfterForPos: (pos) ->
        [cp, li] = pos
        rngs = matchr.ranges @config, @editor.lines[li]       
        
        if rngs.length > 1 #remove trivial: (), {}, []
            for i in [rngs.length-1..1]
                if rngs[i-1].value == 'open' and rngs[i].value == 'close' and
                    @close[rngs[i-1].match] == rngs[i].match and 
                        rngs[i-1].start == rngs[i].start - 1
                            rngs.splice i-1, 2
                            
        if rngs.length
            r.line = li for r in rngs
            lst = last rngs
            fst = first rngs
            for firstAfterIndex in [0...rngs.length]
                break if rngs[firstAfterIndex].start >= cp
            before = rngs.slice 0, firstAfterIndex
            after  = rngs.slice firstAfterIndex
            return [before, after]
        [[],[]]
    
    highlight: (opn, cls) ->
        @clear()
        @editor.highlights.push [opn.line, [opn.start, opn.start+opn.match.length], 'bracketmatch']
        @editor.highlights.push [cls.line, [cls.start, cls.start+cls.match.length], 'bracketmatch']
        @editor.renderHighlights()

    clear: ->
        @editor.highlights = @editor.highlights.filter (h) -> not h[2]? or h[2] != 'bracketmatch'

module.exports = Brackets
