a = (s) ->
    if 5 < s < 15 
        x = 0
        b = 2
        console.log "5< #{s} <15"
    else if s > 20 
        z = 0
        b = 3
        console.log "#{s} >20"
    else
        y = 0
        b = 4
        console.log "#{s}"
    0
module.exports = a