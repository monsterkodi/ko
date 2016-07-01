# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 

log     = require '../tools/log'
{last}  = require '../tools/tools'
{clone} = require 'lodash'

class undo
    
    constructor: (@editor, @groupDone=->) -> @reset()

    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
        
    reset: ->
        @actions = []
        @futures = []
        @groupCount = 0
                
    hasLineChanges: -> 
        return false if @actions.length == 0
        return last(@actions).lines.length > 0
        
    #  0000000  000   000   0000000   000   000   0000000   00000000  000  000   000  00000000   0000000 
    # 000       000   000  000   000  0000  000  000        000       000  0000  000  000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000  000 0 000  000000    000   000
    # 000       000   000  000   000  000  0000  000   000  000       000  000  0000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  000  000   000  000        0000000 

    newChangeInfo: ->
        @changeInfo = 
            cursor:    []
            selection: []
            changed:   []
            inserted:  []
            deleted:   []
            sorted:    []
            
    getChangeInfo: ->
        if not @changeInfo?
            @newChangeInfo()
        @changeInfo
        
    changeInfoLineChange: (i) ->
        @getChangeInfo()
        if @changeInfo.changed.indexOf(i) < 0
            @changeInfo.changed.push i
            @changeInfo.sorted.push [i, 'changed', i]

    changeInfoLineInsert: (i) ->
        @getChangeInfo()
        @changeInfo.inserted.push i
        for c in @changeInfo.sorted
            if c[0] >= i
                c[0] += 1
        @changeInfo.sorted.push [i, 'inserted', i]

    changeInfoLineDelete: (i) ->
        @getChangeInfo()
        @changeInfo.deleted.push i
        for c in @changeInfo.sorted
            if c[0] > i
                c[0] -= 1
        @changeInfo.sorted.push [i, 'deleted', i]        
        
    changeInfoCursor: ->
        @getChangeInfo()
        for c in @editor.cursors
            if @changeInfo.cursor.indexOf(c[1]) < 0
                @changeInfo.cursor.push c[1]

    changeInfoSelection: ->
        @getChangeInfo()
        @changeInfo.selection.push @editor.selectedLineIndexRange()
            
    delChangeInfo: -> @changeInfo = null
        
    # 00000000   00000000  0000000     0000000 
    # 000   000  000       000   000  000   000
    # 0000000    0000000   000   000  000   000
    # 000   000  000       000   000  000   000
    # 000   000  00000000  0000000     0000000 

    redo: ->
        if @futures.length
            @newChangeInfo()
            action = @futures.shift()
            for line in action.lines
                @redoLine line
            @redoCursor action
            @redoSelection action
            @actions.push action
            
            @cleanChangeInfo()
            @editor.changed @changeInfo
            # log "redo @changeInfo", @changeInfo
            @delChangeInfo()

    redoLine: (line) ->
        if line.after?
            if line.before?
                @editor.lines[line.index] = line.after
                @changeInfoLineChange line.index
            else
                @editor.lines.splice line.index, 0, line.after
                @changeInfoLineInsert line.index
        else if line.before?
            @editor.lines.splice line.index, 1
            @changeInfoLineDelete line.index

    redoSelection: (action) ->
        if action.selAfter.length
            @editor.selections = _.cloneDeep action.selAfter
            @changeInfoSelection()
        if action.selAfter.length == 0
            @changeInfoSelection()
            @editor.selections = [] 
        
    redoCursor: (action) ->
        @changeInfoCursor()
        if action.curAfter?
            @editor.cursors = action.curAfter
            @editor.mainCursor = @editor.cursors[action.mainAfter]
        @changeInfoCursor()

    # 000   000  000   000  0000000     0000000 
    # 000   000  0000  000  000   000  000   000
    # 000   000  000 0 000  000   000  000   000
    # 000   000  000  0000  000   000  000   000
    #  0000000   000   000  0000000     0000000 
    
    undo: ->
        if @actions.length
            @newChangeInfo()
            action = @actions.pop()
            # log "undo.undo", action
            if action.lines.length
                for i in [action.lines.length-1..0]
                    @undoLine action.lines[i]
            @undoCursor action
            @undoSelection action
            @futures.unshift action

            @cleanChangeInfo()
            @editor.changed @changeInfo
            # log "undo @changeInfo", @changeInfo
            @delChangeInfo()
                                    
    undoLine: (line) ->
        if line.before?
            if line.after?
                @editor.lines[line.index] = line.before
                @changeInfoLineChange line.index
            else
                @editor.lines.splice line.index, 0, line.before
                @changeInfoLineInsert line.index
        else if line.after?
            @editor.lines.splice line.index, 1
            @changeInfoLineDelete line.index
            
    undoSelection: (action) ->
        if action.selBefore.length
            @editor.selections = _.cloneDeep action.selBefore 
            @changeInfoSelection()
        if action.selBefore.length == 0
            @changeInfoSelection()
            @editor.selections = [] 
        
    undoCursor: (action) ->
        @changeInfoCursor()
        if action.curBefore?
            @editor.cursors = action.curBefore 
            @editor.mainCursor = @editor.cursors[action.mainBefore]
        @changeInfoCursor()
        
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
    
    selections: (newSelections) -> 
        if newSelections.length
            newSelections = @editor.cleanRanges newSelections
            @lastAction().selAfter = _.cloneDeep newSelections
            @editor.selections = newSelections
            @changeInfoSelection()
        else
            @changeInfoSelection()
            @editor.selections = []
            @lastAction().selAfter = []
        @check()
        
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 

    cursors: (newCursors, opt) ->
        
        if not newCursors? or newCursors.length < 1
            alert('empty cursors') 
            throw new Error
            
        @editor.mainCursor = @editor.posClosestToPosInPositions(@editor.mainCursor, newCursors) if opt?.closestMain
        
        if newCursors.indexOf(@editor.mainCursor) < 0
            if @editor.indexOfCursor(@editor.mainCursor) >= 0
                @editor.mainCursor = newCursors[Math.min newCursors.length-1, @editor.indexOfCursor @editor.mainCursor]
            else
                @editor.mainCursor = last(newCursors)        
        
        @editor.cleanCursors newCursors
        
        if not opt?.keepInitial or newCursors.length != @editor.cursors.length
            @editor.initialCursors = _.cloneDeep newCursors
        @changeInfoCursor()
        if not @actions.length
            @lastAction().curBefore  = _.cloneDeep newCursors 
            @lastAction().mainBefore = newCursors.indexOf @editor.mainCursor
        @lastAction().curAfter  = _.cloneDeep newCursors        
        @lastAction().mainAfter = newCursors.indexOf @editor.mainCursor
        @editor.cursors = newCursors
        @changeInfoCursor()
        
        @check()

    # 000       0000000    0000000  000000000
    # 000      000   000  000          000   
    # 000      000000000  0000000      000   
    # 000      000   000       000     000   
    # 0000000  000   000  0000000      000   
    
    lastAction: ->
        if @actions.length == 0
            @actions.push
                selBefore:  []
                selAfter:   []
                curBefore:  [[0,0]]
                curAfter:   [[0,0]]
                mainBefore: 0
                mainAfter:  0
                lines:      []
        return @actions[@actions.length-1]
            
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: -> 
        @groupCount += 1
        if @groupCount == 1
            a = @lastAction()            
            @actions.push 
                selBefore:  clone a.selAfter
                curBefore:  clone a.curAfter
                selAfter:   clone a.selAfter
                curAfter:   clone a.curAfter
                mainBefore: a.mainBefore
                mainAfter:  a.mainAfter
                lines:      []

    # 00     00   0000000   0000000    000  00000000  000   000
    # 000   000  000   000  000   000  000  000        000 000 
    # 000000000  000   000  000   000  000  000000      00000  
    # 000 0 000  000   000  000   000  000  000          000   
    # 000   000   0000000   0000000    000  000          000   
    
    modify: (change) ->
        lines = @lastAction().lines
        if lines.length and last(lines).index == change.index and change.before?
            last(lines).after = change.after
        else
            lines.push change
    
    change: (index, text) ->
        return if @editor.lines[index] == text
        @modify
            index:  index
            before: @editor.lines[index]
            after:  text
        @editor.lines[index] = text
        @changeInfoLineChange index
        @check()
        
    insert: (index, text) ->
        @modify
            index:  index
            after:  text        
        @editor.lines.splice index, 0, text
        @changeInfoLineInsert index
        @check()
        
    delete: (index) ->
        if @editor.lines.length > 1
            @modify
                index:   index
                before:  @editor.lines[index]        
            @editor.emit 'willDeleteLine', index, @editor.lines[index]
            @editor.lines.splice index, 1
            @changeInfoLineDelete index
            @check()
        else
            log 'warning! last line deleted?' 
            alert 'wtf?'
        
    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  
                
    end: -> 
        @groupCount -= 1
        @check()

    #  0000000  000   000  00000000   0000000  000   000
    # 000       000   000  000       000       000  000 
    # 000       000000000  0000000   000       0000000  
    # 000       000   000  000       000       000  000 
    #  0000000  000   000  00000000   0000000  000   000
    
    check: ->
        @futures = []
        if @groupCount == 0
            @merge()
            if @changeInfo?
                @cleanChangeInfo()
                @groupDone()
                @delChangeInfo()
        
    #  0000000  000      00000000   0000000   000   000
    # 000       000      000       000   000  0000  000
    # 000       000      0000000   000000000  000 0 000
    # 000       000      000       000   000  000  0000
    #  0000000  0000000  00000000  000   000  000   000
        
    cleanChangeInfo: ->
        @changeInfo.inserted.sort (a,b) -> a-b
        @changeInfo.deleted.sort  (a,b) -> a-b
        @changeInfo.changed.sort  (a,b) -> a-b
        @changeInfo.cursor.sort   (a,b) -> a-b
        
    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000     
    # 000000000  0000000   0000000    000  0000  0000000 
    # 000 0 000  000       000   000  000   000  000     
    # 000   000  00000000  000   000   0000000   00000000
    
    merge: ->        
        # log "\nundo.merge before", @actions
        while @actions.length >= 2
            b = @actions[@actions.length-2]
            a = last @actions
            if a.lines.length == 0 
                @actions.pop()
                b.selAfter  = a.selAfter
                b.curAfter  = a.curAfter
                b.mainAfter = a.mainAfter
            else if a.lines.length == b.lines.length
                sameLines = true
                for i in [0...a.lines.length]
                    if a.lines[i].index != b.lines[i].index or 
                        not a.lines[i].after or
                            not b.lines[i].after
                                sameLines = false
                                break                    
                if sameLines
                    @actions.pop()
                    b.selAfter  = a.selAfter
                    b.curAfter  = a.curAfter
                    b.mainAfter = a.mainAfter
                    for i in [0...a.lines.length]
                        b.lines[i].after = a.lines[i].after
                else
                    break
            else
                break
        # log "\nundo.merge merged", @actions
        
module.exports = undo