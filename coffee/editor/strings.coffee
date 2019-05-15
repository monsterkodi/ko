###
 0000000  000000000  00000000   000  000   000   0000000    0000000
000          000     000   000  000  0000  000  000        000     
0000000      000     0000000    000  000 0 000  000  0000  0000000 
     000     000     000   000  000  000  0000  000   000       000
0000000      000     000   000  000  000   000   0000000   0000000 
###

{ _ } = require 'kxk'

matchr = require '../tools/matchr'

class Strings
    
    constructor: (@editor) ->
        
        @editor.on 'cursor', @onCursor
        @editor.on 'fileTypeChanged', @setupConfig
        @setupConfig()
            
    setupConfig: => 
        @config = ( [new RegExp(_.escapeRegExp(p)), a] for p,a of @editor.stringCharacters )
        
    onCursor: =>
        if @editor.numHighlights() # don't highlight strings when other highlights exist
            for h in @editor.highlights()
                return if not h[2]?
                
        return if @highlightInside @editor.cursorPos()
                
        @clear()
        @editor.renderHighlights()

    highlightInside: (pos) ->
        stack = []
        pairs = []
        pair  = null
        [cp, li] = pos
        line = @editor.line(li)
        rngs = matchr.ranges @config, line       
        return if not rngs.length
        for i in [0...rngs.length]
            ths = rngs[i]
            
            if ths.start > 0 and line[ths.start-1] == '\\' 
                if ths.start-1 <= 0 or line[ths.start-2] != '\\'
                    continue # ignore escaped
                
            if _.last(stack)?.match == "'" == ths.match and _.last(stack).start == ths.start-1
                stack.pop() # remove ''
                continue
                
            if _.last(stack)?.match == ths.match
                pairs.push [stack.pop(), ths]
                if not pair? 
                    if _.last(pairs)[0].start <= cp <= ths.start+1
                        pair = _.last pairs
                continue

            if stack.length > 1 and stack[stack.length-2].match == ths.match
                stack.pop()
                pairs.push [stack.pop(), ths]
                if not pair? 
                    if _.last(pairs)[0].start <= cp <= ths.start+1
                        pair = _.last pairs
                continue
            
            stack.push ths
        
        if pair?
            @highlight pair, li
            true
        
    highlight: (pair, li) ->
        @clear()
        [opn,cls] = pair
        pair[0].clss = "stringmatch #{@editor.stringCharacters[opn.match]}"
        pair[1].clss = "stringmatch #{@editor.stringCharacters[cls.match]}"
        @editor.addHighlight [li, [opn.start, opn.start+opn.match.length], pair[0]]
        @editor.addHighlight [li, [cls.start, cls.start+cls.match.length], pair[1]]
        @editor.renderHighlights()
        
    clear: ->
        @editor.setHighlights @editor.highlights().filter (h) -> not h[2]?.clss?.startsWith 'stringmatch'

module.exports = Strings
