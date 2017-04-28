
# 00     00   0000000   000000000   0000000  000   000  00000000 
# 000   000  000   000     000     000       000   000  000   000
# 000000000  000000000     000     000       000000000  0000000  
# 000 0 000  000   000     000     000       000   000  000   000
# 000   000  000   000     000      0000000  000   000  000   000

{last, str, _} = require 'kxk'

#  0000000   0000000   000   000  00000000  000   0000000 
# 000       000   000  0000  000  000       000  000      
# 000       000   000  000 0 000  000000    000  000  0000
# 000       000   000  000  0000  000       000  000   000
#  0000000   0000000   000   000  000       000   0000000 

# convert the patterns object to a list of [RegExp(key), value] pairs

config = (patterns, flags) -> ( [new RegExp(p, flags), a] for p,a of patterns )

sortRanges = (rgs) ->
    rgs.sort (a,b) -> 
        if a.start == b.start
            if a.match.length == b.match.length
                a.index - b.index
            else
                a.match.length - b.match.length
        else
            a.start - b.start

# 00000000    0000000   000   000   0000000   00000000   0000000
# 000   000  000   000  0000  000  000        000       000     
# 0000000    000000000  000 0 000  000  0000  0000000   0000000 
# 000   000  000   000  000  0000  000   000  000            000
# 000   000  000   000  000   000   0000000   00000000  0000000 

# accepts a list of [regexp, value(s)] pairs and a string
# returns a list of objects with information about the matches:
  
#     match: the matched substring
#     start: position of match in str
#     value: the value for the match
#     index: the index of the regexp 
      
#     the objects are sorted by start, match.length and index
      
#     if the regexp has capture groups then 
#         the value for the match of the nth group is
#             the nth item of values(s) if value(s) is an array
#             the nth [key, value] pair if value(s) is an object

ranges = (regexes, text, flags) ->
    
    if not _.isArray regexes
        if _.isString regexes
            if regexes.indexOf('|') >= 0
                regexes = ([new RegExp(r, flags), 'found'] for r in regexes.split('|'))
            else
                regexes = [[new RegExp(regexes, flags), 'found']]
        else
            regexes = [[regexes, 'found']]
    else if not _.isArray regexes[0]
        regexes = [regexes]

    rgs = []
    return rgs if not text?
    for r in [0...regexes.length]
        reg = regexes[r][0]
        arg = regexes[r][1]
        i = 0
        s = text
        while s.length
            match = reg.exec s
            break if not match?
            if match.length == 1
                rgs.push
                    start: match.index + i
                    match: match[0]
                    value: arg
                    index: r
                i += match.index + match[0].length
                s = text.slice i
            else
                gs = 0
                for j in [0..match.length-2]
                    value = arg
                    if _.isArray(value) and j < value.length then value = value[j]
                    else if _.isObject(value) and j < _.size(value) 
                        value = [_.keys(value)[j], value[_.keys(value)[j]]]
                    break if not match[j+1]?
                    gi = match[0].slice(gs).indexOf match[j+1]
                    rgs.push
                        start: match.index + i + gs + gi
                        match: match[j+1]
                        value: value
                        index: r
                    gs += match[j+1]?.length
                i += match.index + match[0].length
                s = text.slice i
    sortRanges rgs        

# 0000000    000   0000000   0000000  00000000   0000000  000000000
# 000   000  000  000       000       000       000          000   
# 000   000  000  0000000   0000000   0000000   000          000   
# 000   000  000       000       000  000       000          000   
# 0000000    000  0000000   0000000   00000000   0000000     000   
 
# accepts a list of ranges
# returns a list of objects:
 
#     match: the matched substring
#     start: position of match in str
#     cls:   list of classnames
#     clss:  string of classnames joined with a space
     
#     with none of the [start, start+match.length] ranges overlapping

dissect = (ranges, opt = join:false) -> 
    
    log = opt?.log ? ->
        
    return [] if not ranges.length
    # console.log "dissect -- #{JSON.stringify ranges}"
    di = []
    for ri in [0...ranges.length]
        rg = ranges[ri]
        di.push [rg.start, ri]
        di.push [rg.start + rg.match.length]
    di.sort (a,b) -> 
        if a[0]==b[0] 
            a[1]-b[1]
        else
            a[0]-b[0]
    d = []
    si = -1
    for i in [0...di.length-1]
        if di[i][0] > si
            si = di[i][0]
            d.push
                start: si
                cid:   0
                cls:   []

    p = 0
    for ri in [0...ranges.length]
        rg = ranges[ri]
        while d[p].start < rg.start 
            p += 1 
        pn = p
        while d[pn].start < rg.start+rg.match.length
            if (d[pn].cid <= rg.index or opt.join) and rg.value?
                if not rg.value.split?
                    for r in rg.value
                        continue if not r.split?
                        for c in r.split '.' 
                            d[pn].cls.push c if d[pn].cls.indexOf(c) < 0
                else 
                    for c in rg.value.split '.' 
                        d[pn].cls.push c if d[pn].cls.indexOf(c) < 0
                d[pn].cid = rg.index
            if pn+1 < d.length
                if not d[pn].match
                    d[pn].match = rg.match.substr d[pn].start-rg.start, d[pn+1].start-d[pn].start
                pn += 1
            else
                if not d[pn].match
                    d[pn].match = rg.match.substr d[pn].start-rg.start
                break
                
    d = d.filter (i) -> i.match?.trim().length
    
    for i in d
        i.clss = i.cls.join ' '
        
    if d.length > 1
        log 'join', d
        for i in [d.length-2..0]
            if d[i].start + d[i].match.length == d[i+1].start
                if d[i].clss == d[i+1].clss
                    d[i].match += d[i+1].match
                    d.splice i+1, 1
    d

module.exports = 
    config:     config
    ranges:     ranges
    dissect:    dissect
    sortRanges: sortRanges
