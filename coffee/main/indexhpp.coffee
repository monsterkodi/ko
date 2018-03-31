###
000  000   000  0000000    00000000  000   000        000   000  00000000   00000000   
000  0000  000  000   000  000        000 000         000   000  000   000  000   000  
000  000 0 000  000   000  0000000     00000          000000000  00000000   00000000   
000  000  0000  000   000  000        000 000         000   000  000        000        
000  000   000  0000000    00000000  000   000        000   000  000        000        
###

{ empty, str, first, last, log, error, _ } = require 'kxk'

class IndexHpp

    constructor: ->

        @regions =
            character:       open: "'",  close: "'"
            string:          open: '"',  close: '"'
            bracketArgs:     open: '(',  close: ')'
            bracketSquare:   open: '[',  close: ']'
            # bracketTemplate: open: '<',  close: '>'
            codeBlock:       open: '{',  close: '}'
            blockComment:    open: '/*', close: '*/'
            lineComment:     open: '//', close: null
            
        @classRegExp  = /^(class|enum|struct)\s+/
        @methodRegExp = /^([\w\&\*]+)\s+(\w+)\s*\(/
        @constrRegExp = /^\~?(\w+)\s*\(/

    # 00000000    0000000   00000000    0000000  00000000       000      000  000   000  00000000  
    # 000   000  000   000  000   000  000       000            000      000  0000  000  000       
    # 00000000   000000000  0000000    0000000   0000000        000      000  000 0 000  0000000   
    # 000        000   000  000   000       000  000            000      000  000  0000  000       
    # 000        000   000  000   000  0000000   00000000       0000000  000  000   000  00000000  
    
    parseLine: (lineIndex, lineText) ->
        
        log lineIndex, lineText
        
        @lastWord = @currentWord if not empty @currentWord
        @currentWord = ''
        
        if last(@tokenStack)?.class and not last(@tokenStack).name
            last(@tokenStack).name = @lastWord
                
        p    = -1
        rest = lineText
        while p < lineText.length-1
            p += 1
            ch = lineText[p]
            
            if ch in [' ', '\t']
                @lastWord = @currentWord if not empty @currentWord
                @currentWord = ''
            else
                @currentWord += ch
                
            topToken = last @tokenStack
            
            if topToken?.class 
                if not topToken.name
                    if rest[0] == ':'
                        topToken.name = @lastWord
                if not topToken.codeBlock?.start
                    if rest[0] == ';'
                        @tokenStack.pop()
            else if topToken?.method
                if rest[0] == ';' and topToken.args.end
                    @result.funcs.push topToken
                    @tokenStack.pop()
                
            if empty(@regionStack) or last(@regionStack).region == 'codeBlock'
                
                if empty(@tokenStack) or last(@tokenStack).class
                    if match = rest.match @classRegExp
                        @tokenStack.push
                            line:    lineIndex
                            col:     p
                            class:   match[1]
                            depth:   @regionStack.length
                         
                if last(@tokenStack)?.class
                    if match = rest.match @methodRegExp
                        @tokenStack.push
                            line:    lineIndex
                            col:     p
                            method:  match[2]
                            depth:   @regionStack.length
                    else if match = rest.match @constrRegExp
                        if match[1] == last(@tokenStack)?.name
                            @tokenStack.push
                                line:    lineIndex
                                col:     p
                                method:  match[1]
                                depth:   @regionStack.length
            
            topRegion = last @regionStack
            
            if topRegion?.region == 'blockComment'
                if not rest.startsWith @regions.blockComment.close
                    rest = rest.slice 1
                    continue
            
            for key,region of @regions

                if rest.startsWith(region.open) and (not topRegion or region.open != region.close or topRegion.region != key)
                    
                    if topToken? and key == 'codeBlock' and @regionStack.length == topToken?.depth
                        topToken.codeBlock = 
                            start:
                                line:   lineIndex
                                col:    p
                        
                    if topToken?.method and not topToken.args and key == 'bracketArgs' and @regionStack.length == topToken?.depth
                        topToken.args = 
                            start:
                                line:   lineIndex
                                col:    p
                    
                    if key == 'lineComment'
                        return
                        
                    @regionStack.push
                        line:   lineIndex
                        col:    p
                        region: key
                        
                    break
                        
                else if region.close and rest.startsWith region.close
                    
                    poppedRegion = @regionStack.pop()
                    
                    if topToken? and key == 'codeBlock' and @regionStack.length == topToken?.depth
                        topToken.codeBlock.end = 
                            line:   lineIndex
                            col:    p
                        @tokenStack.pop()
                        if topToken.class
                            @result.classes.push topToken
                        else
                            @result.funcs.push topToken
                            
                    if topToken?.args?.start? and not topToken.args.end? and key == 'bracketArgs' and @regionStack.length == topToken?.depth
                        topToken.args.end = 
                            line:   lineIndex
                            col:    p
                        
                    break
                    
            rest = rest.slice 1
            
        true
            
    # 00000000    0000000   00000000    0000000  00000000       000000000  00000000  000   000  000000000  
    # 000   000  000   000  000   000  000       000               000     000        000 000      000     
    # 00000000   000000000  0000000    0000000   0000000           000     0000000     00000       000     
    # 000        000   000  000   000       000  000               000     000        000 000      000     
    # 000        000   000  000   000  0000000   00000000          000     00000000  000   000     000     
    
    parse: (text) ->
        
        @escapes = 0
        @regionStack = []
        @tokenStack  = []
        @lastWord = ''
        @currentWord = ''
        @result  = 
            classes: []
            funcs:   []

        lineStart = 0
        lineEnd   = 0
        lineIndex = 0
        lineText  = ''
            
        p = -1
        while p < text.length-1

            p += 1
            ch = text[p]
            
            if ch == '\n'
                @parseLine lineIndex, lineText
                lineIndex += 1
                lineText = ''
            else
                lineEnd += 1
                lineText += ch
                
        @parseLine lineIndex, lineText
        @result

module.exports = IndexHpp
