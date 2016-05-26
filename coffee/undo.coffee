# 000   000  000   000  0000000     0000000 
# 000   000  0000  000  000   000  000   000
# 000   000  000 0 000  000   000  000   000
# 000   000  000  0000  000   000  000   000
#  0000000   000   000  0000000     0000000 

class undo
    
    constructor: (done=->) ->
        @groupCount = 0
        @groupDone = done
        
    start: => @groupCount += 1
    change: (lines, index, text) =>
        lines[index] = text
        @check()
    insert: (lines, index, text) =>
        lines.splice index, 0, text
        @check()
    delete: (lines, index) =>
        lines.splice index, 1
        @check()
    check: =>
        if @groupCount == 0
            @groupDone()
    end: => 
        @groupCount -= 1
        @check()
            

module.exports = undo