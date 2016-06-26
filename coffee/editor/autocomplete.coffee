#  0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
# 000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
# 000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
# 000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
# 000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
{
clamp,
last,
$} = require '../tools/tools'
log   = require '../tools/log'
fuzzy = require 'fuzzy'

class Autocomplete

    constructor: (@editor) ->
        
        @wordlist = []
        @wordinfo = {}
        
        @close()
    
        @editor.on 'edit',          @onEdit
        @editor.on 'linesSet',      @onLinesSet
        @editor.on 'lineInserted',  @onLineInserted
        @editor.on 'lineDeleted',   @onLineDeleted
        @editor.on 'lineChanged',   @onLineChanged
        @editor.on 'linesAppended', @onLinesAppended

    close: ->
        @list?.remove()
        @span?.remove()
        @selected   = -1
        @list       = null
        @span       = null
        @completion = null
        @firstMatch = null
        @matchList  = []

    # 00     00   0000000   000000000   0000000  000   000
    # 000   000  000   000     000     000       000   000
    # 000000000  000000000     000     000       000000000
    # 000 0 000  000   000     000     000       000   000
    # 000   000  000   000     000      0000000  000   000

    onEdit: (info) =>
        
        @close()
        
        @word = last info.before.split ' '
        return if not @word?.length
        return if not @wordlist?.length
        
        for w in @wordlist
            if w.startsWith(@word) and w.length > @word.length
                if not @firstMatch
                    @firstMatch = w 
                else
                    @matchList.push w
        # log "autocomplete.match #{firstMatch}"
        
        return if not @firstMatch?
        @completion = @firstMatch.slice @word.length
        # log "autocomplete.match word: #{word} match: #{@firstMatch.string} info:", info
        cursor = $('.main', @editor.view)
        @span = document.createElement 'span'
        @span.innerHTML = @completion
        @span.className = 'autocomplete'
        if @matchList.length
            @list = document.createElement 'div'
            @list.className = "list"
            for m in @matchList
                item = document.createElement 'div'
                item.className = 'item'
                item.innerHTML = m
                @list.appendChild item
            @span.appendChild @list
        cursor.appendChild @span
        # log "autocomplete.match #{@completion}"

    selectedCompletion: ->
        if @selected >= 0
            @matchList[@selected].slice @word.length
        else
            @completion

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000     
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
    # 000  0000  000   000     000     000  000   000  000   000     000     000     
    # 000   000  000   000      0      000   0000000   000   000     000     00000000
    
    navigate: (delta) ->
        log "autocomplete.navigate delta #{delta}"
        return if not @list
        @list.children[@selected]?.classList.remove 'selected'
        @selected = clamp -1, @matchList.length-1, @selected+delta
        log "autocomplete.navigate selected #{@selected}"
        if @selected >= 0
            @list.children[@selected]?.classList.add 'selected'
            @list.children[@selected]?.scrollIntoViewIfNeeded()
            
        @span.innerHTML = @selectedCompletion()
        @span.appendChild @list
        
    prev: -> @navigate -1    
    next: -> @navigate 1
        
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
        
        # 000   000  00000000  000   0000000   000   000  000000000
        # 000 0 000  000       000  000        000   000     000   
        # 000000000  0000000   000  000  0000  000000000     000   
        # 000   000  000       000  000   000  000   000     000   
        # 00     00  00000000  000   0000000   000   000     000   
        
        weight = (w) -> 
            [word, info] = w
            (word.length - 3) - (info.count)
            
        sorted = ([w,i] for w,i of @wordinfo).sort (a,b) -> weight(a) - weight(b)
        
        # log "Completion.parseLines #{@editor.name} sorted:", sorted
        
        @wordlist = (s[0] for s in sorted)
        
        # log "Completion.parseLines #{@editor.name} @wordlist:", @wordlist if opt.action != 'change'
        # log "Completion.parseLines #{@editor.name} @wordlist:", @wordlist.length
                
    #  0000000   000   000
    # 000   000  0000  000
    # 000   000  000 0 000
    # 000   000  000  0000
    #  0000000   000   000
            
    onLinesAppended: (lines)  => @parseLines lines, action: 'append'
    onLineInserted:  (li)     => @parseLines [@editor.lines[li]], action: 'insert'
    onLineChanged:   (li)     => #@parseLines [@editor.lines[li]], action: 'change', count: 0
    onLineDeleted:   (li)     => @parseLines [@editor.lines[li]], action: 'delete', count: -1
    onLinesSet:      (lines)  => 
        if lines.length
            @parseLines lines, action: 'set' 
        else @wordinfo = {}

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        # log "autocomplete.handleModKeyComboEvent combo #{combo}"
        return 'unhandled' if not @span?
        
        switch combo
            when 'enter'                
                @editor.paste @selectedCompletion()
                @close()
                return
            
        if @list? 
            switch combo
                when 'down'
                    @next()
                    return
                when 'up'
                    if @selected >= 0
                        @prev()
                        return
        @close()   
        return 'unhandled'
        
module.exports = Autocomplete