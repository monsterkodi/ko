###
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
###

{ error, log, stopEvent, clamp, post, empty, elem, $, _ } = require 'kxk'

Indexer = require '../main/indexer'
event   = require 'events'

class Autocomplete extends event

    constructor: (@editor) -> 
        
        super()
        
        @wordinfo  = {}
        @matchList = []
        @clones    = []
        @cloned    = []
        
        @close()
        
        specials = "_-@#"
        @especial = ("\\"+c for c in specials.split '').join ''
        @headerRegExp      = new RegExp "^[0#{@especial}]+$"
        
        @notSpecialRegExp  = new RegExp "[^#{@especial}]"
        @specialWordRegExp = new RegExp "(\\s+|[\\w#{@especial}]+|[^\\s])", 'g'
        @splitRegExp       = new RegExp "[^\\w\\d#{@especial}]+", 'g'        
    
        @editor.on 'edit',           @onEdit
        @editor.on 'linesSet',       @onLinesSet
        @editor.on 'lineInserted',   @onLineInserted
        @editor.on 'willDeleteLine', @onWillDeleteLine
        @editor.on 'lineChanged',    @onLineChanged
        @editor.on 'linesAppended',  @onLinesAppended
        @editor.on 'cursor',         @close
        @editor.on 'blur',           @close
        
        # post.on 'funcsCount',        @onFuncsCount
        
    #  0000000   000   000  00000000  0000000    000  000000000
    # 000   000  0000  000  000       000   000  000     000   
    # 000   000  000 0 000  0000000   000   000  000     000   
    # 000   000  000  0000  000       000   000  000     000   
    #  0000000   000   000  00000000  0000000    000     000   

    onEdit: (info) =>
        
        @close()
        @word = _.last info.before.split @splitRegExp
        switch info.action
            
            when 'delete' # ever happening?
                error 'delete!!!!'
                if @wordinfo[@word]?.temp and @wordinfo[@word]?.count <= 0
                    delete @wordinfo[@word]
                    
            when 'insert'
                
                return if not @word?.length
                return if empty @wordinfo
                
                matches = _.pickBy @wordinfo, (c,w) => w.startsWith(@word) and w.length > @word.length            
                matches = _.toPairs matches
                for m in matches
                    d = @editor.distanceOfWord m[0]
                    m[1].distance = 100 - Math.min d, 100
                    
                matches.sort (a,b) ->
                    (b[1].distance+b[1].count+1/b[0].length) - (a[1].distance+a[1].count+1/a[0].length)
                    
                # log matches
                    
                words = matches.map (m) -> m[0]
                for w in words
                    if not @firstMatch
                        @firstMatch = w 
                    else
                        @matchList.push w
                            
                return if not @firstMatch?
                @completion = @firstMatch.slice @word.length
                
                @open info
        
    #  0000000   00000000   00000000  000   000
    # 000   000  000   000  000       0000  000
    # 000   000  00000000   0000000   000 0 000
    # 000   000  000        000       000  0000
    #  0000000   000        00000000  000   000
    
    open: (info) ->
        
        cursor = $('.main', @editor.view)
        if not cursor?
            error "Autocomplete.open --- no cursor?"
            return

        @span = elem 'span', class: 'autocomplete-span'
        @span.textContent = @completion
        @span.style.opacity    = 1
        @span.style.background = "#44a"
        @span.style.color      = "#fff"

        cr = cursor.getBoundingClientRect()
        spanInfo = @editor.lineSpanAtXY cr.left, cr.top
        
        if not spanInfo?
            
            p = @editor.posAtXY cr.left, cr.top
            ci = p[1]-@editor.scroll.top
            log 'p:', p, 'scroll.top', @editor.scroll.top, 'ci', ci, 'num children', @editor.layerDict['lines'].children.length
            log @editor.lineElemAtXY(cr.left, cr.top)?
            return error "no span for autocomplete? cursor topleft: #{parseInt cr.left} #{parseInt cr.top}", info

        sp = spanInfo.span
        inner = sp.innerHTML
        @clones.push sp.cloneNode true
        @clones.push sp.cloneNode true
        @cloned.push sp
        
        ws = @word.slice @word.search /\w/
        wi = ws.length
        
        @clones[0].innerHTML = inner.slice 0, spanInfo.offsetChar + 1 
        @clones[1].innerHTML = inner.slice    spanInfo.offsetChar + 1
                    
        sibling = sp
        while sibling = sibling.nextSibling
            @clones.push sibling.cloneNode true
            @cloned.push sibling
            
        sp.parentElement.appendChild @span
        
        for c in @cloned
            c.style.display = 'none'

        for c in @clones
            @span.insertAdjacentElement 'afterend', c
            
        @moveClonesBy @completion.length            
        
        if @matchList.length
            
            @list = elem class: 'autocomplete-list'
            @list.addEventListener 'wheel', @onWheel
            @list.addEventListener 'mousedown', @onMouseDown
            index = 0
            for m in @matchList
                item = elem class: 'autocomplete-item', index:index++
                item.textContent = m
                @list.appendChild item
            cursor.appendChild @list

    #  0000000  000       0000000    0000000  00000000
    # 000       000      000   000  000       000     
    # 000       000      000   000  0000000   0000000 
    # 000       000      000   000       000  000     
    #  0000000  0000000   0000000   0000000   00000000

    close: =>
        
        if @list?
            @list.removeEventListener 'wheel', @onWheel
            @list.removeEventListener 'click', @onClick
            @list.remove()
            
        @span?.remove()
        @selected   = -1
        @list       = null
        @span       = null
        @completion = null
        @firstMatch = null
        
        for c in @clones
            c.remove()

        for c in @cloned
            c.style.display = 'initial'
        
        @clones = []
        @cloned = []
        @matchList  = []
        @

    onWheel: (event) =>
        
        @list.scrollTop += event.deltaY
        stopEvent event    
    
    onMouseDown: (event) =>
        
        index = elem.upAttr event.target, 'index'
        if index            
            @select index
            @onEnter()
        stopEvent event

    onEnter: ->  
        
        @editor.pasteText @selectedCompletion()
        @close()

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
        
        return if not @list
        @select clamp -1, @matchList.length-1, @selected+delta
        
    select: (index) ->
        @list.children[@selected]?.classList.remove 'selected'
        @selected = index
        if @selected >= 0
            @list.children[@selected]?.classList.add 'selected'
            @list.children[@selected]?.scrollIntoViewIfNeeded()
        @span.innerHTML = @selectedCompletion()
        @moveClonesBy @span.innerHTML.length
        @span.classList.remove 'selected' if @selected < 0
        @span.classList.add    'selected' if @selected >= 0
        
    prev: -> @navigate -1    
    next: -> @navigate 1
    last: -> @navigate @matchList.length - @selected

    # 00     00   0000000   000   000  00000000   0000000  000       0000000   000   000  00000000   0000000
    # 000   000  000   000  000   000  000       000       000      000   000  0000  000  000       000     
    # 000000000  000   000   000 000   0000000   000       000      000   000  000 0 000  0000000   0000000 
    # 000 0 000  000   000     000     000       000       000      000   000  000  0000  000            000
    # 000   000   0000000       0      00000000   0000000  0000000   0000000   000   000  00000000  0000000 

    moveClonesBy: (numChars) ->
        
        return if empty @clones
        beforeLength = @clones[0].innerHTML.length
        for ci in [1...@clones.length]
            c = @clones[ci]
            offset = parseFloat @cloned[ci-1].style.transform.split('translateX(')[1]
            charOffset = numChars
            charOffset += beforeLength if ci == 1
            c.style.transform = "translatex(#{offset+@editor.size.charWidth*charOffset}px)"
        spanOffset = parseFloat @cloned[0].style.transform.split('translateX(')[1]
        spanOffset += @editor.size.charWidth*beforeLength
        @span.style.transform = "translatex(#{spanOffset}px)"
        
    # 00000000    0000000   00000000    0000000  00000000
    # 000   000  000   000  000   000  000       000     
    # 00000000   000000000  0000000    0000000   0000000 
    # 000        000   000  000   000       000  000     
    # 000        000   000  000   000  0000000   00000000
    
    parseLines:(lines, opt) ->
        
        @close()

        return if not lines?
        
        cursorWord = @cursorWord()
        for l in lines
            if not l?.split?
                return error "Autocomplete.parseLines -- line has no split? action: #{opt.action} line: #{l}", lines
            words = l.split @splitRegExp
            words = words.filter (w) => 
                return false if not Indexer.testWord w
                return false if w == cursorWord
                return false if @word == w.slice 0, w.length-1
                return false if @headerRegExp.test w
                true
                
            for w in words # append words without leading special character
                i = w.search @notSpecialRegExp
                if i > 0 and w[0] != "#"
                    w = w.slice i
                    words.push w if not /^[\-]?[\d]+$/.test w
            
            for w in words
                info  = @wordinfo[w] ? {}
                count = info.count ? 0
                count += opt?.count ? 1
                info.count = count
                info.temp = true if opt.action is 'change'
                @wordinfo[w] = info
                
        post.emit 'autocompleteCount', _.size @wordinfo
                            
    #  0000000  000   000  00000000    0000000   0000000   00000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  000       000   000  000   000  000 0 000  000   000  000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000    000000000  000   000  0000000    000   000
    # 000       000   000  000   000       000  000   000  000   000  000   000  000   000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000  00     00   0000000   000   000  0000000  
    
    cursorWords: -> 
        
        cp = @editor.cursorPos()
        words = @editor.wordRangesInLineAtIndex cp[1], regExp: @specialWordRegExp        
        [befor, cursr, after] = rangesSplitAtPosInRanges cp, words
        [@editor.textsInRanges(befor), @editor.textInRange(cursr), @editor.textsInRanges(after)]
        
    cursorWord: -> @cursorWords()[1]
                
    
    #  0000000   000   000
    # 000   000  0000  000
    # 000   000  000 0 000
    # 000   000  000  0000
    #  0000000   000   000
    
    onLinesAppended:  (lines)    => @parseLines lines, action: 'append'
    onLineInserted:   (li)       => @parseLines [@editor.line(li)], action: 'insert'
    onLineChanged:    (li)       => @parseLines [@editor.line(li)], action: 'change', count: 0
    onWillDeleteLine: (line)     => @parseLines [line], action: 'delete', count: -1
    onLinesSet:       (lines)    => @parseLines lines, action: 'set' if lines.length

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        
        return 'unhandled' if not @span?
        
        switch combo
            when 'enter' then return @onEnter()               
            
        if @list? 
            switch combo
                when 'down'
                    @next()
                    return
                when 'up'
                    if @selected >= 0
                        @prev()
                        return
                    else 
                        @last()
                        return
        @close()   
        'unhandled'
        
module.exports = Autocomplete
