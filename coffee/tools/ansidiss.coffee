# based on code from https://github.com/rburns/ansi-to-html

log      = require './log'
entities = require 'entities'
_        = require 'lodash'

STYLES =
    f0:  'color:#000' # normal intensity
    f1:  'color:#E00'
    f2:  'color:#0A0'
    f3:  'color:#A50'
    f4:  'color:#00E'
    f5:  'color:#A0A'
    f6:  'color:#0AA'
    f7:  'color:#AAA'
    f8:  'color:#555' # high intensity
    f9:  'color:#F55'
    f10: 'color:#5F5'
    f11: 'color:#FF5'
    f12: 'color:#55F'
    f13: 'color:#F5F'
    f14: 'color:#5FF'
    f15: 'color:#FFF'
    b0:  'background-color:#000' # normal intensity
    b1:  'background-color:#A00'
    b2:  'background-color:#0A0'
    b3:  'background-color:#A50'
    b4:  'background-color:#00A'
    b5:  'background-color:#A0A'
    b6:  'background-color:#0AA'
    b7:  'background-color:#AAA'
    b8:  'background-color:#555' # high intensity
    b9:  'background-color:#F55'
    b10: 'background-color:#5F5'
    b11: 'background-color:#FF5'
    b12: 'background-color:#55F'
    b13: 'background-color:#F5F'
    b14: 'background-color:#5FF'
    b15: 'background-color:#FFF'

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
            STYLES["f#{c}"] = "color:##{rgb}"
            STYLES["b#{c}"] = "background-color:##{rgb}"

[0..23].forEach (gray) ->
    c = gray+232
    l = toHexString(gray*10 + 8)
    STYLES["f#{c}"] = "color:##{l}#{l}#{l}"
    STYLES["b#{c}"] = "background-color:##{l}#{l}#{l}"

#  0000000   000   000   0000000  000  0000000    000   0000000   0000000
# 000   000  0000  000  000       000  000   000  000  000       000     
# 000000000  000 0 000  0000000   000  000   000  000  0000000   0000000 
# 000   000  000  0000       000  000  000   000  000       000       000
# 000   000  000   000  0000000   000  0000000    000  0000000   0000000 

class AnsiDiss
    
    constructor: () ->

    dissect: (@input) ->
        @diss  = []
        @text  = ""
        @tokenize()
        [@text, @diss]

    tokenize: () ->
        
        start       = 0
        ansiHandler = 2
        ansiMatch   = false
        
        fg = bg = ''
        st = []

        resetStyle = () ->
            fg = ''
            bg = ''
            st = []
            
        addStyle = (style) -> st.push style if style not in st
        delStyle = (style) -> _.pull st, style
        
        addText = (t) =>
            @text += t
            txt = @text.slice start
            match = txt.trim()
            if match.length
                style = ''
                style += fg + ';'    if fg.length
                style += bg + ';'    if bg.length
                style += st.join ';' if st.length
                @diss.push
                    match: match
                    start: start + txt.search /[^\s]/
                    styl:  style
            start = @text.length
            ''
        
        toHighIntensity = (c) ->
            for i in [0..7]
                if c == STYLES["f#{i}"]
                    return STYLES["f#{8+i}"]
            c
        
        ansiCode = (m, c) =>
            ansiMatch = true
            c = '0' if c.trim().length is 0            
            cs = c.trimRight(';').split(';')            
            for code in cs
                code = parseInt code, 10
                switch 
                    when code is 0          then resetStyle()
                    when code is 1          
                        addStyle 'font-weight:bold'
                        fg = toHighIntensity fg
                    when code is 2          then addStyle 'opacity:0.5'
                    when code is 4          then addStyle 'text-decoration:underline'
                    when code is 8          then addStyle 'display:none'
                    when code is 9          then addStyle 'text-decoration:line-through'
                    when code is 39         then fg = STYLES["f15"] # default foreground
                    when code is 49         then bg = STYLES["b0"]  # default background
                    when code is 38         then fg = STYLES["f#{cs[2]}"] # extended fg 38;5;[0-255]
                    when code is 48         then bg = STYLES["b#{cs[2]}"] # extended bg 48;5;[0-255]
                    when  30 <= code <= 37  then fg = STYLES["f#{code - 30}"] # normal intensity
                    when  40 <= code <= 47  then bg = STYLES["b#{code - 40}"]
                    when  90 <= code <= 97  then fg = STYLES["f#{8+code - 90}"]  # high intensity
                    when 100 <= code <= 107 then bg = STYLES["b#{8+code - 100}"]
                    when code is 28         then delStyle 'display:none'
                    when code is 22         
                        delStyle 'font-weight:bold'
                        delStyle 'opacity:0.5'
                break if code in [38, 48]
            ''
            
        tokens = [
            {pattern: /^\x08+/,                     sub: ''}
            {pattern: /^\x1b\[[012]?K/,             sub: ''}
            {pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,  sub: ansiCode} 
            {pattern: /^\x1b\[?[\d;]{0,3}/,         sub: ''}
            {pattern: /^([^\x1b\x08\n]+)/,          sub: addText}
         ]

        process = (handler, i) =>
            return if i > ansiHandler and ansiMatch # give ansiHandler another chance if it matches
            ansiMatch = false
            @input = @input.replace handler.pattern, handler.sub

        while (length = @input.length) > 0
            process(handler, i) for handler, i in tokens
            break if @input.length == length
            
module.exports = AnsiDiss
