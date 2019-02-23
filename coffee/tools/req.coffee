###
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
###

{ post, slash, valid, empty, log, _ } = require 'kxk'

kxk = require 'kxk'

requireRegExp = /^(.+)=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/
globalRegExp  = /^(console|process|global|module|exports|window|null|undefined|true|false|return|if|then|else|for|in|not|continue|break|switch|when)$/

req = (file, lines, words, editor) ->
    
    operations = []

    words = words.filter (w) -> /\w+/.test w
    words = words.filter (w) -> not globalRegExp.test w
    
    if pkgPath = slash.pkg file
        projectFiles = post.get('indexer', 'project', pkgPath).files
        if valid projectFiles
            projectFiles = projectFiles.filter (f) -> slash.ext(f) in ['coffee', 'json', 'js']
            projectFiles = projectFiles.map (f) -> 
                p = slash.splitExt(slash.relative f, slash.dir file)[0]
                p = '.' + p if not p.startsWith '.'
                p
        else
            log "req:- no projectFiles for '#{pkgPath}'??"
                
    projectFiles ?= []
    
    requires  = {}
    reqvalues = {}
    kxkValues = []
    modValues = []
    firstIndex = null
    
    for li in [0...lines.length]
        
        m = lines[li].match requireRegExp
        if m?[1]? and m?[2]?
            if not requires[m[2]]
                requires[m[2]] = index:li, value:m[1].trim(), module:m[2]
                reqvalues[m[1].trim()] = m[2]
                firstIndex ?= li
            continue
            
        for k in Object.keys kxk
            continue if reqvalues[k]
            if k == '$'
                regex = new RegExp "[^*\\)\'\"\\\\]\\$"
            else
                regex = new RegExp "(^|[\\:\\(\\{]|\\s+)#{k}(\\s+[^:]|\\s*$|[\\.\\(])"
            if regex.test lines[li]
                diss = editor.syntax.getDiss li
                diss = diss.filter (d) -> not d.clss.startsWith('comment') and not d.clss.startsWith('string')
                text = diss.map((s) -> s.match).join ' '
                if regex.test text
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
    kxkValues = kxkValues.filter (v) -> v not in ['state']
    
    log "req.req kxkValues:#{kxkValues}"
      
    if valid kxkValues
        
        weight = (v) ->
            switch v
                when 'post'  then 0
                when '_'     then 1000
                when '$'     then 999
                when 'error' then 900
                when 'log'   then 901
                else Math.max(0, 500 - v.length)
                
        kxkValues.sort (a,b) -> weight(a) - weight(b)
        
        text = "{ #{kxkValues.join ', '} } = require 'kxk'"
        if requires['kxk']
            operations.push op:'change', index:requires['kxk'].index, text:text
        else
            operations.push op:'insert', index:firstIndex, text:text
    
    for modValue in modValues
        if empty requires[modValue.module]
            operations.push op:'insert', index:firstIndex, text:"#{modValue.value} = require '#{modValue.module}'"
            
    return operations

module.exports = req
