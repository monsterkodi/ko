# 0000000     0000000 
# 000   000  000   000
# 000   000  000   000
# 000   000  000   000
# 0000000     0000000 
{
clamp,
first, 
last,
str,
log}  = require 'kxk'
_     = require 'lodash'

class Do
    
    constructor: (@editor) -> @reset()

    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
        
    reset: ->
        @groupCount = 0
        @history = []
        @redos   = []
        @state   = null
                
    hasLineChanges: ->
        return false if @history.length == 0
        return not first(@history).get('lines').equals @editor.state.get('lines')
                                                                        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: -> 
        
        @groupCount += 1
        if @groupCount == 1
            @startState = @state = @editor.state
            @history.push @state

    # 00     00   0000000   0000000    000  00000000  000   000
    # 000   000  000   000  000   000  000  000        000 000 
    # 000000000  000   000  000   000  000  000000      00000  
    # 000 0 000  000   000  000   000  000  000          000   
    # 000   000   0000000   0000000    000  000          000   
            
    change: (index, text) ->
        return if @editor.line(index) == text
        @state = @state.changeLine index, text 
        
    insert: (index, text) ->
        @state = @state.insertLine index, text
        
    delete: (index) ->
        if @editor.numLines() > 1
            @editor.emit 'willDeleteLine', index, @editor.line(index)
            @state = @state.deleteLine index

    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  

    end: (opt) -> # no log here!
        # if opt?.foreign
        @redos = []
        @groupCount -= 1
        if @groupCount == 0
            @merge()
            changes = @calculateChanges @startState, @state
            @editor.setState @state
            @editor.changed? changes
        else
            @editor.setState @state # < this should be gone, shouldn't it?

    # 000   000  000   000  0000000     0000000 
    # 000   000  0000  000  000   000  000   000
    # 000   000  000 0 000  000   000  000   000
    # 000   000  000  0000  000   000  000   000
    #  0000000   000   000  0000000     0000000 
                    
    undo: -> 
        
        if @history.length
            
            if _.isEmpty @redos
                @redos.unshift @editor.state 
        
            @state = @history.pop()
            @redos.unshift @state
            
            changes = @calculateChanges @editor.state, @state
            @editor.setState @state
            @editor.changed? changes

    # 00000000   00000000  0000000     0000000 
    # 000   000  000       000   000  000   000
    # 0000000    0000000   000   000  000   000
    # 000   000  000       000   000  000   000
    # 000   000  00000000  0000000     0000000 

    redo: ->
        
        if @redos.length
            
            if @redos.length > 1
                @history.push @redos.shift()
                
            @state = first @redos
            if @redos.length == 1
                @redos = []
                
            changes = @calculateChanges @editor.state, @state
            @editor.setState @state
            @editor.changed? changes

    #  0000000  00000000  000      00000000   0000000  000000000  
    # 000       000       000      000       000          000     
    # 0000000   0000000   000      0000000   000          000     
    #      000  000       000      000       000          000     
    # 0000000   00000000  0000000  00000000   0000000     000     
    
    select: (newSelections) -> 
        
        if newSelections.length
            newSelections = @editor.cleanRanges newSelections
            @state = @state.setSelections newSelections
        else
            @state = @state.setSelections []
        
    #  0000000  000   000  00000000    0000000   0000000   00000000   
    # 000       000   000  000   000  000       000   000  000   000  
    # 000       000   000  0000000    0000000   000   000  0000000    
    # 000       000   000  000   000       000  000   000  000   000  
    #  0000000   0000000   000   000  0000000    0000000   000   000  

    setCursors: (newCursors, opt) ->

        if not newCursors? or newCursors.length < 1
            alert 'warning!! empty cursors?'
            throw new Error
                        
        if opt?.main 
            switch opt.main
                when 'first' then mainIndex = 0
                when 'last'  then mainIndex = newCursors.length-1
                when 'closest'
                    mainIndex = newCursors.indexOf @editor.posClosestToPosInPositions @editor.mainCursor(), newCursors 
                else 
                    mainIndex = newCursors.indexOf opt.main
                    mainIndex = parseInt opt.main if mainIndex < 0
        else
            mainIndex = newCursors.length-1
    
        mainCursor = newCursors[mainIndex]
        @cleanCursors newCursors
        mainIndex = newCursors.indexOf @editor.posClosestToPosInPositions mainCursor, newCursors 
    
        @state = @state.set 'main', mainIndex
        @state = @state.setCursors newCursors

    #  0000000   0000000   000       0000000  000   000  000       0000000   000000000  00000000 
    # 000       000   000  000      000       000   000  000      000   000     000     000      
    # 000       000000000  000      000       000   000  000      000000000     000     0000000  
    # 000       000   000  000      000       000   000  000      000   000     000     000      
    #  0000000  000   000  0000000   0000000   0000000   0000000  000   000     000     00000000 
    
    calculateChanges: (oldState, newState) ->
        
        oi = 0 # index in oldState 
        ni = 0 # index in newState
        dd = 0 # delta for doIndex
        changes = []
            
        oldLines = oldState.get 'lines'
        newLines = newState.get 'lines'

        insertions = 0 # number of insertions
        deletions  = 0 # number of deletions
        
        if oldLines != newLines
        
            ol = oldLines.get oi
            nl = newLines.get ni
                
            while oi < oldLines.size
                if not nl? # new state has not enough lines, mark remaining lines in oldState as deleted
                    deletions += 1
                    changes.push change: 'deleted', oldIndex: oi, doIndex: oi+dd
                    oi += 1
                    dd -= 1
                    
                else if ol == nl # same lines in old and new
                    oi += 1
                    ol = oldLines.get oi
                    ni += 1
                    nl = newLines.get ni
                    
                else if 0 < (inserts = newLines.slice(ni).findIndex (v) -> v==ol) # insertion
                    while inserts
                        changes.push change: 'inserted', newIndex: ni, doIndex: oi+dd
                        ni += 1
                        dd += 1
                        inserts -= 1
                        insertions += 1
                    nl = newLines.get ni
                    
                else if 0 < (deletes = oldLines.slice(oi).findIndex (v) -> v==nl) # deletion
                    while deletes
                        changes.push change: 'deleted', oldIndex: oi, doIndex: oi+dd
                        oi += 1
                        dd -= 1
                        deletes -= 1
                        deletions += 1
                    ol = oldLines.get oi
                    
                else # change
                    changes.push change: 'changed', oldIndex: oi, newIndex: ni, doIndex: oi+dd
                    oi += 1
                    ol = oldLines.get oi
                    ni += 1
                    nl = newLines.get ni
                            
            while ni < newLines.size # mark remaing lines in newState as inserted
                insertions += 1
                changes.push change: 'inserted', newIndex: ni, doIndex: ni
                ni += 1
           
        changes: changes
        inserts: insertions
        deletes: deletions
        cursors: oldState.get('cursors')    != newState.get('cursors')
        selects: oldState.get('selections') != newState.get('selections')
                    
    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000     
    # 000000000  0000000   0000000    000  0000  0000000 
    # 000 0 000  000       000   000  000   000  000     
    # 000   000  00000000  000   000   0000000   00000000
    
    # looks at last two actions and merges them 
    #       when they contain no line changes
    #       when they contain only changes of the same set of lines

    merge: ->
        
        while @history.length > 1
            b = @history[@history.length-2]
            a = last @history
            if a.get('lines') == b.get('lines')
                if @history.length > 2
                    @history.splice @history.length-2, 1
                else
                    return
            else if @history.length > 2 
                c = @history[@history.length-3]
                if a.get('lines').size == b.get('lines').size == c.get('lines').size 
                    for li in [0...a.get('lines').size]
                        la = a.getIn 'lines', li
                        lb = b.getIn 'lines', li
                        lc = c.getIn 'lines', li
                        if la == lb and lc != lb or la != lb and lc == lb
                            return
                    @history.splice @history.length-2, 1
                else return
            else return

    #  0000000  000      00000000   0000000   000   000  
    # 000       000      000       000   000  0000  000  
    # 000       000      0000000   000000000  000 0 000  
    # 000       000      000       000   000  000  0000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    cleanCursors: (cs) ->
        for p in cs
            p[0] = Math.max p[0], 0
            p[1] = clamp 0, @state.numLines()-1, p[1]
            
        @editor.sortPositions cs
        
        if cs.length > 1
            for ci in [cs.length-1...0]
                c = cs[ci]
                p = cs[ci-1]
                if c[1] == p[1] and c[0] == p[0]
                    cs.splice ci, 1
        cs
    
    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
        
    line:        (i) -> @state.line i 
    cursor:      (i) -> @state.cursor i
    highlight:   (i) -> @state.highlight i
    selection:   (i) -> @state.selection i

    lines:           -> @state.lines()
    cursors:         -> @state.cursors()
    highlights:      -> @state.highlights()
    selections:      -> @state.selections()

    numLines:        -> @state.numLines()
    textInRange: (r) -> @state.line(r[0]).slice? r[1][0], r[1][1]
    
    selections:      -> @state.selections()
    numSelections:   -> @state.numSelections()
    highlights:      -> @state.highlights()
    numHighlights:   -> @state.numHighlights()
    
    cursors:         -> @state.cursors()
    numCursors:      -> @state.numCursors()
    mainCursor:      -> 
        mc = @state.mainCursor()
        [mc?.get?('x') ? 0, mc?.get?('y') ? -1]
            
module.exports = Do
