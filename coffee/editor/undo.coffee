# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 
{
first, 
last,
str,
log}  = require 'kxk'
_     = require 'lodash'

dbg = false

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

    redoLine: (line) ->
        switch line.change
            when 'deleted'
                @editor.lines.splice line.oldIndex, 1
                @changeInfoLineDelete()
            when 'inserted'
                @editor.lines.splice line.oldIndex, 0, line.after
                @changeInfoLineInsert()
            when 'changed'
                @editor.lines[line.oldIndex] = line.after
                @changeInfoLineChange()

    redo: ->
        if @futures.length
            @newChangeInfo()
            action = @futures.shift()
            
            if dbg 
                log 'lines before redo', @editor.lines
                log 'action.lines', action.lines
                        
            for line in action.lines
                @redoLine line
            
            if dbg    
                log 'lines after redo', @editor.lines
                
            @redoCursor action
            @redoSelection action
            @actions.push action
            @editor.changed? @changeInfo, action
            @delChangeInfo()

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
    
    undoLine: (line) ->
        switch line.change
            when 'deleted'
                @editor.lines.splice line.oldIndex, 1
                @changeInfoLineDelete()
            when 'inserted'
                @editor.lines.splice line.newIndex, 0, line.after
                @changeInfoLineInsert()
            when 'changed'
                @editor.lines[line.newIndex] = line.after
                @changeInfoLineChange()
                
    undo: ->
        if @actions.length
            @newChangeInfo()
            action = @actions.pop()
            undoLines = []
            
            if dbg
                log 'action.lines', action.lines
                
            for line in action.lines.reversed()
                undoLines.push 
                    oldIndex:  line.newIndex
                    newIndex:  line.oldIndex
                    change:    line.change
                lastLine = last undoLines
                lastLine.before = line.after  if line.after?
                lastLine.after  = line.before if line.before?
                if line.change == 'deleted'  then lastLine.change = 'inserted'
                if line.change == 'inserted' then lastLine.change = 'deleted'
            
            if dbg
                log 'lines before undo', @editor.lines
                log 'undoLines', undoLines
            
            sortedLines = []
            cloneLines = _.cloneDeep undoLines
            while line = cloneLines.shift()
                if line.change != 'changed'
                    for l in cloneLines
                        if l.newIndex >= line.newIndex
                            l.oldIndex += line.change == 'deleted' and -1 or 1
                sortedLines.push line
            
            if dbg
                log 'undoLines sorted', sortedLines
            
            changes = insertions: [], deletions: [], changes: []
            
            for line in sortedLines
                @undoLine line
                
                line.oldIndex = line.newIndex
                switch line.change
                    when 'inserted'
                        inserted = false
                        # for i in [0...changes.insertions.length]
                            # if changes.insertions[i].newIndex >= line.newIndex
                                # changes.insertions.splice i, 0, line
                                # for j in [i+1...changes.insertions.length]
                                    # changes.insertions[j].oldIndex += 1
                                    # changes.insertions[j].newIndex += 1
                                # inserted = true
                                # break
                        if not inserted
                            changes.insertions.push line
                            
                        for change in changes.changes
                            if change.oldIndex >= line.oldIndex
                                change.oldIndex += 1
                                change.newIndex += 1
                            
                    when 'deleted'  
                        changes.deletions.push line
                        
                    when 'changed'
                        # for insertion in changes.insertions
                            # if insertion.newIndex == line.newIndex
                                # line.oldIndex = insertion.oldIndex
                        changes.changes.push line
            
            if dbg
                log 'lines after undo', @editor.lines
                            
            sortedLines = changes.insertions.concat changes.deletions, changes.changes
                        
            if dbg
                log 'sortedLines', sortedLines
            
            @undoCursor action
            @undoSelection action
            @futures.unshift action
            
            @editor.changed? @changeInfo, lines: sortedLines
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
        
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 

    cursors: (newCursors, opt) ->
        return if not @actions.length
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
        @lastAction().curAfter  = _.cloneDeep newCursors        
        @lastAction().mainAfter = newCursors.indexOf @editor.mainCursor
        @editor.cursors = newCursors
        @changeInfoCursor()

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
            if change.oldIndex > index
                change.newIndex += dy
    
    modify: (change) ->
        
        lines = @lastAction().lines
                        
        change.newIndex = change.oldIndex
        if change.change == 'deleted'
            @moveLinesAfter change.oldIndex, -1
        else if change.change == 'inserted'
            @moveLinesAfter change.oldIndex-1,  1
        lines.push change
        
        if dbg 
            console.log 'modify', str lines
    
    change: (index, text) ->
        return if @editor.lines[index] == text
        @modify
            change:   'changed'
            before:   @editor.lines[index]
            after:    text
            oldIndex: index
        @editor.lines[index] = text
        @changeInfoLineChange()
        
    insert: (index, text) ->
        @modify
            change:   'inserted'
            after:    text 
            oldIndex: index
        @editor.lines.splice index, 0, text
        @changeInfoLineInsert()
        
    delete: (index) ->
        if @editor.lines.length > 1
            @modify
                change:   'deleted'
                before:   @editor.lines[index] 
                oldIndex: index
            @editor.emit 'willDeleteLine', index, @editor.lines[index]
            @editor.lines.splice index, 1
            @changeInfoLineDelete()
        else
            alert 'warning! last line deleted?'
            throw new Error
        
    # 00000000  000   000  0000000  
    # 000       0000  000  000   000
    # 0000000   000 0 000  000   000
    # 000       000  0000  000   000
    # 00000000  000   000  0000000  

    end: (opt) -> # no log here!
        
        if opt?.foreign
            @changeInfo?.foreign = opt.foreign
        @groupCount -= 1
        @futures = []
        
        if dbg
            console.log "end", @editor.text()
            
        # if dbg and last(@actions).lines
            # console.log "end group #{@groupCount}", str last(@actions).lines
    
        if @groupCount == 0

            # if dbg 
                # for a in @actions
                    # if a.lines.length
                        # console.log "action before merge", str a.lines
            
            @merge()
            
            if dbg and last(@actions).lines
                console.log 'end', str last(@actions).lines
            
            if @changeInfo?
                @editor.changed? @changeInfo, lines: last(@actions).lines
                @delChangeInfo()

    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000     
    # 000000000  0000000   0000000    000  0000  0000000 
    # 000 0 000  000       000   000  000   000  000     
    # 000   000  00000000  000   000   0000000   00000000
    
    # looks at last two actions and merges them 
    #       when they contain no line changes
    #       when they contain only changes of the same set of lines
    
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
                    if a.lines[i].oldIndex != b.lines[i].oldIndex or 
                        a.lines[i].change != b.lines[i].change or a.lines[i].change != 'changed' or
                            not a.lines[i].after or not b.lines[i].after or
                                Math.abs(a.lines[i].after.length - b.lines[i].after.length) > 1
                                    return
                if sameLines
                    @actions.pop()
                    b.selAfter  = a.selAfter
                    b.curAfter  = a.curAfter
                    b.mainAfter = a.mainAfter
                    for i in [0...a.lines.length]
                        b.lines[i].after = a.lines[i].after
                else return
            else return
        
module.exports = Undo
