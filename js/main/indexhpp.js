// koffee 1.16.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhocHAuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL21haW4iLCJzb3VyY2VzIjpbImluZGV4aHBwLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwQkFBQTtJQUFBOztBQVFBLE1BQWtCLE9BQUEsQ0FBUSxLQUFSLENBQWxCLEVBQUUsaUJBQUYsRUFBUzs7QUFFSDtJQUVDLGtCQUFBO1FBRUMsSUFBQyxDQUFBLE9BQUQsR0FDSTtZQUFBLFNBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLEdBQU47Z0JBQVcsS0FBQSxFQUFPLEdBQWxCO2FBQWpCO1lBQ0EsTUFBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFEakI7WUFFQSxXQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxHQUFOO2dCQUFXLEtBQUEsRUFBTyxHQUFsQjthQUZqQjtZQUdBLGFBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLEdBQU47Z0JBQVcsS0FBQSxFQUFPLEdBQWxCO2FBSGpCO1lBSUEsU0FBQSxFQUFpQjtnQkFBQSxJQUFBLEVBQU0sR0FBTjtnQkFBVyxLQUFBLEVBQU8sR0FBbEI7YUFKakI7WUFLQSxZQUFBLEVBQWlCO2dCQUFBLElBQUEsRUFBTSxJQUFOO2dCQUFXLEtBQUEsRUFBTyxJQUFsQjthQUxqQjtZQU1BLFdBQUEsRUFBaUI7Z0JBQUEsSUFBQSxFQUFNLElBQU47Z0JBQVcsS0FBQSxFQUFPLElBQWxCO2FBTmpCOztRQVFKLElBQUMsQ0FBQSxXQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxhQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxVQUFELEdBQWlCO0lBZmxCOzt1QkF1QkgsU0FBQSxHQUFXLFNBQUMsU0FBRCxFQUFZLFFBQVo7QUFFUCxZQUFBO1FBQUEsSUFBNEIsQ0FBSSxLQUFBLENBQU0sSUFBQyxDQUFBLFdBQVAsQ0FBaEM7WUFBQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxZQUFiOztRQUNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixrREFBb0IsQ0FBRSxtQkFBbkIsSUFBaUMsQ0FBSSxJQUFBLENBQUssSUFBQyxDQUFBLFVBQU4sQ0FBaUIsQ0FBQyxJQUExRDtZQUNJLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQXFCLEdBQXJCLENBQUg7Z0JBQ0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQUEsRUFESjthQUFBLE1BQUE7Z0JBR0ksSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFOLENBQWlCLENBQUMsSUFBbEIsR0FBeUIsSUFBQyxDQUFBLFNBSDlCO2FBREo7O1FBTUEsQ0FBQSxHQUFPLENBQUM7UUFDUixJQUFBLEdBQU87QUFDUCxlQUFNLENBQUEsR0FBSSxRQUFRLENBQUMsTUFBVCxHQUFnQixDQUExQjtZQUNJLENBQUEsSUFBSztZQUNMLEVBQUEsR0FBSyxRQUFTLENBQUEsQ0FBQTtZQUVkLE9BQUEsR0FBVSxTQUFDLENBQUQ7Z0JBQ04sSUFBWSxDQUFBLEdBQUksQ0FBaEI7b0JBQUEsQ0FBQSxJQUFLLENBQUEsR0FBRSxFQUFQOzt1QkFDQSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYO1lBRkQ7WUFJVixJQUFHLEVBQUEsS0FBTyxHQUFQLElBQUEsRUFBQSxLQUFXLElBQWQ7Z0JBQ0ksSUFBNEIsQ0FBSSxLQUFBLENBQU0sSUFBQyxDQUFBLFdBQVAsQ0FBaEM7b0JBQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsWUFBYjs7Z0JBQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxHQUZuQjthQUFBLE1BQUE7Z0JBSUksSUFBQyxDQUFBLFdBQUQsSUFBZ0IsR0FKcEI7O1lBTUEsUUFBQSxHQUFXLElBQUEsQ0FBSyxJQUFDLENBQUEsVUFBTjtZQUVYLHVCQUFHLFFBQVEsQ0FBRSxrQkFBYjtnQkFDSSxJQUFHLENBQUksUUFBUSxDQUFDLElBQWhCO29CQUNJLElBQUcsSUFBSyxDQUFBLENBQUEsQ0FBTCxLQUFXLEdBQWQ7d0JBQ0ksUUFBUSxDQUFDLElBQVQsR0FBZ0IsSUFBQyxDQUFBLFNBRHJCO3FCQURKOztnQkFHQSxJQUFHLDRDQUFzQixDQUFFLGVBQTNCO29CQUVJLFlBQUcsSUFBSyxDQUFBLENBQUEsRUFBTCxLQUFZLEdBQVosSUFBQSxJQUFBLEtBQWdCLEdBQWhCLElBQUEsSUFBQSxLQUFvQixHQUF2Qjt3QkFDSSxJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBQSxFQURKO3FCQUZKO2lCQUpKO2FBQUEsTUFRSyx1QkFBRyxRQUFRLENBQUUsZUFBYjtnQkFDRCxJQUFHLElBQUssQ0FBQSxDQUFBLENBQUwsS0FBVyxHQUFYLElBQW1CLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBakMsSUFBNkMscUVBQWhEO29CQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQWQsQ0FBbUIsUUFBbkI7b0JBQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQUEsRUFGSjtpQkFEQzs7WUFLTCxJQUFHLEtBQUEsQ0FBTSxJQUFDLENBQUEsV0FBUCxDQUFBLElBQXVCLElBQUEsQ0FBSyxJQUFDLENBQUEsV0FBTixDQUFrQixDQUFDLE1BQW5CLEtBQTZCLFdBQXZEO2dCQUVJLElBQUcsS0FBQSxDQUFNLElBQUMsQ0FBQSxVQUFQLENBQUEsSUFBc0IsSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFOLENBQWlCLENBQUMsU0FBM0M7b0JBQ0ksSUFBRyxDQUFBLEtBQUssQ0FBTCxJQUFXLENBQUEsS0FBQSxHQUFRLFFBQVEsQ0FBQyxLQUFULENBQWUsSUFBQyxDQUFBLFdBQWhCLENBQVIsQ0FBZDt3QkFDSSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FDSTs0QkFBQSxJQUFBLEVBQVksU0FBWjs0QkFDQSxHQUFBLEVBQVksQ0FEWjs0QkFFQSxTQUFBLEVBQVksS0FBTSxDQUFBLENBQUEsQ0FGbEI7NEJBR0EsS0FBQSxFQUFZLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFIekI7eUJBREo7d0JBS0EsT0FBQSxDQUFRLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUFqQjt3QkFDQSxJQUFDLENBQUEsV0FBRCxHQUFlO0FBQ2YsaUNBUko7cUJBREo7O2dCQVdBLElBQUcsS0FBQSxDQUFNLElBQUMsQ0FBQSxVQUFQLENBQUg7b0JBQ0ksSUFBRyxLQUFBLENBQU0sSUFBQyxDQUFBLFdBQVAsQ0FBSDt3QkFDSSxJQUFHLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQUMsQ0FBQSxhQUFaLENBQVg7NEJBQ0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQ0k7Z0NBQUEsSUFBQSxFQUFRLFNBQVI7Z0NBQ0EsR0FBQSxFQUFRLENBRFI7Z0NBRUEsQ0FBQSxLQUFBLENBQUEsRUFBUSxLQUFNLENBQUEsQ0FBQSxDQUZkO2dDQUdBLE1BQUEsRUFBUSxLQUFNLENBQUEsQ0FBQSxDQUhkO2dDQUlBLEtBQUEsRUFBUSxDQUpSOzZCQURKOzRCQU9BLFdBQUcsS0FBTSxDQUFBLENBQUEsQ0FBTixFQUFBLGFBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQWhCLENBQW9CLFNBQUMsRUFBRDt1Q0FBUSxFQUFFLENBQUM7NEJBQVgsQ0FBcEIsQ0FBaEIsRUFBQSxJQUFBLEtBQUg7Z0NBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBaEIsQ0FDSTtvQ0FBQSxJQUFBLEVBQVEsU0FBUjtvQ0FDQSxHQUFBLEVBQVEsQ0FEUjtvQ0FFQSxJQUFBLEVBQVEsS0FBTSxDQUFBLENBQUEsQ0FGZDtpQ0FESixFQURKOzZCQVJKO3lCQUFBLE1BYUssSUFBRyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsVUFBWixDQUFYOzRCQUNELElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUNJO2dDQUFBLElBQUEsRUFBUSxTQUFSO2dDQUNBLEdBQUEsRUFBUSxDQURSO2dDQUVBLE1BQUEsRUFBUSxLQUFNLENBQUEsQ0FBQSxDQUZkO2dDQUdBLElBQUEsRUFBUSxLQUFNLENBQUEsQ0FBQSxDQUhkO2dDQUlBLEtBQUEsRUFBUSxDQUpSO2dDQUtBLENBQUEsTUFBQSxDQUFBLEVBQVEsSUFMUjs2QkFESixFQURDO3lCQWRUO3FCQURKO2lCQUFBLE1Bd0JLLElBQUcsSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFOLENBQWlCLENBQUMsU0FBckI7b0JBQ0QsSUFBRyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsWUFBWixDQUFYO3dCQUNJLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUNJOzRCQUFBLElBQUEsRUFBUyxTQUFUOzRCQUNBLEdBQUEsRUFBUyxDQURUOzRCQUVBLE1BQUEsRUFBUyxLQUFNLENBQUEsQ0FBQSxDQUZmOzRCQUdBLEtBQUEsRUFBUyxJQUFDLENBQUEsV0FBVyxDQUFDLE1BSHRCOzRCQUlBLENBQUEsS0FBQSxDQUFBLEVBQVMsSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFOLENBQWlCLENBQUMsSUFKM0I7eUJBREosRUFESjtxQkFBQSxNQU9LLElBQUcsS0FBQSxHQUFRLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQyxDQUFBLFlBQVosQ0FBWDt3QkFDRCxJQUFHLEtBQU0sQ0FBQSxDQUFBLENBQU4sS0FBWSxJQUFBLENBQUssSUFBQyxDQUFBLFVBQU4sQ0FBaUIsQ0FBQyxJQUE5QixJQUFzQyxLQUFNLENBQUEsQ0FBQSxDQUFOLEtBQVksR0FBQSxHQUFJLElBQUEsQ0FBSyxJQUFDLENBQUEsVUFBTixDQUFpQixDQUFDLElBQTNFOzRCQUNJLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUNJO2dDQUFBLElBQUEsRUFBUyxTQUFUO2dDQUNBLEdBQUEsRUFBUyxDQURUO2dDQUVBLE1BQUEsRUFBUyxLQUFNLENBQUEsQ0FBQSxDQUZmO2dDQUdBLEtBQUEsRUFBUyxJQUFDLENBQUEsV0FBVyxDQUFDLE1BSHRCO2dDQUlBLENBQUEsS0FBQSxDQUFBLEVBQVMsSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFOLENBQWlCLENBQUMsSUFKM0I7NkJBREosRUFESjt5QkFEQztxQkFSSjtpQkFyQ1Q7O1lBc0RBLFNBQUEsR0FBWSxJQUFBLENBQUssSUFBQyxDQUFBLFdBQU47WUFFWixnQ0FBRyxTQUFTLENBQUUsZ0JBQVgsS0FBc0IsY0FBdEIsSUFBQSxJQUFBLEtBQXFDLFFBQXJDLElBQUEsSUFBQSxLQUE4QyxXQUFqRDtnQkFDSSxZQUFHLFNBQVMsQ0FBQyxPQUFWLEtBQXFCLFFBQXJCLElBQUEsSUFBQSxLQUE4QixXQUFqQztvQkFDSSxJQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLElBQWhCLENBQUg7d0JBQ0ksT0FBQSxDQUFRLENBQVI7QUFDQSxpQ0FGSjtxQkFESjs7Z0JBSUEsSUFBRyxDQUFJLElBQUksQ0FBQyxVQUFMLENBQWdCLElBQUMsQ0FBQSxPQUFRLENBQUEsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsQ0FBQyxLQUEzQyxDQUFQO29CQUNJLE9BQUEsQ0FBUSxDQUFSO0FBQ0EsNkJBRko7aUJBTEo7O0FBU0E7QUFBQSxpQkFBQSxXQUFBOztnQkFFSSxJQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLE1BQU0sQ0FBQyxJQUF2QixDQUFBLElBQWlDLENBQUMsQ0FBSSxTQUFKLElBQWlCLE1BQU0sQ0FBQyxJQUFQLEtBQWUsTUFBTSxDQUFDLEtBQXZDLElBQWdELFNBQVMsQ0FBQyxNQUFWLEtBQW9CLEdBQXJFLENBQXBDO29CQUVJLElBQUcsa0JBQUEsSUFBYyxHQUFBLEtBQU8sV0FBckIsSUFBcUMsSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFiLHlCQUF1QixRQUFRLENBQUUsZUFBekU7d0JBQ0ksUUFBUSxDQUFDLFNBQVQsR0FDSTs0QkFBQSxLQUFBLEVBQ0k7Z0NBQUEsSUFBQSxFQUFRLFNBQVI7Z0NBQ0EsR0FBQSxFQUFRLENBRFI7NkJBREo7MEJBRlI7O29CQU1BLHdCQUFHLFFBQVEsQ0FBRSxnQkFBVixJQUFxQixDQUFJLFFBQVEsQ0FBQyxJQUFsQyxJQUEyQyxHQUFBLEtBQU8sYUFBbEQsSUFBb0UsSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFiLHlCQUF1QixRQUFRLENBQUUsZUFBeEc7d0JBQ0ksUUFBUSxDQUFDLElBQVQsR0FDSTs0QkFBQSxLQUFBLEVBQ0k7Z0NBQUEsSUFBQSxFQUFRLFNBQVI7Z0NBQ0EsR0FBQSxFQUFRLENBRFI7NkJBREo7MEJBRlI7O29CQU1BLElBQUcsR0FBQSxLQUFPLGFBQVY7QUFDSSwrQkFESjs7b0JBR0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQ0k7d0JBQUEsSUFBQSxFQUFRLFNBQVI7d0JBQ0EsR0FBQSxFQUFRLENBRFI7d0JBRUEsTUFBQSxFQUFRLEdBRlI7cUJBREo7QUFLQSwwQkF0Qko7aUJBQUEsTUF3QkssSUFBRyxNQUFNLENBQUMsS0FBUCxJQUFpQixJQUFJLENBQUMsVUFBTCxDQUFnQixNQUFNLENBQUMsS0FBdkIsQ0FBcEI7b0JBRUQsWUFBQSxHQUFlLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFBO29CQUVmLElBQUcsa0JBQUEsSUFBYyxHQUFBLEtBQU8sV0FBckIsSUFBcUMsSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFiLHlCQUF1QixRQUFRLENBQUUsZUFBekU7d0JBQ0ksUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFuQixHQUNJOzRCQUFBLElBQUEsRUFBUSxTQUFSOzRCQUNBLEdBQUEsRUFBUSxDQURSOzt3QkFFSixJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBQTt3QkFDQSxJQUFHLFFBQVEsQ0FBQyxTQUFaOzRCQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQWhCLENBQXFCLFFBQXJCLEVBREo7eUJBQUEsTUFBQTs0QkFHSSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFkLENBQW1CLFFBQW5CLEVBSEo7eUJBTEo7O29CQVVBLElBQUcsNEZBQUEsSUFBK0IsMkJBQS9CLElBQXNELEdBQUEsS0FBTyxhQUE3RCxJQUErRSxJQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIseUJBQXVCLFFBQVEsQ0FBRSxlQUFuSDt3QkFDSSxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQWQsR0FDSTs0QkFBQSxJQUFBLEVBQVEsU0FBUjs0QkFDQSxHQUFBLEVBQVEsQ0FEUjswQkFGUjs7QUFLQSwwQkFuQkM7O0FBMUJUO1lBK0NBLE9BQUEsQ0FBUSxDQUFSO1FBN0lKO2VBK0lBO0lBNUpPOzt1QkFvS1gsS0FBQSxHQUFPLFNBQUMsSUFBRDtBQUVILFlBQUE7UUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXO1FBQ1gsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxVQUFELEdBQWU7UUFDZixJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQ0k7WUFBQSxPQUFBLEVBQVMsRUFBVDtZQUNBLEtBQUEsRUFBUyxFQURUOztRQUdKLFNBQUEsR0FBWTtRQUNaLE9BQUEsR0FBWTtRQUNaLFNBQUEsR0FBWTtRQUNaLFFBQUEsR0FBWTtRQUVaLENBQUEsR0FBSSxDQUFDO0FBQ0wsZUFBTSxDQUFBLEdBQUksSUFBSSxDQUFDLE1BQUwsR0FBWSxDQUF0QjtZQUVJLENBQUEsSUFBSztZQUNMLEVBQUEsR0FBSyxJQUFLLENBQUEsQ0FBQTtZQUVWLElBQUcsRUFBQSxLQUFNLElBQVQ7Z0JBQ0ksSUFBQyxDQUFBLFNBQUQsQ0FBVyxTQUFYLEVBQXNCLFFBQXRCO2dCQUNBLFNBQUEsSUFBYTtnQkFDYixRQUFBLEdBQVcsR0FIZjthQUFBLE1BQUE7Z0JBS0ksT0FBQSxJQUFXO2dCQUNYLFFBQUEsSUFBWSxHQU5oQjs7UUFMSjtRQWFBLElBQUMsQ0FBQSxTQUFELENBQVcsU0FBWCxFQUFzQixRQUF0QjtlQUNBLElBQUMsQ0FBQTtJQS9CRTs7Ozs7O0FBaUNYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuIyMjXG5cbnsgZW1wdHksIGxhc3QgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgSW5kZXhIcHBcblxuICAgIEA6IC0+XG5cbiAgICAgICAgQHJlZ2lvbnMgPVxuICAgICAgICAgICAgY2hhcmFjdGVyOiAgICAgICBvcGVuOiBcIidcIiAgY2xvc2U6IFwiJ1wiXG4gICAgICAgICAgICBzdHJpbmc6ICAgICAgICAgIG9wZW46ICdcIicgIGNsb3NlOiAnXCInXG4gICAgICAgICAgICBicmFja2V0QXJnczogICAgIG9wZW46ICcoJyAgY2xvc2U6ICcpJ1xuICAgICAgICAgICAgYnJhY2tldFNxdWFyZTogICBvcGVuOiAnWycgIGNsb3NlOiAnXSdcbiAgICAgICAgICAgIGNvZGVCbG9jazogICAgICAgb3BlbjogJ3snICBjbG9zZTogJ30nXG4gICAgICAgICAgICBibG9ja0NvbW1lbnQ6ICAgIG9wZW46ICcvKicgY2xvc2U6ICcqLydcbiAgICAgICAgICAgIGxpbmVDb21tZW50OiAgICAgb3BlbjogJy8vJyBjbG9zZTogbnVsbFxuXG4gICAgICAgIEBjbGFzc1JlZ0V4cCAgID0gL15cXHMqKFxcUytcXHMrKT8oZW51bXxlbnVtXFxzK2NsYXNzfGNsYXNzfHN0cnVjdClcXHMrL1xuICAgICAgICBAbWV0aG9kUmVnRXhwICA9IC9eKFtcXHdcXCZcXCpdKylcXHMrKFxcdyspXFxzKlxcKC9cbiAgICAgICAgQGNvbnN0clJlZ0V4cCAgPSAvXihcXH4/XFx3KylcXHMqXFwoL1xuICAgICAgICBAdG9wTWV0aFJlZ0V4cCA9IC9eKFxcdyspXFw6XFw6KFxcdyspXFxzKlxcKC9cbiAgICAgICAgQGZ1bmNSZWdFeHAgICAgPSAvXihcXHcrKVxccysoXFx3KylcXHMqXFwoL1xuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgcGFyc2VMaW5lOiAobGluZUluZGV4LCBsaW5lVGV4dCkgLT5cblxuICAgICAgICBAbGFzdFdvcmQgPSBAY3VycmVudFdvcmQgaWYgbm90IGVtcHR5IEBjdXJyZW50V29yZFxuICAgICAgICBAY3VycmVudFdvcmQgPSAnJ1xuXG4gICAgICAgIGlmIGxhc3QoQHRva2VuU3RhY2spPy5jbGFzc1R5cGUgYW5kIG5vdCBsYXN0KEB0b2tlblN0YWNrKS5uYW1lXG4gICAgICAgICAgICBpZiBAbGFzdFdvcmQuc3RhcnRzV2l0aCAnPidcbiAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wb3AoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxhc3QoQHRva2VuU3RhY2spLm5hbWUgPSBAbGFzdFdvcmRcblxuICAgICAgICBwICAgID0gLTFcbiAgICAgICAgcmVzdCA9IGxpbmVUZXh0XG4gICAgICAgIHdoaWxlIHAgPCBsaW5lVGV4dC5sZW5ndGgtMVxuICAgICAgICAgICAgcCArPSAxXG4gICAgICAgICAgICBjaCA9IGxpbmVUZXh0W3BdXG5cbiAgICAgICAgICAgIGFkdmFuY2UgPSAobikgLT5cbiAgICAgICAgICAgICAgICBwICs9IG4tMSBpZiBuID4gMVxuICAgICAgICAgICAgICAgIHJlc3QgPSByZXN0LnNsaWNlIG5cblxuICAgICAgICAgICAgaWYgY2ggaW4gWycgJyAnXFx0J11cbiAgICAgICAgICAgICAgICBAbGFzdFdvcmQgPSBAY3VycmVudFdvcmQgaWYgbm90IGVtcHR5IEBjdXJyZW50V29yZFxuICAgICAgICAgICAgICAgIEBjdXJyZW50V29yZCA9ICcnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRXb3JkICs9IGNoXG5cbiAgICAgICAgICAgIHRvcFRva2VuID0gbGFzdCBAdG9rZW5TdGFja1xuXG4gICAgICAgICAgICBpZiB0b3BUb2tlbj8uY2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgaWYgbm90IHRvcFRva2VuLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgcmVzdFswXSA9PSAnOidcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRva2VuLm5hbWUgPSBAbGFzdFdvcmRcbiAgICAgICAgICAgICAgICBpZiBub3QgdG9wVG9rZW4uY29kZUJsb2NrPy5zdGFydFxuICAgICAgICAgICAgICAgICAgICAjIGlmIHJlc3RbMF0gPT0gJzsnXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlc3RbMF0gaW4gWyc7JyAnKicgJyYnXVxuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucG9wKClcbiAgICAgICAgICAgIGVsc2UgaWYgdG9wVG9rZW4/Lm1ldGhvZFxuICAgICAgICAgICAgICAgIGlmIHJlc3RbMF0gPT0gJzsnIGFuZCB0b3BUb2tlbi5hcmdzLmVuZCBhbmQgbm90IHRvcFRva2VuLmNvZGVCbG9jaz8uc3RhcnQ/XG4gICAgICAgICAgICAgICAgICAgIEByZXN1bHQuZnVuY3MucHVzaCB0b3BUb2tlblxuICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wb3AoKVxuXG4gICAgICAgICAgICBpZiBlbXB0eShAcmVnaW9uU3RhY2spIG9yIGxhc3QoQHJlZ2lvblN0YWNrKS5yZWdpb24gPT0gJ2NvZGVCbG9jaydcblxuICAgICAgICAgICAgICAgIGlmIGVtcHR5KEB0b2tlblN0YWNrKSBvciBsYXN0KEB0b2tlblN0YWNrKS5jbGFzc1R5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgcCA9PSAwIGFuZCBtYXRjaCA9IGxpbmVUZXh0Lm1hdGNoIEBjbGFzc1JlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgICAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc1R5cGU6ICBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAgICAgIEByZWdpb25TdGFjay5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UgbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VycmVudFdvcmQgPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIGVtcHR5KEB0b2tlblN0YWNrKVxuICAgICAgICAgICAgICAgICAgICBpZiBlbXB0eSBAcmVnaW9uU3RhY2sgIyBuYW1lc3BhY2UgY29kZUJsb2Nrcz9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoID0gcmVzdC5tYXRjaCBAdG9wTWV0aFJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXB0aDogIDBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoWzFdIG5vdCBpbiBAcmVzdWx0LmNsYXNzZXMubWFwKChjaSkgLT4gY2kubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHJlc3VsdC5jbGFzc2VzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICAgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgbWF0Y2ggPSByZXN0Lm1hdGNoIEBmdW5jUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuU3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAgIG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAgMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0aWM6IHRydWVcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbGFzdChAdG9rZW5TdGFjaykuY2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoID0gcmVzdC5tYXRjaCBAbWV0aG9kUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICAgcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogIG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6ICAgQHJlZ2lvblN0YWNrLmxlbmd0aCAjIHRva2VuU3RhY2subGVuZ3RoP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAgIGxhc3QoQHRva2VuU3RhY2spLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBtYXRjaCA9IHJlc3QubWF0Y2ggQGNvbnN0clJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2hbMV0gPT0gbGFzdChAdG9rZW5TdGFjaykubmFtZSBvciBtYXRjaFsxXSA9PSAnficrbGFzdChAdG9rZW5TdGFjaykubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6ICAgQHJlZ2lvblN0YWNrLmxlbmd0aCAjIHRva2VuU3RhY2subGVuZ3RoP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogICBsYXN0KEB0b2tlblN0YWNrKS5uYW1lXG5cbiAgICAgICAgICAgIHRvcFJlZ2lvbiA9IGxhc3QgQHJlZ2lvblN0YWNrXG5cbiAgICAgICAgICAgIGlmIHRvcFJlZ2lvbj8ucmVnaW9uIGluIFsnYmxvY2tDb21tZW50JyAnc3RyaW5nJyAnY2hhcmFjdGVyJ11cbiAgICAgICAgICAgICAgICBpZiB0b3BSZWdpb24ucmVnaW9uIGluIFsnc3RyaW5nJyAnY2hhcmFjdGVyJ11cbiAgICAgICAgICAgICAgICAgICAgaWYgcmVzdC5zdGFydHNXaXRoICdcXFxcJ1xuICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSAyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIGlmIG5vdCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnNbdG9wUmVnaW9uLnJlZ2lvbl0uY2xvc2VcbiAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSAxXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGZvciBrZXkscmVnaW9uIG9mIEByZWdpb25zXG5cbiAgICAgICAgICAgICAgICBpZiByZXN0LnN0YXJ0c1dpdGgocmVnaW9uLm9wZW4pIGFuZCAobm90IHRvcFJlZ2lvbiBvciByZWdpb24ub3BlbiAhPSByZWdpb24uY2xvc2Ugb3IgdG9wUmVnaW9uLnJlZ2lvbiAhPSBrZXkpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgdG9wVG9rZW4/IGFuZCBrZXkgPT0gJ2NvZGVCbG9jaycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5jb2RlQmxvY2sgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcblxuICAgICAgICAgICAgICAgICAgICBpZiB0b3BUb2tlbj8ubWV0aG9kIGFuZCBub3QgdG9wVG9rZW4uYXJncyBhbmQga2V5ID09ICdicmFja2V0QXJncycgYW5kIEByZWdpb25TdGFjay5sZW5ndGggPT0gdG9wVG9rZW4/LmRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BUb2tlbi5hcmdzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG5cbiAgICAgICAgICAgICAgICAgICAgaWYga2V5ID09ICdsaW5lQ29tbWVudCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICAgICAgIEByZWdpb25TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG4gICAgICAgICAgICAgICAgICAgICAgICByZWdpb246IGtleVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIHJlZ2lvbi5jbG9zZSBhbmQgcmVzdC5zdGFydHNXaXRoIHJlZ2lvbi5jbG9zZVxuXG4gICAgICAgICAgICAgICAgICAgIHBvcHBlZFJlZ2lvbiA9IEByZWdpb25TdGFjay5wb3AoKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuPyBhbmQga2V5ID09ICdjb2RlQmxvY2snIGFuZCBAcmVnaW9uU3RhY2subGVuZ3RoID09IHRvcFRva2VuPy5kZXB0aFxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wVG9rZW4uY29kZUJsb2NrLmVuZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICBsaW5lSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2w6ICAgIHBcbiAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlblN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0b3BUb2tlbi5jbGFzc1R5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcmVzdWx0LmNsYXNzZXMucHVzaCB0b3BUb2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEByZXN1bHQuZnVuY3MucHVzaCB0b3BUb2tlblxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcFRva2VuPy5hcmdzPy5zdGFydD8gYW5kIG5vdCB0b3BUb2tlbi5hcmdzLmVuZD8gYW5kIGtleSA9PSAnYnJhY2tldEFyZ3MnIGFuZCBAcmVnaW9uU3RhY2subGVuZ3RoID09IHRvcFRva2VuPy5kZXB0aFxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wVG9rZW4uYXJncy5lbmQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sOiAgICBwXG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgYWR2YW5jZSAxXG5cbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgcGFyc2U6ICh0ZXh0KSAtPlxuXG4gICAgICAgIEBlc2NhcGVzID0gMFxuICAgICAgICBAcmVnaW9uU3RhY2sgPSBbXVxuICAgICAgICBAdG9rZW5TdGFjayAgPSBbXVxuICAgICAgICBAbGFzdFdvcmQgPSAnJ1xuICAgICAgICBAY3VycmVudFdvcmQgPSAnJ1xuICAgICAgICBAcmVzdWx0ICA9XG4gICAgICAgICAgICBjbGFzc2VzOiBbXVxuICAgICAgICAgICAgZnVuY3M6ICAgW11cblxuICAgICAgICBsaW5lU3RhcnQgPSAwXG4gICAgICAgIGxpbmVFbmQgICA9IDBcbiAgICAgICAgbGluZUluZGV4ID0gMFxuICAgICAgICBsaW5lVGV4dCAgPSAnJ1xuXG4gICAgICAgIHAgPSAtMVxuICAgICAgICB3aGlsZSBwIDwgdGV4dC5sZW5ndGgtMVxuXG4gICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgIGNoID0gdGV4dFtwXVxuXG4gICAgICAgICAgICBpZiBjaCA9PSAnXFxuJ1xuICAgICAgICAgICAgICAgIEBwYXJzZUxpbmUgbGluZUluZGV4LCBsaW5lVGV4dFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleCArPSAxXG4gICAgICAgICAgICAgICAgbGluZVRleHQgPSAnJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxpbmVFbmQgKz0gMVxuICAgICAgICAgICAgICAgIGxpbmVUZXh0ICs9IGNoXG5cbiAgICAgICAgQHBhcnNlTGluZSBsaW5lSW5kZXgsIGxpbmVUZXh0XG4gICAgICAgIEByZXN1bHRcblxubW9kdWxlLmV4cG9ydHMgPSBJbmRleEhwcFxuIl19
//# sourceURL=../../coffee/main/indexhpp.coffee