
#  0000000  000000000  00000000   000  000   000   0000000   0000000    000   0000000   0000000  
# 000          000     000   000  000  0000  000  000        000   000  000  000       000       
# 0000000      000     0000000    000  000 0 000  000  0000  000   000  000  0000000   0000000   
#      000     000     000   000  000  000  0000  000   000  000   000  000       000       000  
# 0000000      000     000   000  000  000   000   0000000   0000000    000  0000000   0000000   

stringDiss = (text, dss) ->

    console.log 'stringDiss ---- ', text,  str dss

    stack = []
    result = []

    addString = (strDiss) ->
        
        console.log 'addString', str strDiss
        last = _.last result
        if ('marker' not in end.cls) and last.start + last.match.length == strDiss.start
            last.match += strDiss.match
        else
            strDiss.cls = ['text', 'string'].concat [_.last last.cls]
            strDiss.clss = strDiss.cls.join ' '
            result.push strDiss
        console.log 'add string result:', str result

    addInterpolation = (interDiss) ->
        
        console.log 'addInterpolation', str interDiss
        result.push interDiss
        console.log 'add interpolation result:', str result
        
    while d = dss.shift()

        top = _.last stack
        end = _.last result
        
        if d.clss == 'syntax string marker double' and d.match == '"""'
            d.cls.pop()
            d.cls.push 'triple'
            d.clss = d.cls.join ' '
            # console.log 'triple convert'

        if 'interpolation' in d.cls # interpolation start
            console.log 'interpolation!', str d

            if top?
                if 'interpolation' in top.cls
                    if 'open' in d.cls
                        top.clss = 'syntax string interpolation open'
                        top.cls = d.clss.split ' '
                        top.match += d.match
                        result.push top
                        console.log 'joined open interpolation', str result
                        continue
                    else
                        console.log 'dafuk?'
                        
            # push half open interpolation to stack
            
            stack.push d
            console.log 'pushed interpolation stack:', str stack
            continue

        if top? and 'interpolation' in top.cls # interpolation end
            if d.clss.endsWith 'bracket close'
                console.log 'pop interpolation!', str d
                stack.pop()
                d.clss = 'syntax string interpolation close'
                d.cls = d.clss.split ' '
                result.push d
                continue
            
        switch d.clss

            when 'syntax string marker triple', 'syntax string marker double', 'syntax string marker single'

                if d.clss != 'syntax string marker triple'
                    if d.match.length > 1 # split multiple string markers
                        console.log 'splice non triple'
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
                                console.log 'escaped top:', str top
                                if top? and 'interpolation' not in top.cls
                                    console.log 'inside escaped', d.match
                                    end.match += d.match
                                else
                                    console.log 'outside escaped', d.match
                                    result.push d
                                console.log 'escaped result:', str result
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
                    console.log 'pushed string stack:', str stack
                    console.log 'pushed string result:', str result
                    
                continue
                
        if top? 
            if 'interpolation' in top.cls
                addInterpolation d
            else 
                addString d
        else
            console.log 'push stray', str d
            result.push d
            console.log 'pushed stray result:', str result         

    while stack.length
        console.log 'unbalanced!', str stack
        stack.pop()

    console.log "text -- #{text} -- result:", str result

    result
    
module.exports = stringDiss