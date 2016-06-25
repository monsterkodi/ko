#  0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000    
# 000   000  000   000     000     000   000  000       000   000  000   000  000   000  000    
# 000000000  000   000     000     000   000  000       000   000  000000000  00000000   000    
# 000   000  000   000     000     000   000  000       000   000  000 0 000  000        000    
# 000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000

log = require '../tools/log'

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

    parseLines:(lines, opt) ->
        for l in lines
            words = l.split new RegExp "[^\\#\\w\\d\"\'-]+", 'g'
            words = words.filter (w) -> 
                w.length > 1 and not /([\\'\\"_]+|([0\\#]+))/.test w 
            for w in words
                info  = @wordinfo[w] ? {}
                count = info.count ? 0
                count += opt?.count ? 1
                info.count = count
                @wordinfo[w] = info
        log "Completion.parseLines #{@editor.name} lines: #{lines.length} @wordinfo:", @wordinfo 
            
    onCharacterInserted: (ch) =>
        # log "Completion.onCharacterInserted #{@editor.name} ch: #{ch}"

    onLinesSet:      (lines) => @parseLines lines
    onLinesAppended: (lines) => @parseLines lines
    onLineInserted:  (li)    => @parseLines [@editor.lines[li]]
    onLineChanged:   (li)    => @parseLines [@editor.lines[li]], count: 0
    onLineDeleted:   (li)    => @parseLines [@editor.lines[li]], count: -1
    
module.exports = Autocomplete