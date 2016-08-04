
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
            "[\\\"\\']":     'string'
        
    onCursor: => 
        [cp, li] = @editor.cursorPos()
        # log "Brackets.onCursor cp:#{cp} li:#{li}"
        rngs = matchr.ranges @config, @editor.lines[li]       
        
        if rngs.length > 1 #remove trivial: (), {}, []
            for i in [rngs.length-1..1]
                if rngs[i-1].value == 'open' and rngs[i].value == 'close' and
                    @close[rngs[i-1].match] == rngs[i].match and 
                        rngs[i-1].start == rngs[i].start - 1
                            rngs.splice i-1, 2 
                
        if rngs.length
            lst = last rngs
            fst = first rngs
            if fst.start <= cp and lst.start + lst.match.length >= cp
                for firstAfterIndex in [0...rngs.length]
                    break if rngs[firstAfterIndex].start >= cp
                before = rngs.slice 0, firstAfterIndex
                after  = rngs.slice firstAfterIndex
                
                return if @highlightAfter   after  if not before.length
                return if @highlightBefore  before if not after.length
                return if @highlightBetween before, after

                # log "\nbefore:", ("#{r.value} #{r.start} #{r.match}" for r in before) if before.length
                # log "\nafter:", ("#{r.value} #{r.start} #{r.match}" for r in after) if after.length
        @clear()
        @editor.renderHighlights()
        
    highlightAfter: (after) ->
        fst = first after
        if fst.value == 'open'
            nxt = after[1]
            if nxt?.match == @close[fst.match]
                @highlight fst, nxt
                true

    highlightBefore: (before) ->
        lst = last before
        if lst.value == 'close'
            prv = before[before.length-2]
            if prv?.match == @open[lst.match]
                @highlight prv, lst
                true
                
    highlightBetween: (before, after) ->
        prv = last before
        nxt = first after        
        return if not prv? or not nxt?
        if prv.value == 'open' and nxt.value == 'close' and @close[prv.match] == nxt.match
            @highlight prv, nxt
            true

    highlight: (opn, cls) ->
        # log "#{opn.match} #{cls.match} #{opn.start} #{cls.start}"
        @clear()
        @editor.highlights.push [@editor.cursorPos()[1], [opn.start, opn.start+opn.match.length], 'bracketmatch']
        @editor.highlights.push [@editor.cursorPos()[1], [cls.start, cls.start+cls.match.length], 'bracketmatch']
        @editor.renderHighlights()

    clear: ->
        @editor.highlights = @editor.highlights.filter (h) -> not h[2]? or h[2] != 'bracketmatch'

module.exports = Brackets
