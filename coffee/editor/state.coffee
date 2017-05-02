
#  0000000  000000000   0000000   000000000  00000000
# 000          000     000   000     000     000     
# 0000000      000     000000000     000     0000000 
#      000     000     000   000     000     000     
# 0000000      000     000   000     000     00000000

{ log, str, _ 
}         = require 'kxk'
Immutable = require 'seamless-immutable'

class State
    
    constructor: (opt) ->
        
        if opt? and Immutable.isImmutable opt
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
    
    # read only:
    
    text:          -> @s.lines.join '\n'    
    lines:         -> @s.lines
    cursors:       -> @s.cursors.asMutable deep: true 
    highlights:    -> @s.highlights.asMutable deep: true 
    selections:    -> @s.selections.asMutable deep: true 
    main:          -> @s.main
    
    line:      (i) -> @s.lines[i]
    cursor:    (i) -> @s.cursors[i].asMutable deep: true 
    selection: (i) -> @s.selections[i].asMutable deep: true 
    highlight: (i) -> @s.highlights[i].asMutable deep: true 
        
    numLines:      -> @s.lines.length
    numCursors:    -> @s.cursors.length
    numSelections: -> @s.selections.length
    numHighlights: -> @s.highlights.length
    mainCursor:    -> @s.cursors[@s.main].asMutable deep: true

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
    addHighlight: (h) -> m = @s.highlights.asMutable(); m.push h;    new State @s.set 'highlights', m
    
module.exports = State
