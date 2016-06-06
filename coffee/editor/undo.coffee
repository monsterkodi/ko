# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 

log = require '../tools/log'
{clone} = require 'lodash'

class undo
    
    constructor: (done=->) ->
        @reset()
        @groupDone = done

    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
        
    reset: ->
        @actions = []
        @futures = []
        @groupCount = 0
        
    # 00000000   00000000  0000000     0000000 
    # 000   000  000       000   000  000   000
    # 0000000    0000000   000   000  000   000
    # 000   000  000       000   000  000   000
    # 000   000  00000000  0000000     0000000 

    redo: (obj) =>
        if @futures.length
            @changedLineIndices = []
            action = @futures.shift()
            for line in action.lines
                @redoLine obj, line
            @redoCursor obj, action
            @redoSelection obj, action
            @actions.push action
            obj.linesChanged @changedLineIndices
            @changedLineIndices = null

    redoLine: (obj, line) =>
        if line.after?
            if line.before?
                obj.lines[line.index] = line.after
                @changedLineIndices.push [line.index, line.index]
            else
                obj.lines.splice line.index, 0, line.before
                @changedLineIndices.push [line.index+1, -1]
        else if line.before?
            obj.lines.splice line.index, 1
            @changedLineIndices.push [line.index, -1]

    redoSelection: (obj, action) =>
        if action.selAfter?
            obj.selection = action.selAfter 
            @changedLineIndices.push obj.selectedLineIndicesRange()
        if action.selAfter?[0] == null
            @changedLineIndices.push obj.selectedLineIndicesRange()
            obj.selection = null 
        
    redoCursor: (obj, action) =>
        @addChangedLinesForCursor obj
        obj.cursor = [action.curAfter[0], action.curAfter[1]] if action.curAfter?
        @addChangedLinesForCursor obj

    # 000   000  000   000  0000000     0000000 
    # 000   000  0000  000  000   000  000   000
    # 000   000  000 0 000  000   000  000   000
    # 000   000  000  0000  000   000  000   000
    #  0000000   000   000  0000000     0000000 
    
    undo: (obj) =>
        if @actions.length
            @changedLineIndices = []
            action = @actions.pop()
            if action.lines.length
                for i in [action.lines.length-1..0]
                    @undoLine obj, action.lines[i]
            @undoCursor obj, action
            @undoSelection obj, action
            @futures.unshift action
            obj.linesChanged @changedLineIndices
            @changedLineIndices = null
                                    
    undoLine: (obj, line) =>
        if line.before?
            if line.after?
                obj.lines[line.index] = line.before
                @changedLineIndices.push [line.index, line.index]
            else
                obj.lines.splice line.index, 0, line.before
                @changedLineIndices.push [line.index+1, -1]
        else if line.after?
            obj.lines.splice line.index, 1
            @changedLineIndices.push [line.index, -1]
            
    undoSelection: (obj, action) =>
        if action.selBefore?
            obj.selection = action.selBefore 
            @changedLineIndices.push obj.selectedLineIndicesRange()
        if action.selBefore?[0] == null
            @changedLineIndices.push obj.selectedLineIndicesRange()
            obj.selection = null 
        
    undoCursor: (obj, action) =>
        @addChangedLinesForCursor obj
        obj.cursor = action.curBefore if action.curBefore?
        @addChangedLinesForCursor obj

    # 000       0000000    0000000  000000000
    # 000      000   000  000          000   
    # 000      000000000  0000000      000   
    # 000      000   000       000     000   
    # 0000000  000   000  0000000      000   
    
    lastAction: =>
        if @actions.length == 0
            @actions.push
                selBefore: [null, null]
                selAfter:  [null, null]
                curBefore: [0,0]
                curAfter:  [0,0]
                lines:     []
        return @actions[@actions.length-1]
        
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
    
    selection: (obj, pos) => 
        if (obj.selection?[0] != pos?[0]) or (obj.selection?[1] != pos?[1])
            @changedLineIndices = [] if not @changedLineIndices
            if pos?
                @lastAction().selAfter = [pos[0], pos[1]]
                obj.selection = [pos[0], pos[1]]
                @changedLineIndices.push obj.selectedLineIndicesRange()
            else
                @changedLineIndices.push obj.selectedLineIndicesRange()
                obj.selection = null
                @lastAction().selAfter = [null, null]
            @check()
        
    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000

    addChangedLinesForCursor: (obj) -> 
        @changedLineIndices = [] if not @changedLineIndices
        if obj.selection?
            @changedLineIndices.push obj.selectedLineIndicesRange()
        else
            @changedLineIndices.push [obj.cursor[1], obj.cursor[1]]
    
    cursor: (obj, pos) =>
        if (obj.cursor[0] != pos[0]) or (obj.cursor[1] != pos[1])
            @addChangedLinesForCursor obj
            @lastAction().curAfter = [pos[0], pos[1]]
            obj.cursor = [pos[0], pos[1]]
            @addChangedLinesForCursor obj
            @check()
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: => 
        @groupCount += 1
        if @groupCount == 1
            last = @lastAction()
            @actions.push 
                selBefore: clone last.selAfter
                curBefore: clone last.curAfter
                selAfter:  clone last.selAfter
                curAfter:  clone last.curAfter
                lines:     []

    # 00     00   0000000   0000000    000  00000000  000   000
    # 000   000  000   000  000   000  000  000        000 000 
    # 000000000  000   000  000   000  000  000000      00000  
    # 000 0 000  000   000  000   000  000  000          000   
    # 000   000   0000000   0000000    000  000          000   
    
    modify: (change) =>
        @changedLineIndices = [] if not @changedLineIndices
        last = @lastAction()
        lines = last.lines
        if lines.length and lines[lines.length-1].index == change.index
            lines[lines.length-1].after = change.after
        else
            lines.push change
    
    change: (lines, index, text) =>
        return if lines[index] == text
        @modify
            index:  index
            before: lines[index]
            after:  text
        lines[index] = text
        @changedLineIndices.push [index, index]
        @check()
        
    insert: (lines, index, text) =>
        @modify
            index:  index
            after:  text        
        lines.splice index, 0, text
        @changedLineIndices.push [index+1, -1]
        @check()
        
    delete: (lines, index) =>
        @modify
            index:   index
            before:  lines[index]        
        lines.splice index, 1
        @changedLineIndices.push [index, -1]
        @check()
        
    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  
    
    check: =>
        @futures = []
        if @groupCount == 0
            if @changedLineIndices?
                @groupDone()
                @changedLineIndices = null
            
    end: => 
        @groupCount -= 1
        @check()

module.exports = undo