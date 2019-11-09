// koffee 1.4.0

/*
000  000   000  0000000    00000000  000   000        000   000  00000000   00000000
000  0000  000  000   000  000        000 000         000   000  000   000  000   000
000  000 0 000  000   000  0000000     00000          000000000  00000000   00000000
000  000  0000  000   000  000        000 000         000   000  000        000
000  000   000  0000000    00000000  000   000        000   000  000        000
 */
var IndexHpp, empty, last, ref,
    indexOf = [].indexOf;

ref = require('kxk'), empty = ref.empty, last = ref.last;

IndexHpp = (function() {
    function IndexHpp() {
        this.regions = {
            character: {
                open: "'",
                close: "'"
            },
            string: {
                open: '"',
                close: '"'
            },
            bracketArgs: {
                open: '(',
                close: ')'
            },
            bracketSquare: {
                open: '[',
                close: ']'
            },
            codeBlock: {
                open: '{',
                close: '}'
            },
            blockComment: {
                open: '/*',
                close: '*/'
            },
            lineComment: {
                open: '//',
                close: null
            }
        };
        this.classRegExp = /^\s*(\S+\s+)?(enum|enum\s+class|class|struct)\s+/;
        this.methodRegExp = /^([\w\&\*]+)\s+(\w+)\s*\(/;
        this.constrRegExp = /^(\~?\w+)\s*\(/;
        this.topMethRegExp = /^(\w+)\:\:(\w+)\s*\(/;
    }

    IndexHpp.prototype.parseLine = function(lineIndex, lineText) {
        var advance, ch, key, match, p, poppedRegion, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, region, rest, topRegion, topToken;
        if (!empty(this.currentWord)) {
            this.lastWord = this.currentWord;
        }
        this.currentWord = '';
        if (((ref1 = last(this.tokenStack)) != null ? ref1.classType : void 0) && !last(this.tokenStack).name) {
            if (this.lastWord.startsWith('>')) {
                this.tokenStack.pop();
            } else {
                last(this.tokenStack).name = this.lastWord;
            }
        }
        p = -1;
        rest = lineText;
        while (p < lineText.length - 1) {
            p += 1;
            ch = lineText[p];
            advance = function(n) {
                if (n > 1) {
                    p += n - 1;
                }
                return rest = rest.slice(n);
            };
            if (ch === ' ' || ch === '\t') {
                if (!empty(this.currentWord)) {
                    this.lastWord = this.currentWord;
                }
                this.currentWord = '';
            } else {
                this.currentWord += ch;
            }
            topToken = last(this.tokenStack);
            if (topToken != null ? topToken.classType : void 0) {
                if (!topToken.name) {
                    if (rest[0] === ':') {
                        topToken.name = this.lastWord;
                    }
                }
                if (!((ref2 = topToken.codeBlock) != null ? ref2.start : void 0)) {
                    if ((ref3 = rest[0]) === ';' || ref3 === '*' || ref3 === '&') {
                        this.tokenStack.pop();
                    }
                }
            } else if (topToken != null ? topToken.method : void 0) {
                if (rest[0] === ';' && topToken.args.end && (((ref4 = topToken.codeBlock) != null ? ref4.start : void 0) == null)) {
                    this.result.funcs.push(topToken);
                    this.tokenStack.pop();
                }
            }
            if (empty(this.regionStack) || last(this.regionStack).region === 'codeBlock') {
                if (empty(this.tokenStack) || last(this.tokenStack).classType) {
                    if (p === 0 && (match = lineText.match(this.classRegExp))) {
                        this.tokenStack.push({
                            line: lineIndex,
                            col: p,
                            classType: match[2],
                            depth: this.regionStack.length
                        });
                        advance(match[0].length);
                        this.currentWord = '';
                        continue;
                    }
                }
                if (empty(this.tokenStack)) {
                    if (empty(this.regionStack)) {
                        if (match = rest.match(this.topMethRegExp)) {
                            this.tokenStack.push({
                                line: lineIndex,
                                col: p,
                                "class": match[1],
                                method: match[2],
                                depth: 0
                            });
                            if (ref5 = match[1], indexOf.call(this.result.classes.map(function(ci) {
                                return ci.name;
                            }), ref5) < 0) {
                                this.result.classes.push({
                                    line: lineIndex,
                                    col: p,
                                    name: match[1]
                                });
                            }
                        }
                    }
                } else if (last(this.tokenStack).classType) {
                    if (match = rest.match(this.methodRegExp)) {
                        this.tokenStack.push({
                            line: lineIndex,
                            col: p,
                            method: match[2],
                            depth: this.regionStack.length,
                            "class": last(this.tokenStack).name
                        });
                    } else if (match = rest.match(this.constrRegExp)) {
                        if (match[1] === last(this.tokenStack).name || match[1] === '~' + last(this.tokenStack).name) {
                            this.tokenStack.push({
                                line: lineIndex,
                                col: p,
                                method: match[1],
                                depth: this.regionStack.length,
                                "class": last(this.tokenStack).name
                            });
                        }
                    }
                }
            }
            topRegion = last(this.regionStack);
            if ((ref6 = topRegion != null ? topRegion.region : void 0) === 'blockComment' || ref6 === 'string' || ref6 === 'character') {
                if ((ref7 = topRegion.region) === 'string' || ref7 === 'character') {
                    if (rest.startsWith('\\')) {
                        advance(2);
                        continue;
                    }
                }
                if (!rest.startsWith(this.regions[topRegion.region].close)) {
                    advance(1);
                    continue;
                }
            }
            ref8 = this.regions;
            for (key in ref8) {
                region = ref8[key];
                if (rest.startsWith(region.open) && (!topRegion || region.open !== region.close || topRegion.region !== key)) {
                    if ((topToken != null) && key === 'codeBlock' && this.regionStack.length === (topToken != null ? topToken.depth : void 0)) {
                        topToken.codeBlock = {
                            start: {
                                line: lineIndex,
                                col: p
                            }
                        };
                    }
                    if ((topToken != null ? topToken.method : void 0) && !topToken.args && key === 'bracketArgs' && this.regionStack.length === (topToken != null ? topToken.depth : void 0)) {
                        topToken.args = {
                            start: {
                                line: lineIndex,
                                col: p
                            }
                        };
                    }
                    if (key === 'lineComment') {
                        return;
                    }
                    this.regionStack.push({
                        line: lineIndex,
                        col: p,
                        region: key
                    });
                    break;
                } else if (region.close && rest.startsWith(region.close)) {
                    poppedRegion = this.regionStack.pop();
                    if ((topToken != null) && key === 'codeBlock' && this.regionStack.length === (topToken != null ? topToken.depth : void 0)) {
                        topToken.codeBlock.end = {
                            line: lineIndex,
                            col: p
                        };
                        this.tokenStack.pop();
                        if (topToken.classType) {
                            this.result.classes.push(topToken);
                        } else {
                            this.result.funcs.push(topToken);
                        }
                    }
                    if (((topToken != null ? (ref9 = topToken.args) != null ? ref9.start : void 0 : void 0) != null) && (topToken.args.end == null) && key === 'bracketArgs' && this.regionStack.length === (topToken != null ? topToken.depth : void 0)) {
                        topToken.args.end = {
                            line: lineIndex,
                            col: p
                        };
                    }
                    break;
                }
            }
            advance(1);
        }
        return true;
    };

    IndexHpp.prototype.parse = function(text) {
        var ch, lineEnd, lineIndex, lineStart, lineText, p;
        this.escapes = 0;
        this.regionStack = [];
        this.tokenStack = [];
        this.lastWord = '';
        this.currentWord = '';
        this.result = {
            classes: [],
            funcs: []
        };
        lineStart = 0;
        lineEnd = 0;
        lineIndex = 0;
        lineText = '';
        p = -1;
        while (p < text.length - 1) {
            p += 1;
            ch = text[p];
            if (ch === '\n') {
                this.parseLine(lineIndex, lineText);
                lineIndex += 1;
                lineText = '';
            } else {
                lineEnd += 1;
                lineText += ch;
            }
        }
        this.parseLine(lineIndex, lineText);
        return this.result;
    };

    return IndexHpp;

})();

module.exports = IndexHpp;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhocHAuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDBCQUFBO0lBQUE7O0FBUUEsTUFBa0IsT0FBQSxDQUFRLEtBQVIsQ0FBbEIsRUFBRSxpQkFBRixFQUFTOztBQUVIO0lBRUMsa0JBQUE7UUFFQyxJQUFDLENBQUEsT0FBRCxHQUNJO1lBQUEsU0FBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFBakI7WUFDQSxNQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxHQUFOO2dCQUFXLEtBQUEsRUFBTyxHQUFsQjthQURqQjtZQUVBLFdBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLEdBQU47Z0JBQVcsS0FBQSxFQUFPLEdBQWxCO2FBRmpCO1lBR0EsYUFBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFIakI7WUFJQSxTQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxHQUFOO2dCQUFXLEtBQUEsRUFBTyxHQUFsQjthQUpqQjtZQUtBLFlBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLElBQU47Z0JBQVcsS0FBQSxFQUFPLElBQWxCO2FBTGpCO1lBTUEsV0FBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sSUFBTjtnQkFBVyxLQUFBLEVBQU8sSUFBbEI7YUFOakI7O1FBUUosSUFBQyxDQUFBLFdBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLGFBQUQsR0FBaUI7SUFkbEI7O3VCQXNCSCxTQUFBLEdBQVcsU0FBQyxTQUFELEVBQVksUUFBWjtBQUVQLFlBQUE7UUFBQSxJQUE0QixDQUFJLEtBQUEsQ0FBTSxJQUFDLENBQUEsV0FBUCxDQUFoQztZQUFBLElBQUMsQ0FBQSxRQUFELEdB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Q2YsSUFBQyxDQUFBLE1BQUQsR0FDSTtZQUFBLE9BQUEsRUFBUyxFQUFUO1lBQ0EsS0FBQSxFQUFTLEVBRFQ7O1FBR0osU0FBQSxHQUFZO1FBQ1osT0FBQSxHQUFZO1FBQ1osU0FBQSxHQUFZO1FBQ1osUUFBQSxHQUFZO1FBRVosQ0FBQSxHQUFJLENBQUM7QUFDTCxlQUFNLENBQUEsR0FBSSxJQUFJLENBQUMsTUFBTCxHQUFZLENBQXRCO1lBRUksQ0FBQSxJQUFLO1lBQ0wsRUFBQSxHQUFLLElBQUssQ0FBQSxDQUFBO1lBRVYsSUFBRyxFQUFBLEtBQU0sSUFBVDtnQkFDSSxJQUFDLENBQUEsU0FBRCxDQUFXLFNBQVgsRUFBc0IsUUFBdEI7Z0JBQ0EsU0FBQSxJQUFhO2dCQUNiLFFBQUEsR0FBVyxHQUhmO2FBQUEsTUFBQTtnQkFLSSxPQUFBLElBQVc7Z0JBQ1gsUUFBQSxJQUFZLEdBTmhCOztRQUxKO1FBYUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxTQUFYLEVBQXNCLFFBQXRCO2VBQ0EsSUFBQyxDQUFBO0lBL0JFOzs7Ozs7QUFpQ1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4jIyNcblxueyBlbXB0eSwgbGFzdCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBJbmRleEhwcFxuXG4gICAgQDogLT5cblxuICAgICAgICBAcmVnaW9ucyA9XG4gICAgICAgICAgICBjaGFyYWN0ZXI6ICAgICAgIG9wZW46IFwiJ1wiICBjbG9zZTogXCInXCJcbiAgICAgICAgICAgIHN0cmluZzogICAgICAgICAgb3BlbjogJ1wiJyAgY2xvc2U6ICdcIidcbiAgICAgICAgICAgIGJyYWNrZXRBcmdzOiAgICAgb3BlbjogJygnICBjbG9zZTogJyknXG4gICAgICAgICAgICBicmFja2V0U3F1YXJlOiAgIG9wZW46ICdbJyAgY2xvc2U6ICddJ1xuICAgICAgICAgICAgY29kZUJsb2NrOiAgICAgICBvcGVuOiAneycgIGNsb3NlOiAnfSdcbiAgICAgICAgICAgIGJsb2NrQ29tbWVudDogICAgb3BlbjogJy8qJyBjbG9zZTogJyovJ1xuICAgICAgICAgICAgbGluZUNvbW1lbnQ6ICAgICBvcGVuOiAnLy8nIGNsb3NlOiBudWxsXG5cbiAgICAgICAgQGNsYXNzUmVnRXhwICAgPSAvXlxccyooXFxTK1xccyspPyhlbnVtfGVudW1cXHMrY2xhc3N8Y2xhc3N8c3RydWN0KVxccysvXG4gICAgICAgIEBtZXRob2RSZWdFeHAgID0gL14oW1xcd1xcJlxcKl0rKVxccysoXFx3KylcXHMqXFwoL1xuICAgICAgICBAY29uc3RyUmVnRXhwICA9IC9eKFxcfj9cXHcrKVxccypcXCgvXG4gICAgICAgIEB0b3BNZXRoUmVnRXhwID0gL14oXFx3KylcXDpcXDooXFx3KylcXHMqXFwoL1xuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgcGFyc2VMaW5lOiAobGluZUluZGV4LCBsaW5lVGV4dCkgLT5cblxuICAgICAgICBAbGFzdFdvcmQgPSBAY3VycmVudFdvcmQgaWYgbm90IGVtcHR5IEBjdXJyZW50V29yZFxuICAgICAgICBAY3VycmVudFdvcmQgPSAnJ1xuXG4gICAgICAgIGlmIGxhc3QoQHRva2VuU3RhY2spPy5jbGFzc1R5cGUgYW5kIG5vdCBsYXN0KEB0b2tlblN0YWNrKS5uYW1lXG4gICAgICAgICAgICBpZiBAbGFzdFdvcmQuc3RhcnRzV2l0aCAnPidcbiAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wb3AoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxhc3QoQHRva2VuU3RhY2spLm5hbWUgPSBAbGFzdFdvcmRcblxuICAgICAgICBwICAgID0gLTFcbiAgICAgICAgcmVzdCA9IGxpbmVUZXh0XG4gICAgICAgIHdoaWxlIHAgPCBsaW5lVGV4dC5sZW5ndGgtMVxuICAgICAgICAgICAgcCArPSAxXG4gICAgICAgICAgICBjaCA9IGxpbmVUZXh0W3BdXG5cbiAgICAgICAgICAgIGFkdmFuY2UgPSAobikgLT5cbiAgICAgICAgICAgICAgICBwICs9IG4tMSBpZiBuID4gMVxuICAgICAgICAgICAgICAgIHJlc3QgPSByZXN0LnNsaWNlIG5cblxuICAgICAgICAgICAgaWYgY2ggaW4gWycgJyAnXFx0J11cbiAgICAgICAgICAgICAgICBAbGFzdFdvcmQgPSBAY3VycmVudFdvcmQgaWYgbm90IGVtcHR5IEBjdXJyZW50V29yZFxuICAgICAgICAgICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRXb3JkICs9IGNoXG5cbiAgICAgICAgICAgIHRvcFRva2VuID0gbGFzdCBAdG9rZW5TdGFja1xuXG4gICAgICAgICAgICBpZiB0b3BUb2tlbj8uY2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgaWYgbm90IHRvcFRva2VuLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgcmVzdFswXSA9PSAnOidcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRva2VuLm5hbWUgPSBAbGFzdFdvcmRcbiAgICAgICAgICAgICAgICBpZiBub3QgdG9wVG9rZW4uY29kZUJsb2NrPy5zdGFydFxuICAgICAgICAgICAgICAgICAgICAjIGlmIHJlc3RbMF0gPT0gJzsnXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlc3RbMF0gaW4gWyc7JyAnKicgJyYnXVxuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucG9wKClcbiAgICAgICAgICAgIGVsc2UgaWYgdG9wVG9rZW4/Lm1ldGhvZFxuICAgICAgICAgICAgICAgIGlmIHJlc3RbMF0gPT0gJzsnIGFuZCB0b3BUb2tlbi5hcmdzLmVuZCBhbmQgbm90IHRvcFRva2VuLmNvZGVCbG9jaz8uc3RhcnQ/XG4gICAgICAgICAgICAgICAgICAgIEByZXN1bHQuZnVuY3MucHVzaCB0b3BUb2tlblxuICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wb3AoKVxuXG4gICAgICAgICAgICBpZiBlbXB0eShAcmVnaW9uU3RhY2spIG9yIGxhc3QoQHJlZ2lvblN0YWNrKS5yZWdpb24gPT0gJ2NvZGVCbG9jaydcblxuICAgICAgICAgICAgICAgIGlmIGVtcHR5KEB0b2tlblN0YWNrKSBvciBsYXN0KEB0b2tlblN0YWNrKS5jbGFzc1R5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgcCA9PSAwIGFuZCBtYXRjaCA9IGxpbmVUZXh0Lm1hdGNoIEBjbGFzc1JlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgICAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc1R5cGU6ICBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAgICAgIEByZWdpb25TdGFjay5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UgbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VycmVudFdvcmQgPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIGVtcHR5KEB0b2tlblN0YWNrKVxuICAgICAgICAgICAgICAgICAgICBpZiBlbXB0eSBAcmVnaW9uU3RhY2sgIyBuYW1lc3BhY2UgY29kZUJsb2Nrcz9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoID0gcmVzdC5tYXRjaCBAdG9wTWV0aFJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXB0aDogIDBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoWzFdIG5vdCBpbiBAcmVzdWx0LmNsYXNzZXMubWFwKChjaSkgLT4gY2kubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHJlc3VsdC5jbGFzc2VzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICAgbWF0Y2hbMV1cblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbGFzdChAdG9rZW5TdGFjaykuY2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoID0gcmVzdC5tYXRjaCBAbWV0aG9kUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogIG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6ICAgQHJlZ2lvblN0YWNrLmxlbmd0aCAjIHRva2VuU3RhY2subGVuZ3RoP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAgIGxhc3QoQHRva2VuU3RhY2spLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBtYXRjaCA9IHJlc3QubWF0Y2ggQGNvbnN0clJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2hbMV0gPT0gbGFzdChAdG9rZW5TdGFjaykubmFtZSBvciBtYXRjaFsxXSA9PSAnficrbGFzdChAdG9rZW5TdGFjaykubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6ICAgQHJlZ2lvblN0YWNrLmxlbmd0aCAjIHRva2VuU3RhY2subGVuZ3RoP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogICBsYXN0KEB0b2tlblN0YWNrKS5uYW1lXG5cbiAgICAgICAgICAgIHRvcFJlZ2lvbiA9IGxhc3QgQHJlZ2lvblN0YWNrXG5cbiAgICAgICAgICAgIGlmIHRvcFJlZ2lvbj8ucmVnaW9uIGluIFsnYmxvY2tDb21tZW50JyAnc3RyaW5nJyAnY2hhcmFjdGVyJ11cbiAgICAgICAgICAgICAgICBpZiB0b3BSZWdpb24ucmVnaW9uIGluIFsnc3RyaW5nJyAnY2hhcmFjdGVyJ11cbiAgICAgICAgICAgICAgICAgICAgaWYgcmVzdC5zdGFydHNXaXRoICdcXFxcJ1xuICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSAyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIGlmIG5vdCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnNbdG9wUmVnaW9uLnJlZ2lvbl0uY2xvc2VcbiAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSAxXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGZvciBrZXkscmVnaW9uIG9mIEByZWdpb25zXG5cbiAgICAgICAgICAgICAgICBpZiByZXN0LnN0YXJ0c1dpdGgocmVnaW9uLm9wZW4pIGFuZCAobm90IHRvcFJlZ2lvbiBvciByZWdpb24ub3BlbiAhPSByZWdpb24uY2xvc2Ugb3IgdG9wUmVnaW9uLnJlZ2lvbiAhPSBrZXkpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgdG9wVG9rZW4/IGFuZCBrZXkgPT0gJ2NvZGVCbG9jaycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5jb2RlQmxvY2sgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcblxuICAgICAgICAgICAgICAgICAgICBpZiB0b3BUb2tlbj8ubWV0aG9kIGFuZCBub3QgdG9wVG9rZW4uYXJncyBhbmQga2V5ID09ICdicmFja2V0QXJncycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5hcmdzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG5cbiAgICAgICAgICAgICAgICAgICAgaWYga2V5ID09ICdsaW5lQ29tbWVudCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICAgICAgIEByZWdpb25TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG4gICAgICAgICAgICAgICAgICAgICAgICByZWdpb246IGtleVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIHJlZ2lvbi5jbG9zZSBhbmQgcmVzdC5zdGFydHNXaXRoIHJlZ2lvbi5jbG9zZVxuXG4gICAgICAgICAgICAgICAgICAgIHBvcHBlZFJlZ2lvbiA9IEByZWdpb25TdGFjay5wb3AoKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuPyBhbmQga2V5ID09ICdjb2RlQmxvY2snIGFuZCBAcmVnaW9uU3RhY2subGVuZ3RoID09IHRvcFRva2VuPy5kZXB0aFxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wVG9rZW4uY29kZUJsb2NrLmVuZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0b3BUb2tlbi5jbGFzc1R5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcmVzdWx0LmNsYXNzZXMucHVzaCB0b3BUb2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEByZXN1bHQuZnVuY3MucHVzaCB0b3BUb2tlblxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuPy5hcmdzPy5zdGFydD8gYW5kIG5vdCB0b3BUb2tlbi5hcmdzLmVuZD8gYW5kIGtleSA9PSAnYnJhY2tldEFyZ3MnIGFuZCBAcmVnaW9uU3RhY2subGVuZ3RoID09IHRvcFRva2VuPy5kZXB0aFxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wVG9rZW4uYXJncy5lbmQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgYWR2YW5jZSAxXG5cbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgcGFyc2U6ICh0ZXh0KSAtPlxuXG4gICAgICAgIEBlc2NhcGVzID0gMFxuICAgICAgICBAcmVnaW9uU3RhY2sgPSBbXVxuICAgICAgICBAdG9rZW5TdGFjayAgPSBbXVxuICAgICAgICBAbGFzdFdvcmQgPSAnJ1xuICAgICAgICBAY3VycmVudFdvcmQgPSAnJ1xuICAgICAgICBAcmVzdWx0ICA9XG4gICAgICAgICAgICBjbGFzc2VzOiBbXVxuICAgICAgICAgICAgZnVuY3M6ICAgW11cblxuICAgICAgICBsaW5lU3RhcnQgPSAwXG4gICAgICAgIGxpbmVFbmQgICA9IDBcbiAgICAgICAgbGluZUluZGV4ID0gMFxuICAgICAgICBsaW5lVGV4dCAgPSAnJ1xuXG4gICAgICAgIHAgPSAtMVxuICAgICAgICB3aGlsZSBwIDwgdGV4dC5sZW5ndGgtMVxuXG4gICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgIGNoID0gdGV4dFtwXVxuXG4gICAgICAgICAgICBpZiBjaCA9PSAnXFxuJ1xuICAgICAgICAgICAgICAgIEBwYXJzZUxpbmUgbGluZUluZGV4LCBsaW5lVGV4dFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleCArPSAxXG4gICAgICAgICAgICAgICAgbGluZVRleHQgPSAnJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxpbmVFbmQgKz0gMVxuICAgICAgICAgICAgICAgIGxpbmVUZXh0ICs9IGNoXG5cbiAgICAgICAgQHBhcnNlTGluZSBsaW5lSW5kZXgsIGxpbmVUZXh0XG4gICAgICAgIEByZXN1bHRcblxubW9kdWxlLmV4cG9ydHMgPSBJbmRleEhwcFxuIl19
//# sourceURL=../../coffee/main/indexhpp.coffee