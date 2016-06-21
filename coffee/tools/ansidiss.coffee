# based on code from https://github.com/rburns/ansi-to-html

log      = require './log'
entities = require 'entities'
_        = require 'lodash'

STYLES =
    ef0:  'color:#000'
    ef1:  'color:#A00'
    ef2:  'color:#0A0'
    ef3:  'color:#A50'
    ef4:  'color:#00A'
    ef5:  'color:#A0A'
    ef6:  'color:#0AA'
    ef7:  'color:#AAA'
    ef8:  'color:#555'
    ef9:  'color:#F55'
    ef10: 'color:#5F5'
    ef11: 'color:#FF5'
    ef12: 'color:#55F'
    ef13: 'color:#F5F'
    ef14: 'color:#5FF'
    ef15: 'color:#FFF'
    eb0:  'background-color:#000'
    eb1:  'background-color:#A00'
    eb2:  'background-color:#0A0'
    eb3:  'background-color:#A50'
    eb4:  'background-color:#00A'
    eb5:  'background-color:#A0A'
    eb6:  'background-color:#0AA'
    eb7:  'background-color:#AAA'
    eb8:  'background-color:#555'
    eb9:  'background-color:#F55'
    eb10: 'background-color:#5F5'
    eb11: 'background-color:#FF5'
    eb12: 'background-color:#55F'
    eb13: 'background-color:#F5F'
    eb14: 'background-color:#5FF'
    eb15: 'background-color:#FFF'

toHexString = (num) ->
    num = num.toString(16)
    while num.length < 2 then num = "0#{num}"
    num

[0..5].forEach (red) ->
    [0..5].forEach (green) ->
        [0..5].forEach (blue) ->
            c = 16 + (red * 36) + (green * 6) + blue
            r = if red   > 0 then red   * 40 + 55 else 0
            g = if green > 0 then green * 40 + 55 else 0
            b = if blue  > 0 then blue  * 40 + 55 else 0
            rgb = (toHexString(n) for n in [r, g, b]).join('')
            STYLES["ef#{c}"] = "color:##{rgb}"
            STYLES["eb#{c}"] = "background-color:##{rgb}"


[0..23].forEach (gray) ->
    c = gray+232
    l = toHexString(gray*10 + 8)
    STYLES["ef#{c}"] = "color:##{l}#{l}#{l}"
    STYLES["eb#{c}"] = "background-color:##{l}#{l}#{l}"

#  0000000   000   000   0000000  000  0000000    000   0000000   0000000
# 000   000  0000  000  000       000  000   000  000  000       000     
# 000000000  000 0 000  0000000   000  000   000  000  0000000   0000000 
# 000   000  000  0000       000  000  000   000  000       000       000
# 000   000  000   000  0000000   000  0000000    000  0000000   0000000 

class ansiDiss
    
    constructor: () ->
        # log "STYLES", STYLES

    dissect: (@input) ->
        # log "ansiDiss.dissect @input #{@input}"
        @diss  = []
        @text  = ""
        @tokenize()
        [@text, @diss]

    addText: (t) => 
        # log "addText #{@text} + #{t}"
        @text += t
        ''

    tokenize: () ->
        dss = 
            start: 0
            cls: []
            style: []
        ansiMatch   = false
        ansiHandler = 3
        
        nextDiss = (next) =>
            dss.match = _.trimEnd @text.slice dss.start
            while dss.match.startsWith ' '
                dss.start += 1
                dss.match = dss.match.slice 1
            dss.clss = dss.cls.join " "
            dss.styl = dss.style.join ";"
            @diss.push dss if dss.match.length
            dss = next
            dss.start = @text.length
            dss.cls ?= []
            dss.style ?= []
        
        termCode = (m, c) =>
            nextDiss style: [STYLES["ef#{c}"]]
            ''
            
        ansiCode = (m, c) =>
            ansiMatch = true
            c = '0' if c.trim().length is 0
            # log "c", c
            cs = c.trimRight(';').split(';')
            for code in cs
                code = parseInt code, 10
                switch 
                    when code is 0          then nextDiss {}
                    when code is 1          then dss.cls.push 'bold'
                    when 2 < code < 5       then dss.style.push 'text-decoration:underLine'
                    when 4 < code < 7       then dss.style.push 'text-decoration:overline'
                    when code is 8          then dss.style.push 'display:none'
                    when code is 9          then dss.style.push 'text-decoration:line-through'
                    when 29 < code < 38     then dss.style.push STYLES["ef#{code - 30}"]
                    when code is 39         then dss.style.push STYLES["fg"]
                    when 39 < code < 48     then dss.style.push STYLES["eb#{code - 40}"]
                    when code is 49         then dss.style.push STYLES["bg"]
                    when 89 < code < 98     then dss.style.push STYLES["ef#{8+code - 90}"]
                    when 99 < code < 108    then dss.style.push STYLES["eb#{8+code - 100}"]
                    else
                        log "ansiCode", code
            ''
        tokens = [
            {pattern: /^\x08+/,                     sub: ''}
            {pattern: /^\x1b\[[012]?K/,             sub: ''}
            {pattern: /^\x1b\[38;5;(\d+)m/,         sub: termCode}
            {pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,  sub: ansiCode} 
            {pattern: /^\x1b\[?[\d;]{0,3}/,         sub: ''}
            {pattern: /^([^\x1b\x08\n]+)/,          sub: @addText}
         ]

        process = (handler, i) =>
            if i > ansiHandler and ansiMatch then return else ansiMatch = false # give ansiHandler another chance if it matches
            matches = @input.match handler.pattern
            @input  = @input.replace handler.pattern, handler.sub
            return if !matches?

        while (length = @input.length) > 0
            process(handler, i) for handler, i in tokens
            break if @input.length == length
            
        # log "@diss", @diss

module.exports = ansiDiss
