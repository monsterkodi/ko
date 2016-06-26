#  0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
# 000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
# 000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
# 000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
# 000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
{
last} = require '../tools/tools'
log   = require '../tools/log'
fuzzy = require 'fuzzy'

class Autocomplete

    constructor: (@editor) ->
        
        @wordlist = []
        @wordinfo = {}
    
        @editor.on 'characterInserted', @onCharacterInserted
        @editor.on 'linesSet',          @onLinesSet
        @editor.on 'lineInserted',      @onLineInserted
        @editor.on 'lineDeleted',       @onLineDeleted
        @editor.on 'lineChanged',       @onLineChanged
        @editor.on 'linesAppended',     @onLinesAppended

    # 00     00   0000000   000000000   0000000  000   000
    # 000   000  000   000     000     000       000   000
    # 000000000  000000000     000     000       000000000
    # 000 0 000  000   000     000     000       000   000
    # 000   000  000   000     000      0000000  000   000

    match: (word) ->
        log "autocomplete.match word: #{word}"
        fuzzied = fuzzy.filter word, @wordlist
        # log "autocomplete.match fuzzied:", fuzzied
        firstMatch = fuzzied[0]
        log "autocomplete.match #{word} firstMatch:", firstMatch
        
    # 00000000    0000000   00000000    0000000  00000000
    # 000   000  000   000  000   000  000       000     
    # 00000000   000000000  0000000    0000000   0000000 
    # 000        000   000  000   000       000  000     
    # 000        000   000  000   000  0000000   00000000
    
    parseLines:(lines, opt) ->
        for l in lines
            words = l.split new RegExp "[^\\#\\w\\d\"\'-@]+", 'g'
            words = words.filter (w) -> 
                w.length > 1 and not /([\\'\\"_]+|([0\\#]+))/.test w 
            for w in words
                info  = @wordinfo[w] ? {}
                count = info.count ? 0
                count += opt?.count ? 1
                info.count = count
                @wordinfo[w] = info
                
        # log "Completion.parseLines #{@editor.name} lines: #{lines.length} @wordinfo:", @wordinfo 
        
        weight = (w) -> 
            [word, info] = w
            (word.length - 3) + (info.count)
            
        sorted = ([w,i] for w,i of @wordinfo).sort (a,b) -> weight(b) - weight(a)
        
        # log "Completion.parseLines #{@editor.name} sorted:", sorted
        
        @wordlist = (s[0] for s in sorted)
        
        # log "Completion.parseLines #{@editor.name} @wordlist:", @wordlist 
        # log "Completion.parseLines #{@editor.name} @wordlist:", @wordlist.length
                
    #  0000000   000   000
    # 000   000  0000  000
    # 000   000  000 0 000
    # 000   000  000  0000
    #  0000000   000   000
            
    onLinesAppended: (lines)  => @parseLines lines
    onLineInserted:  (li)     => @parseLines [@editor.lines[li]]
    onLineChanged:   (li)     => @parseLines [@editor.lines[li]], count: 0
    onLineDeleted:   (li)     => @parseLines [@editor.lines[li]], count: -1
    onLinesSet:      (lines)  => 
        if lines.length
            @parseLines lines 
        else @wordinfo = {}

    onCharacterInserted: (info) => 
        # log "Completion.onCharacterInserted #{@editor.name} ch: #{ch}"
        @match last info.text.split ' '        
        
module.exports = Autocomplete