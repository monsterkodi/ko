###
000  000   000  0000000    00000000  000   000        000   000  00000000   00000000
000  0000  000  000   000  000        000 000         000   000  000   000  000   000
000  000 0 000  000   000  0000000     00000          000000000  00000000   00000000
000  000  0000  000   000  000        000 000         000   000  000        000
000  000   000  0000000    00000000  000   000        000   000  000        000
###

{ empty, last } = require 'kxk'

class IndexHpp

    @: ->

        @regions =
            character:       open: "'"  close: "'"
            string:          open: '"'  close: '"'
            bracketArgs:     open: '('  close: ')'
            bracketSquare:   open: '['  close: ']'
            codeBlock:       open: '{'  close: '}'
            blockComment:    open: '/*' close: '*/'
            lineComment:     open: '//' close: null

        @classRegExp   = /^\s*(\S+\s+)?(enum|enum\s+class|class|struct)\s+/
        @methodRegExp  = /^([\w\&\*]+)\s+(\w+)\s*\(/
        @constrRegExp  = /^(\~?\w+)\s*\(/
        @topMethRegExp = /^(\w+)\:\:(\w+)\s*\(/

    # 00000000    0000000   00000000    0000000  00000000       000      000  000   000  00000000
    # 000   000  000   000  000   000  000       000            000      000  0000  000  000
    # 00000000   000000000  0000000    0000000   0000000        000      000  000 0 000  0000000
    # 000        000   000  000   000       000  000            000      000  000  0000  000
    # 000        000   000  000   000  0000000   00000000       0000000  000  000   000  00000000

    parseLine: (lineIndex, lineText) ->

        @lastWord = @currentWord if not empty @currentWord
        @currentWord = ''

        if last(@tokenStack)?.classType and not last(@tokenStack).name
            if @lastWord.startsWith '>'
                @tokenStack.pop()
            else
                last(@tokenStack).name = @lastWord

        p    = -1
        rest = lineText
        while p < lineText.length-1
            p += 1
            ch = lineText[p]

            advance = (n) ->
                p += n-1 if n > 1
                rest = rest.slice n

            if ch in [' ' '\t']
                @lastWord = @currentWord if not empty @currentWord
                @currentWord = ''
            else
                @currentWord += ch

            topToken = last @tokenStack

            if topToken?.classType
                if not topToken.name
                    if rest[0] == ':'
                        topToken.name = @lastWord
                if not topToken.codeBlock?.start
                    # if rest[0] == ';'
                    if rest[0] in [';' '*' '&']
                        @tokenStack.pop()
            else if topToken?.method
                if rest[0] == ';' and topToken.args.end and not topToken.codeBlock?.start?
                    @result.funcs.push topToken
                    @tokenStack.pop()

            if empty(@regionStack) or last(@regionStack).region == 'codeBlock'

                if empty(@tokenStack) or last(@tokenStack).classType
                    if p == 0 and match = lineText.match @classRegExp
                        @tokenStack.push
                            line:       lineIndex
                            col:        p
                            classType:  match[2]
                            depth:      @regionStack.length
                        advance match[0].length
                        @currentWord = ''
                        continue

                if empty(@tokenStack)
                    if empty @regionStack # namespace codeBlocks?
                        if match = rest.match @topMethRegExp
                            @tokenStack.push
                                line:   lineIndex
                                col:    p
                                class:  match[1]
                                method: match[2]
                                depth:  0

                            if match[1] not in @result.classes.map((ci) -> ci.name)
                                @result.classes.push
                                    line:   lineIndex
                                    col:    p
                                    name:   match[1]

                else if last(@tokenStack).classType
                    if match = rest.match @methodRegExp
                        @tokenStack.push
                            line:    lineIndex
                            col:     p
                            method:  match[2]
                            depth:   @regionStack.length # tokenStack.length?
                            class:   last(@tokenStack).name
                    else if match = rest.match @constrRegExp
                        if match[1] == last(@tokenStack).name or match[1] == '~'+last(@tokenStack).name
                            @tokenStack.push
                                line:    lineIndex
                                col:     p
                                method:  match[1]
                                depth:   @regionStack.length # tokenStack.length?
                                class:   last(@tokenStack).name

            topRegion = last @regionStack

            if topRegion?.region in ['blockComment' 'string' 'character']
                if topRegion.region in ['string' 'character']
                    if rest.startsWith '\\'
                        advance 2
                        continue
                if not rest.startsWith @regions[topRegion.region].close
                    advance 1
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
                        if topToken.classType
                            @result.classes.push topToken
                        else
                            @result.funcs.push topToken

                    if topToken?.args?.start? and not topToken.args.end? and key == 'bracketArgs' and @regionStack.length == topToken?.depth
                        topToken.args.end =
                            line:   lineIndex
                            col:    p

                    break

            advance 1

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
