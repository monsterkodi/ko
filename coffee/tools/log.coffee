#000       0000000    0000000 
#000      000   000  000      
#000      000   000  000  0000
#000      000   000  000   000
#0000000   0000000    0000000 

str  = require './str'

log = -> 
    console.log (str(s) for s in [].slice.call arguments, 0).join " "
    
logScroll = -> 
    s = (str(s) for s in [].slice.call arguments, 0).join " "
    console.log s
    tools = require './tools'
    div = document.createElement 'pre'
    div.className = 'logline'
    div.innerHTML = s.trim()
    tools.$('.logview').appendChild div
    div.scrollIntoViewIfNeeded()

if window?
    module.exports = logScroll
else
    module.exports = log