# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 

log = require '../tools/log'
{last} = require '../tools/tools'
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
                
    hasLineChanges: -> 
        return false if @actions.length == 0
        return last(@actions).lines.length > 0
        
    #  0000000  000   000   0000000   000   000   0000000   00000000  000  000   000  00000000   0000000 
    # 000       000   000  000   000  0000  000  000        000       000  0000  000  000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000  000 0 000  000000    000   000
    # 000       000   000  000   000  000  0000  000   000  000       000  000  0000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  000  000   000  000        0000000 

    newChangedInfo: ->
        @changeInfo = 
            cursor: []
            selection: []
            changed: []
            inserted: []
            removed: []
            
    getChangeInfo: ->
        if not @changeInfo?
            @changeInfo = 
                cursor: []
                selection: []
                changed: []
                inserted: []
                removed: []
        @changeInfo
        
    delChangeInfo: ->
        @changeInfo = null
        
    # 00000000   00000000  0000000     0000000 
    # 000   000  000       000   000  000   000
    # 0000000    0000000   000   000  000   000
    # 000   000  000       000   000  000   000
    # 000   000  00000000  0000000     0000000 

    redo: (obj) =>
        if @futures.length
            @changedLineIndices = []
            @newChangeInfo()
            action = @futures.shift()
            for line in action.lines
                @redoLine obj, line
            @redoCursor obj, action
            @redoSelection obj, action
            @actions.push action
            obj.linesChanged @changedLineIndices
            obj.changed @changeInfo
            log "redo @changeInfo", @changeInfo
            @delChangeInfo()
            @changedLineIndices = null

    redoLine: (obj, line) =>
        if line.after?
            if line.before?
                obj.lines[line.index] = line.after
                @changedLineIndices.push [line.index, line.index]
                @changeInfo.changed.push line.index
            else
                obj.lines.splice line.index, 0, line.after
                @changedLineIndices.push [line.index+1, -1]
                @changeInfo.inserted.push line.index+1
        else if line.before?
            obj.lines.splice line.index, 1
            @changedLineIndices.push [line.index, -1]
            @changeInfo.removed.push line.index+1

    redoSelection: (obj, action) =>
        if action.selAfter?
            obj.selection = action.selAfter 
            @changedLineIndices.push obj.selectedLineIndicesRange()
            @changeInfo.selection.push obj.selectedLineIndicesRange()
        if action.selAfter?[0] == null
            @changedLineIndices.push obj.selectedLineIndicesRange()
            @changeInfo.selection.push obj.selectedLineIndicesRange()
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
            @newChangeInfo()
            action = @actions.pop()
            if action.lines.length
                for i in [action.lines.length-1..0]
                    @undoLine obj, action.lines[i]
            @undoCursor obj, action
            @undoSelection obj, action
            @futures.unshift action
            obj.linesChanged @changedLineIndices
            obj.changed @changeInfo
            log "undo @changeInfo", @changeInfo
            @delChangeInfo()
            @changedLineIndices = null
                                    
    undoLine: (obj, line) =>
        if line.before?
            if line.after?
                obj.lines[line.index] = line.before
                @changedLineIndices.push [line.index, line.index]
                @changeInfo.changed.push line.index
            else
                obj.lines.splice line.index, 0, line.before
                @changedLineIndices.push [line.index+1, -1]
                @changeInfo.inserted.push line.index+1
        else if line.after?
            obj.lines.splice line.index, 1
            @changedLineIndices.push [line.index, -1]
            @changeInfo.removed.push line.index
            
    undoSelection: (obj, action) =>
        if action.selBefore?
            obj.selection = action.selBefore 
            @changedLineIndices.push obj.selectedLineIndicesRange()
            @changeInfo.selection.push obj.selectedLineIndicesRange()
        if action.selBefore?[0] == null
            @changedLineIndices.push obj.selectedLineIndicesRange()
            @changeInfo.selection.push obj.selectedLineIndicesRange()
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
                @getChangeInfo().selection.push obj.selectedLineIndicesRange()
            else
                @changedLineIndices.push obj.selectedLineIndicesRange()
                @getChangeInfo().selection.push obj.selectedLineIndicesRange()
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
        @getChangeInfo().cursor.push obj.cursor[1]
    
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
            a = @lastAction()
            @actions.push 
                selBefore: clone a.selAfter
                curBefore: clone a.curAfter
                selAfter:  clone a.selAfter
                curAfter:  clone a.curAfter
                lines:     []

    # 00     00   0000000   0000000    000  00000000  000   000
    # 000   000  000   000  000   000  000  000        000 000 
    # 000000000  000   000  000   000  000  000000      00000  
    # 000 0 000  000   000  000   000  000  000          000   
    # 000   000   0000000   0000000    000  000          000   
    
    modify: (change) =>
        @changedLineIndices = [] if not @changedLineIndices
        lines = @lastAction().lines
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
        @getChangeInfo().changed.push index
        @check()
        
    insert: (lines, index, text) =>
        @modify
            index:  index
            after:  text        
        lines.splice index, 0, text
        @changedLineIndices.push [index+1, -1]
        @getChangeInfo().inserted.push index+1
        @check()
        
    delete: (lines, index) =>
        @modify
            index:   index
            before:  lines[index]        
        lines.splice index, 1
        @changedLineIndices.push [index, -1]
        @getChangeInfo().removed.push index
        @check()
        
    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  
                
    end: => 
        @groupCount -= 1
        @check()

    #  0000000  000   000  00000000   0000000  000   000
    # 000       000   000  000       000       000  000 
    # 000       000000000  0000000   000       0000000  
    # 000       000   000  000       000       000  000 
    #  0000000  000   000  00000000   0000000  000   000
    
    check: =>
        @futures = []
        if @groupCount == 0
            @merge()
            if @changedLineIndices? # replace with @changeInfo?
                @groupDone()
                @changedLineIndices = null
                @delChangeInfo()
                
    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000     
    # 000000000  0000000   0000000    000  0000  0000000 
    # 000 0 000  000       000   000  000   000  000     
    # 000   000  00000000  000   000   0000000   00000000
    
    merge: =>
        while @actions.length >= 2
            a = last @actions
            b = @actions[@actions.length-2]
            if a.lines.length == 0 
                @actions.pop()
                b.selAfter = a.selAfter
                b.curAfter = a.curAfter
            else if a.lines.length == b.lines.length
                sameLines = true
                for i in [0...a.lines.length]
                    if a.lines[i].index != b.lines[i].index
                        sameLines = false
                        break
                if sameLines
                    @actions.pop()
                    b.selAfter = a.selAfter
                    b.curAfter = a.curAfter
                    for i in [0...a.lines.length]
                        b.lines[i].after = a.lines[i].after
                else
                    break
            else
                break

module.exports = undo