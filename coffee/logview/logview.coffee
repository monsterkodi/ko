# 000       0000000    0000000   000   000  000  00000000  000   000
# 000      000   000  000        000   000  000  000       000 0 000
# 000      000   000  000  0000   000 000   000  0000000   000000000
# 000      000   000  000   000     000     000  000       000   000
# 0000000   0000000    0000000       0      000  00000000  00     00
{
$}        = require '../tools/tools'
ViewBase  = require '../editor/viewbase'
Numbers   = require '../editor/numbers'
Scrollbar = require '../editor/scrollbar'
Minimap   = require '../editor/minimap'
log       = require '../tools/log'

class LogView extends ViewBase

    constructor: (viewElem) ->
        
        @fontSizeDefault = 10
        @fontSizeKey     = 'logviewFontSize'
        
        super viewElem
        
        @scrollbar = new Scrollbar @
        @numbers   = new Numbers @
        @minimap   = new Minimap @
                
module.exports = LogView