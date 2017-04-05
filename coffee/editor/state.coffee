#  0000000  000000000   0000000   000000000  00000000
# 000          000     000   000     000     000     
# 0000000      000     000000000     000     0000000 
#      000     000     000   000     000     000     
# 0000000      000     000   000     000     00000000
{
log,
str
}      = require 'kxk'
{
Record, 
List, 
Map
}      = require 'immutable' 

Select = Record s:0, e:0, l:-1
Highlt = Record s:0, e:0, l:-1, o:{}
Cursor = Record x:0, y:-1
Line   = Record text:''
StateR = Record 
    lines:      List []
    selections: List []
    highlights: List []
    cursors:    List [new Cursor()]
    main:       0

class State extends StateR
    
    constructor: (opt) -> 
        lines = opt?.lines ? []
        super 
            lines:   List lines.map (l) -> Line text:l
            cursors: List [Cursor y:lines.length-1]
    
    # read only:
        
    selections:    -> @get('selections').map((s) -> [s.get('l'), [s.get('s'), s.get('e')]]).toArray()
    highlights:    -> @get('highlights').map((s) -> [s.get('l'), [s.get('s'), s.get('e')], s.get('o')]).toArray()
    cursors:       -> @get('cursors').map((c) -> [c.get('x'), c.get('y')]).toArray()
    lines:         -> @get('lines').toArray().map (l) -> l.get 'text'
    line:      (l) -> @getIn ['lines', l, 'text']
    mainCursor:    -> @getIn ['cursors', @get 'main']
    numLines:      -> @get('lines').size
    numCursors:    -> @get('cursors').size
    numSelections: -> @get('selections').size
    numHighlights: -> @get('highlights').size

    # modify:

    setSelections: (s) -> @set 'selections', List s.map (r) -> Select s:r[1][0], e:r[1][1], l:r[0]
    setHighlights: (h) -> @set 'highlights', List h.map (r) -> Highlt s:r[1][0], e:r[1][1], l:r[0], o:r[2]
    setCursors:    (c) -> @set 'cursors',    List c.map (t) -> Cursor x:t[0], y:t[1]
    setLines:      (l) -> @set 'lines',      List l.map (t) -> Line text:t
    setMain:       (m) -> @set 'main', m
    
    insertLine: (i,t) -> @update 'lines', (l) -> l.splice i, 0, Line text:t
    changeLine: (i,t) -> @setIn ['lines', i, 'text'], t
    deleteLine: (i)   -> @update 'lines', (l) -> l.splice i, 1
    appendLine: (t)   -> @set 'lines', @get('lines').push new Line text:t
    
module.exports = State
