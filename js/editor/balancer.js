// koffee 1.6.0

/*
0000000     0000000   000       0000000   000   000   0000000  00000000  00000000
000   000  000   000  000      000   000  0000  000  000       000       000   000
0000000    000000000  000      000000000  000 0 000  000       0000000   0000000
000   000  000   000  000      000   000  000  0000  000       000       000   000
0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000
 */
var Balancer, _, empty, kerror, klor, matchr, ref;

ref = require('kxk'), _ = ref._, empty = ref.empty, kerror = ref.kerror, klor = ref.klor, matchr = ref.matchr;

Balancer = (function() {
    function Balancer(syntax, getLine) {
        this.syntax = syntax;
        this.getLine = getLine;
        this.unbalanced = [];
        this.blocks = null;
    }

    Balancer.prototype.setLines = function(lines) {
        var ref1;
        if ((ref1 = this.syntax.name) !== 'browser' && ref1 !== 'ko' && ref1 !== 'commandline' && ref1 !== 'macro' && ref1 !== 'term' && ref1 !== 'test') {
            return this.blocks = klor.dissect(lines, this.syntax.name);
        }
    };

    Balancer.prototype.setFileType = function(fileType) {
        var lineComment, multiComment;
        lineComment = (function() {
            switch (fileType) {
                case 'coffee':
                case 'koffee':
                case 'sh':
                case 'bat':
                case 'noon':
                case 'ko':
                case 'txt':
                case 'fish':
                    return '#';
                case 'styl':
                case 'cpp':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'scss':
                case 'ts':
                case 'swift':
                case 'frag':
                case 'vert':
                    return '//';
                case 'iss':
                case 'ini':
                    return ';';
            }
        })();
        multiComment = (function() {
            switch (fileType) {
                case 'coffee':
                case 'koffee':
                    return {
                        open: '###',
                        close: '###'
                    };
                case 'html':
                case 'md':
                    return {
                        open: '<!--',
                        close: '-->'
                    };
                case 'styl':
                case 'cpp':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'scss':
                case 'ts':
                case 'swift':
                case 'frag':
                case 'vert':
                    return {
                        open: '/*',
                        close: '*/'
                    };
            }
        })();
        this.regions = {
            doubleString: {
                clss: 'string double',
                open: '"',
                close: '"'
            }
        };
        if (lineComment) {
            this.regions.lineComment = {
                clss: 'comment',
                open: lineComment,
                close: null,
                force: true
            };
            this.headerRegExp = new RegExp("^(\\s*" + (_.escapeRegExp(this.regions.lineComment.open)) + "\\s*)?(\\s*0[0\\s]+)$");
        }
        if (multiComment) {
            this.regions.multiComment = {
                clss: 'comment triple',
                open: multiComment.open,
                close: multiComment.close,
                multi: true
            };
        }
        switch (fileType) {
            case 'coffee':
            case 'koffee':
                this.regions.multiString = {
                    clss: 'string triple',
                    open: '"""',
                    close: '"""',
                    multi: true
                };
                this.regions.multiString2 = {
                    clss: 'string triple skinny',
                    open: "'''",
                    close: "'''",
                    multi: true
                };
                this.regions.interpolation = {
                    clss: 'interpolation',
                    open: '#{',
                    close: '}',
                    multi: true
                };
                this.regions.singleString = {
                    clss: 'string single',
                    open: "'",
                    close: "'"
                };
                break;
            case 'js':
            case 'ts':
                this.regions.singleString = {
                    clss: 'string single',
                    open: "'",
                    close: "'"
                };
                break;
            case 'noon':
            case 'iss':
                this.regions.lineComment.solo = true;
                break;
            case 'md':
                this.regions.multiString = {
                    clss: 'string triple',
                    open: '```',
                    close: '```',
                    multi: true
                };
                this.regions.header5 = {
                    clss: 'markdown h5',
                    open: '#####',
                    close: null,
                    solo: true
                };
                this.regions.header4 = {
                    clss: 'markdown h4',
                    open: '####',
                    close: null,
                    solo: true
                };
                this.regions.header3 = {
                    clss: 'markdown h3',
                    open: '###',
                    close: null,
                    solo: true
                };
                this.regions.header2 = {
                    clss: 'markdown h2',
                    open: '##',
                    close: null,
                    solo: true
                };
                this.regions.header1 = {
                    clss: 'markdown h1',
                    open: '#',
                    close: null,
                    solo: true
                };
        }
        return this.openRegions = _.filter(this.regions, function(r) {
            return r.close === null;
        });
    };

    Balancer.prototype.dissForLine = function(li) {
        var r, ref1, text;
        text = this.getLine(li);
        if (text == null) {
            return kerror("dissForLine -- no line at index " + li + "?");
        }
        if ((ref1 = this.blocks) != null ? ref1[li] : void 0) {
            return this.blocks[li];
        }
        r = this.mergeRegions(this.parse(text, li), text, li);
        return r;
    };

    Balancer.prototype.dissForLineAndRanges = function(line, rgs) {
        var regions;
        regions = this.mergeRegions(this.parse(line, 0), line, 0);
        return matchr.merge(regions, matchr.dissect(rgs));
    };

    Balancer.prototype.mergeRegions = function(regions, text, li) {
        var addDiss, merged, p, region, unbalanced;
        unbalanced = this.getUnbalanced(li);
        merged = [];
        p = 0;
        addDiss = (function(_this) {
            return function(start, end, force) {
                var diss, slice;
                slice = text.slice(start, end);
                if (!force && (unbalanced != null) && _.last(unbalanced).region.clss !== 'interpolation') {
                    diss = _this.dissForClass(slice, 0, _.last(unbalanced).region.clss);
                } else {
                    if (end < text.length - 1) {
                        slice += ' x';
                        diss = _this.syntax.constructor.dissForTextAndSyntax(slice, _this.syntax.name);
                        diss.pop();
                    } else {
                        diss = _this.syntax.constructor.dissForTextAndSyntax(slice, _this.syntax.name);
                    }
                }
                if (start) {
                    _.each(diss, function(d) {
                        return d.start += start;
                    });
                }
                return merged = merged.concat(diss);
            };
        })(this);
        while (region = regions.shift()) {
            if (region.start > p) {
                addDiss(p, region.start);
            }
            if (region.clss === 'interpolation') {
                addDiss(region.start, region.start + region.match.length, true);
            } else {
                merged.push(region);
            }
            p = region.start + region.match.length;
        }
        if (p < text.length) {
            addDiss(p, text.length);
        }
        return merged;
    };

    Balancer.prototype.dissForClass = function(text, start, clss) {
        var c, diss, m, p, ref1, s;
        if ((ref1 = this.headerRegExp) != null ? ref1.test(text) : void 0) {
            clss += ' header';
        }
        diss = [];
        m = '';
        p = s = start;
        while (p < text.length) {
            c = text[p];
            p += 1;
            if (c !== ' ') {
                if (m === '') {
                    s = p - 1;
                }
                m += c;
                if (p < text.length) {
                    continue;
                }
            }
            if (m !== '') {
                diss.push({
                    start: s,
                    match: m,
                    clss: clss
                });
                m = '';
            }
        }
        return diss;
    };


    /*
    00000000    0000000   00000000    0000000  00000000
    000   000  000   000  000   000  000       000
    00000000   000000000  0000000    0000000   0000000
    000        000   000  000   000       000  000
    000        000   000  000   000  0000000   00000000
     */

    Balancer.prototype.parse = function(text, li) {
        var ch, closeStackItem, escapes, forced, i, j, keepUnbalanced, len, len1, lineStartRegion, openRegion, p, popRegion, pushForceRegion, pushRegion, pushTop, pushed, realStack, ref1, ref2, ref3, ref4, rest, result, stack, top, unbalanced;
        p = 0;
        escapes = 0;
        stack = [];
        result = [];
        unbalanced = null;
        keepUnbalanced = [];
        if (unbalanced = this.getUnbalanced(li)) {
            for (i = 0, len = unbalanced.length; i < len; i++) {
                lineStartRegion = unbalanced[i];
                stack.push({
                    start: 0,
                    region: lineStartRegion.region,
                    fake: true
                });
            }
        }
        pushTop = function() {
            var advance, le, lr, oldmatch, ref1, results, split, top, word;
            if (top = _.last(stack)) {
                lr = _.last(result);
                le = (lr != null) && lr.start + lr.match.length || 0;
                if (p - 1 - le > 0 && le < text.length - 1) {
                    top = _.cloneDeep(top);
                    top.start = le;
                    top.match = text.slice(le, p - 1);
                    top.clss = top.region.clss;
                    delete top.region;
                    advance = function() {
                        var results;
                        results = [];
                        while (top.match.length && top.match[0] === ' ') {
                            top.match = top.match.slice(1);
                            results.push(top.start += 1);
                        }
                        return results;
                    };
                    advance();
                    top.match = top.match.trimRight();
                    if (top.match.length) {
                        if ((ref1 = top.clss) === 'string single' || ref1 === 'string double' || ref1 === 'string triple' || ref1 === 'string triple skinny') {
                            split = top.match.split(/\s\s+/);
                            if (split.length === 1) {
                                return result.push(top);
                            } else {
                                results = [];
                                while (word = split.shift()) {
                                    oldmatch = top.match;
                                    top.match = word;
                                    result.push(top);
                                    top = _.cloneDeep(top);
                                    top.start += word.length + 2;
                                    top.match = oldmatch.slice(word.length + 2);
                                    results.push(advance());
                                }
                                return results;
                            }
                        } else {
                            return result.push(top);
                        }
                    }
                }
            }
        };
        pushForceRegion = (function(_this) {
            return function(region) {
                var start;
                start = p - 1 + region.open.length;
                result.push({
                    start: p - 1,
                    match: region.open,
                    clss: region.clss + ' marker'
                });
                if (start < text.length - 1) {
                    return result = result.concat(_this.dissForClass(text, start, region.clss));
                }
            };
        })(this);
        pushRegion = function(region) {
            pushTop();
            result.push({
                start: p - 1,
                match: region.open,
                clss: region.clss + ' marker'
            });
            return stack.push({
                start: p - 1 + region.open.length,
                region: region
            });
        };
        popRegion = function(rest) {
            var top;
            top = _.last(stack);
            if (((top != null ? top.region.close : void 0) != null) && rest.startsWith(top.region.close)) {
                pushTop();
                stack.pop();
                if (top.fake) {
                    keepUnbalanced.unshift({
                        start: p - 1,
                        region: top.region
                    });
                }
                result.push({
                    start: p - 1,
                    clss: top.region.clss + ' marker',
                    match: top.region.close
                });
                p += top.region.close.length - 1;
                return top;
            }
            return false;
        };
        while (p < text.length) {
            ch = text[p];
            p += 1;
            top = _.last(stack);
            if (ch === '\\') {
                escapes++;
            } else {
                if (ch === ' ') {
                    continue;
                }
                if (escapes) {
                    if (escapes % 2 && (ch !== "#" || top && top.region.clss !== 'interpolation')) {
                        escapes = 0;
                        continue;
                    }
                    escapes = 0;
                }
                if (ch === ':') {
                    if (this.syntax.name === 'json') {
                        if (_.last(result).clss === 'string double marker') {
                            if (result.length > 1 && result[result.length - 2].clss === 'string double') {
                                result[result.length - 2].clss = 'string dictionary key';
                                result.push({
                                    start: p - 1,
                                    match: ch,
                                    clss: 'dictionary marker'
                                });
                                continue;
                            }
                        }
                    }
                }
            }
            rest = text.slice(p - 1);
            if (empty(top) || ((ref1 = top.region) != null ? ref1.clss : void 0) === 'interpolation') {
                if (popRegion(rest)) {
                    continue;
                }
                if (this.regions.multiComment && rest.startsWith(this.regions.multiComment.open)) {
                    pushRegion(this.regions.multiComment);
                    continue;
                } else if (this.regions.multiString && rest.startsWith(this.regions.multiString.open)) {
                    pushRegion(this.regions.multiString);
                    continue;
                } else if (this.regions.multiString2 && rest.startsWith(this.regions.multiString2.open)) {
                    pushRegion(this.regions.multiString2);
                    continue;
                } else if (empty(top)) {
                    forced = false;
                    pushed = false;
                    ref2 = this.openRegions;
                    for (j = 0, len1 = ref2.length; j < len1; j++) {
                        openRegion = ref2[j];
                        if (rest.startsWith(openRegion.open)) {
                            if ((openRegion.minX != null) && p - 1 < openRegion.minX) {
                                continue;
                            }
                            if ((openRegion.maxX != null) && p - 1 > openRegion.maxX) {
                                continue;
                            }
                            if (!openRegion.solo || empty(text.slice(0, p - 1).trim())) {
                                if (openRegion.force) {
                                    pushForceRegion(openRegion);
                                    forced = true;
                                } else {
                                    pushRegion(openRegion);
                                    pushed = true;
                                }
                                break;
                            }
                        }
                    }
                    if (forced) {
                        break;
                    }
                    if (pushed) {
                        continue;
                    }
                }
                if (this.regions.regexp && ch === this.regions.regexp.open) {
                    pushRegion(this.regions.regexp);
                    continue;
                }
                if (ch === ((ref3 = this.regions.singleString) != null ? ref3.open : void 0)) {
                    pushRegion(this.regions.singleString);
                    continue;
                }
                if (ch === this.regions.doubleString.open) {
                    pushRegion(this.regions.doubleString);
                    continue;
                }
            } else {
                if ((ref4 = top.region.clss) === 'string double' || ref4 === 'string triple') {
                    if (this.regions.interpolation && rest.startsWith(this.regions.interpolation.open)) {
                        pushRegion(this.regions.interpolation);
                        continue;
                    }
                }
                if (popRegion(rest)) {
                    continue;
                }
            }
        }
        realStack = stack.filter(function(s) {
            return !s.fake && s.region.close !== null && s.region.multi;
        });
        closeStackItem = (function(_this) {
            return function(stackItem) {
                return result = result.concat(_this.dissForClass(text, _.last(result).start + _.last(result).match.length, stackItem.region.clss));
            };
        })(this);
        if (realStack.length) {
            this.setUnbalanced(li, realStack);
            closeStackItem(_.last(realStack));
        } else if (keepUnbalanced.length) {
            this.setUnbalanced(li, keepUnbalanced);
            if (stack.length) {
                closeStackItem(_.last(stack));
            }
        } else {
            if (stack.length && _.last(stack).region.close === null) {
                closeStackItem(_.last(stack));
            }
            this.setUnbalanced(li);
        }
        return result;
    };

    Balancer.prototype.getUnbalanced = function(li) {
        var i, len, ref1, stack, u;
        stack = [];
        ref1 = this.unbalanced;
        for (i = 0, len = ref1.length; i < len; i++) {
            u = ref1[i];
            if (u.line < li) {
                if (stack.length && _.last(stack).region.clss === u.region.clss) {
                    stack.pop();
                } else {
                    stack.push(u);
                }
            }
            if (u.line >= li) {
                break;
            }
        }
        if (stack.length) {
            return stack;
        }
        return null;
    };

    Balancer.prototype.setUnbalanced = function(li, stack) {
        _.remove(this.unbalanced, function(u) {
            return u.line === li;
        });
        if (stack != null) {
            _.each(stack, function(s) {
                return s.line = li;
            });
            this.unbalanced = this.unbalanced.concat(stack);
            return this.unbalanced.sort(function(a, b) {
                if (a.line === b.line) {
                    return a.start - b.start;
                } else {
                    return a.line - b.line;
                }
            });
        }
    };

    Balancer.prototype.deleteLine = function(li) {
        _.remove(this.unbalanced, function(u) {
            return u.line === li;
        });
        return _.each(this.unbalanced, function(u) {
            if (u.line >= li) {
                return u.line -= 1;
            }
        });
    };

    Balancer.prototype.insertLine = function(li) {
        return _.each(this.unbalanced, function(u) {
            if (u.line >= li) {
                return u.line += 1;
            }
        });
    };

    Balancer.prototype.clear = function() {
        this.unbalanced = [];
        return this.blocks = null;
    };

    return Balancer;

})();

module.exports = Balancer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQXFDLE9BQUEsQ0FBUSxLQUFSLENBQXJDLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksbUJBQVosRUFBb0IsZUFBcEIsRUFBMEI7O0FBRXBCO0lBRUMsa0JBQUMsTUFBRCxFQUFVLE9BQVY7UUFBQyxJQUFDLENBQUEsU0FBRDtRQUFTLElBQUMsQ0FBQSxVQUFEO1FBRVQsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIWDs7dUJBS0gsUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUNOLFlBQUE7UUFBQSxZQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixLQUFxQixTQUFyQixJQUFBLElBQUEsS0FBK0IsSUFBL0IsSUFBQSxJQUFBLEtBQW9DLGFBQXBDLElBQUEsSUFBQSxLQUFrRCxPQUFsRCxJQUFBLElBQUEsS0FBMEQsTUFBMUQsSUFBQSxJQUFBLEtBQWlFLE1BQXBFO21CQUNJLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBNUIsRUFEZDs7SUFETTs7dUJBVVYsV0FBQSxHQUFhLFNBQUMsUUFBRDtBQUVULFlBQUE7UUFBQSxXQUFBO0FBQWMsb0JBQU8sUUFBUDtBQUFBLHFCQUNMLFFBREs7QUFBQSxxQkFDSSxRQURKO0FBQUEscUJBQ2EsSUFEYjtBQUFBLHFCQUNrQixLQURsQjtBQUFBLHFCQUN3QixNQUR4QjtBQUFBLHFCQUMrQixJQUQvQjtBQUFBLHFCQUNvQyxLQURwQztBQUFBLHFCQUMwQyxNQUQxQzsyQkFDbUU7QUFEbkUscUJBRUwsTUFGSztBQUFBLHFCQUVFLEtBRkY7QUFBQSxxQkFFUSxHQUZSO0FBQUEscUJBRVksR0FGWjtBQUFBLHFCQUVnQixLQUZoQjtBQUFBLHFCQUVzQixLQUZ0QjtBQUFBLHFCQUU0QixJQUY1QjtBQUFBLHFCQUVpQyxJQUZqQztBQUFBLHFCQUVzQyxNQUZ0QztBQUFBLHFCQUU2QyxJQUY3QztBQUFBLHFCQUVrRCxPQUZsRDtBQUFBLHFCQUUwRCxNQUYxRDtBQUFBLHFCQUVpRSxNQUZqRTsyQkFFNkU7QUFGN0UscUJBR0wsS0FISztBQUFBLHFCQUdDLEtBSEQ7MkJBR21FO0FBSG5FOztRQUtkLFlBQUE7QUFBZSxvQkFBTyxRQUFQO0FBQUEscUJBQ04sUUFETTtBQUFBLHFCQUNHLFFBREg7MkJBQ2tFO3dCQUFBLElBQUEsRUFBSyxLQUFMO3dCQUFZLEtBQUEsRUFBTSxLQUFsQjs7QUFEbEUscUJBRU4sTUFGTTtBQUFBLHFCQUVDLElBRkQ7MkJBRWtFO3dCQUFBLElBQUEsRUFBSyxNQUFMO3dCQUFZLEtBQUEsRUFBTSxLQUFsQjs7QUFGbEUscUJBR04sTUFITTtBQUFBLHFCQUdDLEtBSEQ7QUFBQSxxQkFHTyxHQUhQO0FBQUEscUJBR1csR0FIWDtBQUFBLHFCQUdlLEtBSGY7QUFBQSxxQkFHcUIsS0FIckI7QUFBQSxxQkFHMkIsSUFIM0I7QUFBQSxxQkFHZ0MsSUFIaEM7QUFBQSxxQkFHcUMsTUFIckM7QUFBQSxxQkFHNEMsSUFINUM7QUFBQSxxQkFHaUQsT0FIakQ7QUFBQSxxQkFHeUQsTUFIekQ7QUFBQSxxQkFHZ0UsTUFIaEU7MkJBRzRFO3dCQUFBLElBQUEsRUFBSyxJQUFMO3dCQUFZLEtBQUEsRUFBTSxJQUFsQjs7QUFINUU7O1FBS2YsSUFBQyxDQUFBLE9BQUQsR0FDSTtZQUFBLFlBQUEsRUFBYztnQkFBQSxJQUFBLEVBQUssZUFBTDtnQkFBcUIsSUFBQSxFQUFLLEdBQTFCO2dCQUE4QixLQUFBLEVBQU0sR0FBcEM7YUFBZDs7UUFFSixJQUFHLFdBQUg7WUFDSSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsR0FBdUI7Z0JBQUEsSUFBQSxFQUFLLFNBQUw7Z0JBQWUsSUFBQSxFQUFLLFdBQXBCO2dCQUFpQyxLQUFBLEVBQU0sSUFBdkM7Z0JBQTZDLEtBQUEsRUFBTSxJQUFuRDs7WUFDdkIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBSSxNQUFKLENBQVcsUUFBQSxHQUFRLENBQUMsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFwQyxDQUFELENBQVIsR0FBa0QsdUJBQTdELEVBRnBCOztRQUlBLElBQUcsWUFBSDtZQUNJLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBVCxHQUNJO2dCQUFBLElBQUEsRUFBTyxnQkFBUDtnQkFDQSxJQUFBLEVBQU8sWUFBWSxDQUFDLElBRHBCO2dCQUVBLEtBQUEsRUFBTyxZQUFZLENBQUMsS0FGcEI7Z0JBR0EsS0FBQSxFQUFPLElBSFA7Y0FGUjs7QUFPQSxnQkFBTyxRQUFQO0FBQUEsaUJBRVMsUUFGVDtBQUFBLGlCQUVrQixRQUZsQjtnQkFHUSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLGVBQUw7b0JBQTRCLElBQUEsRUFBSyxLQUFqQztvQkFBdUMsS0FBQSxFQUFPLEtBQTlDO29CQUFvRCxLQUFBLEVBQU8sSUFBM0Q7O2dCQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLFlBQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLHNCQUFMO29CQUE0QixJQUFBLEVBQUssS0FBakM7b0JBQXVDLEtBQUEsRUFBTyxLQUE5QztvQkFBb0QsS0FBQSxFQUFPLElBQTNEOztnQkFDekIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUFULEdBQXlCO29CQUFBLElBQUEsRUFBSyxlQUFMO29CQUE0QixJQUFBLEVBQUssSUFBakM7b0JBQXVDLEtBQUEsRUFBTyxHQUE5QztvQkFBb0QsS0FBQSxFQUFPLElBQTNEOztnQkFDekIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFULEdBQXlCO29CQUFBLElBQUEsRUFBSyxlQUFMO29CQUE0QixJQUFBLEVBQUssR0FBakM7b0JBQXFDLEtBQUEsRUFBTyxHQUE1Qzs7QUFKZjtBQUZsQixpQkFRUyxJQVJUO0FBQUEsaUJBUWMsSUFSZDtnQkFTUSxJQUFDLENBQUEsT0FBTyxDQUFDLFlBQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFNLGVBQU47b0JBQXVCLElBQUEsRUFBTSxHQUE3QjtvQkFBaUMsS0FBQSxFQUFPLEdBQXhDOztBQURuQjtBQVJkLGlCQVdTLE1BWFQ7QUFBQSxpQkFXZ0IsS0FYaEI7Z0JBWVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBckIsR0FBNEI7QUFEcEI7QUFYaEIsaUJBY1MsSUFkVDtnQkFlUSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLGVBQUw7b0JBQXFCLElBQUEsRUFBSyxLQUExQjtvQkFBa0MsS0FBQSxFQUFPLEtBQXpDO29CQUErQyxLQUFBLEVBQU8sSUFBdEQ7O2dCQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLGFBQUw7b0JBQXFCLElBQUEsRUFBSyxPQUExQjtvQkFBa0MsS0FBQSxFQUFPLElBQXpDO29CQUErQyxJQUFBLEVBQU0sSUFBckQ7O2dCQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLGFBQUw7b0JBQXFCLElBQUEsRUFBSyxNQUExQjtvQkFBa0MsS0FBQSxFQUFPLElBQXpDO29CQUErQyxJQUFBLEVBQU0sSUFBckQ7O2dCQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLGFBQUw7b0JBQXFCLElBQUEsRUFBSyxLQUExQjtvQkFBa0MsS0FBQSxFQUFPLElBQXpDO29CQUErQyxJQUFBLEVBQU0sSUFBckQ7O2dCQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLGFBQUw7b0JBQXFCLElBQUEsRUFBSyxJQUExQjtvQkFBa0MsS0FBQSxFQUFPLElBQXpDO29CQUErQyxJQUFBLEVBQU0sSUFBckQ7O2dCQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsR0FBeUI7b0JBQUEsSUFBQSxFQUFLLGFBQUw7b0JBQXFCLElBQUEsRUFBSyxHQUExQjtvQkFBa0MsS0FBQSxFQUFPLElBQXpDO29CQUErQyxJQUFBLEVBQU0sSUFBckQ7O0FBcEJqQztlQXNCQSxJQUFDLENBQUEsV0FBRCxHQUFlLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBQyxDQUFBLE9BQVYsRUFBbUIsU0FBQyxDQUFEO21CQUFPLENBQUMsQ0FBQyxLQUFGLEtBQVc7UUFBbEIsQ0FBbkI7SUFoRE47O3VCQXdEYixXQUFBLEdBQWEsU0FBQyxFQUFEO0FBRVQsWUFBQTtRQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsT0FBRCxDQUFTLEVBQVQ7UUFFUCxJQUFPLFlBQVA7QUFDSSxtQkFBTyxNQUFBLENBQU8sa0NBQUEsR0FBbUMsRUFBbkMsR0FBc0MsR0FBN0MsRUFEWDs7UUFHQSx1Q0FBWSxDQUFBLEVBQUEsVUFBWjtBQUNJLG1CQUFPLElBQUMsQ0FBQSxNQUFPLENBQUEsRUFBQSxFQURuQjs7UUFFQSxDQUFBLEdBQUksSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsS0FBRCxDQUFPLElBQVAsRUFBYSxFQUFiLENBQWQsRUFBZ0MsSUFBaEMsRUFBc0MsRUFBdEM7ZUFDSjtJQVZTOzt1QkFZYixvQkFBQSxHQUFzQixTQUFDLElBQUQsRUFBTyxHQUFQO0FBRWxCLFlBQUE7UUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsS0FBRCxDQUFPLElBQVAsRUFBYSxDQUFiLENBQWQsRUFBK0IsSUFBL0IsRUFBcUMsQ0FBckM7ZUFDVixNQUFNLENBQUMsS0FBUCxDQUFhLE9BQWIsRUFBc0IsTUFBTSxDQUFDLE9BQVAsQ0FBZSxHQUFmLENBQXRCO0lBSGtCOzt1QkFXdEIsWUFBQSxHQUFjLFNBQUMsT0FBRCxFQUFVLElBQVYsRUFBZ0IsRUFBaEI7QUFFVixZQUFBO1FBQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxhQUFELENBQWUsRUFBZjtRQUViLE1BQUEsR0FBUztRQUNULENBQUEsR0FBSTtRQUVKLE9BQUEsR0FBVSxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLEtBQUQsRUFBUSxHQUFSLEVBQWEsS0FBYjtBQUVOLG9CQUFBO2dCQUFBLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQVgsRUFBa0IsR0FBbEI7Z0JBQ1IsSUFBRyxDQUFJLEtBQUosSUFBYyxvQkFBZCxJQUE4QixDQUFDLENBQUMsSUFBRixDQUFPLFVBQVAsQ0FBa0IsQ0FBQyxNQUFNLENBQUMsSUFBMUIsS0FBa0MsZUFBbkU7b0JBQ0ksSUFBQSxHQUFPLEtBQUMsQ0FBQSxZQUFELENBQWMsS0FBZCxFQUFxQixDQUFyQixFQUF3QixDQUFDLENBQUMsSUFBRixDQUFPLFVBQVAsQ0FBa0IsQ0FBQyxNQUFNLENBQUMsSUFBbEQsRUFEWDtpQkFBQSxNQUFBO29CQUdJLElBQUcsR0FBQSxHQUFNLElBQUksQ0FBQyxNQUFMLEdBQVksQ0FBckI7d0JBQ0ksS0FBQSxJQUFTO3dCQUNULElBQUEsR0FBTyxLQUFDLENBQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBcEIsQ0FBeUMsS0FBekMsRUFBZ0QsS0FBQyxDQUFBLE1BQU0sQ0FBQyxJQUF4RDt3QkFDUCxJQUFJLENBQUMsR0FBTCxDQUFBLEVBSEo7cUJBQUEsTUFBQTt3QkFLSSxJQUFBLEdBQU8sS0FBQyxDQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQXBCLENBQXlDLEtBQXpDLEVBQWdELEtBQUMsQ0FBQSxNQUFNLENBQUMsSUFBeEQsRUFMWDtxQkFISjs7Z0JBU0EsSUFBRyxLQUFIO29CQUNJLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBUCxFQUFhLFNBQUMsQ0FBRDsrQkFBTyxDQUFDLENBQUMsS0FBRixJQUFXO29CQUFsQixDQUFiLEVBREo7O3VCQUVBLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQ7WUFkSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7QUFnQlYsZUFBTSxNQUFBLEdBQVMsT0FBTyxDQUFDLEtBQVIsQ0FBQSxDQUFmO1lBRUksSUFBRyxNQUFNLENBQUMsS0FBUCxHQUFlLENBQWxCO2dCQUNJLE9BQUEsQ0FBUSxDQUFSLEVBQVcsTUFBTSxDQUFDLEtBQWxCLEVBREo7O1lBRUEsSUFBRyxNQUFNLENBQUMsSUFBUCxLQUFlLGVBQWxCO2dCQUNJLE9BQUEsQ0FBUSxNQUFNLENBQUMsS0FBZixFQUFzQixNQUFNLENBQUMsS0FBUCxHQUFhLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBaEQsRUFBd0QsSUFBeEQsRUFESjthQUFBLE1BQUE7Z0JBR0ksTUFBTSxDQUFDLElBQVAsQ0FBWSxNQUFaLEVBSEo7O1lBSUEsQ0FBQSxHQUFJLE1BQU0sQ0FBQyxLQUFQLEdBQWUsTUFBTSxDQUFDLEtBQUssQ0FBQztRQVJwQztRQVVBLElBQUcsQ0FBQSxHQUFJLElBQUksQ0FBQyxNQUFaO1lBQ0ksT0FBQSxDQUFRLENBQVIsRUFBVyxJQUFJLENBQUMsTUFBaEIsRUFESjs7ZUFHQTtJQXBDVTs7dUJBc0NkLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsSUFBZDtBQUVWLFlBQUE7UUFBQSw2Q0FBZ0IsQ0FBRSxJQUFmLENBQW9CLElBQXBCLFVBQUg7WUFDSSxJQUFBLElBQVEsVUFEWjs7UUFHQSxJQUFBLEdBQU87UUFDUCxDQUFBLEdBQUk7UUFDSixDQUFBLEdBQUksQ0FBQSxHQUFJO0FBQ1IsZUFBTSxDQUFBLEdBQUksSUFBSSxDQUFDLE1BQWY7WUFFSSxDQUFBLEdBQUksSUFBSyxDQUFBLENBQUE7WUFDVCxDQUFBLElBQUs7WUFFTCxJQUFHLENBQUEsS0FBSyxHQUFSO2dCQUNJLElBQVcsQ0FBQSxLQUFLLEVBQWhCO29CQUFBLENBQUEsR0FBSSxDQUFBLEdBQUUsRUFBTjs7Z0JBQ0EsQ0FBQSxJQUFLO2dCQUNMLElBQVksQ0FBQSxHQUFJLElBQUksQ0FBQyxNQUFyQjtBQUFBLDZCQUFBO2lCQUhKOztZQUtBLElBQUcsQ0FBQSxLQUFLLEVBQVI7Z0JBRUksSUFBSSxDQUFDLElBQUwsQ0FDSTtvQkFBQSxLQUFBLEVBQU8sQ0FBUDtvQkFDQSxLQUFBLEVBQU8sQ0FEUDtvQkFFQSxJQUFBLEVBQU0sSUFGTjtpQkFESjtnQkFJQSxDQUFBLEdBQUksR0FOUjs7UUFWSjtlQWlCQTtJQXpCVTs7O0FBMkJkOzs7Ozs7Ozt1QkFRQSxLQUFBLEdBQU8sU0FBQyxJQUFELEVBQU8sRUFBUDtBQUVILFlBQUE7UUFBQSxDQUFBLEdBQVU7UUFDVixPQUFBLEdBQVU7UUFFVixLQUFBLEdBQVU7UUFDVixNQUFBLEdBQVU7UUFFVixVQUFBLEdBQWlCO1FBQ2pCLGNBQUEsR0FBaUI7UUFFakIsSUFBRyxVQUFBLEdBQWEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxFQUFmLENBQWhCO0FBQ0ksaUJBQUEsNENBQUE7O2dCQUNJLEtBQUssQ0FBQyxJQUFOLENBQ0k7b0JBQUEsS0FBQSxFQUFRLENBQVI7b0JBQ0EsTUFBQSxFQUFRLGVBQWUsQ0FBQyxNQUR4QjtvQkFFQSxJQUFBLEVBQVEsSUFGUjtpQkFESjtBQURKLGFBREo7O1FBYUEsT0FBQSxHQUFVLFNBQUE7QUFFTixnQkFBQTtZQUFBLElBQUksR0FBQSxHQUFNLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBUCxDQUFWO2dCQUNJLEVBQUEsR0FBTSxDQUFDLENBQUMsSUFBRixDQUFPLE1BQVA7Z0JBQ04sRUFBQSxHQUFNLFlBQUEsSUFBUSxFQUFFLENBQUMsS0FBSCxHQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBNUIsSUFBc0M7Z0JBRTVDLElBQUcsQ0FBQSxHQUFFLENBQUYsR0FBTSxFQUFOLEdBQVcsQ0FBWCxJQUFpQixFQUFBLEdBQUssSUFBSSxDQUFDLE1BQUwsR0FBWSxDQUFyQztvQkFFSSxHQUFBLEdBQU0sQ0FBQyxDQUFDLFNBQUYsQ0FBWSxHQUFaO29CQUNOLEdBQUcsQ0FBQyxLQUFKLEdBQVk7b0JBQ1osR0FBRyxDQUFDLEtBQUosR0FBWSxJQUFJLENBQUMsS0FBTCxDQUFXLEVBQVgsRUFBZSxDQUFBLEdBQUUsQ0FBakI7b0JBQ1osR0FBRyxDQUFDLElBQUosR0FBVyxHQUFHLENBQUMsTUFBTSxDQUFDO29CQUN0QixPQUFPLEdBQUcsQ0FBQztvQkFFWCxPQUFBLEdBQVUsU0FBQTtBQUNOLDRCQUFBO0FBQUE7K0JBQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFWLElBQXFCLEdBQUcsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFWLEtBQWdCLEdBQTNDOzRCQUNJLEdBQUcsQ0FBQyxLQUFKLEdBQVksR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFWLENBQWdCLENBQWhCO3lDQUNaLEdBQUcsQ0FBQyxLQUFKLElBQWE7d0JBRmpCLENBQUE7O29CQURNO29CQUlWLE9BQUEsQ0FBQTtvQkFFQSxHQUFHLENBQUMsS0FBSixHQUFZLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBVixDQUFBO29CQUVaLElBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFiO3dCQUVJLFlBQUcsR0FBRyxDQUFDLEtBQUosS0FBYSxlQUFiLElBQUEsSUFBQSxLQUE2QixlQUE3QixJQUFBLElBQUEsS0FBNkMsZUFBN0MsSUFBQSxJQUFBLEtBQTZELHNCQUFoRTs0QkFDSSxLQUFBLEdBQVEsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFWLENBQWdCLE9BQWhCOzRCQUNSLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7dUNBQ0ksTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFaLEVBREo7NkJBQUEsTUFBQTtBQUdJO3VDQUFNLElBQUEsR0FBTyxLQUFLLENBQUMsS0FBTixDQUFBLENBQWI7b0NBQ0ksUUFBQSxHQUFXLEdBQUcsQ0FBQztvQ0FDZixHQUFHLENBQUMsS0FBSixHQUFZO29DQUNaLE1BQU0sQ0FBQyxJQUFQLENBQVksR0FBWjtvQ0FDQSxHQUFBLEdBQU0sQ0FBQyxDQUFDLFNBQUYsQ0FBWSxHQUFaO29DQUNOLEdBQUcsQ0FBQyxLQUFKLElBQWEsSUFBSSxDQUFDLE1BQUwsR0FBYztvQ0FDM0IsR0FBRyxDQUFDLEtBQUosR0FBWSxRQUFRLENBQUMsS0FBVCxDQUFlLElBQUksQ0FBQyxNQUFMLEdBQWMsQ0FBN0I7aURBQ1osT0FBQSxDQUFBO2dDQVBKLENBQUE7K0NBSEo7NkJBRko7eUJBQUEsTUFBQTttQ0FjSSxNQUFNLENBQUMsSUFBUCxDQUFZLEdBQVosRUFkSjt5QkFGSjtxQkFoQko7aUJBSko7O1FBRk07UUE4Q1YsZUFBQSxHQUFrQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLE1BQUQ7QUFFZCxvQkFBQTtnQkFBQSxLQUFBLEdBQVEsQ0FBQSxHQUFFLENBQUYsR0FBSSxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUV4QixNQUFNLENBQUMsSUFBUCxDQUNJO29CQUFBLEtBQUEsRUFBTyxDQUFBLEdBQUUsQ0FBVDtvQkFDQSxLQUFBLEVBQU8sTUFBTSxDQUFDLElBRGQ7b0JBRUEsSUFBQSxFQUFNLE1BQU0sQ0FBQyxJQUFQLEdBQWMsU0FGcEI7aUJBREo7Z0JBS0EsSUFBRyxLQUFBLEdBQVEsSUFBSSxDQUFDLE1BQUwsR0FBWSxDQUF2QjsyQkFDSSxNQUFBLEdBQVMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxLQUFDLENBQUEsWUFBRCxDQUFjLElBQWQsRUFBb0IsS0FBcEIsRUFBMkIsTUFBTSxDQUFDLElBQWxDLENBQWQsRUFEYjs7WUFUYztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFrQmxCLFVBQUEsR0FBYSxTQUFDLE1BQUQ7WUFFVCxPQUFBLENBQUE7WUFFQSxNQUFNLENBQUMsSUFBUCxDQUNJO2dCQUFBLEtBQUEsRUFBTyxDQUFBLEdBQUUsQ0FBVDtnQkFDQSxLQUFBLEVBQU8sTUFBTSxDQUFDLElBRGQ7Z0JBRUEsSUFBQSxFQUFNLE1BQU0sQ0FBQyxJQUFQLEdBQWMsU0FGcEI7YUFESjttQkFLQSxLQUFLLENBQUMsSUFBTixDQUNJO2dCQUFBLEtBQUEsRUFBUSxDQUFBLEdBQUUsQ0FBRixHQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBeEI7Z0JBQ0EsTUFBQSxFQUFRLE1BRFI7YUFESjtRQVRTO1FBbUJiLFNBQUEsR0FBWSxTQUFDLElBQUQ7QUFFUixnQkFBQTtZQUFBLEdBQUEsR0FBTSxDQUFDLENBQUMsSUFBRixDQUFPLEtBQVA7WUFFTixJQUFHLG1EQUFBLElBQXVCLElBQUksQ0FBQyxVQUFMLENBQWdCLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBM0IsQ0FBMUI7Z0JBRUksT0FBQSxDQUFBO2dCQUNBLEtBQUssQ0FBQyxHQUFOLENBQUE7Z0JBQ0EsSUFBRyxHQUFHLENBQUMsSUFBUDtvQkFDSSxjQUFjLENBQUMsT0FBZixDQUNJO3dCQUFBLEtBQUEsRUFBUSxDQUFBLEdBQUUsQ0FBVjt3QkFDQSxNQUFBLEVBQVEsR0FBRyxDQUFDLE1BRFo7cUJBREosRUFESjs7Z0JBS0EsTUFBTSxDQUFDLElBQVAsQ0FDSTtvQkFBQSxLQUFBLEVBQU8sQ0FBQSxHQUFFLENBQVQ7b0JBQ0EsSUFBQSxFQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBWCxHQUFrQixTQUR4QjtvQkFFQSxLQUFBLEVBQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUZsQjtpQkFESjtnQkFLQSxDQUFBLElBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBakIsR0FBd0I7QUFDN0IsdUJBQU8sSUFmWDs7bUJBZ0JBO1FBcEJRO0FBNEJaLGVBQU0sQ0FBQSxHQUFJLElBQUksQ0FBQyxNQUFmO1lBRUksRUFBQSxHQUFLLElBQUssQ0FBQSxDQUFBO1lBQ1YsQ0FBQSxJQUFLO1lBRUwsR0FBQSxHQUFNLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBUDtZQUVOLElBQUcsRUFBQSxLQUFNLElBQVQ7Z0JBQW1CLE9BQUEsR0FBbkI7YUFBQSxNQUFBO2dCQUVJLElBQUcsRUFBQSxLQUFNLEdBQVQ7QUFDSSw2QkFESjs7Z0JBR0EsSUFBRyxPQUFIO29CQUNJLElBQUcsT0FBQSxHQUFVLENBQVYsSUFBZ0IsQ0FBQyxFQUFBLEtBQU0sR0FBTixJQUFhLEdBQUEsSUFBUSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQVgsS0FBbUIsZUFBekMsQ0FBbkI7d0JBQ0ksT0FBQSxHQUFVO0FBQ1YsaUNBRko7O29CQUdBLE9BQUEsR0FBVSxFQUpkOztnQkFNQSxJQUFHLEVBQUEsS0FBTSxHQUFUO29CQUNJLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLEtBQWdCLE1BQW5CO3dCQUNJLElBQUcsQ0FBQyxDQUFDLElBQUYsQ0FBTyxNQUFQLENBQWMsQ0FBQyxJQUFmLEtBQXVCLHNCQUExQjs0QkFDSSxJQUFHLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLENBQWhCLElBQXNCLE1BQU8sQ0FBQSxNQUFNLENBQUMsTUFBUCxHQUFjLENBQWQsQ0FBZ0IsQ0FBQyxJQUF4QixLQUFnQyxlQUF6RDtnQ0FDSSxNQUFPLENBQUEsTUFBTSxDQUFDLE1BQVAsR0FBYyxDQUFkLENBQWdCLENBQUMsSUFBeEIsR0FBK0I7Z0NBQy9CLE1BQU0sQ0FBQyxJQUFQLENBQ0k7b0NBQUEsS0FBQSxFQUFPLENBQUEsR0FBRSxDQUFUO29DQUNBLEtBQUEsRUFBTyxFQURQO29DQUVBLElBQUEsRUFBTSxtQkFGTjtpQ0FESjtBQUlBLHlDQU5KOzZCQURKO3lCQURKO3FCQURKO2lCQVhKOztZQXNCQSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFBLEdBQUUsQ0FBYjtZQUVQLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBQSx1Q0FBd0IsQ0FBRSxjQUFaLEtBQW9CLGVBQXJDO2dCQUVJLElBQUcsU0FBQSxDQUFVLElBQVYsQ0FBSDtBQUNJLDZCQURKOztnQkFHQSxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBVCxJQUEwQixJQUFJLENBQUMsVUFBTCxDQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUF0QyxDQUE3QjtvQkFDSSxVQUFBLENBQVcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFwQjtBQUNBLDZCQUZKO2lCQUFBLE1BSUssSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsSUFBeUIsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBckMsQ0FBNUI7b0JBQ0QsVUFBQSxDQUFXLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBcEI7QUFDQSw2QkFGQztpQkFBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFULElBQTBCLElBQUksQ0FBQyxVQUFMLENBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBWSxDQUFDLElBQXRDLENBQTdCO29CQUNELFVBQUEsQ0FBVyxJQUFDLENBQUEsT0FBTyxDQUFDLFlBQXBCO0FBQ0EsNkJBRkM7aUJBQUEsTUFJQSxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7b0JBQ0QsTUFBQSxHQUFTO29CQUNULE1BQUEsR0FBUztBQUNUO0FBQUEseUJBQUEsd0NBQUE7O3dCQUNJLElBQUcsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsVUFBVSxDQUFDLElBQTNCLENBQUg7NEJBQ0ksSUFBRyx5QkFBQSxJQUFxQixDQUFBLEdBQUUsQ0FBRixHQUFNLFVBQVUsQ0FBQyxJQUF6QztBQUFtRCx5Q0FBbkQ7OzRCQUNBLElBQUcseUJBQUEsSUFBcUIsQ0FBQSxHQUFFLENBQUYsR0FBTSxVQUFVLENBQUMsSUFBekM7QUFBbUQseUNBQW5EOzs0QkFDQSxJQUFHLENBQUksVUFBVSxDQUFDLElBQWYsSUFBdUIsS0FBQSxDQUFNLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxFQUFjLENBQUEsR0FBRSxDQUFoQixDQUFrQixDQUFDLElBQW5CLENBQUEsQ0FBTixDQUExQjtnQ0FDSSxJQUFHLFVBQVUsQ0FBQyxLQUFkO29DQUNJLGVBQUEsQ0FBZ0IsVUFBaEI7b0NBQ0EsTUFBQSxHQUFTLEtBRmI7aUNBQUEsTUFBQTtvQ0FJSSxVQUFBLENBQVcsVUFBWDtvQ0FDQSxNQUFBLEdBQVMsS0FMYjs7QUFNQSxzQ0FQSjs2QkFISjs7QUFESjtvQkFZQSxJQUFTLE1BQVQ7QUFBQSw4QkFBQTs7b0JBQ0EsSUFBWSxNQUFaO0FBQUEsaUNBQUE7cUJBaEJDOztnQkFrQkwsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsSUFBb0IsRUFBQSxLQUFNLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQTdDO29CQUNJLFVBQUEsQ0FBVyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQXBCO0FBQ0EsNkJBRko7O2dCQUdBLElBQUcsRUFBQSx1REFBMkIsQ0FBRSxjQUFoQztvQkFDSSxVQUFBLENBQVcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFwQjtBQUNBLDZCQUZKOztnQkFHQSxJQUFHLEVBQUEsS0FBTSxJQUFDLENBQUEsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUEvQjtvQkFDSSxVQUFBLENBQVcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFwQjtBQUNBLDZCQUZKO2lCQXpDSjthQUFBLE1BQUE7Z0JBK0NJLFlBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFYLEtBQW9CLGVBQXBCLElBQUEsSUFBQSxLQUFvQyxlQUF2QztvQkFFSSxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBVCxJQUEyQixJQUFJLENBQUMsVUFBTCxDQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUF2QyxDQUE5Qjt3QkFDSSxVQUFBLENBQVcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUFwQjtBQUNBLGlDQUZKO3FCQUZKOztnQkFNQSxJQUFHLFNBQUEsQ0FBVSxJQUFWLENBQUg7QUFDSSw2QkFESjtpQkFyREo7O1FBL0JKO1FBdUZBLFNBQUEsR0FBWSxLQUFLLENBQUMsTUFBTixDQUFhLFNBQUMsQ0FBRDttQkFBTyxDQUFJLENBQUMsQ0FBQyxJQUFOLElBQWUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFULEtBQWtCLElBQWpDLElBQTBDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFBMUQsQ0FBYjtRQUVaLGNBQUEsR0FBaUIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxTQUFEO3VCQUNiLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLEtBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixDQUFDLENBQUMsSUFBRixDQUFPLE1BQVAsQ0FBYyxDQUFDLEtBQWYsR0FBdUIsQ0FBQyxDQUFDLElBQUYsQ0FBTyxNQUFQLENBQWMsQ0FBQyxLQUFLLENBQUMsTUFBaEUsRUFBd0UsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUF6RixDQUFkO1lBREk7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBR2pCLElBQUcsU0FBUyxDQUFDLE1BQWI7WUFDSSxJQUFDLENBQUEsYUFBRCxDQUFlLEVBQWYsRUFBbUIsU0FBbkI7WUFDQSxjQUFBLENBQWUsQ0FBQyxDQUFDLElBQUYsQ0FBTyxTQUFQLENBQWYsRUFGSjtTQUFBLE1BR0ssSUFBRyxjQUFjLENBQUMsTUFBbEI7WUFDRCxJQUFDLENBQUEsYUFBRCxDQUFlLEVBQWYsRUFBbUIsY0FBbkI7WUFDQSxJQUFHLEtBQUssQ0FBQyxNQUFUO2dCQUNJLGNBQUEsQ0FBZSxDQUFDLENBQUMsSUFBRixDQUFPLEtBQVAsQ0FBZixFQURKO2FBRkM7U0FBQSxNQUFBO1lBS0QsSUFBRyxLQUFLLENBQUMsTUFBTixJQUFpQixDQUFDLENBQUMsSUFBRixDQUFPLEtBQVAsQ0FBYSxDQUFDLE1BQU0sQ0FBQyxLQUFyQixLQUE4QixJQUFsRDtnQkFDSSxjQUFBLENBQWUsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFQLENBQWYsRUFESjs7WUFFQSxJQUFDLENBQUEsYUFBRCxDQUFlLEVBQWYsRUFQQzs7ZUFTTDtJQS9PRzs7dUJBdVBQLGFBQUEsR0FBZSxTQUFDLEVBQUQ7QUFFWCxZQUFBO1FBQUEsS0FBQSxHQUFRO0FBQ1I7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUcsQ0FBQyxDQUFDLElBQUYsR0FBUyxFQUFaO2dCQUNJLElBQUcsS0FBSyxDQUFDLE1BQU4sSUFBaUIsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFQLENBQWEsQ0FBQyxNQUFNLENBQUMsSUFBckIsS0FBNkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUExRDtvQkFDSSxLQUFLLENBQUMsR0FBTixDQUFBLEVBREo7aUJBQUEsTUFBQTtvQkFHSSxLQUFLLENBQUMsSUFBTixDQUFXLENBQVgsRUFISjtpQkFESjs7WUFLQSxJQUFHLENBQUMsQ0FBQyxJQUFGLElBQVUsRUFBYjtBQUNJLHNCQURKOztBQU5KO1FBU0EsSUFBRyxLQUFLLENBQUMsTUFBVDtBQUNJLG1CQUFPLE1BRFg7O2VBR0E7SUFmVzs7dUJBaUJmLGFBQUEsR0FBZSxTQUFDLEVBQUQsRUFBSyxLQUFMO1FBRVgsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsVUFBVixFQUFzQixTQUFDLENBQUQ7bUJBQU8sQ0FBQyxDQUFDLElBQUYsS0FBVTtRQUFqQixDQUF0QjtRQUNBLElBQUcsYUFBSDtZQUNJLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBUCxFQUFjLFNBQUMsQ0FBRDt1QkFBTyxDQUFDLENBQUMsSUFBRixHQUFTO1lBQWhCLENBQWQ7WUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixDQUFtQixLQUFuQjttQkFDZCxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsU0FBQyxDQUFELEVBQUcsQ0FBSDtnQkFDYixJQUFHLENBQUMsQ0FBQyxJQUFGLEtBQVUsQ0FBQyxDQUFDLElBQWY7MkJBQ0ksQ0FBQyxDQUFDLEtBQUYsR0FBVSxDQUFDLENBQUMsTUFEaEI7aUJBQUEsTUFBQTsyQkFHSSxDQUFDLENBQUMsSUFBRixHQUFTLENBQUMsQ0FBQyxLQUhmOztZQURhLENBQWpCLEVBSEo7O0lBSFc7O3VCQVlmLFVBQUEsR0FBWSxTQUFDLEVBQUQ7UUFFUixDQUFDLENBQUMsTUFBRixDQUFTLElBQUMsQ0FBQSxVQUFWLEVBQXNCLFNBQUMsQ0FBRDttQkFBTyxDQUFDLENBQUMsSUFBRixLQUFVO1FBQWpCLENBQXRCO2VBQ0EsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsVUFBUixFQUFvQixTQUFDLENBQUQ7WUFBTyxJQUFlLENBQUMsQ0FBQyxJQUFGLElBQVUsRUFBekI7dUJBQUEsQ0FBQyxDQUFDLElBQUYsSUFBVSxFQUFWOztRQUFQLENBQXBCO0lBSFE7O3VCQUtaLFVBQUEsR0FBWSxTQUFDLEVBQUQ7ZUFFUixDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxVQUFSLEVBQW9CLFNBQUMsQ0FBRDtZQUFPLElBQWUsQ0FBQyxDQUFDLElBQUYsSUFBVSxFQUF6Qjt1QkFBQSxDQUFDLENBQUMsSUFBRixJQUFVLEVBQVY7O1FBQVAsQ0FBcEI7SUFGUTs7dUJBSVosS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsVUFBRCxHQUFjO2VBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUhQOzs7Ozs7QUFLWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZW1wdHksIGtlcnJvciwga2xvciwgbWF0Y2hyIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEJhbGFuY2VyXG5cbiAgICBAOiAoQHN5bnRheCwgQGdldExpbmUpIC0+XG5cbiAgICAgICAgQHVuYmFsYW5jZWQgPSBbXVxuICAgICAgICBAYmxvY2tzID0gbnVsbFxuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgaWYgQHN5bnRheC5uYW1lIG5vdCBpbiBbJ2Jyb3dzZXInICdrbycgJ2NvbW1hbmRsaW5lJyAnbWFjcm8nICd0ZXJtJyAndGVzdCddXG4gICAgICAgICAgICBAYmxvY2tzID0ga2xvci5kaXNzZWN0IGxpbmVzLCBAc3ludGF4Lm5hbWVcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNldEZpbGVUeXBlOiAoZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgbGluZUNvbW1lbnQgPSBzd2l0Y2ggZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgJ3NoJyAnYmF0JyAnbm9vbicgJ2tvJyAndHh0JyAnZmlzaCcgICAgICAgICAgICAgIHRoZW4gJyMnXG4gICAgICAgICAgICB3aGVuICdzdHlsJyAnY3BwJyAnYycgJ2gnICdocHAnICdjeHgnICdjcycgJ2pzJyAnc2NzcycgJ3RzJyAnc3dpZnQnICdmcmFnJyAndmVydCcgdGhlbiAnLy8nXG4gICAgICAgICAgICB3aGVuICdpc3MnICdpbmknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICc7J1xuXG4gICAgICAgIG11bHRpQ29tbWVudCA9IHN3aXRjaCBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOicjIyMnICBjbG9zZTonIyMjJ1xuICAgICAgICAgICAgd2hlbiAnaHRtbCcgJ21kJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOic8IS0tJyBjbG9zZTonLS0+J1xuICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAnZnJhZycgJ3ZlcnQnIHRoZW4gb3BlbjonLyonICAgY2xvc2U6JyovJ1xuXG4gICAgICAgIEByZWdpb25zID1cbiAgICAgICAgICAgIGRvdWJsZVN0cmluZzogY2xzczonc3RyaW5nIGRvdWJsZScgb3BlbjonXCInIGNsb3NlOidcIidcblxuICAgICAgICBpZiBsaW5lQ29tbWVudFxuICAgICAgICAgICAgQHJlZ2lvbnMubGluZUNvbW1lbnQgPSBjbHNzOidjb21tZW50JyBvcGVuOmxpbmVDb21tZW50LCBjbG9zZTpudWxsLCBmb3JjZTp0cnVlXG4gICAgICAgICAgICBAaGVhZGVyUmVnRXhwID0gbmV3IFJlZ0V4cChcIl4oXFxcXHMqI3tfLmVzY2FwZVJlZ0V4cCBAcmVnaW9ucy5saW5lQ29tbWVudC5vcGVufVxcXFxzKik/KFxcXFxzKjBbMFxcXFxzXSspJFwiKVxuXG4gICAgICAgIGlmIG11bHRpQ29tbWVudFxuICAgICAgICAgICAgQHJlZ2lvbnMubXVsdGlDb21tZW50ID1cbiAgICAgICAgICAgICAgICBjbHNzOiAgJ2NvbW1lbnQgdHJpcGxlJ1xuICAgICAgICAgICAgICAgIG9wZW46ICBtdWx0aUNvbW1lbnQub3BlblxuICAgICAgICAgICAgICAgIGNsb3NlOiBtdWx0aUNvbW1lbnQuY2xvc2VcbiAgICAgICAgICAgICAgICBtdWx0aTogdHJ1ZVxuXG4gICAgICAgIHN3aXRjaCBmaWxlVHlwZVxuXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMubXVsdGlTdHJpbmcgICA9IGNsc3M6J3N0cmluZyB0cmlwbGUnICAgICAgICBvcGVuOidcIlwiXCInIGNsb3NlOiAnXCJcIlwiJyBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLm11bHRpU3RyaW5nMiAgPSBjbHNzOidzdHJpbmcgdHJpcGxlIHNraW5ueScgb3BlbjpcIicnJ1wiIGNsb3NlOiBcIicnJ1wiIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaW50ZXJwb2xhdGlvbiA9IGNsc3M6J2ludGVycG9sYXRpb24nICAgICAgICBvcGVuOicjeycgIGNsb3NlOiAnfScgICBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLnNpbmdsZVN0cmluZyAgPSBjbHNzOidzdHJpbmcgc2luZ2xlJyAgICAgICAgb3BlbjpcIidcIiBjbG9zZTogXCInXCJcblxuICAgICAgICAgICAgd2hlbiAnanMnICd0cydcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5zaW5nbGVTdHJpbmcgID0gY2xzczogJ3N0cmluZyBzaW5nbGUnICBvcGVuOiBcIidcIiBjbG9zZTogXCInXCJcblxuICAgICAgICAgICAgd2hlbiAnbm9vbicgJ2lzcydcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5saW5lQ29tbWVudC5zb2xvID0gdHJ1ZSAjIG9ubHkgc3BhY2VzIGJlZm9yZSBjb21tZW50cyBhbGxvd2VkXG5cbiAgICAgICAgICAgIHdoZW4gJ21kJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLm11bHRpU3RyaW5nICAgPSBjbHNzOidzdHJpbmcgdHJpcGxlJyBvcGVuOidgYGAnICAgY2xvc2U6ICdgYGAnIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyNSAgICAgICA9IGNsc3M6J21hcmtkb3duIGg1JyAgIG9wZW46JyMjIyMjJyBjbG9zZTogbnVsbCAgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjQgICAgICAgPSBjbHNzOidtYXJrZG93biBoNCcgICBvcGVuOicjIyMjJyAgY2xvc2U6IG51bGwgIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXIzICAgICAgID0gY2xzczonbWFya2Rvd24gaDMnICAgb3BlbjonIyMjJyAgIGNsb3NlOiBudWxsICBzb2xvOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyMiAgICAgICA9IGNsc3M6J21hcmtkb3duIGgyJyAgIG9wZW46JyMjJyAgICBjbG9zZTogbnVsbCAgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjEgICAgICAgPSBjbHNzOidtYXJrZG93biBoMScgICBvcGVuOicjJyAgICAgY2xvc2U6IG51bGwgIHNvbG86IHRydWVcblxuICAgICAgICBAb3BlblJlZ2lvbnMgPSBfLmZpbHRlciBAcmVnaW9ucywgKHIpIC0+IHIuY2xvc2UgPT0gbnVsbFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGRpc3NGb3JMaW5lOiAobGkpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gQGdldExpbmUgbGlcblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJkaXNzRm9yTGluZSAtLSBubyBsaW5lIGF0IGluZGV4ICN7bGl9P1wiXG5cbiAgICAgICAgaWYgQGJsb2Nrcz9bbGldIFxuICAgICAgICAgICAgcmV0dXJuIEBibG9ja3NbbGldXG4gICAgICAgIHIgPSBAbWVyZ2VSZWdpb25zIEBwYXJzZSh0ZXh0LCBsaSksIHRleHQsIGxpXG4gICAgICAgIHJcblxuICAgIGRpc3NGb3JMaW5lQW5kUmFuZ2VzOiAobGluZSwgcmdzKSAtPlxuXG4gICAgICAgIHJlZ2lvbnMgPSBAbWVyZ2VSZWdpb25zIEBwYXJzZShsaW5lLCAwKSwgbGluZSwgMFxuICAgICAgICBtYXRjaHIubWVyZ2UgcmVnaW9ucywgbWF0Y2hyLmRpc3NlY3QgcmdzXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgbWVyZ2VSZWdpb25zOiAocmVnaW9ucywgdGV4dCwgbGkpIC0+XG5cbiAgICAgICAgdW5iYWxhbmNlZCA9IEBnZXRVbmJhbGFuY2VkIGxpXG5cbiAgICAgICAgbWVyZ2VkID0gW11cbiAgICAgICAgcCA9IDBcblxuICAgICAgICBhZGREaXNzID0gKHN0YXJ0LCBlbmQsIGZvcmNlKSA9PlxuXG4gICAgICAgICAgICBzbGljZSA9IHRleHQuc2xpY2Ugc3RhcnQsIGVuZFxuICAgICAgICAgICAgaWYgbm90IGZvcmNlIGFuZCB1bmJhbGFuY2VkPyBhbmQgXy5sYXN0KHVuYmFsYW5jZWQpLnJlZ2lvbi5jbHNzICE9ICdpbnRlcnBvbGF0aW9uJ1xuICAgICAgICAgICAgICAgIGRpc3MgPSBAZGlzc0ZvckNsYXNzIHNsaWNlLCAwLCBfLmxhc3QodW5iYWxhbmNlZCkucmVnaW9uLmNsc3NcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBlbmQgPCB0ZXh0Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgIHNsaWNlICs9ICcgeCcgIyBsaXR0bGUgaGFjayB0byBnZXQgZnVuY3Rpb24gY2FsbCBkZXRlY3Rpb24gdG8gd29ya1xuICAgICAgICAgICAgICAgICAgICBkaXNzID0gQHN5bnRheC5jb25zdHJ1Y3Rvci5kaXNzRm9yVGV4dEFuZFN5bnRheCBzbGljZSwgQHN5bnRheC5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGRpc3MucG9wKClcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBAc3ludGF4LmNvbnN0cnVjdG9yLmRpc3NGb3JUZXh0QW5kU3ludGF4IHNsaWNlLCBAc3ludGF4Lm5hbWVcbiAgICAgICAgICAgIGlmIHN0YXJ0XG4gICAgICAgICAgICAgICAgXy5lYWNoIGRpc3MsIChkKSAtPiBkLnN0YXJ0ICs9IHN0YXJ0XG4gICAgICAgICAgICBtZXJnZWQgPSBtZXJnZWQuY29uY2F0IGRpc3NcblxuICAgICAgICB3aGlsZSByZWdpb24gPSByZWdpb25zLnNoaWZ0KClcblxuICAgICAgICAgICAgaWYgcmVnaW9uLnN0YXJ0ID4gcFxuICAgICAgICAgICAgICAgIGFkZERpc3MgcCwgcmVnaW9uLnN0YXJ0XG4gICAgICAgICAgICBpZiByZWdpb24uY2xzcyA9PSAnaW50ZXJwb2xhdGlvbidcbiAgICAgICAgICAgICAgICBhZGREaXNzIHJlZ2lvbi5zdGFydCwgcmVnaW9uLnN0YXJ0K3JlZ2lvbi5tYXRjaC5sZW5ndGgsIHRydWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBtZXJnZWQucHVzaCByZWdpb25cbiAgICAgICAgICAgIHAgPSByZWdpb24uc3RhcnQgKyByZWdpb24ubWF0Y2gubGVuZ3RoXG5cbiAgICAgICAgaWYgcCA8IHRleHQubGVuZ3RoXG4gICAgICAgICAgICBhZGREaXNzIHAsIHRleHQubGVuZ3RoXG5cbiAgICAgICAgbWVyZ2VkXG5cbiAgICBkaXNzRm9yQ2xhc3M6ICh0ZXh0LCBzdGFydCwgY2xzcykgLT5cblxuICAgICAgICBpZiBAaGVhZGVyUmVnRXhwPy50ZXN0IHRleHRcbiAgICAgICAgICAgIGNsc3MgKz0gJyBoZWFkZXInXG5cbiAgICAgICAgZGlzcyA9IFtdXG4gICAgICAgIG0gPSAnJ1xuICAgICAgICBwID0gcyA9IHN0YXJ0XG4gICAgICAgIHdoaWxlIHAgPCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgICAgICBjID0gdGV4dFtwXVxuICAgICAgICAgICAgcCArPSAxXG5cbiAgICAgICAgICAgIGlmIGMgIT0gJyAnXG4gICAgICAgICAgICAgICAgcyA9IHAtMSBpZiBtID09ICcnXG4gICAgICAgICAgICAgICAgbSArPSBjXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgcCA8IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIG0gIT0gJydcblxuICAgICAgICAgICAgICAgIGRpc3MucHVzaFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogc1xuICAgICAgICAgICAgICAgICAgICBtYXRjaDogbVxuICAgICAgICAgICAgICAgICAgICBjbHNzOiBjbHNzXG4gICAgICAgICAgICAgICAgbSA9ICcnXG4gICAgICAgIGRpc3NcblxuICAgICMjI1xuICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIyNcblxuICAgIHBhcnNlOiAodGV4dCwgbGkpIC0+XG5cbiAgICAgICAgcCAgICAgICA9IDBcbiAgICAgICAgZXNjYXBlcyA9IDBcblxuICAgICAgICBzdGFjayAgID0gW11cbiAgICAgICAgcmVzdWx0ICA9IFtdXG5cbiAgICAgICAgdW5iYWxhbmNlZCAgICAgPSBudWxsXG4gICAgICAgIGtlZXBVbmJhbGFuY2VkID0gW11cblxuICAgICAgICBpZiB1bmJhbGFuY2VkID0gQGdldFVuYmFsYW5jZWQgbGlcbiAgICAgICAgICAgIGZvciBsaW5lU3RhcnRSZWdpb24gaW4gdW5iYWxhbmNlZFxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICAwXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogbGluZVN0YXJ0UmVnaW9uLnJlZ2lvblxuICAgICAgICAgICAgICAgICAgICBmYWtlOiAgIHRydWVcblxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICAgICAgcHVzaFRvcCA9IC0+XG5cbiAgICAgICAgICAgIGlmICB0b3AgPSBfLmxhc3Qgc3RhY2tcbiAgICAgICAgICAgICAgICBsciAgPSBfLmxhc3QgcmVzdWx0XG4gICAgICAgICAgICAgICAgbGUgID0gbHI/IGFuZCBsci5zdGFydCArIGxyLm1hdGNoLmxlbmd0aCBvciAwXG5cbiAgICAgICAgICAgICAgICBpZiBwLTEgLSBsZSA+IDAgYW5kIGxlIDwgdGV4dC5sZW5ndGgtMVxuXG4gICAgICAgICAgICAgICAgICAgIHRvcCA9IF8uY2xvbmVEZWVwIHRvcFxuICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgPSBsZVxuICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0ZXh0LnNsaWNlIGxlLCBwLTFcbiAgICAgICAgICAgICAgICAgICAgdG9wLmNsc3MgPSB0b3AucmVnaW9uLmNsc3NcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRvcC5yZWdpb25cblxuICAgICAgICAgICAgICAgICAgICBhZHZhbmNlID0gLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIHRvcC5tYXRjaC5sZW5ndGggYW5kIHRvcC5tYXRjaFswXSA9PSAnICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0b3AubWF0Y2guc2xpY2UgMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5zdGFydCArPSAxXG4gICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoKVxuXG4gICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IHRvcC5tYXRjaC50cmltUmlnaHQoKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcC5tYXRjaC5sZW5ndGhcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdG9wLmNsc3MgaW4gWydzdHJpbmcgc2luZ2xlJyAnc3RyaW5nIGRvdWJsZScgJ3N0cmluZyB0cmlwbGUnICdzdHJpbmcgdHJpcGxlIHNraW5ueSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BsaXQgPSB0b3AubWF0Y2guc3BsaXQgL1xcc1xccysvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgc3BsaXQubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2ggdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB3b3JkID0gc3BsaXQuc2hpZnQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkbWF0Y2ggPSB0b3AubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IHdvcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoIHRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wID0gXy5jbG9uZURlZXAgdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgKz0gd29yZC5sZW5ndGggKyAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSBvbGRtYXRjaC5zbGljZSB3b3JkLmxlbmd0aCArIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoIHRvcFxuXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgICAgICBwdXNoRm9yY2VSZWdpb24gPSAocmVnaW9uKSA9PlxuXG4gICAgICAgICAgICBzdGFydCA9IHAtMStyZWdpb24ub3Blbi5sZW5ndGhcblxuICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICBzdGFydDogcC0xXG4gICAgICAgICAgICAgICAgbWF0Y2g6IHJlZ2lvbi5vcGVuXG4gICAgICAgICAgICAgICAgY2xzczogcmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcblxuICAgICAgICAgICAgaWYgc3RhcnQgPCB0ZXh0Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCBAZGlzc0ZvckNsYXNzIHRleHQsIHN0YXJ0LCByZWdpb24uY2xzc1xuXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICAgICAgcHVzaFJlZ2lvbiA9IChyZWdpb24pIC0+XG5cbiAgICAgICAgICAgIHB1c2hUb3AoKVxuXG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICBtYXRjaDogcmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICBjbHNzOiByZWdpb24uY2xzcyArICcgbWFya2VyJ1xuXG4gICAgICAgICAgICBzdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgc3RhcnQ6ICBwLTErcmVnaW9uLm9wZW4ubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmVnaW9uOiByZWdpb25cblxuICAgICAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgICAgIHBvcFJlZ2lvbiA9IChyZXN0KSAtPlxuXG4gICAgICAgICAgICB0b3AgPSBfLmxhc3Qgc3RhY2tcblxuICAgICAgICAgICAgaWYgdG9wPy5yZWdpb24uY2xvc2U/IGFuZCByZXN0LnN0YXJ0c1dpdGggdG9wLnJlZ2lvbi5jbG9zZVxuXG4gICAgICAgICAgICAgICAgcHVzaFRvcCgpXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICBpZiB0b3AuZmFrZVxuICAgICAgICAgICAgICAgICAgICBrZWVwVW5iYWxhbmNlZC51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogIHAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnaW9uOiB0b3AucmVnaW9uXG5cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogcC0xXG4gICAgICAgICAgICAgICAgICAgIGNsc3M6IHRvcC5yZWdpb24uY2xzcyArICcgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICBtYXRjaDogdG9wLnJlZ2lvbi5jbG9zZVxuXG4gICAgICAgICAgICAgICAgcCArPSB0b3AucmVnaW9uLmNsb3NlLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvcFxuICAgICAgICAgICAgZmFsc2VcblxuICAgICAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgICAgIHdoaWxlIHAgPCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgICAgICBjaCA9IHRleHRbcF1cbiAgICAgICAgICAgIHAgKz0gMVxuXG4gICAgICAgICAgICB0b3AgPSBfLmxhc3Qgc3RhY2tcblxuICAgICAgICAgICAgaWYgY2ggPT0gJ1xcXFwnIHRoZW4gZXNjYXBlcysrXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gJyAnXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBpZiBlc2NhcGVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGVzY2FwZXMgJSAyIGFuZCAoY2ggIT0gXCIjXCIgb3IgdG9wIGFuZCB0b3AucmVnaW9uLmNsc3MgIT0gJ2ludGVycG9sYXRpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgZXNjYXBlcyA9IDAgIyBjaGFyYWN0ZXIgaXMgZXNjYXBlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlICAgICMganVzdCBjb250aW51ZSB0byBuZXh0XG4gICAgICAgICAgICAgICAgICAgIGVzY2FwZXMgPSAwXG5cbiAgICAgICAgICAgICAgICBpZiBjaCA9PSAnOidcbiAgICAgICAgICAgICAgICAgICAgaWYgQHN5bnRheC5uYW1lID09ICdqc29uJyAjIGhpZ2hsaWdodCBqc29uIGRpY3Rpb25hcnkga2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgXy5sYXN0KHJlc3VsdCkuY2xzcyA9PSAnc3RyaW5nIGRvdWJsZSBtYXJrZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgcmVzdWx0Lmxlbmd0aCA+IDEgYW5kIHJlc3VsdFtyZXN1bHQubGVuZ3RoLTJdLmNsc3MgPT0gJ3N0cmluZyBkb3VibGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoLTJdLmNsc3MgPSAnc3RyaW5nIGRpY3Rpb25hcnkga2V5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbHNzOiAnZGljdGlvbmFyeSBtYXJrZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIHJlc3QgPSB0ZXh0LnNsaWNlIHAtMVxuXG4gICAgICAgICAgICBpZiBlbXB0eSh0b3ApIG9yIHRvcC5yZWdpb24/LmNsc3MgPT0gJ2ludGVycG9sYXRpb24nXG5cbiAgICAgICAgICAgICAgICBpZiBwb3BSZWdpb24gcmVzdFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgQHJlZ2lvbnMubXVsdGlDb21tZW50IGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMubXVsdGlDb21tZW50Lm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5tdWx0aUNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQHJlZ2lvbnMubXVsdGlTdHJpbmcgYW5kIHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9ucy5tdWx0aVN0cmluZy5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQHJlZ2lvbnMubXVsdGlTdHJpbmcyIGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMubXVsdGlTdHJpbmcyLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5tdWx0aVN0cmluZzJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgZW1wdHkgdG9wXG4gICAgICAgICAgICAgICAgICAgIGZvcmNlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHB1c2hlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGZvciBvcGVuUmVnaW9uIGluIEBvcGVuUmVnaW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgcmVzdC5zdGFydHNXaXRoIG9wZW5SZWdpb24ub3BlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24ubWluWD8gYW5kIHAtMSA8IG9wZW5SZWdpb24ubWluWCB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3BlblJlZ2lvbi5tYXhYPyBhbmQgcC0xID4gb3BlblJlZ2lvbi5tYXhYIHRoZW4gY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBub3Qgb3BlblJlZ2lvbi5zb2xvIG9yIGVtcHR5IHRleHQuc2xpY2UoMCwgcC0xKS50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3BlblJlZ2lvbi5mb3JjZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaEZvcmNlUmVnaW9uIG9wZW5SZWdpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBvcGVuUmVnaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrIGlmIGZvcmNlZFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBwdXNoZWRcblxuICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLnJlZ2V4cCBhbmQgY2ggPT0gQHJlZ2lvbnMucmVnZXhwLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5yZWdleHBcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICBpZiBjaCA9PSBAcmVnaW9ucy5zaW5nbGVTdHJpbmc/Lm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5zaW5nbGVTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICBpZiBjaCA9PSBAcmVnaW9ucy5kb3VibGVTdHJpbmcub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLmRvdWJsZVN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgICAgICBpZiB0b3AucmVnaW9uLmNsc3MgaW4gWydzdHJpbmcgZG91YmxlJyAnc3RyaW5nIHRyaXBsZSddXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgQHJlZ2lvbnMuaW50ZXJwb2xhdGlvbiBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLmludGVycG9sYXRpb24ub3BlbiAjIHN0cmluZyBpbnRlcnBvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLmludGVycG9sYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBpZiBwb3BSZWdpb24gcmVzdFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIHJlYWxTdGFjayA9IHN0YWNrLmZpbHRlciAocykgLT4gbm90IHMuZmFrZSBhbmQgcy5yZWdpb24uY2xvc2UgIT0gbnVsbCBhbmQgcy5yZWdpb24ubXVsdGlcblxuICAgICAgICBjbG9zZVN0YWNrSXRlbSA9IChzdGFja0l0ZW0pID0+XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0IEBkaXNzRm9yQ2xhc3MgdGV4dCwgXy5sYXN0KHJlc3VsdCkuc3RhcnQgKyBfLmxhc3QocmVzdWx0KS5tYXRjaC5sZW5ndGgsIHN0YWNrSXRlbS5yZWdpb24uY2xzc1xuXG4gICAgICAgIGlmIHJlYWxTdGFjay5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRVbmJhbGFuY2VkIGxpLCByZWFsU3RhY2tcbiAgICAgICAgICAgIGNsb3NlU3RhY2tJdGVtIF8ubGFzdCByZWFsU3RhY2tcbiAgICAgICAgZWxzZSBpZiBrZWVwVW5iYWxhbmNlZC5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRVbmJhbGFuY2VkIGxpLCBrZWVwVW5iYWxhbmNlZFxuICAgICAgICAgICAgaWYgc3RhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgY2xvc2VTdGFja0l0ZW0gXy5sYXN0IHN0YWNrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCBhbmQgXy5sYXN0KHN0YWNrKS5yZWdpb24uY2xvc2UgPT0gbnVsbFxuICAgICAgICAgICAgICAgIGNsb3NlU3RhY2tJdGVtIF8ubGFzdCBzdGFja1xuICAgICAgICAgICAgQHNldFVuYmFsYW5jZWQgbGlcblxuICAgICAgICByZXN1bHRcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGdldFVuYmFsYW5jZWQ6IChsaSkgLT5cblxuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIGZvciB1IGluIEB1bmJhbGFuY2VkXG4gICAgICAgICAgICBpZiB1LmxpbmUgPCBsaVxuICAgICAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCBhbmQgXy5sYXN0KHN0YWNrKS5yZWdpb24uY2xzcyA9PSB1LnJlZ2lvbi5jbHNzXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoIHVcbiAgICAgICAgICAgIGlmIHUubGluZSA+PSBsaVxuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgaWYgc3RhY2subGVuZ3RoXG4gICAgICAgICAgICByZXR1cm4gc3RhY2tcblxuICAgICAgICBudWxsXG5cbiAgICBzZXRVbmJhbGFuY2VkOiAobGksIHN0YWNrKSAtPlxuXG4gICAgICAgIF8ucmVtb3ZlIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lID09IGxpXG4gICAgICAgIGlmIHN0YWNrP1xuICAgICAgICAgICAgXy5lYWNoIHN0YWNrLCAocykgLT4gcy5saW5lID0gbGlcbiAgICAgICAgICAgIEB1bmJhbGFuY2VkID0gQHVuYmFsYW5jZWQuY29uY2F0IHN0YWNrXG4gICAgICAgICAgICBAdW5iYWxhbmNlZC5zb3J0IChhLGIpIC0+XG4gICAgICAgICAgICAgICAgaWYgYS5saW5lID09IGIubGluZVxuICAgICAgICAgICAgICAgICAgICBhLnN0YXJ0IC0gYi5zdGFydFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYS5saW5lIC0gYi5saW5lXG5cbiAgICBkZWxldGVMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgXy5yZW1vdmUgQHVuYmFsYW5jZWQsICh1KSAtPiB1LmxpbmUgPT0gbGlcbiAgICAgICAgXy5lYWNoIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lIC09IDEgaWYgdS5saW5lID49IGxpXG5cbiAgICBpbnNlcnRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgXy5lYWNoIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lICs9IDEgaWYgdS5saW5lID49IGxpXG5cbiAgICBjbGVhcjogLT5cblxuICAgICAgICBAdW5iYWxhbmNlZCA9IFtdXG4gICAgICAgIEBibG9ja3MgPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID0gQmFsYW5jZXJcbiJdfQ==
//# sourceURL=../../coffee/editor/balancer.coffee