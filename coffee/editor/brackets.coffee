
# 0000000    00000000    0000000    0000000  000   000  00000000  000000000   0000000
# 000   000  000   000  000   000  000       000  000   000          000     000     
# 0000000    0000000    000000000  000       0000000    0000000      000     0000000 
# 000   000  000   000  000   000  000       000  000   000          000          000
# 0000000    000   000  000   000   0000000  000   000  00000000     000     0000000 

log = require '../tools/log'

class Brackets
    
    constructor: (@editor) ->
        @editor.on 'edit',           @onEdit
        @editor.on 'cursor',         @onCursor
        
    onEdit:   (e) => #log "brackets.onEdit", e
    onCursor: (e) => #log "brackets.onCursor", @editor.cursorPos()
        
module.exports = Brackets
