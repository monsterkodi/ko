
# 0000000     0000000 
# 000   000  000   000
# 000   000  000   000
# 000   000  000   000
# 0000000     0000000 

{ clamp, str, post, empty, error, log, _
}     = require 'kxk'
State = require './state'
require '../tools/ranges'

class Do
    
    constructor: (@editor) -> 
        
        @reset()
        
        post.on 'fileLinesChanged', (file, lineChanges) =>
            if file == @editor.currentFile
                @foreignChanges lineChanges

    foreignChanges: (lineChanges) ->
        
        @start()
        for change in lineChanges
            if change.change != 'deleted' and not change.after?
                error "Do.foreignChanges -- no after? #{change}" 
                continue
            switch change.change
                when 'changed'  then @change change.doIndex, change.after
                when 'inserted' then @insert change.doIndex, change.after
                when 'deleted'  then @delete change.doIndex
                else
                    error "Do.foreignChanges -- unknown change #{change.change}"
        @end foreign: true

    # 000000000   0000000   0000000     0000000  000000000   0000000   000000000  00000000  
    #    000     000   000  000   000  000          000     000   000     000     000       
    #    000     000000000  0000000    0000000      000     000000000     000     0000000   
    #    000     000   000  000   000       000     000     000   000     000     000       
    #    000     000   000  0000000    0000000      000     000   000     000     00000000  
    
    tabState: ->
        
        history: @history
        redos:   @redos
        state:   @state
        file:    @editor.currentFile
        
    setTabState: (state) ->
                
        @editor.restoreFromTabState state

        @groupCount = 0
        @history = state.history
        @redos   = state.redos
        @state   = state.state
        
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
        return _.first(@history).lines() != @editor.lines()
                                                                        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: ->
        
        @groupCount += 1
        if @groupCount == 1
            @startState = @state = new State @editor.state.s
            if empty(@history) or @state.s != _.last(@history).s
                @history.push @state

    isDoing: -> @groupCount > 0

    # 00     00   0000000   0000000    000  00000000  000   000
    # 000   000  000   000  000   000  000  000        000 000 
    # 000000000  000   000  000   000  000  000000      00000  
    # 000 0 000  000   000  000   000  000  000          000   
    # 000   000   0000000   0000000    000  000          000   
            
    change: (index, text) -> @state = @state.changeLine index, text 
    insert: (index, text) -> @state = @state.insertLine index, text
    delete: (index) ->
        if @editor.numLines() > 1 and 0 <= index < @editor.numLines()
            @editor.emit 'willDeleteLine', index, @editor.line(index)
            @state = @state.deleteLine index

    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  

    end: (opt) ->
        
        nologhere = log # !!! NO log HERE !!!

        @redos = []
        @groupCount -= 1
        if @groupCount == 0
            @merge()
            changes = @calculateChanges @startState, @state
            changes.foreign = opt?.foreign
            @editor.setState @state
            @editor.changed? changes
            
        log = nologhere

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
                
            @state = _.first @redos
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
            newSelections = cleanRanges newSelections
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
            return error "Do.setCursors -- empty cursors?"
                        
        if opt?.main 
            switch opt.main
                when 'first' then mainIndex = 0
                when 'last'  then mainIndex = newCursors.length-1
                when 'closest'
                    mainIndex = newCursors.indexOf posClosestToPosInPositions @editor.mainCursor(), newCursors 
                else 
                    mainIndex = newCursors.indexOf opt.main
                    mainIndex = parseInt opt.main if mainIndex < 0
        else
            mainIndex = newCursors.length-1
    
        mainCursor = newCursors[mainIndex]
        @cleanCursors newCursors
        mainIndex = newCursors.indexOf posClosestToPosInPositions mainCursor, newCursors 
    
        @state = @state.setCursors newCursors
        @state = @state.setMain mainIndex

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
            
        oldLines = oldState.lines()
        newLines = newState.lines()

        insertions = 0 # number of insertions
        deletions  = 0 # number of deletions
        
        if oldLines != newLines
        
            ol = oldLines[oi]
            nl = newLines[ni]
            
            while oi < oldLines.length
                
                if not nl? # new state has not enough lines, mark remaining lines in oldState as deleted
                    deletions += 1
                    changes.push change: 'deleted', oldIndex: oi, doIndex: oi+dd
                    oi += 1
                    dd -= 1
                    
                else if ol == nl # same lines in old and new
                    oi += 1
                    ol = oldLines[oi]
                    ni += 1
                    nl = newLines[ni]
                    
                else 
                    inserts = newLines.slice(ni).findIndex (v) -> v==ol # insertion
                    deletes = oldLines.slice(oi).findIndex (v) -> v==nl # deletion
                    
                    if inserts > 0 and (deletes <= 0 or inserts < deletes)
                        
                        while inserts
                            changes.push change: 'inserted', newIndex: ni, doIndex: oi+dd, after: nl
                            ni += 1
                            dd += 1
                            inserts -= 1
                            insertions += 1
                        nl = newLines[ni]
                        
                    else if deletes > 0 and (inserts <= 0 or deletes < inserts)                                    
                        
                        while deletes
                            changes.push change: 'deleted', oldIndex: oi, doIndex: oi+dd
                            oi += 1
                            dd -= 1
                            deletes -= 1
                            deletions += 1
                        ol = oldLines[oi]
                    
                    else # change
                        
                        changes.push change: 'changed', oldIndex: oi, newIndex: ni, doIndex: oi+dd, after: nl
                        oi += 1
                        ol = oldLines[oi]
                        ni += 1
                        nl = newLines[ni]
                            
            while ni < newLines.length # mark remaing lines in newState as inserted
                insertions += 1
                changes.push change: 'inserted', newIndex: ni, doIndex: ni, after: nl
                ni += 1
                nl = newLines[ni]
           
        changes: changes
        inserts: insertions
        deletes: deletions
        cursors: oldState.s.cursors    != newState.s.cursors
        selects: oldState.s.selections != newState.s.selections
                    
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
            a = _.last @history
            if a.lines() == b.lines()
                if @history.length > 2
                    @history.splice @history.length-2, 1
                else
                    return
            else if @history.length > 2 
                c = @history[@history.length-3]
                if a.lines().length == b.lines().length == c.lines().length
                    for li in [0...a.lines().length]
                        la = a.line li
                        lb = b.line li
                        lc = c.line li
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
            
        sortPositions cs
        
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
      
    text:            -> @state.text()
    line:        (i) -> @state.line i 
    cursor:      (i) -> @state.cursor i
    highlight:   (i) -> @state.highlight i
    selection:   (i) -> @state.selection i

    lines:           -> @state.lines()
    cursors:         -> @state.cursors()
    highlights:      -> @state.highlights()
    selections:      -> @state.selections()

    numLines:        -> @state.numLines()
    numCursors:      -> @state.numCursors()
    numSelections:   -> @state.numSelections()
    numHighlights:   -> @state.numHighlights()
    
    textInRange: (r) -> @state.line(r[0])?.slice r[1][0], r[1][1]
    mainCursor:      -> @state.mainCursor()
    rangeForLineAtIndex: (i) -> [i, [0, @line(i).length]]
            
module.exports = Do
