# 000   000  000   000  00     00  0000000    00000000  00000000    0000000
# 0000  000  000   000  000   000  000   000  000       000   000  000     
# 000 0 000  000   000  000000000  0000000    0000000   0000000    0000000 
# 000  0000  000   000  000 0 000  000   000  000       000   000       000
# 000   000   0000000   000   000  0000000    00000000  000   000  0000000 
{
setStyle,
first,
last,
$
}        = require '../tools/tools'
log      = require '../tools/log'
_        = require 'lodash'

class Numbers

    constructor: (@editor) ->
        
        @elem = $(".numbers")
        @editor.on 'lineExposed', @onLineExposed
        @elem.style.lineHeight = "#{@editor.size.lineHeight}px"
    
    # 000      000  000   000  00000000  00000000  000   000  00000000    0000000    0000000  00000000  0000000  
    # 000      000  0000  000  000       000        000 000   000   000  000   000  000       000       000   000
    # 000      000  000 0 000  0000000   0000000     00000    00000000   000   000  0000000   0000000   000   000
    # 000      000  000  0000  000       000        000 000   000        000   000       000  000       000   000
    # 0000000  000  000   000  00000000  00000000  000   000  000         0000000   0000000   00000000  0000000  
        
    onLineExposed: (e) =>
        # log "Numbers.onLineAdded", e
        div = document.createElement "div"
        div.className = "linenumber"
        pre = document.createElement "pre"
        pre.innerHTML = _.padStart "#{e.lineIndex}", 5
        div.appendChild pre
        @elem.appendChild div
    
module.exports = Numbers
