// koffee 1.4.0

/*
000  000   000  0000000    00000000  000   000        000   000  00000000   00000000
000  0000  000  000   000  000        000 000         000   000  000   000  000   000
000  000 0 000  000   000  0000000     00000          000000000  00000000   00000000
000  000  0000  000   000  000        000 000         000   000  000        000
000  000   000  0000000    00000000  000   000        000   000  000        000
 */
var IndexHpp, _, empty, first, last, ref,
    indexOf = [].indexOf;

ref = require('kxk'), empty = ref.empty, first = ref.first, last = ref.last, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhocHAuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG9DQUFBO0lBQUE7O0FBUUEsTUFBNEIsT0FBQSxDQUFRLEtBQVIsQ0FBNUIsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCOztBQUVoQjtJQUVDLGtCQUFBO1FBRUMsSUFBQyxDQUFBLE9BQUQsR0FDSTtZQUFBLFNBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLEdBQU47Z0JBQVcsS0FBQSxFQUFPLEdBQWxCO2FBQWpCO1lBQ0EsTUFBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFEakI7WUFFQSxXQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxHQUFOO2dCQUFXLEtBQUEsRUFBTyxHQUFsQjthQUZqQjtZQUdBLGFBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLEdBQU47Z0JBQVcsS0FBQSxFQUFPLEdBQWxCO2FBSGpCO1lBSUEsU0FBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFKakI7WUFLQSxZQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxJQUFOO2dCQUFXLEtBQUEsRUFBTyxJQUFsQjthQUxqQjtZQU1BLFdBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLElBQU47Z0JBQVcsS0FBQSxFQUFPLElBQWxCO2FBTmpCOztRQVFKLElBQUMsQ0FBQSxXQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxhQUFELEdBQWlCO0lBZGxCOzt1QkFzQkgsU0FBQSxHQUFXLFNBQUMsU0FBRCxFQUFZLFFBQVo7QUFFUCxZQUFBO1FBQUEsSUFBNEIsQ0FBSSxLQUFBLENBQU0sSUFBQyxDQUFBLFdBQVAsQ0FB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Q1osSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQ0k7WUFBQSxPQUFBLEVBQVMsRUFBVDtZQUNBLEtBQUEsRUFBUyxFQURUOztRQUdKLFNBQUEsR0FBWTtRQUNaLE9BQUEsR0FBWTtRQUNaLFNBQUEsR0FBWTtRQUNaLFFBQUEsR0FBWTtRQUVaLENBQUEsR0FBSSxDQUFDO0FBQ0wsZUFBTSxDQUFBLEdBQUksSUFBSSxDQUFDLE1BQUwsR0FBWSxDQUF0QjtZQUVJLENBQUEsSUFBSztZQUNMLEVBQUEsR0FBSyxJQUFLLENBQUEsQ0FBQTtZQUVWLElBQUcsRUFBQSxLQUFNLElBQVQ7Z0JBQ0ksSUFBQyxDQUFBLFNBQUQsQ0FBVyxTQUFYLEVBQXNCLFFBQXRCO2dCQUNBLFNBQUEsSUFBYTtnQkFDYixRQUFBLEdBQVcsR0FIZjthQUFBLE1BQUE7Z0JBS0ksT0FBQSxJQUFXO2dCQUNYLFFBQUEsSUFBWSxHQU5oQjs7UUFMSjtRQWFBLElBQUMsQ0FBQSxTQUFELENBQVcsU0FBWCxFQUFzQixRQUF0QjtlQUNBLElBQUMsQ0FBQTtJQS9CRTs7Ozs7O0FBaUNYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuIyMjXG5cbnsgZW1wdHksIGZpcnN0LCBsYXN0LCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEluZGV4SHBwXG5cbiAgICBAOiAtPlxuXG4gICAgICAgIEByZWdpb25zID1cbiAgICAgICAgICAgIGNoYXJhY3RlcjogICAgICAgb3BlbjogXCInXCIgIGNsb3NlOiBcIidcIlxuICAgICAgICAgICAgc3RyaW5nOiAgICAgICAgICBvcGVuOiAnXCInICBjbG9zZTogJ1wiJ1xuICAgICAgICAgICAgYnJhY2tldEFyZ3M6ICAgICBvcGVuOiAnKCcgIGNsb3NlOiAnKSdcbiAgICAgICAgICAgIGJyYWNrZXRTcXVhcmU6ICAgb3BlbjogJ1snICBjbG9zZTogJ10nXG4gICAgICAgICAgICBjb2RlQmxvY2s6ICAgICAgIG9wZW46ICd7JyAgY2xvc2U6ICd9J1xuICAgICAgICAgICAgYmxvY2tDb21tZW50OiAgICBvcGVuOiAnLyonIGNsb3NlOiAnKi8nXG4gICAgICAgICAgICBsaW5lQ29tbWVudDogICAgIG9wZW46ICcvLycgY2xvc2U6IG51bGxcblxuICAgICAgICBAY2xhc3NSZWdFeHAgICA9IC9eXFxzKihcXFMrXFxzKyk/KGVudW18ZW51bVxccytjbGFzc3xjbGFzc3xzdHJ1Y3QpXFxzKy9cbiAgICAgICAgQG1ldGhvZFJlZ0V4cCAgPSAvXihbXFx3XFwmXFwqXSspXFxzKyhcXHcrKVxccypcXCgvXG4gICAgICAgIEBjb25zdHJSZWdFeHAgID0gL14oXFx+P1xcdyspXFxzKlxcKC9cbiAgICAgICAgQHRvcE1ldGhSZWdFeHAgPSAvXihcXHcrKVxcOlxcOihcXHcrKVxccypcXCgvXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBwYXJzZUxpbmU6IChsaW5lSW5kZXgsIGxpbmVUZXh0KSAtPlxuXG4gICAgICAgIEBsYXN0V29yZCA9IEBjdXJyZW50V29yZCBpZiBub3QgZW1wdHkgQGN1cnJlbnRXb3JkXG4gICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG5cbiAgICAgICAgaWYgbGFzdChAdG9rZW5TdGFjayk/LmNsYXNzVHlwZSBhbmQgbm90IGxhc3QoQHRva2VuU3RhY2spLm5hbWVcbiAgICAgICAgICAgIGlmIEBsYXN0V29yZC5zdGFydHNXaXRoICc+J1xuICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnBvcCgpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbGFzdChAdG9rZW5TdGFjaykubmFtZSA9IEBsYXN0V29yZFxuXG4gICAgICAgIHAgICAgPSAtMVxuICAgICAgICByZXN0ID0gbGluZVRleHRcbiAgICAgICAgd2hpbGUgcCA8IGxpbmVUZXh0Lmxlbmd0aC0xXG4gICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgIGNoID0gbGluZVRleHRbcF1cblxuICAgICAgICAgICAgYWR2YW5jZSA9IChuKSAtPlxuICAgICAgICAgICAgICAgIHAgKz0gbi0xIGlmIG4gPiAxXG4gICAgICAgICAgICAgICAgcmVzdCA9IHJlc3Quc2xpY2UgblxuXG4gICAgICAgICAgICBpZiBjaCBpbiBbJyAnLCAnXFx0J11cbiAgICAgICAgICAgICAgICBAbGFzdFdvcmQgPSBAY3VycmVudFdvcmQgaWYgbm90IGVtcHR5IEBjdXJyZW50V29yZFxuICAgICAgICAgICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRXb3JkICs9IGNoXG5cbiAgICAgICAgICAgIHRvcFRva2VuID0gbGFzdCBAdG9rZW5TdGFja1xuXG4gICAgICAgICAgICBpZiB0b3BUb2tlbj8uY2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgaWYgbm90IHRvcFRva2VuLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgcmVzdFswXSA9PSAnOidcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRva2VuLm5hbWUgPSBAbGFzdFdvcmRcbiAgICAgICAgICAgICAgICBpZiBub3QgdG9wVG9rZW4uY29kZUJsb2NrPy5zdGFydFxuICAgICAgICAgICAgICAgICAgICAjIGlmIHJlc3RbMF0gPT0gJzsnXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlc3RbMF0gaW4gWyc7JywgJyonLCAnJiddXG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wb3AoKVxuICAgICAgICAgICAgZWxzZSBpZiB0b3BUb2tlbj8ubWV0aG9kXG4gICAgICAgICAgICAgICAgaWYgcmVzdFswXSA9PSAnOycgYW5kIHRvcFRva2VuLmFyZ3MuZW5kIGFuZCBub3QgdG9wVG9rZW4uY29kZUJsb2NrPy5zdGFydD9cbiAgICAgICAgICAgICAgICAgICAgQHJlc3VsdC5mdW5jcy5wdXNoIHRvcFRva2VuXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnBvcCgpXG5cbiAgICAgICAgICAgIGlmIGVtcHR5KEByZWdpb25TdGFjaykgb3IgbGFzdChAcmVnaW9uU3RhY2spLnJlZ2lvbiA9PSAnY29kZUJsb2NrJ1xuXG4gICAgICAgICAgICAgICAgaWYgZW1wdHkoQHRva2VuU3RhY2spIG9yIGxhc3QoQHRva2VuU3RhY2spLmNsYXNzVHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiBwID09IDAgYW5kIG1hdGNoID0gbGluZVRleHQubWF0Y2ggQGNsYXNzUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICAgICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzVHlwZTogIG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6ICAgICAgQHJlZ2lvblN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgZW1wdHkoQHRva2VuU3RhY2spXG4gICAgICAgICAgICAgICAgICAgIGlmIGVtcHR5IEByZWdpb25TdGFjayAjIG5hbWVzcGFjZSBjb2RlQmxvY2tzP1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2ggPSByZXN0Lm1hdGNoIEB0b3BNZXRoUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICBtYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAgMFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2hbMV0gbm90IGluIEByZXN1bHQuY2xhc3Nlcy5tYXAoKGNpKSAtPiBjaS5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcmVzdWx0LmNsYXNzZXMucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogICBtYXRjaFsxXVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBsYXN0KEB0b2tlblN0YWNrKS5jbGFzc1R5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2ggPSByZXN0Lm1hdGNoIEBtZXRob2RSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgICBwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAgbWF0Y2hbMl1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXB0aDogICBAcmVnaW9uU3RhY2subGVuZ3RoICMgdG9rZW5TdGFjay5sZW5ndGg/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICAgbGFzdChAdG9rZW5TdGFjaykubmFtZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG1hdGNoID0gcmVzdC5tYXRjaCBAY29uc3RyUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaFsxXSA9PSBsYXN0KEB0b2tlblN0YWNrKS5uYW1lIG9yIG1hdGNoWzFdID09ICd+JytsYXN0KEB0b2tlblN0YWNrKS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICBtYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXB0aDogICBAcmVnaW9uU3RhY2subGVuZ3RoICMgdG9rZW5TdGFjay5sZW5ndGg/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAgIGxhc3QoQHRva2VuU3RhY2spLm5hbWVcblxuICAgICAgICAgICAgdG9wUmVnaW9uID0gbGFzdCBAcmVnaW9uU3RhY2tcblxuICAgICAgICAgICAgaWYgdG9wUmVnaW9uPy5yZWdpb24gaW4gWydibG9ja0NvbW1lbnQnICdzdHJpbmcnICdjaGFyYWN0ZXInXVxuICAgICAgICAgICAgICAgIGlmIHRvcFJlZ2lvbi5yZWdpb24gaW4gWydzdHJpbmcnICdjaGFyYWN0ZXInXVxuICAgICAgICAgICAgICAgICAgICBpZiByZXN0LnN0YXJ0c1dpdGggJ1xcXFwnXG4gICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlIDJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgbm90IHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9uc1t0b3BSZWdpb24ucmVnaW9uXS5jbG9zZVxuICAgICAgICAgICAgICAgICAgICBhZHZhbmNlIDFcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgZm9yIGtleSxyZWdpb24gb2YgQHJlZ2lvbnNcblxuICAgICAgICAgICAgICAgIGlmIHJlc3Quc3RhcnRzV2l0aChyZWdpb24ub3BlbikgYW5kIChub3QgdG9wUmVnaW9uIG9yIHJlZ2lvbi5vcGVuICE9IHJlZ2lvbi5jbG9zZSBvciB0b3BSZWdpb24ucmVnaW9uICE9IGtleSlcblxuICAgICAgICAgICAgICAgICAgICBpZiB0b3BUb2tlbj8gYW5kIGtleSA9PSAnY29kZUJsb2NrJyBhbmQgQHJlZ2lvblN0YWNrLmxlbmd0aCA9PSB0b3BUb2tlbj8uZGVwdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRva2VuLmNvZGVCbG9jayA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgcFxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuPy5tZXRob2QgYW5kIG5vdCB0b3BUb2tlbi5hcmdzIGFuZCBrZXkgPT0gJ2JyYWNrZXRBcmdzJyBhbmQgQHJlZ2lvblN0YWNrLmxlbmd0aCA9PSB0b3BUb2tlbj8uZGVwdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRva2VuLmFyZ3MgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcblxuICAgICAgICAgICAgICAgICAgICBpZiBrZXkgPT0gJ2xpbmVDb21tZW50J1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgICAgICAgQHJlZ2lvblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lvbjoga2V5XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgcmVnaW9uLmNsb3NlIGFuZCByZXN0LnN0YXJ0c1dpdGggcmVnaW9uLmNsb3NlXG5cbiAgICAgICAgICAgICAgICAgICAgcG9wcGVkUmVnaW9uID0gQHJlZ2lvblN0YWNrLnBvcCgpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgdG9wVG9rZW4/IGFuZCBrZXkgPT0gJ2NvZGVCbG9jaycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5jb2RlQmxvY2suZW5kID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuLmNsYXNzVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEByZXN1bHQuY2xhc3Nlcy5wdXNoIHRvcFRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHJlc3VsdC5mdW5jcy5wdXNoIHRvcFRva2VuXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgdG9wVG9rZW4/LmFyZ3M/LnN0YXJ0PyBhbmQgbm90IHRvcFRva2VuLmFyZ3MuZW5kPyBhbmQga2V5ID09ICdicmFja2V0QXJncycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5hcmdzLmVuZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcblxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICBhZHZhbmNlIDFcblxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBwYXJzZTogKHRleHQpIC0+XG5cbiAgICAgICAgQGVzY2FwZXMgPSAwXG4gICAgICAgIEByZWdpb25TdGFjayA9IFtdXG4gICAgICAgIEB0b2tlblN0YWNrICA9IFtdXG4gICAgICAgIEBsYXN0V29yZCA9ICcnXG4gICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG4gICAgICAgIEByZXN1bHQgID1cbiAgICAgICAgICAgIGNsYXNzZXM6IFtdXG4gICAgICAgICAgICBmdW5jczogICBbXVxuXG4gICAgICAgIGxpbmVTdGFydCA9IDBcbiAgICAgICAgbGluZUVuZCAgID0gMFxuICAgICAgICBsaW5lSW5kZXggPSAwXG4gICAgICAgIGxpbmVUZXh0ICA9ICcnXG5cbiAgICAgICAgcCA9IC0xXG4gICAgICAgIHdoaWxlIHAgPCB0ZXh0Lmxlbmd0aC0xXG5cbiAgICAgICAgICAgIHAgKz0gMVxuICAgICAgICAgICAgY2ggPSB0ZXh0W3BdXG5cbiAgICAgICAgICAgIGlmIGNoID09ICdcXG4nXG4gICAgICAgICAgICAgICAgQHBhcnNlTGluZSBsaW5lSW5kZXgsIGxpbmVUZXh0XG4gICAgICAgICAgICAgICAgbGluZUluZGV4ICs9IDFcbiAgICAgICAgICAgICAgICBsaW5lVGV4dCA9ICcnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbGluZUVuZCArPSAxXG4gICAgICAgICAgICAgICAgbGluZVRleHQgKz0gY2hcblxuICAgICAgICBAcGFyc2VMaW5lIGxpbmVJbmRleCwgbGluZVRleHRcbiAgICAgICAgQHJlc3VsdFxuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGV4SHBwXG4iXX0=
//# sourceURL=../../coffee/main/indexhpp.coffee