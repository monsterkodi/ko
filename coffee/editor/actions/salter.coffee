#  0000000   0000000   000      000000000  00000000  00000000   
# 000       000   000  000         000     000       000   000  
# 0000000   000000000  000         000     0000000   0000000    
#      000  000   000  000         000     000       000   000  
# 0000000   000   000  0000000     000     00000000  000   000  
  
salt = require '../../tools/salt'  
_    = require 'lodash'

module.exports =
    
    startSalter: (opt) ->
        cp = @cursorPos()
        if not opt?.word and rgs = @salterRangesAtPos() # edit existing header
            cols = @columnsInSalt (@textInRange r for r in rgs)
            ci = 0
            while ci < cols.length and cp[0] > cols[ci]
                ci += 1
            col = cols[ci]
            @do.start()
            newCursors = ([col, r[0]] for r in rgs)
            @do.cursor newCursors, main: 'last'
            @do.end()
        else # create new header
            word = opt?.word ? @selectionTextOrWordAtCursor().trim()
            if @textInRange(@rangeForLineAtIndex cp[1]).trim().length
                indt = _.padStart '', @indentationAtLineIndex cp[1]
            else
                indt = @indentStringForLineAtIndex cp[1]
            stxt = word.length and salt(word).split('\n') or ['', '', '', '', '']
            stxt = ("#{indt}#{@lineComment} #{s}  " for s in stxt)
            @do.start()
            newCursors = []
            @do.insert cp[1], indt
            li = cp[1]+1
            for s in stxt
                @do.insert li, s
                newCursors.push [s.length, li]
                li += 1
            @do.cursor newCursors, main: 'last'
            @do.select []
            @do.end()
        @setSalterMode true
    
    insertSalterCharacter: (ch) ->
        if ch == ' '
            char = ['    ', '    ', '    ', '    ', '    ']
        else
            char = salt(ch).split '\n'
        if char.length == 5
            @paste ("#{s}  " for s in char).join '\n'
        else
            @setSalterMode false
        true
    
    deleteSalterCharacter: ->
        return if not @salterMode
        cp = @cursorPos()
        if rgs = @salterRangesAtPos()
            cols = @columnsInSalt (@do.textInRange r for r in rgs)
            ci = cols.length-1
            while ci > 0 and cols[ci-1] >= cp[0]
                ci -= 1
            if ci > 0
                length = cols[ci]-cols[ci-1]
                for r in rgs
                    @do.change r[0], @lines[r[0]].splice cols[ci-1], length
                @do.cursor ([cols[ci-1], r[0]] for r in rgs)
    
    checkSalterMode: ->        
        return if not @salterMode
        @setSalterMode false
        return if @numCursors() != 5
        cp = @cursors[0]
        for c in @cursors.slice 1
            return if c[0] != cp[0]
            return if c[1] != cp[1]+1
            cp = c
        rgs = @salterRangesAtPos()
        return if not rgs? or rgs[0][0] != @cursors[0][1]
        cols = @columnsInSalt (@textInRange r for r in rgs)
        return if @cursors[0][0] < cols[0]
        @setSalterMode true
    
    columnsInSalt: (salt) ->
        min = _.min (s.search /0/ for s in salt)
        max = _.max (s.length for s in salt)
        cols = [min]
        for col in [min..max]
            s = 0
            for i in [0...5]
                s += 1 if salt[i].slice(col-2, col) in ['  ', '# ']
            cols.push col if s == 5
        cols.push max
        cols
    
    salterRangesAtPos: (p=@cursorPos()) ->
        salterRegExp = new RegExp("^\\s*#{@lineComment}[0\\s]+$")
        rgs = []
        li = p[1]
        while rgs.length < 5 and li < @numLines() and salterRegExp.test @lines[li]
            rgs.push @rangeForLineAtIndex li
            li += 1
        return if not rgs.length
        li = p[1]-1
        while rgs.length < 5 and li >= 0 and salterRegExp.test @lines[li]
            rgs.unshift @rangeForLineAtIndex li
            li -= 1
        return rgs if rgs.length == 5
      
    setSalterMode: (active=true) ->
        @salterMode = active
        @layerDict?['cursors']?.classList.toggle "salterMode", active
