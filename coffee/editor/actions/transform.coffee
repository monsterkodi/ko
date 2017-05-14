
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
        'upperCase', 'lowerCase', 'titleCase',
        'resolve', 'unresolve',
        'basename', 'dirname', 'extname', 'filename',
        'reverse'
    ]

    constructor: (@editor) ->

        @editor.transform = @
        @last         = null
        @caseFuncs    = ['upperCase', 'lowerCase', 'titleCase']
        @resolveFuncs = ['resolve', 'unresolve']

    # 00000000   00000000  000   000  00000000  00000000    0000000  00000000  
    # 000   000  000       000   000  000       000   000  000       000       
    # 0000000    0000000    000 000   0000000   0000000    0000000   0000000   
    # 000   000  000          000     000       000   000       000  000       
    # 000   000  00000000      0      00000000  000   000  0000000   00000000  
    
    reverse: ->
        @trans (l) -> reversed l
        'reverse'
        
    #  0000000   0000000    0000000  00000000
    # 000       000   000  000       000
    # 000       000000000  0000000   0000000
    # 000       000   000       000  000
    #  0000000  000   000  0000000   00000000

    toggleCase: ->

        if @last not in @caseFuncs
            @last = _.last @caseFuncs

        nextIndex = (1 + @caseFuncs.indexOf @last) % @caseFuncs.length
        @do @caseFuncs[nextIndex]

    upperCase: ->

        @apply (t) -> t.toUpperCase()
        'upperCase'

    lowerCase: ->

        @apply (t) -> t.toLowerCase()
        'lowerCase'

    titleCase: ->

        pattern = /\w+/
        @apply (t) ->
            for r in matchr.ranges /\w+/, t
                t = t.splice r.start, r.match.length, r.match.substr(0,1).toUpperCase() + r.match.slice(1).toLowerCase()
            t
        'titleCase'

    # 00000000   00000000   0000000   0000000   000      000   000  00000000
    # 000   000  000       000       000   000  000      000   000  000
    # 0000000    0000000   0000000   000   000  000       000 000   0000000
    # 000   000  000            000  000   000  000         000     000
    # 000   000  00000000  0000000    0000000   0000000      0      00000000

    toggleResolve: ->

        if @last not in @resolveFuncs
            @last = _.last @resolveFuncs

        nextIndex = (1+ @resolveFuncs.indexOf @last) % @resolveFuncs.length
        @do @resolveFuncs[nextIndex]

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
        
        selections = @editor.selections()
        
        tl = @editor.textsInRanges selections
        tl = tl.map opt.apply if opt.apply?
        tl = opt.trans tl     if opt.trans?

        selections = _.zip(selections, tl).map (p) ->
            p[0][1][1] = p[0][1][0] + p[1].length
            p[0]

        @editor.do.start()
        @editor.pasteText tl.join '\n'
        @editor.do.select selections
        @editor.do.end()
        
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
