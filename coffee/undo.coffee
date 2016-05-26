# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 

log = require './tools/log'

class undo
    
    constructor: (done=->) ->
        @actionList = []
        @futureList = []
        @actions = @actionList
        @groupCount = 0
        @groupDone  = done
        
    undo: (obj) =>
        if @actionList.length
            action = @actionList.pop()
            if action.length?
                for i in [action.length-1..0]
                    a = action[i]
                    @undoAction obj, a
            else
                @undoAction obj, action
            @futureList.unshift action
            log @actionList
                
    redo: (obj) =>
        if @futureList.length
            action = @futureList.shift()
            if action.length?
                for a in action
                    @redoAction obj, a
            else
                @redoAction obj, action
            @actionList.push action
            log @actionList
            
    undoAction: (obj, action) =>
        if action.before?
            if action.after?
                obj.lines[action.index] = action.before
            else
                obj.lines.splice action.index, 0, action.before
        else if action.after?
            obj.lines.splice action.index, 1
            
        obj.selection = action.selBefore if action.selBefore?
        obj.selection = null if action.selBefore == [null, null]
        obj.cursor    = action.curBefore if action.curBefore?

    redoAction: (obj, action) =>
        if action.after?
            if action.before?
                obj.lines[action.index] = action.after
            else
                obj.lines.splice action.index, 1
        else if action.before?
            obj.lines.splice action.index, 0, action.before
        
        obj.selection = action.selAfter if action.selAfter?
        obj.selection = null if action.selAfter == [null, null]
        obj.cursor    = action.curAfter if action.curAfter?
        
    selection: (sel, pos) => 
        if sel != pos
            @actions.push 
                selBefore: [sel?[0], sel?[1]]
                selAfter:  [pos?[0], pos?[1]]
            sel?[0] = pos?[0]
            sel?[1] = pos?[1]
            @check()
            log @actionList
        pos
        
    cursor: (cur, pos) =>
        if (cur[0] != pos[0]) or (cur[1] != pos[1])
            @actions.push 
                curBefore: [cur[0], cur[1]]
                curAfter:  [pos[0], pos[1]]
            cur[0] = pos[0]
            cur[1] = pos[1]
            @check()
            log @actionList
        pos
        
    start: => 
        @groupCount += 1
        if @groupCount == 1
            @actions = []
            @actionList.push @actions
    
    change: (lines, index, text) =>
        @actions.push 
            index:  index
            before: lines[index]
            after:  text
        lines[index] = text
        @check()
        
    insert: (lines, index, text) =>
        @actions.push 
            index:  index
            after:  text        
        lines.splice index, 0, text
        @check()
        
    delete: (lines, index) =>
        @actions.push 
            index:   index
            before:  text        
        lines.splice index, 1
        @check()
        
    check: =>
        @futureList = []
        if @groupCount == 0
            @groupDone()
            # log @actionList
            
    end: => 
        @groupCount -= 1
        @check()
        if @groupCount == 0
            @actions = @actionList
            

module.exports = undo