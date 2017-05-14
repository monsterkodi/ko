
# 000000000  00000000    0000000   000   000   0000000  00000000   0000000   00000000   00     00
#    000     000   000  000   000  0000  000  000       000       000   000  000   000  000   000
#    000     0000000    000000000  000 0 000  0000000   000000    000   000  0000000    000000000
#    000     000   000  000   000  000  0000       000  000       000   000  000   000  000 0 000
#    000     000   000  000   000  000   000  0000000   000        0000000   000   000  000   000

{ error, log, _
} = require 'kxk'
matchr = require '../../tools/matchr'

class Transform

    constructor: (@editor) ->
        
        @editor.transform = @
        @last      = null
        @caseFuncs = ['upperCase', 'lowerCase', 'titleCase']
    
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

    apply: (tfunc) ->
        
        selections = @editor.selections()
        tl = @editor.textsInRanges selections
        tl = tl.map tfunc

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

    toggleCase: -> Transform.do @, 'toggleCase'
