###
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
###

{ _, kerror, kstr, slash, valid } = require 'kxk'

requireRegExp = /^(\s*\{.+\})\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/
mathRegExp = /^(\s*\{.+\})\s*=\s*(Math)\s*$/

moduleKeys = (moduleName, file) ->
    
    if pkgDir = slash.pkg file
        nodeModules = slash.unslash slash.join pkgDir, 'node_modules'
        if nodeModules not in module.paths
            module.paths.push nodeModules
         
    if moduleName.startsWith '.'
        fileDir = slash.resolve(slash.join slash.dir(file), moduleName).replace '/coffee/' '/js/'
        fileDir = slash.unslash slash.dir fileDir
        if fileDir not in module.paths
            module.paths.unshift fileDir
        moduleName = slash.file moduleName
         
    try
        required = require moduleName
    catch err
        error "can't require #{moduleName} #{err}"
        
    if required
        if required.prototype
            return Object.keys required.prototype
        if required.getOwnPropertyNames
            return required.getOwnPropertyNames()
        return Object.keys required
    []
    
req = (file, lines, editor) ->

    requires  = {}
    exports   = {}
    reqValues = {}
    regexes   = '$': /[^*\)\'\"\\]?\$[\s\(]/
    firstIndex = null
    
    keys = Math: [
        'E''LN2''LN10''LOG2E''LOG10E''PI''SQRT1_2''SQRT2'
        'abs''acos''acosh''asin''asinh''atan''atanh''atan2'
        'cbrt''ceil''clz32''cos''cosh''exp''expm1''floor''fround'
        'hypot''imul''log1p''log10''log2''max''min''pow''random'
        'round''sign''sin''sinh''sqrt''tan''tanh''trunc'
        ]
   
    for li in [0...lines.length]
        
        m = lines[li].match requireRegExp

        if not m?[1]?
            m = lines[li].match mathRegExp
        
        if m?[1]? and m?[2]?
            
            if not requires[m[2]]
                indent = ''
                ci = 0
                while m[1][ci] == ' '
                    indent += ' '
                    ci += 1
                requires[m[2]] = index:li, value:m[1].trim(), module:m[2], indent:indent
                
                if requires[m[2]].value.startsWith '{'
                    if not keys[m[2]]
                        try
                            moduleName = kstr.strip m[2], '"\''
                            newKeys = moduleKeys moduleName, file
                            keys[m[2]] = newKeys
                            for k in newKeys
                                regexes[k] ?= new RegExp "(^|[\\:\\(\\{]|\\s+)#{k}(\\s+[^:]|\\s*$|[\\.\\(])"
                            
                        catch err
                            kerror "can't require #{m[2]} for #{file}: #{err} \nmodule.paths:" module.paths
                
                firstIndex ?= li
            continue
            
        if lines[li].trim().startsWith 'module.exports'
            name = lines[li].trim().split('=')[1]?.trim()
            if name and /\w+/.test name
                exports[name.toLowerCase()] = true
                         
        for mod,values of keys

            for k in values

                reqValues[mod] ?= []

                if k in reqValues[mod]
                    continue
                
                regexes[k] ?= new RegExp "(^|[\\:\\(\\{]|\\s+)#{k}(\\s+[^:]|\\s*$|[\\.\\(])"
                    
                if regexes[k].test lines[li]
                    
                    diss = editor.syntax.getDiss li
                    diss = diss.filter (d) -> d?.clss and not d.clss.startsWith('comment') and not d.clss.startsWith('string')
                    text = diss.map((s) -> s.match).join ' '
                    
                    if regexes[k].test text
                        reqValues[mod].push k

    operations = []
         
    for mod,values of reqValues
    
        firstIndex ?= 0
        
        if requires[mod]
            firstIndex = requires[mod].index + 1
        else 
            continue
                        
        values = _.uniq values
        values = values.filter (v) -> v not in Object.keys(exports).concat ['state']
        
        if valid values
    
            values.sort()
            
            if mod == 'Math'
                text = "#{requires[mod].indent}{ #{values.join ', '} } = #{mod}"
            else
                text = "#{requires[mod].indent}{ #{values.join ', '} } = require #{mod}"
                
            if requires[mod]
                operations.push op:'change' index:requires[mod].index, text:text
            else
                operations.push op:'insert' index:firstIndex, text:text
                
    operations

req.moduleKeys = moduleKeys
    
module.exports = req
