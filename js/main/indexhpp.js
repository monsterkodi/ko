// koffee 1.6.0

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
        this.funcRegExp = /^(\w+)\s+(\w+)\s*\(/;
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
                        } else if (match = rest.match(this.funcRegExp)) {
                            this.tokenStack.push({
                                line: lineIndex,
                                col: p,
                                method: match[2],
                                name: match[2],
                                depth: 0,
                                "static": true
                            });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhocHAuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDBCQUFBO0lBQUE7O0FBUUEsTUFBa0IsT0FBQSxDQUFRLEtBQVIsQ0FBbEIsRUFBRSxpQkFBRixFQUFTOztBQUVIO0lBRUMsa0JBQUE7UUFFQyxJQUFDLENBQUEsT0FBRCxHQUNJO1lBQUEsU0FBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFBakI7WUFDQSxNQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxHQUFOO2dCQUFXLEtBQUEsRUFBTyxHQUFsQjthQURqQjtZQUVBLFdBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLEdBQU47Z0JBQVcsS0FBQSxFQUFPLEdBQWxCO2FBRmpCO1lBR0EsYUFBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFIakI7WUFJQSxTQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxHQUFOO2dCQUFXLEtBQUEsRUFBTyxHQUFsQjthQUpqQjtZQUtBLFlBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLElBQU47Z0JBQVcsS0FBQSxFQUFPLElBQWxCO2FBTGpCO1lBTUEsV0FBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sSUFBTjtnQkFBVyxLQUFBLEVBQU8sSUFBbEI7YUFOakI7O1FBUUosSUFBQyxDQUFBLFdBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLGFBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFVBQUQsR0FBaUI7SUFmbEI7O3VCQXVCSCxTQUFBLEdBQVcsU0FBQyxTQUFELEVBQVksUUFBWjtBQUVQLFlBQUE7UUFBQSxJQUE0QixDQUFJLEtBQUEsQ0FBTSxJQUFDLENBQUEsV0FBUCxD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QUNJLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBZCxHQUNJOzRCQUFBLElBQUEsRUFBUSxTQUFSOzRCQUNBLEdBQUEsRUFBUSxDQURSOzBCQUZSOztBQUtBLDBCQW5CQzs7QUExQlQ7WUErQ0EsT0FBQSxDQUFRLENBQVI7UUE3SUo7ZUErSUE7SUE1Sk87O3VCQW9LWCxLQUFBLEdBQU8sU0FBQyxJQUFEO0FBRUgsWUFBQTtRQUFBLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFDWCxJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLFVBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFDWixJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLE1BQUQsR0FDSTtZQUFBLE9BQUEsRUFBUyxFQUFUO1lBQ0EsS0FBQSxFQUFTLEVBRFQ7O1FBR0osU0FBQSxHQUFZO1FBQ1osT0FBQSxHQUFZO1FBQ1osU0FBQSxHQUFZO1FBQ1osUUFBQSxHQUFZO1FBRVosQ0FBQSxHQUFJLENBQUM7QUFDTCxlQUFNLENBQUEsR0FBSSxJQUFJLENBQUMsTUFBTCxHQUFZLENBQXRCO1lBRUksQ0FBQSxJQUFLO1lBQ0wsRUFBQSxHQUFLLElBQUssQ0FBQSxDQUFBO1lBRVYsSUFBRyxFQUFBLEtBQU0sSUFBVDtnQkFDSSxJQUFDLENBQUEsU0FBRCxDQUFXLFNBQVgsRUFBc0IsUUFBdEI7Z0JBQ0EsU0FBQSxJQUFhO2dCQUNiLFFBQUEsR0FBVyxHQUhmO2FBQUEsTUFBQTtnQkFLSSxPQUFBLElBQVc7Z0JBQ1gsUUFBQSxJQUFZLEdBTmhCOztRQUxKO1FBYUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxTQUFYLEVBQXNCLFFBQXRCO2VBQ0EsSUFBQyxDQUFBO0lBL0JFOzs7Ozs7QUFpQ1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4jIyNcblxueyBlbXB0eSwgbGFzdCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBJbmRleEhwcFxuXG4gICAgQDogLT5cblxuICAgICAgICBAcmVnaW9ucyA9XG4gICAgICAgICAgICBjaGFyYWN0ZXI6ICAgICAgIG9wZW46IFwiJ1wiICBjbG9zZTogXCInXCJcbiAgICAgICAgICAgIHN0cmluZzogICAgICAgICAgb3BlbjogJ1wiJyAgY2xvc2U6ICdcIidcbiAgICAgICAgICAgIGJyYWNrZXRBcmdzOiAgICAgb3BlbjogJygnICBjbG9zZTogJyknXG4gICAgICAgICAgICBicmFja2V0U3F1YXJlOiAgIG9wZW46ICdbJyAgY2xvc2U6ICddJ1xuICAgICAgICAgICAgY29kZUJsb2NrOiAgICAgICBvcGVuOiAneycgIGNsb3NlOiAnfSdcbiAgICAgICAgICAgIGJsb2NrQ29tbWVudDogICAgb3BlbjogJy8qJyBjbG9zZTogJyovJ1xuICAgICAgICAgICAgbGluZUNvbW1lbnQ6ICAgICBvcGVuOiAnLy8nIGNsb3NlOiBudWxsXG5cbiAgICAgICAgQGNsYXNzUmVnRXhwICAgPSAvXlxccyooXFxTK1xccyspPyhlbnVtfGVudW1cXHMrY2xhc3N8Y2xhc3N8c3RydWN0KVxccysvXG4gICAgICAgIEBtZXRob2RSZWdFeHAgID0gL14oW1xcd1xcJlxcKl0rKVxccysoXFx3KylcXHMqXFwoL1xuICAgICAgICBAY29uc3RyUmVnRXhwICA9IC9eKFxcfj9cXHcrKVxccypcXCgvXG4gICAgICAgIEB0b3BNZXRoUmVnRXhwID0gL14oXFx3KylcXDpcXDooXFx3KylcXHMqXFwoL1xuICAgICAgICBAZnVuY1JlZ0V4cCAgICA9IC9eKFxcdyspXFxzKyhcXHcrKVxccypcXCgvXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBwYXJzZUxpbmU6IChsaW5lSW5kZXgsIGxpbmVUZXh0KSAtPlxuXG4gICAgICAgIEBsYXN0V29yZCA9IEBjdXJyZW50V29yZCBpZiBub3QgZW1wdHkgQGN1cnJlbnRXb3JkXG4gICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG5cbiAgICAgICAgaWYgbGFzdChAdG9rZW5TdGFjayk/LmNsYXNzVHlwZSBhbmQgbm90IGxhc3QoQHRva2VuU3RhY2spLm5hbWVcbiAgICAgICAgICAgIGlmIEBsYXN0V29yZC5zdGFydHNXaXRoICc+J1xuICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnBvcCgpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbGFzdChAdG9rZW5TdGFjaykubmFtZSA9IEBsYXN0V29yZFxuXG4gICAgICAgIHAgICAgPSAtMVxuICAgICAgICByZXN0ID0gbGluZVRleHRcbiAgICAgICAgd2hpbGUgcCA8IGxpbmVUZXh0Lmxlbmd0aC0xXG4gICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgIGNoID0gbGluZVRleHRbcF1cblxuICAgICAgICAgICAgYWR2YW5jZSA9IChuKSAtPlxuICAgICAgICAgICAgICAgIHAgKz0gbi0xIGlmIG4gPiAxXG4gICAgICAgICAgICAgICAgcmVzdCA9IHJlc3Quc2xpY2UgblxuXG4gICAgICAgICAgICBpZiBjaCBpbiBbJyAnICdcXHQnXVxuICAgICAgICAgICAgICAgIEBsYXN0V29yZCA9IEBjdXJyZW50V29yZCBpZiBub3QgZW1wdHkgQGN1cnJlbnRXb3JkXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRXb3JkID0gJydcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY3VycmVudFdvcmQgKz0gY2hcblxuICAgICAgICAgICAgdG9wVG9rZW4gPSBsYXN0IEB0b2tlblN0YWNrXG5cbiAgICAgICAgICAgIGlmIHRvcFRva2VuPy5jbGFzc1R5cGVcbiAgICAgICAgICAgICAgICBpZiBub3QgdG9wVG9rZW4ubmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiByZXN0WzBdID09ICc6J1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wVG9rZW4ubmFtZSA9IEBsYXN0V29yZFxuICAgICAgICAgICAgICAgIGlmIG5vdCB0b3BUb2tlbi5jb2RlQmxvY2s/LnN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICMgaWYgcmVzdFswXSA9PSAnOydcbiAgICAgICAgICAgICAgICAgICAgaWYgcmVzdFswXSBpbiBbJzsnICcqJyAnJiddXG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wb3AoKVxuICAgICAgICAgICAgZWxzZSBpZiB0b3BUb2tlbj8ubWV0aG9kXG4gICAgICAgICAgICAgICAgaWYgcmVzdFswXSA9PSAnOycgYW5kIHRvcFRva2VuLmFyZ3MuZW5kIGFuZCBub3QgdG9wVG9rZW4uY29kZUJsb2NrPy5zdGFydD9cbiAgICAgICAgICAgICAgICAgICAgQHJlc3VsdC5mdW5jcy5wdXNoIHRvcFRva2VuXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnBvcCgpXG5cbiAgICAgICAgICAgIGlmIGVtcHR5KEByZWdpb25TdGFjaykgb3IgbGFzdChAcmVnaW9uU3RhY2spLnJlZ2lvbiA9PSAnY29kZUJsb2NrJ1xuXG4gICAgICAgICAgICAgICAgaWYgZW1wdHkoQHRva2VuU3RhY2spIG9yIGxhc3QoQHRva2VuU3RhY2spLmNsYXNzVHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiBwID09IDAgYW5kIG1hdGNoID0gbGluZVRleHQubWF0Y2ggQGNsYXNzUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICAgICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzVHlwZTogIG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6ICAgICAgQHJlZ2lvblN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgZW1wdHkoQHRva2VuU3RhY2spXG4gICAgICAgICAgICAgICAgICAgIGlmIGVtcHR5IEByZWdpb25TdGFjayAjIG5hbWVzcGFjZSBjb2RlQmxvY2tzP1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2ggPSByZXN0Lm1hdGNoIEB0b3BNZXRoUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICBtYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAgMFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2hbMV0gbm90IGluIEByZXN1bHQuY2xhc3Nlcy5tYXAoKGNpKSAtPiBjaS5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcmVzdWx0LmNsYXNzZXMucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogICBtYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBtYXRjaCA9IHJlc3QubWF0Y2ggQGZ1bmNSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICAgbWF0Y2hbMl1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6ICAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRpYzogdHJ1ZVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBsYXN0KEB0b2tlblN0YWNrKS5jbGFzc1R5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2ggPSByZXN0Lm1hdGNoIEBtZXRob2RSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgICBwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAgbWF0Y2hbMl1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXB0aDogICBAcmVnaW9uU3RhY2subGVuZ3RoICMgdG9rZW5TdGFjay5sZW5ndGg/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICAgbGFzdChAdG9rZW5TdGFjaykubmFtZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG1hdGNoID0gcmVzdC5tYXRjaCBAY29uc3RyUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaFsxXSA9PSBsYXN0KEB0b2tlblN0YWNrKS5uYW1lIG9yIG1hdGNoWzFdID09ICd+JytsYXN0KEB0b2tlblN0YWNrKS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICBtYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXB0aDogICBAcmVnaW9uU3RhY2subGVuZ3RoICMgdG9rZW5TdGFjay5sZW5ndGg/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAgIGxhc3QoQHRva2VuU3RhY2spLm5hbWVcblxuICAgICAgICAgICAgdG9wUmVnaW9uID0gbGFzdCBAcmVnaW9uU3RhY2tcblxuICAgICAgICAgICAgaWYgdG9wUmVnaW9uPy5yZWdpb24gaW4gWydibG9ja0NvbW1lbnQnICdzdHJpbmcnICdjaGFyYWN0ZXInXVxuICAgICAgICAgICAgICAgIGlmIHRvcFJlZ2lvbi5yZWdpb24gaW4gWydzdHJpbmcnICdjaGFyYWN0ZXInXVxuICAgICAgICAgICAgICAgICAgICBpZiByZXN0LnN0YXJ0c1dpdGggJ1xcXFwnXG4gICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlIDJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgbm90IHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9uc1t0b3BSZWdpb24ucmVnaW9uXS5jbG9zZVxuICAgICAgICAgICAgICAgICAgICBhZHZhbmNlIDFcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgZm9yIGtleSxyZWdpb24gb2YgQHJlZ2lvbnNcblxuICAgICAgICAgICAgICAgIGlmIHJlc3Quc3RhcnRzV2l0aChyZWdpb24ub3BlbikgYW5kIChub3QgdG9wUmVnaW9uIG9yIHJlZ2lvbi5vcGVuICE9IHJlZ2lvbi5jbG9zZSBvciB0b3BSZWdpb24ucmVnaW9uICE9IGtleSlcblxuICAgICAgICAgICAgICAgICAgICBpZiB0b3BUb2tlbj8gYW5kIGtleSA9PSAnY29kZUJsb2NrJyBhbmQgQHJlZ2lvblN0YWNrLmxlbmd0aCA9PSB0b3BUb2tlbj8uZGVwdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRva2VuLmNvZGVCbG9jayA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgcFxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuPy5tZXRob2QgYW5kIG5vdCB0b3BUb2tlbi5hcmdzIGFuZCBrZXkgPT0gJ2JyYWNrZXRBcmdzJyBhbmQgQHJlZ2lvblN0YWNrLmxlbmd0aCA9PSB0b3BUb2tlbj8uZGVwdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRva2VuLmFyZ3MgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcblxuICAgICAgICAgICAgICAgICAgICBpZiBrZXkgPT0gJ2xpbmVDb21tZW50J1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgICAgICAgQHJlZ2lvblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lvbjoga2V5XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgcmVnaW9uLmNsb3NlIGFuZCByZXN0LnN0YXJ0c1dpdGggcmVnaW9uLmNsb3NlXG5cbiAgICAgICAgICAgICAgICAgICAgcG9wcGVkUmVnaW9uID0gQHJlZ2lvblN0YWNrLnBvcCgpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgdG9wVG9rZW4/IGFuZCBrZXkgPT0gJ2NvZGVCbG9jaycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5jb2RlQmxvY2suZW5kID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuLmNsYXNzVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEByZXN1bHQuY2xhc3Nlcy5wdXNoIHRvcFRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHJlc3VsdC5mdW5jcy5wdXNoIHRvcFRva2VuXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgdG9wVG9rZW4/LmFyZ3M/LnN0YXJ0PyBhbmQgbm90IHRvcFRva2VuLmFyZ3MuZW5kPyBhbmQga2V5ID09ICdicmFja2V0QXJncycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5hcmdzLmVuZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcblxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICBhZHZhbmNlIDFcblxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBwYXJzZTogKHRleHQpIC0+XG5cbiAgICAgICAgQGVzY2FwZXMgPSAwXG4gICAgICAgIEByZWdpb25TdGFjayA9IFtdXG4gICAgICAgIEB0b2tlblN0YWNrICA9IFtdXG4gICAgICAgIEBsYXN0V29yZCA9ICcnXG4gICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG4gICAgICAgIEByZXN1bHQgID1cbiAgICAgICAgICAgIGNsYXNzZXM6IFtdXG4gICAgICAgICAgICBmdW5jczogICBbXVxuXG4gICAgICAgIGxpbmVTdGFydCA9IDBcbiAgICAgICAgbGluZUVuZCAgID0gMFxuICAgICAgICBsaW5lSW5kZXggPSAwXG4gICAgICAgIGxpbmVUZXh0ICA9ICcnXG5cbiAgICAgICAgcCA9IC0xXG4gICAgICAgIHdoaWxlIHAgPCB0ZXh0Lmxlbmd0aC0xXG5cbiAgICAgICAgICAgIHAgKz0gMVxuICAgICAgICAgICAgY2ggPSB0ZXh0W3BdXG5cbiAgICAgICAgICAgIGlmIGNoID09ICdcXG4nXG4gICAgICAgICAgICAgICAgQHBhcnNlTGluZSBsaW5lSW5kZXgsIGxpbmVUZXh0XG4gICAgICAgICAgICAgICAgbGluZUluZGV4ICs9IDFcbiAgICAgICAgICAgICAgICBsaW5lVGV4dCA9ICcnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbGluZUVuZCArPSAxXG4gICAgICAgICAgICAgICAgbGluZVRleHQgKz0gY2hcblxuICAgICAgICBAcGFyc2VMaW5lIGxpbmVJbmRleCwgbGluZVRleHRcbiAgICAgICAgQHJlc3VsdFxuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGV4SHBwXG4iXX0=
//# sourceURL=../../coffee/main/indexhpp.coffee