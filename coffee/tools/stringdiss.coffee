
#  0000000  000000000  00000000   000  000   000   0000000   0000000    000   0000000   0000000  
# 000          000     000   000  000  0000  000  000        000   000  000  000       000       
# 0000000      000     0000000    000  000 0 000  000  0000  000   000  000  0000000   0000000   
#      000     000     000   000  000  000  0000  000   000  000   000  000       000       000  
# 0000000      000     000   000  000  000   000   0000000   0000000    000  0000000   0000000   

{ str, _
} = require 'kxk'

log = -> #console.log.apply console, [].slice.call(arguments, 0).map (s) -> str s

stringDiss = (text, dss) ->

    log "stringDiss -- #{text} -- ", dss

    stack  = []
    result = []

    addString = (strDiss) ->
        
        log 'addString', strDiss
        last = _.last result
        if ('marker' not in last.cls) and ('interpolation' not in last.cls) and last.start + last.match.length == strDiss.start
            last.match += strDiss.match
        else
            strDiss.cls = ['text', 'string'].concat [_.last last.cls]
            strDiss.clss = strDiss.cls.join ' '
            result.push strDiss
        log 'add string result:', result

    addInterpolation = (interDiss) ->
        
        log 'addInterpolation', interDiss
        result.push interDiss
        log 'add interpolation result:', result
        
    while d = dss.shift()

        top = _.last stack
        end = _.last result
        
        if d.clss == 'syntax string marker double' and d.match == '"""'
            d.cls.pop()
            d.cls.push 'triple'
            d.clss = d.cls.join ' '
            log 'triple convert'

        if 'interpolation' in d.cls # interpolation start
            log 'interpolation!', d

            if top?
                if 'interpolation' in top.cls
                    if 'open' in d.cls
                        top.clss = 'syntax string interpolation open'
                        top.cls = d.clss.split ' '
                        top.match += d.match
                        result.push top
                        log 'joined open interpolation', result
                        continue
                    else
                        log 'dafuk?'
                else
                    if 'single' == _.last top.cls
                        addString d
                        continue
            else
                result.push d
                continue
                        
            # push half open interpolation to stack
            
            stack.push d
            log 'pushed interpolation stack:', stack
            continue

        if top? and 'interpolation' in top.cls # interpolation end
            if d.clss.endsWith 'bracket close'
                log 'pop interpolation!', d
                stack.pop()
                d.clss = 'syntax string interpolation close'
                d.cls = d.clss.split ' '
                result.push d
                continue
            
        switch d.clss

            when 'syntax string marker triple', 'syntax string marker double', 'syntax string marker single'

                if d.clss != 'syntax string marker triple'
                    if d.match.length > 1 # split multiple string markers
                        log 'splice non triple'
                        dss.unshift
                            match: d.match.slice 1
                            start: d.start + 1
                            clss:  d.clss
                            cls:   _.clone d.cls
                            cid:   d.cid # needed?
                        d.match = d.match.slice 0, 1

                if end? # escaped string markers ...
                    if end.match.endsWith '\\'
                        if numberOfCharsAtEnd(end.match, '\\') % 2
                            if end.start + end.match.length == d.start
                                log 'escaped top:', top
                                if top? and 'interpolation' not in top.cls
                                    log 'inside escaped', d.match
                                    end.match += d.match
                                else
                                    log 'outside escaped', d.match
                                    result.push d
                                log 'escaped result:', result
                                continue

                if top? and top.clss == d.clss # pop matching string marker
                    
                    stack.pop()
                    result.push d
                    
                else if top? and 'interpolation' not in top.cls
                    
                    addString d

                else 
                
                    # push string marker onto stack
                    
                    result.push d
                    stack.push d
                    log 'pushed string stack:', stack
                    log 'pushed string result:', result
                    
                continue
                
        if top? 
            if 'interpolation' in top.cls
                addInterpolation d
            else 
                addString d
        else
            log 'push stray', d
            result.push d
            log 'pushed stray result:', result         

    while stack.length
        log 'unbalanced!', stack
        stack.pop()

    log "text -- #{text} -- result:", result

    result
    
module.exports = stringDiss