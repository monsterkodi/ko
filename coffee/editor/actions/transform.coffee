
# 000000000  00000000    0000000   000   000   0000000  00000000   0000000   00000000   00     00
#    000     000   000  000   000  0000  000  000       000       000   000  000   000  000   000
#    000     0000000    000000000  000 0 000  0000000   000000    000   000  0000000    000000000
#    000     000   000  000   000  000  0000       000  000       000   000  000   000  000 0 000
#    000     000   000  000   000  000   000  0000000   000        0000000   000   000  000   000

{ reversed, matchr, slash, kstr, args, kerror, _ } = require 'kxk'

class Transform

    @transformNames = [
        'upper' 'lower' 'title' 'case'
        'count' 'add' 'sub'
        'up' 'down' 'sort' 'uniq'
        'reverse'
        'resolve' 'unresolve'
        'dir' 'base'
        'file' 'ext'
    ]
    @transformMenus =
        Case: ['upper' 'lower' 'title' 'case']
        Calc: ['count' 'add' 'sub']
        Sort: ['up' 'down' 'sort' 'uniq' 'reverse']
        Path: [ 'resolve' 'unresolve' 'dir' 'base' 'file' 'ext' ]

    @: (@editor) ->

        @editor.transform = @
        @last         = null
        @caseFuncs    = ['upper' 'lower' 'title']
        @resolveFuncs = ['resolve' 'unresolve']
        @sortFuncs    = ['up' 'down']

    #  0000000   0000000   000   000  000   000  000000000
    # 000       000   000  000   000  0000  000     000
    # 000       000   000  000   000  000 0 000     000
    # 000       000   000  000   000  000  0000     000
    #  0000000   0000000    0000000   000   000     000

    count: (typ='dec' offset=0, step=1) ->

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

        @apply (t) -> kstr(parseInt(t) + parseInt(d))
        'add'

    sub: (d=1) ->

        @apply (t) -> kstr(parseInt(t) - parseInt(d))
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

    # 000   000  000   000  000   0000000
    # 000   000  0000  000  000  000   000
    # 000   000  000 0 000  000  000 00 00
    # 000   000  000  0000  000  000 0000
    #  0000000   000   000  000   00000 00

    uniq: ->
        @trans (l) ->
            v = []
            r = []
            for a in l
                r.push if a in v then '' else
                    v.push a
                    a
            r
        'uniq'

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
            process.chdir slash.dir @editor.currentFile
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

    base: ->

        @apply (t) -> slash.base t
        'basename'

    dir: ->

        @apply (t) -> slash.dir t
        'dirname'

    ext: ->

        @apply (t) -> slash.ext t
        'ext'

    file: ->

        @apply (t) -> slash.file t
        'file'

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
            return kerror "unhandled transform #{transName}"

        @last

    @do: (editor, transName, args...) ->

        t = editor.transform ? new Transform editor
        t.do.apply t, [transName].concat args

module.exports =

    actions:

        menu: "Misc"

        toggleCase:
            name:  'Toggle Case'
            text:  'toggles selected texts between lower- upper- and title-case'
            combo: 'command+alt+ctrl+u'
            accel: 'alt+ctrl+u'

        reverseSelection:
            name:  'Reverse Selection'
            text:  'reverses the order of selected texts'
            combo: 'command+alt+ctrl+r'
            accel: 'alt+ctrl+r'

        doTransform:
            name:  'doTransform'

    toggleCase:        -> Transform.do @, 'case'
    reverseSelection:  -> Transform.do @, 'reverse'
    doTransform: (arg) -> Transform.do @, arg
    Transform:         Transform
    transformNames:    Transform.transformNames
