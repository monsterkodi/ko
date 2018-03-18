###
00000000  000   000   0000000  00000000    0000000  00000000
000       0000  000  000       000   000  000       000     
0000000   000 0 000  0000000   00000000   000       0000000 
000       000  0000       000  000        000       000     
00000000  000   000  0000000   000         0000000  00000000
###

module.exports = (s) ->
    return "" if not s?
    tag = false
    for i in [s.length-1..0]
        switch s[i]
            when '>' then tag = true
            when '<' then tag = false
            when ' ' then s = s.splice i, 1, "&nbsp;" if not tag
    s