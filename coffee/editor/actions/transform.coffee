
# 000000000  00000000    0000000   000   000   0000000  00000000   0000000   00000000   00     00
#    000     000   000  000   000  0000  000  000       000       000   000  000   000  000   000
#    000     0000000    000000000  000 0 000  0000000   000000    000   000  0000000    000000000
#    000     000   000  000   000  000  0000       000  000       000   000  000   000  000 0 000
#    000     000   000  000   000  000   000  0000000   000        0000000   000   000  000   000

{ reversed, slash, str, error, log, _ } = require 'kxk'

matchr = require '../../tools/matchr'

class Transform

    @transformNames = [
        'upper', 'lower', 'title', 'case'
        'count', 'add', 'sub'
        'up', 'down', 'sort'
        'reverse', 
        'resolve', 'unresolve'
        'dirname', 'basename'
        'filename', 'extname'
    ]

    constructor: (@editor) ->

        @editor.transform = @
        @last         = null
        @caseFuncs    = ['upper', 'lower', 'title']
        @resolveFuncs = ['resolve', 'unresolve']
        @sortFuncs    = ['up', 'down']

    #  0000000   0000000   000   000  000   000  000000000  
    # 000       000   000  000   000  0000  000     000     
    # 000       000   000  000   000  000 0 000     000     
    # 000       000   000  000   000  000  0000     000     
    #  0000000   0000000    0000000   000   000     000     
    
    count: (typ='dec', offset=0, step=1) ->
        
        offset = parseInt offset
        step   = parseInt step
        
        @editor.do.start()
        @editor.fillVirtualSpaces()
        cs = @editor.do.cursors()
        @editor.do.select rangesFromPositions cs
        
        switch typ
            when 'hex'
                base = 16
            when 'bin'
                base = 2
            else
                base = 10

        pad = Number(step*(cs.length-1)+offset).toString(base).length
        numbers = (_.padStart Number(step*i+offset).toString(base), pad, '0' for i in [0...cs.length])
                    
        @editor.replaceSelectedText numbers
        @editor.do.end()
        'count'

    add: (d=1) ->
        
        @apply (t) -> str(parseInt(t) + parseInt(d))
        'add'

    sub: (d=1) ->
        
        @apply (t) -> str(parseInt(t) - parseInt(d))
        'sub'
        
    # 00000000   00000000  000   000  00000000  00000000    0000000  00000000
    # 000   000  000       000   000  000       000   000  000       000
    # 0000000    0000000    000 000   0000000   0000000    0000000   0000000
    # 000   000  000          000     000       000   000       000  000
    # 000   000  00000000      0      00000000  000   000  0000000   00000000

    reverse: ->
        @trans (l) -> reversed l
        'reverse'

    #  0000000   0000000   00000000   000000000
    # 000       000   000  000   000     000
    # 0000000   000   000  0000000       000
    #      000  000   000  000   000     000
    # 0000000    0000000   000   000     000

    sort: -> @toggle @sortFuncs

    up: ->
        @trans (l) -> l.sort (a,b) -> a.localeCompare b
        'up'

    down: ->
        @trans (l) -> reversed l.sort (a,b) -> a.localeCompare b
        'down'

    #  0000000   0000000    0000000  00000000
    # 000       000   000  000       000
    # 000       000000000  0000000   0000000
    # 000       000   000       000  000
    #  0000000  000   000  0000000   00000000

    case: -> @toggle @caseFuncs

    upper: ->

        @apply (t) -> t.toUpperCase()
        'upper'

    lower: ->

        @apply (t) -> t.toLowerCase()
        'lower'

    title: ->

        pattern = /\w+/
        @apply (t) ->
            for r in matchr.ranges /\w+/, t
                t = t.splice r.start, r.match.length, r.match.substr(0,1).toUpperCase() + r.match.slice(1).toLowerCase()
            t
        'title'

    # 00000000   00000000   0000000   0000000   000      000   000  00000000
    # 000   000  000       000       000   000  000      000   000  000
    # 0000000    0000000   0000000   000   000  000       000 000   0000000
    # 000   000  000            000  000   000  000         000     000
    # 000   000  00000000  0000000    0000000   0000000      0      00000000

    toggleResolve: -> @toggle @resolveFuncs

    resolve: ->

        cwd = process.cwd()
        if @editor.currentFile?
            process.chdir slash.dirname @editor.currentFile
        @apply (t) -> slash.resolve t
        process.chdir cwd
        'resolve'

    unresolve: ->

        @apply (t) -> slash.unresolve t
        'unresolve'

    # 00000000    0000000   000000000  000   000
    # 000   000  000   000     000     000   000
    # 00000000   000000000     000     000000000
    # 000        000   000     000     000   000
    # 000        000   000     000     000   000

    basename: ->

        @apply (t) -> slash.basename t
        'basename'

    dirname: ->

        @apply (t) -> slash.dirname t
        'dirname'

    extname: ->

        @apply (t) -> slash.extname t
        'extname'

    filename: ->

        @apply (t) -> slash.fileName t
        'filename'

    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000
    # 000000000  00000000   00000000   000        00000
    # 000   000  000        000        000         000
    # 000   000  000        000        0000000     000

    apply: (func) -> @tfunc apply:func

    # 000000000  00000000    0000000   000   000   0000000
    #    000     000   000  000   000  0000  000  000
    #    000     0000000    000000000  000 0 000  0000000
    #    000     000   000  000   000  000  0000       000
    #    000     000   000  000   000  000   000  0000000

    trans: (func) -> @tfunc trans:func

    # 000000000  00000000  000   000  000   000   0000000
    #    000     000       000   000  0000  000  000
    #    000     000000    000   000  000 0 000  000
    #    000     000       000   000  000  0000  000
    #    000     000        0000000   000   000   0000000

    tfunc: (opt) ->

        if not @editor.numSelections()

            if opt.trans
                @editor.selectMoreLines()
            else
                @editor.select @editor.rangesForWordsAtCursors()

        selections = @editor.selections()

        tl = @editor.textsInRanges selections
        tl = tl.map opt.apply if opt.apply?
        tl = opt.trans tl     if opt.trans?

        @editor.do.start()
        @editor.replaceSelectedText tl
        @editor.do.end()

    # 000000000   0000000    0000000    0000000   000      00000000
    #    000     000   000  000        000        000      000
    #    000     000   000  000  0000  000  0000  000      0000000
    #    000     000   000  000   000  000   000  000      000
    #    000      0000000    0000000    0000000   0000000  00000000

    toggle: (funcList) ->

        if @last not in funcList
            @last = _.last funcList

        nextIndex = (1 + funcList.indexOf @last) % funcList.length
        @do funcList[nextIndex]

    # 0000000     0000000
    # 000   000  000   000
    # 000   000  000   000
    # 000   000  000   000
    # 0000000     0000000

    do: (transName, args...) ->

        f = @[transName]

        if f and _.isFunction f
            @last = f.apply @, args
        else
            return error "unhandled transform #{transName}"

        @last

    @do: (editor, transName, args...) ->

        t = editor.transform ? new Transform editor
        t.do.apply t, [transName].concat args

module.exports =

    actions:

        toggleCase:
            name:  'Toggle Case'
            text:  'toggles selected texts between lower- upper- and title-case'
            combo: 'command+alt+ctrl+u'

        reverseSelection:
            name:  'reverse selection'
            text:  'reverses the order of selected texts'
            combo: 'command+alt+ctrl+r'

    toggleCase:        -> Transform.do @, 'toggleCase'
    reverseSelection:  -> Transform.do @, 'reverse'
    Transform:         Transform
