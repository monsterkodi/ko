#  0000000  000000000  00000000   000  000   000   0000000    0000000
# 000          000     000   000  000  0000  000  000        000     
# 0000000      000     0000000    000  000 0 000  000  0000  0000000 
#      000     000     000   000  000  000  0000  000   000       000
# 0000000      000     000   000  000  000   000   0000000   0000000 
{
first,
last
}      = require '../tools/tools'
log    = require '../tools/log'
matchr = require '../tools/matchr'

class Strings
    
    constructor: (@editor) ->
        
        @editor.on 'cursor', @onCursor
        @config = matchr.config
            "\\'":  'single'
            '\\"':  'double'
        
    onCursor: => 
        if @editor.highlights.length # don't highlight strings when other highlights exist
            for h in @editor.highlights
                return if not h[2]?
                
        return if @highlightInside @editor.cursorPos()
                
        @clear()
        @editor.renderHighlights()

    highlightInside: (pos) ->
        stack = []
        pairs = []
        pair  = null
        [cp, li] = pos
        line = @editor.lines[li]
        rngs = matchr.ranges @config, line       
        log "rngs", rngs.length if rngs.length
        return if not rngs.length
        for i in [0...rngs.length]
            ths = rngs[i]
            
            if ths.start > 0 and line[ths.start-1] == '\\' # ignore escaped
                continue
                
            if last(stack)?.match == "'" == ths.match and last(stack).start == ths.start-1 # remove ''
                stack.pop()
                continue
                        
            if last(stack)?.match == ths.match
                pairs.push [stack.pop(), ths]
                if not pair? 
                    if last(pairs)[0].start <= cp <= ths.start 
                        pair = last pairs
                continue

            stack.push ths
        
        if pair?
            @highlight pair, li
            # log "Strings.highlightInside stack:", stack, "pairs:", pairs
            true
        
    highlight: (pair, li) ->
        @clear()
        log "highlight pair #{li}", pair
        [opn,cls] = pair
        @editor.highlights.push [li, [opn.start, opn.start+opn.match.length], 'stringmatch']
        @editor.highlights.push [li, [cls.start, cls.start+cls.match.length], 'stringmatch']
        @editor.renderHighlights()
        
    clear: ->
        @editor.highlights = @editor.highlights.filter (h) -> h[2] != 'stringmatch'

module.exports = Strings
