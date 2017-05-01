
#  0000000  000000000   0000000   000000000  00000000
# 000          000     000   000     000     000     
# 0000000      000     000000000     000     0000000 
#      000     000     000   000     000     000     
# 0000000      000     000   000     000     00000000

{ log, str 
}         = require 'kxk'
Immutable = require 'seamless-immutable'

class State
    
    constructor: (opt) ->
        
        if opt? and Immutable.isImmutable opt
            # console.log 'copy opt'
            @s = opt
        else
            lines = opt?.lines ? []
            y = lines.length == 0 and -1 or 0
            @s = Immutable
                lines:      lines
                cursors:    [[0,y]]
                selections: []
                highlights: []
                main:       0
        # console.log str @s
    
    # read only:
    
    text:          -> @s.lines.join '\n'    
    lines:         -> @s.lines
    cursors:       -> @s.cursors.asMutable()
    highlights:    -> @s.highlights.asMutable()
    selections:    -> @s.selections.asMutable()
    main:          -> @s.main
    
    line:      (i) -> String @s.lines[i]
    cursor:    (i) -> @s.cursors[i].asMutable()
    selection: (i) -> @s.selections[i].asMutable()
    highlight: (i) -> @s.highlights[i].asMutable()
        
    numLines:      -> @s.lines.length
    numCursors:    -> @s.cursors.length
    numSelections: -> @s.selections.length
    numHighlights: -> @s.highlights.length
    mainCursor:    -> @s.cursors[@s.main]

    # modify:

    setSelections: (s) -> new State @s.set 'selections', s
    setHighlights: (h) -> new State @s.set 'highlights', h
    setCursors:    (c) -> new State @s.set 'cursors',    c
    setLines:      (l) -> new State @s.set 'lines',      l
    setMain:       (m) -> new State @s.set 'main',       m

    changeLine: (i,t) -> new State @s.setIn ['lines', i], t
    insertLine: (i,t) -> l = @s.lines.asMutable(); l.splice i, 0, t; new State @s.set 'lines', l
    deleteLine: (i)   -> l = @s.lines.asMutable(); l.splice i, 1;    new State @s.set 'lines', l
    appendLine:   (t) -> l = @s.lines.asMutable(); l.push t;         new State @s.set 'lines', l
    addHighlight: (h) -> m = @s.highlights.asMutable(); m.push h; new State @s.set 'highlights', m
    
module.exports = State
