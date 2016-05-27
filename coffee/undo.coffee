# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 

log = require './tools/log'
{clone} = require 'lodash'

class undo
    
    constructor: (done=->) ->
        @actions = []
        @futures = []
        @groupCount = 0
        @groupDone  = done
        
    # 00000000   00000000  0000000     0000000 
    # 000   000  000       000   000  000   000
    # 0000000    0000000   000   000  000   000
    # 000   000  000       000   000  000   000
    # 000   000  00000000  0000000     0000000 

    redo: (obj) =>
        if @futures.length
            action = @futures.shift()
            for line in action.lines
                @redoLine obj, line
            @redoCursor obj, action
            @redoSelection obj, action
            @actions.push action
            # log 'after REDO actions\n', @actions, '------\nfutures\n', @futures

    redoLine: (obj, line) =>
        if line.after?
            if line.before?
                obj.lines[line.index] = line.after
            else
                obj.lines.splice line.index, 0, line.before
        else if line.before?
            obj.lines.splice line.index, 1

    redoSelection: (obj, action) =>
        obj.selection = action.selAfter if action.selAfter?
        obj.selection = null if action.selAfter?[0] == null
        
    redoCursor: (obj, action) =>
        obj.cursor = [action.curAfter[0], action.curAfter[1]] if action.curAfter?

    # 000   000  000   000  0000000     0000000 
    # 000   000  0000  000  000   000  000   000
    # 000   000  000 0 000  000   000  000   000
    # 000   000  000  0000  000   000  000   000
    #  0000000   000   000  0000000     0000000 
    
    undo: (obj) =>
        if @actions.length
            action = @actions.pop()
            if action.lines.length
                for i in [action.lines.length-1..0]
                    @undoLine obj, action.lines[i]
            @undoCursor obj, action
            @undoSelection obj, action
            @futures.unshift action
            # log 'after UNDO actions\n', @actions, '------\nfutures\n', @futures
                                    
    undoLine: (obj, line) =>
        if line.before?
            if line.after?
                obj.lines[line.index] = line.before
            else
                obj.lines.splice line.index, 0, line.before
        else if line.after?
            obj.lines.splice line.index, 1
            
    undoSelection: (obj, action) =>
        obj.selection = action.selBefore if action.selBefore?
        obj.selection = null if action.selBefore?[0] == null
        
    undoCursor: (obj, action) =>
        obj.cursor = action.curBefore if action.curBefore?

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
        
    #  0000000  00000000  000    
    # 000       000       000    
    # 0000000   0000000   000    
    #      000  000       000    
    # 0000000   00000000  0000000
    
    selection: (sel, pos) => 
        if (sel?[0] != pos?[0]) or (sel?[1] != pos?[1])
            
            if pos?
                @lastAction().selAfter = [pos[0], pos[1]]
                sel?[0] = pos[0]
                sel?[1] = pos[1]
            else
                @lastAction().selAfter = [null, null]
            @check()
            # log "selection", @actions
        pos
        
    #  0000000  000   000  00000000 
    # 000       000   000  000   000
    # 000       000   000  0000000  
    # 000       000   000  000   000
    #  0000000   0000000   000   000
    
    cursor: (cur, pos) =>
        if (cur[0] != pos[0]) or (cur[1] != pos[1])
            @lastAction().curAfter = [pos[0], pos[1]]
            cur[0] = pos[0]
            cur[1] = pos[1]
            @check()
            # log "cursor", @actions
        pos
    
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
        @check()
        
    insert: (lines, index, text) =>
        @modify
            index:  index
            after:  text        
        lines.splice index, 0, text
        @check()
        
    delete: (lines, index) =>
        @modify
            index:   index
            before:  lines[index]        
        lines.splice index, 1
        @check()
        
    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  
    
    check: =>
        @futures = []
        if @groupCount == 0
            @groupDone()
            
    end: => 
        @groupCount -= 1
        @check()

module.exports = undo