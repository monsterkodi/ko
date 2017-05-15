
# 000000000  00000000    0000000   000   000   0000000  00000000   0000000   00000000   00     00
#    000     000   000  000   000  0000  000  000       000       000   000  000   000  000   000
#    000     0000000    000000000  000 0 000  0000000   000000    000   000  0000000    000000000
#    000     000   000  000   000  000  0000       000  000       000   000  000   000  000 0 000
#    000     000   000  000   000  000   000  0000000   000        0000000   000   000  000   000

{ resolve, unresolve, reversed, fileName, path, error, log, _
} = require 'kxk'
matchr = require '../../tools/matchr'

class Transform

    @transformNames = [
        'upper', 'lower', 'title',
        'resolve', 'unresolve',
        'basename', 'dirname', 'extname', 'filename',
        'reverse', 'asc', 'desc', 'sort'
    ]

    constructor: (@editor) ->

        @editor.transform = @
        @last         = null
        @caseFuncs    = ['upper', 'lower', 'title']
        @resolveFuncs = ['resolve', 'unresolve']
        @sortFuncs    = ['asc', 'desc']

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

    asc: ->
        @trans (l) -> l.sort (a,b) -> a.localeCompare b
        'asc'

    desc: ->
        @trans (l) -> reversed l.sort (a,b) -> a.localeCompare b
        'desc'

    #  0000000   0000000    0000000  00000000
    # 000       000   000  000       000
    # 000       000000000  0000000   0000000
    # 000       000   000       000  000
    #  0000000  000   000  0000000   00000000

    toggleCase: -> @toggle @caseFuncs

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
            process.chdir path.dirname @editor.currentFile
        @apply (t) -> resolve t
        process.chdir cwd
        'resolve'

    unresolve: ->

        @apply (t) -> unresolve t
        'unresolve'

    # 00000000    0000000   000000000  000   000
    # 000   000  000   000     000     000   000
    # 00000000   000000000     000     000000000
    # 000        000   000     000     000   000
    # 000        000   000     000     000   000

    basename: ->

        @apply (t) -> path.basename t
        'basename'

    dirname: ->

        @apply (t) -> path.dirname t
        'dirname'

    extname: ->

        @apply (t) -> path.extname t
        'extname'

    filename: ->

        @apply (t) -> fileName t
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

    do: (transName) ->

        f = @[transName]

        if f and _.isFunction f
            @last = f.call @
        else
            return error "unhandled transform #{transName}"

        @last

    @do: (editor, transName) ->

        t = editor.transform ? new Transform editor
        t.do transName

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
