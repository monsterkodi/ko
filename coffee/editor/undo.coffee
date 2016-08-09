# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 
{
first, 
last}  = require '../tools/tools'
log    = require '../tools/log'
_      = require 'lodash'

class Undo
    
    constructor: (@editor) -> @reset()

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
            lines:     false
            changed:   false
            inserted:  false
            deleted:   false
            cursors:   false
            selection: false
            
    getChangeInfo: ->
        if not @changeInfo?
            @newChangeInfo()
        @changeInfo
        
    changeInfoLineChange: () ->
        @getChangeInfo()
        @changeInfo.lines = true
        @changeInfo.changed = true

    changeInfoLineInsert: () ->
        @getChangeInfo()
        @changeInfo.lines = true
        @changeInfo.inserted = true

    changeInfoLineDelete: () ->
        @getChangeInfo()
        @changeInfo.lines = true
        @changeInfo.deleted = true
        
    changeInfoCursor: ->
        @getChangeInfo()
        @changeInfo.cursors = true

    changeInfoSelection: ->
        @getChangeInfo()
        @changeInfo.selection = true
            
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
            
            @editor.changed @changeInfo, action
            @delChangeInfo()

    redoLine: (line) ->
        if line.after?
            if line.before?
                @editor.lines[line.oldIndex] = line.after
                @changeInfoLineChange()
            else
                @editor.lines.splice line.oldIndex, 0, line.after
                @changeInfoLineInsert()
        else if line.before?
            @editor.lines.splice line.oldIndex, 1
            @changeInfoLineDelete()

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
            undoLines = []
            for line in action.lines 
                undoLines.push 
                    oldIndex:  line.newIndex
                    newIndex:  line.oldIndex
                    change:    line.change
                lastLine = last undoLines
                lastLine.before = line.after  if line.after?
                lastLine.after  = line.before if line.before?
                if line.change == 'deleted'  then lastLine.change = 'inserted'
                if line.change == 'inserted' then lastLine.change = 'deleted'
                @redoLine lastLine

            @undoCursor action
            @undoSelection action
            @futures.unshift action

            @editor.changed @changeInfo, lines: undoLines
            @delChangeInfo()
                                                
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
            alert 'warning! empty cursors?'
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
                selBefore:  _.clone a.selAfter
                curBefore:  _.clone a.curAfter
                selAfter:   _.clone a.selAfter
                curAfter:   _.clone a.curAfter
                mainBefore: a.mainBefore
                mainAfter:  a.mainAfter
                lines:      []

    # 00     00   0000000   0000000    000  00000000  000   000
    # 000   000  000   000  000   000  000  000        000 000 
    # 000000000  000   000  000   000  000  000000      00000  
    # 000 0 000  000   000  000   000  000  000          000   
    # 000   000   0000000   0000000    000  000          000   
    
    moveLinesAfter: (index, dy) ->
        for change in @lastAction().lines
            if change.oldIndex >= index
                change.newIndex += dy
    
    modify: (change) ->
        lines = @lastAction().lines
        if lines.length and last(lines).oldIndex == change.oldIndex and change.before?
            last(lines).after = change.after
            if not change.after?
                @moveLinesAfter change.oldIndex, -1
        else
            change.newIndex = change.oldIndex
            if not change.after?
                @moveLinesAfter change.oldIndex, -1
            else if not change.before?
                @moveLinesAfter change.oldIndex,  1
            lines.push change
    
    change: (index, text) ->
        return if @editor.lines[index] == text
        @modify
            change: 'changed'
            before: @editor.lines[index]
            after:  text
            oldIndex:  index
        @editor.lines[index] = text
        @changeInfoLineChange()
        @check()
        
    insert: (index, text) ->
        @modify
            change:     'inserted'
            after:      text 
            oldIndex:   index
        @editor.lines.splice index, 0, text
        @changeInfoLineInsert()
        @check()
        
    delete: (index) ->
        if @editor.lines.length > 1
            @modify
                change:     'deleted'
                before:     @editor.lines[index] 
                oldIndex:   index
            @editor.emit 'willDeleteLine', index, @editor.lines[index]
            @editor.lines.splice index, 1
            @changeInfoLineDelete()
            @check()
        else
            alert 'warning! last line deleted?'
            throw new Error
        
    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  

    end: (opt) ->
        if opt?.foreign
            @changeInfo?.foreign = opt.foreign
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
                @editor.changed @changeInfo, last @actions
                @delChangeInfo()
        
    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000     
    # 000000000  0000000   0000000    000  0000  0000000 
    # 000 0 000  000       000   000  000   000  000     
    # 000   000  00000000  000   000   0000000   00000000
    
    merge: ->        
        while @actions.length >= 2
            b = @actions[@actions.length-2]
            a = last @actions
            if a.lines.length == 0 and b.lines.length == 0
                @actions.pop()
                b.selAfter  = a.selAfter
                b.curAfter  = a.curAfter
                b.mainAfter = a.mainAfter
            else if a.lines.length == b.lines.length
                sameLines = true
                for i in [0...a.lines.length]
                    if a.lines[i].index != b.lines[i].index or 
                        not a.lines[i].after or
                            not b.lines[i].after or
                                Math.abs(a.lines[i].after.length - b.lines[i].after.length) > 1
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
        
module.exports = Undo
