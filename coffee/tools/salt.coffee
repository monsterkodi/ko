
#  0000000   0000000   000      000000000
# 000       000   000  000         000   
# 0000000   000000000  000         000   
#      000  000   000  000         000   
# 0000000   000   000  0000000     000   

_    = require 'lodash'

salt = (text) ->
    
    font = require './font.json'
    s = text.toLowerCase().trim()
    
    cs = []
    for c in s
        if font[c]?
            cs.push font[c]

    zs = _.zip.apply(null, cs)
    rs = _.map(zs, (j) -> j.join('  '))
    
    rs.join '\n'
    
module.exports = salt