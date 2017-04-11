#  0000000   0000000   000      000   000  00     00  000   000
# 000       000   000  000      000   000  000   000  0000  000
# 000       000   000  000      000   000  000000000  000 0 000
# 000       000   000  000      000   000  000 0 000  000  0000
#  0000000   0000000   0000000   0000000   000   000  000   000

{ elem, log, $, _ } = require 'kxk'

class Column
    
    constructor: (@browser) ->
        
        @div = elem class: 'browserColumn'
        # @div.style.border = '1px solid white'
        @browser.cols.appendChild @div
        
module.exports = Column
