###
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
###

{ slash, post, log, _, valid, empty } = require 'kxk'

kxk = require 'kxk'

requireRegExp = /^(.+)=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/
globalRegExp  = /^(console|process|global|module|exports|window|null|undefined|true|false|return|if|then|else|for|in|not|continue|break|switch|when)$/

req = (file, lines, words) ->
    
    operations = []

    words = words.filter (w) -> /\w+/.test w
    words = words.filter (w) -> not globalRegExp.test w
    
    if pkgPath = slash.pkg file
        projectFiles = post.get('indexer', 'project', pkgPath).files
        projectFiles = projectFiles.filter (f) -> slash.ext(f) in ['coffee', 'json', 'js']
        projectFiles = projectFiles.map (f) -> 
            p = slash.splitExt(slash.relative f, slash.dir file)[0]
            p = '.' + p if not p.startsWith '.'
            p
    else
        projectFiles = []
    
    requires  = {}
    kxkValues = []
    modValues = []
    firstIndex = null
        
    for li in [0...lines.length]
        
        m = lines[li].match requireRegExp
        if m?[1]? and m?[2]?
            if not requires[m[2]]
                requires[m[2]] = index:li, value:m[1].trim(), module:m[2]
                firstIndex ?= li
            continue
            
        for k in Object.keys kxk
            regex = if k == '$'
                new RegExp "[^\\)\'\"\\\\]\\$"
            else
                new RegExp "(^|\\s+)#{k}\\b"
            if regex.test lines[li]
                if k == '$'
                    log li, lines[li]
                kxkValues.push k
    
    firstIndex ?= 0
    
    if requires['kxk']
        firstIndex = requires['kxk'].index + 1
    
    for word in words
        
        if word in Object.keys kxk
            kxkValues.push word
        else
            
            for f in projectFiles
                if word.toLowerCase() == slash.base f
                    modValues.push value:word, module:f
                    handled = true
                    break
                    
            if not handled
                modValues.push value:word, module:word.toLowerCase()

    kxkValues = _.uniq kxkValues
      
    # log 'kxkValues', kxkValues
    
    if valid kxkValues
        text = "{ #{kxkValues.join ', '} } = require 'kxk'"
        if requires['kxk']
            operations.push op:'change', index:requires['kxk'].index, text:text
        else
            operations.push op:'insert', index:firstIndex, text:text
    
    for modValue in modValues
        if empty requires[modValue.module]
            operations.push op:'insert', index:firstIndex, text:"#{modValue.value} = require '#{modValue.module}'"
            
    log 'operations', operations
    return operations

module.exports = req
