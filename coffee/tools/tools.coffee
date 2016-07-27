# 000000000   0000000    0000000   000       0000000
#    000     000   000  000   000  000      000     
#    000     000   000  000   000  000      0000000 
#    000     000   000  000   000  000           000
#    000      0000000    0000000   0000000  0000000 

pos  = require './pos'
log  = require './log'
_    = require 'lodash'
sfmt = require 'sprintf-js'
path = require 'path'
os   = require 'os'
fs   = require 'fs'

module.exports = 

    # 0000000    000   0000000  000000000
    # 000   000  000  000          000   
    # 000   000  000  000          000   
    # 000   000  000  000          000   
    # 0000000    000   0000000     000   

    def: (c,d) ->
        if c?
            _.defaults(_.clone(c), d)
        else if d?
            _.clone(d)
        else
            {}

    del: (l,e) -> _.remove l, (n) -> n == e

    #  0000000   00000000   00000000    0000000   000   000
    # 000   000  000   000  000   000  000   000   000 000 
    # 000000000  0000000    0000000    000000000    00000  
    # 000   000  000   000  000   000  000   000     000   
    # 000   000  000   000  000   000  000   000     000   

    last:  (a) -> a[a.length-1] if a?.length
    first: (a) -> a[0] if a?.length
    
    startOf: (r) -> r[0]
    endOf:   (r) -> r[0] + Math.max 1, r[1]-r[0]

    # 000   000   0000000   000      000   000  00000000
    # 000   000  000   000  000      000   000  000     
    #  000 000   000000000  000      000   000  0000000 
    #    000     000   000  000      000   000  000     
    #     0      000   000  0000000   0000000   00000000

    clamp: (r1, r2, v) ->
        if r1 > r2
            [r1,r2] = [r2,r1]
        v = Math.max(v, r1) if r1?
        v = Math.min(v, r2) if r2?
        v
        
    shortCount: (v) ->
        v = parseInt v
        switch
            when v > 999999 then "#{Math.floor v/1000000}M"
            when v > 999    then "#{Math.floor v/1000}k"
            else                 "#{v}"
        
    # 00000000    0000000   000000000  000   000
    # 000   000  000   000     000     000   000
    # 00000000   000000000     000     000000000
    # 000        000   000     000     000   000
    # 000        000   000     000     000   000
    
    resolve:   (p) -> path.normalize path.resolve p.replace /^\~/, process.env.HOME
    unresolve: (p) -> p.replace os.homedir(), "~"    
    fileName:  (p) -> path.basename p, path.extname p
    extName:   (p) -> path.extname(p).slice 1

    fileList: (paths, opt={ignoreHidden: true, logError: true}) ->
        files = []
        paths = [paths] if typeof paths == 'string'
        for p in paths
            try
                [p,l] = p.split ':'
                stat = fs.statSync p
                if stat.isDirectory()
                    dirfiles = fs.readdirSync p
                    dirfiles = (path.join(p,f) for f in dirfiles)
                    dirfiles = (f for f in dirfiles when fs.statSync(f).isFile())
                    if opt.ignoreHidden
                        dirfiles = dirfiles.filter (f) -> not path.basename(f).startsWith '.'
                    files = files.concat dirfiles
                    
                else if stat.isFile()
                    if opt.ignoreHidden and path.basename(p).startsWith '.'
                        continue
                    p += ":#{l}" if l?
                    files.push p
            catch err
                if opt.logError
                    log 'tools.fileList.error:', err
        files
        
    fileExists: (file) ->
        try
            if fs.statSync(file).isFile()
                fs.accessSync file, fs.R_OK | fs.W_OK
                return true
        catch
            return false

    dirExists: (dir) ->
        try
            if fs.statSync(dir).isDirectory()
                fs.accessSync dir, fs.R_OK
                return true
        catch
            return false
                                                          
    relative: (absolute, to) ->
        return absolute if not absolute?.startsWith '/'
        d = path.normalize path.resolve to.replace /\~/, process.env.HOME
        r = path.relative d, absolute
        if r.startsWith '../../' 
            unresolved = absolute.replace(os.homedir(), "~")
            if unresolved.length < r.length
                r = unresolved
        if absolute.length < r.length    
            r = absolute
        r
        
    swapExt: (p, ext) -> path.join(path.dirname(p), path.basename(p, path.extname(p))) + ext
            
    #  0000000   0000000   0000000
    # 000       000       000     
    # 000       0000000   0000000 
    # 000            000       000
    #  0000000  0000000   0000000 
    
    setStyle: (selector, key, value) ->
        for rule in document.styleSheets[0].cssRules
            if rule.selectorText == selector
                rule.style[key] = value

    getStyle: (selector, key, value) ->
        for rule in document.styleSheets[0].cssRules
            if rule.selectorText == selector
                return rule.style[key]
        return value
                
    # 0000000     0000000   00     00
    # 000   000  000   000  000   000
    # 000   000  000   000  000000000
    # 000   000  000   000  000 0 000
    # 0000000     0000000   000   000
        
    $: (idOrClass,e=document) -> 
        if idOrClass.startsWith '.'
            e.getElementsByClassName(idOrClass.substr(1).split('.').join " ")[0]
        else
            e.getElementById idOrClass

    absPos: (event) ->
        event = if event? then event else window.event
        if isNaN window.scrollX
            return pos(event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft,
                       event.clientY + document.documentElement.scrollTop + document.body.scrollTop)
        else
            return pos(event.clientX + window.scrollX, event.clientY + window.scrollY)

    sw: () -> document.body.clientWidth
    sh: () -> document.body.clientHeight
    
#  0000000  000000000  00000000   000  000   000   0000000 
# 000          000     000   000  000  0000  000  000      
# 0000000      000     0000000    000  000 0 000  000  0000
#      000     000     000   000  000  000  0000  000   000
# 0000000      000     000   000  000  000   000   0000000 
    
if not String.prototype.splice
    String.prototype.splice = (start, delCount, newSubStr='') ->
        @slice(0, start) + newSubStr + @slice(start + Math.abs(delCount))
    String.prototype.strip = String.prototype.trim
    String.prototype.fmt = -> sfmt.vsprintf @, [].slice.call arguments

#  0000000   00000000   00000000    0000000   000   000
# 000   000  000   000  000   000  000   000   000 000 
# 000000000  0000000    0000000    000000000    00000  
# 000   000  000   000  000   000  000   000     000   
# 000   000  000   000  000   000  000   000     000   

if not Array.prototype.reversed
    Array.prototype.reversed = ->
        _.clone(@).reverse()
