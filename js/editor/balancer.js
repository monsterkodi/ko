// koffee 1.4.0

/*
0000000     0000000   000       0000000   000   000   0000000  00000000  00000000
000   000  000   000  000      000   000  0000  000  000       000       000   000
0000000    000000000  000      000000000  000 0 000  000       0000000   0000000
000   000  000   000  000      000   000  000  0000  000       000       000   000
0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000
 */
var Balancer, _, empty, kerror, klor, matchr, ref;

ref = require('kxk'), matchr = ref.matchr, empty = ref.empty, klor = ref.klor, kerror = ref.kerror, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQXFDLE9BQUEsQ0FBUSxLQUFSLENBQXJDLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixlQUFqQixFQUF1QixtQkFBdkIsRUFBK0I7O0FBRXpCO0lBRUMsa0JBQUMsTUFBRCxFQUFVLE9BQVY7UUFBQyxJQUFDLENBQUEsU0FBRDtRQUFTLElBQUMsQ0FBQSxVQUFEO1FBRVQsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIWDs7dUJBS0gsUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUNOLFlBQUE7UUFBQSxZQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixLQUFxQixTQUFyQixJQUFBLElBQUEsS0FBK0IsSUFBL0IsSUFBQSxJQUFBLEtBQW9DLGFBQXBDLElBQUEsSUFBQSxLQUFrRCxPQUFsRCxJQUFBLElBQUEsS0FBMEQsTUFBMUQsSUFBQSxJQUFBLEtBQWlFLE1BQXBFO21CQUNJLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBNUIsRUFEZDs7SUFETTs7dUJBVVYsV0FBQSxHQUFhLFNBQUMsUUFBRDtBQUVULFlBQUE7UUFBQSxXQUFBO0FBQWMsb0JBQU8sUUFBUDtBQUFBLHFCQUNMLFFBREs7QUFBQSxxQkFDSSxRQURKO0FBQUEscUJBQ2EsSUFEYjtBQUFBLHFCQUNrQixLQURsQjtBQUFBLHFCQUN3QixNQUR4QjtBQUFBLHFCQUMrQixJQUQvQjtBQUFBLHFCQUNvQyxLQURwQztBQUFBLHFCQUMwQyxNQUQxQzsyQkFDbUU7QUFEbkUscUJBRUwsTUFGSztBQUFBLHFCQUVFLEtBRkY7QUFBQSxxQkFFUSxHQUZSO0FBQUEscUJBRVksR0FGWjtBQUFBLHFCQUVnQixL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QSxDQUFDLENBQUMsSUFBRixJQUFVLEVBQVY7O1FBQVAsQ0FBcEI7SUFGUTs7dUJBSVosS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsVUFBRCxHQUFjO2VBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUhQOzs7Ozs7QUFLWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgbWF0Y2hyLCBlbXB0eSwga2xvciwga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEJhbGFuY2VyXG5cbiAgICBAOiAoQHN5bnRheCwgQGdldExpbmUpIC0+XG5cbiAgICAgICAgQHVuYmFsYW5jZWQgPSBbXVxuICAgICAgICBAYmxvY2tzID0gbnVsbFxuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgaWYgQHN5bnRheC5uYW1lIG5vdCBpbiBbJ2Jyb3dzZXInICdrbycgJ2NvbW1hbmRsaW5lJyAnbWFjcm8nICd0ZXJtJyAndGVzdCddXG4gICAgICAgICAgICBAYmxvY2tzID0ga2xvci5kaXNzZWN0IGxpbmVzLCBAc3ludGF4Lm5hbWVcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNldEZpbGVUeXBlOiAoZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgbGluZUNvbW1lbnQgPSBzd2l0Y2ggZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgJ3NoJyAnYmF0JyAnbm9vbicgJ2tvJyAndHh0JyAnZmlzaCcgICAgICAgICAgICAgIHRoZW4gJyMnXG4gICAgICAgICAgICB3aGVuICdzdHlsJyAnY3BwJyAnYycgJ2gnICdocHAnICdjeHgnICdjcycgJ2pzJyAnc2NzcycgJ3RzJyAnc3dpZnQnICAgICB0aGVuICcvLydcbiAgICAgICAgICAgIHdoZW4gJ2lzcycgJ2luaScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gJzsnXG5cbiAgICAgICAgbXVsdGlDb21tZW50ID0gc3dpdGNoIGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIG9wZW46JyMjIycgIGNsb3NlOicjIyMnXG4gICAgICAgICAgICB3aGVuICdodG1sJyAnbWQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIG9wZW46JzwhLS0nIGNsb3NlOictLT4nXG4gICAgICAgICAgICB3aGVuICdzdHlsJyAnY3BwJyAnYycgJ2gnICdocHAnICdjeHgnICdjcycgJ2pzJyAnc2NzcycgJ3RzJyAnc3dpZnQnICAgICB0aGVuIG9wZW46Jy8qJyAgIGNsb3NlOicqLydcblxuICAgICAgICBAcmVnaW9ucyA9XG4gICAgICAgICAgICBkb3VibGVTdHJpbmc6IGNsc3M6J3N0cmluZyBkb3VibGUnIG9wZW46J1wiJyBjbG9zZTonXCInXG5cbiAgICAgICAgaWYgbGluZUNvbW1lbnRcbiAgICAgICAgICAgIEByZWdpb25zLmxpbmVDb21tZW50ID0gY2xzczonY29tbWVudCcgb3BlbjpsaW5lQ29tbWVudCwgY2xvc2U6bnVsbCwgZm9yY2U6dHJ1ZVxuICAgICAgICAgICAgQGhlYWRlclJlZ0V4cCA9IG5ldyBSZWdFeHAoXCJeKFxcXFxzKiN7Xy5lc2NhcGVSZWdFeHAgQHJlZ2lvbnMubGluZUNvbW1lbnQub3Blbn1cXFxccyopPyhcXFxccyowWzBcXFxcc10rKSRcIilcblxuICAgICAgICBpZiBtdWx0aUNvbW1lbnRcbiAgICAgICAgICAgIEByZWdpb25zLm11bHRpQ29tbWVudCA9XG4gICAgICAgICAgICAgICAgY2xzczogICdjb21tZW50IHRyaXBsZSdcbiAgICAgICAgICAgICAgICBvcGVuOiAgbXVsdGlDb21tZW50Lm9wZW5cbiAgICAgICAgICAgICAgICBjbG9zZTogbXVsdGlDb21tZW50LmNsb3NlXG4gICAgICAgICAgICAgICAgbXVsdGk6IHRydWVcblxuICAgICAgICBzd2l0Y2ggZmlsZVR5cGVcblxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLm11bHRpU3RyaW5nICAgPSBjbHNzOidzdHJpbmcgdHJpcGxlJyAgICAgICAgb3BlbjonXCJcIlwiJyBjbG9zZTogJ1wiXCJcIicgbXVsdGk6IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5tdWx0aVN0cmluZzIgID0gY2xzczonc3RyaW5nIHRyaXBsZSBza2lubnknIG9wZW46XCInJydcIiBjbG9zZTogXCInJydcIiBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmludGVycG9sYXRpb24gPSBjbHNzOidpbnRlcnBvbGF0aW9uJyAgICAgICAgb3BlbjonI3snICBjbG9zZTogJ30nICAgbXVsdGk6IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5zaW5nbGVTdHJpbmcgID0gY2xzczonc3RyaW5nIHNpbmdsZScgICAgICAgIG9wZW46XCInXCIgY2xvc2U6IFwiJ1wiXG5cbiAgICAgICAgICAgIHdoZW4gJ2pzJyAndHMnXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuc2luZ2xlU3RyaW5nICA9IGNsc3M6ICdzdHJpbmcgc2luZ2xlJyAgb3BlbjogXCInXCIgY2xvc2U6IFwiJ1wiXG5cbiAgICAgICAgICAgIHdoZW4gJ25vb24nICdpc3MnXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMubGluZUNvbW1lbnQuc29sbyA9IHRydWUgIyBvbmx5IHNwYWNlcyBiZWZvcmUgY29tbWVudHMgYWxsb3dlZFxuXG4gICAgICAgICAgICB3aGVuICdtZCdcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5tdWx0aVN0cmluZyAgID0gY2xzczonc3RyaW5nIHRyaXBsZScgb3BlbjonYGBgJyAgIGNsb3NlOiAnYGBgJyBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjUgICAgICAgPSBjbHNzOidtYXJrZG93biBoNScgICBvcGVuOicjIyMjIycgY2xvc2U6IG51bGwgIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXI0ICAgICAgID0gY2xzczonbWFya2Rvd24gaDQnICAgb3BlbjonIyMjIycgIGNsb3NlOiBudWxsICBzb2xvOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyMyAgICAgICA9IGNsc3M6J21hcmtkb3duIGgzJyAgIG9wZW46JyMjIycgICBjbG9zZTogbnVsbCAgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjIgICAgICAgPSBjbHNzOidtYXJrZG93biBoMicgICBvcGVuOicjIycgICAgY2xvc2U6IG51bGwgIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXIxICAgICAgID0gY2xzczonbWFya2Rvd24gaDEnICAgb3BlbjonIycgICAgIGNsb3NlOiBudWxsICBzb2xvOiB0cnVlXG5cbiAgICAgICAgQG9wZW5SZWdpb25zID0gXy5maWx0ZXIgQHJlZ2lvbnMsIChyKSAtPiByLmNsb3NlID09IG51bGxcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBkaXNzRm9yTGluZTogKGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IEBnZXRMaW5lIGxpXG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiZGlzc0ZvckxpbmUgLS0gbm8gbGluZSBhdCBpbmRleCAje2xpfT9cIlxuXG4gICAgICAgIGlmIEBibG9ja3M/W2xpXSBcbiAgICAgICAgICAgIHJldHVybiBAYmxvY2tzW2xpXVxuICAgICAgICByID0gQG1lcmdlUmVnaW9ucyBAcGFyc2UodGV4dCwgbGkpLCB0ZXh0LCBsaVxuICAgICAgICByXG5cbiAgICBkaXNzRm9yTGluZUFuZFJhbmdlczogKGxpbmUsIHJncykgLT5cblxuICAgICAgICByZWdpb25zID0gQG1lcmdlUmVnaW9ucyBAcGFyc2UobGluZSwgMCksIGxpbmUsIDBcbiAgICAgICAgbWF0Y2hyLm1lcmdlIHJlZ2lvbnMsIG1hdGNoci5kaXNzZWN0IHJnc1xuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG1lcmdlUmVnaW9uczogKHJlZ2lvbnMsIHRleHQsIGxpKSAtPlxuXG4gICAgICAgIHVuYmFsYW5jZWQgPSBAZ2V0VW5iYWxhbmNlZCBsaVxuXG4gICAgICAgIG1lcmdlZCA9IFtdXG4gICAgICAgIHAgPSAwXG5cbiAgICAgICAgYWRkRGlzcyA9IChzdGFydCwgZW5kLCBmb3JjZSkgPT5cblxuICAgICAgICAgICAgc2xpY2UgPSB0ZXh0LnNsaWNlIHN0YXJ0LCBlbmRcbiAgICAgICAgICAgIGlmIG5vdCBmb3JjZSBhbmQgdW5iYWxhbmNlZD8gYW5kIF8ubGFzdCh1bmJhbGFuY2VkKS5yZWdpb24uY2xzcyAhPSAnaW50ZXJwb2xhdGlvbidcbiAgICAgICAgICAgICAgICBkaXNzID0gQGRpc3NGb3JDbGFzcyBzbGljZSwgMCwgXy5sYXN0KHVuYmFsYW5jZWQpLnJlZ2lvbi5jbHNzXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgZW5kIDwgdGV4dC5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICBzbGljZSArPSAnIHgnICMgbGl0dGxlIGhhY2sgdG8gZ2V0IGZ1bmN0aW9uIGNhbGwgZGV0ZWN0aW9uIHRvIHdvcmtcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IEBzeW50YXguY29uc3RydWN0b3IuZGlzc0ZvclRleHRBbmRTeW50YXggc2xpY2UsIEBzeW50YXgubmFtZVxuICAgICAgICAgICAgICAgICAgICBkaXNzLnBvcCgpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBkaXNzID0gQHN5bnRheC5jb25zdHJ1Y3Rvci5kaXNzRm9yVGV4dEFuZFN5bnRheCBzbGljZSwgQHN5bnRheC5uYW1lXG4gICAgICAgICAgICBpZiBzdGFydFxuICAgICAgICAgICAgICAgIF8uZWFjaCBkaXNzLCAoZCkgLT4gZC5zdGFydCArPSBzdGFydFxuICAgICAgICAgICAgbWVyZ2VkID0gbWVyZ2VkLmNvbmNhdCBkaXNzXG5cbiAgICAgICAgd2hpbGUgcmVnaW9uID0gcmVnaW9ucy5zaGlmdCgpXG5cbiAgICAgICAgICAgIGlmIHJlZ2lvbi5zdGFydCA+IHBcbiAgICAgICAgICAgICAgICBhZGREaXNzIHAsIHJlZ2lvbi5zdGFydFxuICAgICAgICAgICAgaWYgcmVnaW9uLmNsc3MgPT0gJ2ludGVycG9sYXRpb24nXG4gICAgICAgICAgICAgICAgYWRkRGlzcyByZWdpb24uc3RhcnQsIHJlZ2lvbi5zdGFydCtyZWdpb24ubWF0Y2gubGVuZ3RoLCB0cnVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWVyZ2VkLnB1c2ggcmVnaW9uXG4gICAgICAgICAgICBwID0gcmVnaW9uLnN0YXJ0ICsgcmVnaW9uLm1hdGNoLmxlbmd0aFxuXG4gICAgICAgIGlmIHAgPCB0ZXh0Lmxlbmd0aFxuICAgICAgICAgICAgYWRkRGlzcyBwLCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgIG1lcmdlZFxuXG4gICAgZGlzc0ZvckNsYXNzOiAodGV4dCwgc3RhcnQsIGNsc3MpIC0+XG5cbiAgICAgICAgaWYgQGhlYWRlclJlZ0V4cD8udGVzdCB0ZXh0XG4gICAgICAgICAgICBjbHNzICs9ICcgaGVhZGVyJ1xuXG4gICAgICAgIGRpc3MgPSBbXVxuICAgICAgICBtID0gJydcbiAgICAgICAgcCA9IHMgPSBzdGFydFxuICAgICAgICB3aGlsZSBwIDwgdGV4dC5sZW5ndGhcblxuICAgICAgICAgICAgYyA9IHRleHRbcF1cbiAgICAgICAgICAgIHAgKz0gMVxuXG4gICAgICAgICAgICBpZiBjICE9ICcgJ1xuICAgICAgICAgICAgICAgIHMgPSBwLTEgaWYgbSA9PSAnJ1xuICAgICAgICAgICAgICAgIG0gKz0gY1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIHAgPCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBtICE9ICcnXG5cbiAgICAgICAgICAgICAgICBkaXNzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHNcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IG1cbiAgICAgICAgICAgICAgICAgICAgY2xzczogY2xzc1xuICAgICAgICAgICAgICAgIG0gPSAnJ1xuICAgICAgICBkaXNzXG5cbiAgICAjIyNcbiAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyMjXG5cbiAgICBwYXJzZTogKHRleHQsIGxpKSAtPlxuXG4gICAgICAgIHAgICAgICAgPSAwXG4gICAgICAgIGVzY2FwZXMgPSAwXG5cbiAgICAgICAgc3RhY2sgICA9IFtdXG4gICAgICAgIHJlc3VsdCAgPSBbXVxuXG4gICAgICAgIHVuYmFsYW5jZWQgICAgID0gbnVsbFxuICAgICAgICBrZWVwVW5iYWxhbmNlZCA9IFtdXG5cbiAgICAgICAgaWYgdW5iYWxhbmNlZCA9IEBnZXRVbmJhbGFuY2VkIGxpXG4gICAgICAgICAgICBmb3IgbGluZVN0YXJ0UmVnaW9uIGluIHVuYmFsYW5jZWRcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiAgMFxuICAgICAgICAgICAgICAgICAgICByZWdpb246IGxpbmVTdGFydFJlZ2lvbi5yZWdpb25cbiAgICAgICAgICAgICAgICAgICAgZmFrZTogICB0cnVlXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgICAgIHB1c2hUb3AgPSAtPlxuXG4gICAgICAgICAgICBpZiAgdG9wID0gXy5sYXN0IHN0YWNrXG4gICAgICAgICAgICAgICAgbHIgID0gXy5sYXN0IHJlc3VsdFxuICAgICAgICAgICAgICAgIGxlICA9IGxyPyBhbmQgbHIuc3RhcnQgKyBsci5tYXRjaC5sZW5ndGggb3IgMFxuXG4gICAgICAgICAgICAgICAgaWYgcC0xIC0gbGUgPiAwIGFuZCBsZSA8IHRleHQubGVuZ3RoLTFcblxuICAgICAgICAgICAgICAgICAgICB0b3AgPSBfLmNsb25lRGVlcCB0b3BcbiAgICAgICAgICAgICAgICAgICAgdG9wLnN0YXJ0ID0gbGVcbiAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gdGV4dC5zbGljZSBsZSwgcC0xXG4gICAgICAgICAgICAgICAgICAgIHRvcC5jbHNzID0gdG9wLnJlZ2lvbi5jbHNzXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0b3AucmVnaW9uXG5cbiAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSA9IC0+XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB0b3AubWF0Y2gubGVuZ3RoIGFuZCB0b3AubWF0Y2hbMF0gPT0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gdG9wLm1hdGNoLnNsaWNlIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKClcblxuICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0b3AubWF0Y2gudHJpbVJpZ2h0KClcblxuICAgICAgICAgICAgICAgICAgICBpZiB0b3AubWF0Y2gubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRvcC5jbHNzIGluIFsnc3RyaW5nIHNpbmdsZScgJ3N0cmluZyBkb3VibGUnICdzdHJpbmcgdHJpcGxlJyAnc3RyaW5nIHRyaXBsZSBza2lubnknXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwbGl0ID0gdG9wLm1hdGNoLnNwbGl0IC9cXHNcXHMrL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNwbGl0Lmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoIHRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgd29yZCA9IHNwbGl0LnNoaWZ0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZG1hdGNoID0gdG9wLm1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB3b3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCB0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9IF8uY2xvbmVEZWVwIHRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLnN0YXJ0ICs9IHdvcmQubGVuZ3RoICsgMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gb2xkbWF0Y2guc2xpY2Ugd29yZC5sZW5ndGggKyAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCB0b3BcblxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICAgICAgcHVzaEZvcmNlUmVnaW9uID0gKHJlZ2lvbikgPT5cblxuICAgICAgICAgICAgc3RhcnQgPSBwLTErcmVnaW9uLm9wZW4ubGVuZ3RoXG5cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgIG1hdGNoOiByZWdpb24ub3BlblxuICAgICAgICAgICAgICAgIGNsc3M6IHJlZ2lvbi5jbHNzICsgJyBtYXJrZXInXG5cbiAgICAgICAgICAgIGlmIHN0YXJ0IDwgdGV4dC5sZW5ndGgtMVxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQgQGRpc3NGb3JDbGFzcyB0ZXh0LCBzdGFydCwgcmVnaW9uLmNsc3NcblxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgICAgIHB1c2hSZWdpb24gPSAocmVnaW9uKSAtPlxuXG4gICAgICAgICAgICBwdXNoVG9wKClcblxuICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICBzdGFydDogcC0xXG4gICAgICAgICAgICAgICAgbWF0Y2g6IHJlZ2lvbi5vcGVuXG4gICAgICAgICAgICAgICAgY2xzczogcmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcblxuICAgICAgICAgICAgc3RhY2sucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiAgcC0xK3JlZ2lvbi5vcGVuLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJlZ2lvbjogcmVnaW9uXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDBcblxuICAgICAgICBwb3BSZWdpb24gPSAocmVzdCkgLT5cblxuICAgICAgICAgICAgdG9wID0gXy5sYXN0IHN0YWNrXG5cbiAgICAgICAgICAgIGlmIHRvcD8ucmVnaW9uLmNsb3NlPyBhbmQgcmVzdC5zdGFydHNXaXRoIHRvcC5yZWdpb24uY2xvc2VcblxuICAgICAgICAgICAgICAgIHB1c2hUb3AoKVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgdG9wLmZha2VcbiAgICAgICAgICAgICAgICAgICAga2VlcFVuYmFsYW5jZWQudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICBwLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogdG9wLnJlZ2lvblxuXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgICAgICBjbHNzOiB0b3AucmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IHRvcC5yZWdpb24uY2xvc2VcblxuICAgICAgICAgICAgICAgIHAgKz0gdG9wLnJlZ2lvbi5jbG9zZS5sZW5ndGgtMVxuICAgICAgICAgICAgICAgIHJldHVybiB0b3BcbiAgICAgICAgICAgIGZhbHNlXG5cbiAgICAgICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDBcblxuICAgICAgICB3aGlsZSBwIDwgdGV4dC5sZW5ndGhcblxuICAgICAgICAgICAgY2ggPSB0ZXh0W3BdXG4gICAgICAgICAgICBwICs9IDFcblxuICAgICAgICAgICAgdG9wID0gXy5sYXN0IHN0YWNrXG5cbiAgICAgICAgICAgIGlmIGNoID09ICdcXFxcJyB0aGVuIGVzY2FwZXMrK1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIGNoID09ICcgJ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgZXNjYXBlc1xuICAgICAgICAgICAgICAgICAgICBpZiBlc2NhcGVzICUgMiBhbmQgKGNoICE9IFwiI1wiIG9yIHRvcCBhbmQgdG9wLnJlZ2lvbi5jbHNzICE9ICdpbnRlcnBvbGF0aW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzY2FwZXMgPSAwICMgY2hhcmFjdGVyIGlzIGVzY2FwZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSAgICAjIGp1c3QgY29udGludWUgdG8gbmV4dFxuICAgICAgICAgICAgICAgICAgICBlc2NhcGVzID0gMFxuXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gJzonXG4gICAgICAgICAgICAgICAgICAgIGlmIEBzeW50YXgubmFtZSA9PSAnanNvbicgIyBoaWdobGlnaHQganNvbiBkaWN0aW9uYXJ5IGtleXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIF8ubGFzdChyZXN1bHQpLmNsc3MgPT0gJ3N0cmluZyBkb3VibGUgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJlc3VsdC5sZW5ndGggPiAxIGFuZCByZXN1bHRbcmVzdWx0Lmxlbmd0aC0yXS5jbHNzID09ICdzdHJpbmcgZG91YmxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aC0yXS5jbHNzID0gJ3N0cmluZyBkaWN0aW9uYXJ5IGtleSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoOiBjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xzczogJ2RpY3Rpb25hcnkgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICByZXN0ID0gdGV4dC5zbGljZSBwLTFcblxuICAgICAgICAgICAgaWYgZW1wdHkodG9wKSBvciB0b3AucmVnaW9uPy5jbHNzID09ICdpbnRlcnBvbGF0aW9uJ1xuXG4gICAgICAgICAgICAgICAgaWYgcG9wUmVnaW9uIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLm11bHRpQ29tbWVudCBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLm11bHRpQ29tbWVudC5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlDb21tZW50XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEByZWdpb25zLm11bHRpU3RyaW5nIGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMubXVsdGlTdHJpbmcub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLm11bHRpU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEByZWdpb25zLm11bHRpU3RyaW5nMiBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLm11bHRpU3RyaW5nMi5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlTdHJpbmcyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIGVtcHR5IHRvcFxuICAgICAgICAgICAgICAgICAgICBmb3JjZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBwdXNoZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBmb3Igb3BlblJlZ2lvbiBpbiBAb3BlblJlZ2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJlc3Quc3RhcnRzV2l0aCBvcGVuUmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBvcGVuUmVnaW9uLm1pblg/IGFuZCBwLTEgPCBvcGVuUmVnaW9uLm1pblggdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24ubWF4WD8gYW5kIHAtMSA+IG9wZW5SZWdpb24ubWF4WCB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IG9wZW5SZWdpb24uc29sbyBvciBlbXB0eSB0ZXh0LnNsaWNlKDAsIHAtMSkudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24uZm9yY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hGb3JjZVJlZ2lvbiBvcGVuUmVnaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gb3BlblJlZ2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBicmVhayBpZiBmb3JjZWRcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgcHVzaGVkXG5cbiAgICAgICAgICAgICAgICBpZiBAcmVnaW9ucy5yZWdleHAgYW5kIGNoID09IEByZWdpb25zLnJlZ2V4cC5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMucmVnZXhwXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gQHJlZ2lvbnMuc2luZ2xlU3RyaW5nPy5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMuc2luZ2xlU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gQHJlZ2lvbnMuZG91YmxlU3RyaW5nLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5kb3VibGVTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICAgICAgaWYgdG9wLnJlZ2lvbi5jbHNzIGluIFsnc3RyaW5nIGRvdWJsZScgJ3N0cmluZyB0cmlwbGUnXVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLmludGVycG9sYXRpb24gYW5kIHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uLm9wZW4gIyBzdHJpbmcgaW50ZXJwb2xhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgcG9wUmVnaW9uIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICByZWFsU3RhY2sgPSBzdGFjay5maWx0ZXIgKHMpIC0+IG5vdCBzLmZha2UgYW5kIHMucmVnaW9uLmNsb3NlICE9IG51bGwgYW5kIHMucmVnaW9uLm11bHRpXG5cbiAgICAgICAgY2xvc2VTdGFja0l0ZW0gPSAoc3RhY2tJdGVtKSA9PlxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCBAZGlzc0ZvckNsYXNzIHRleHQsIF8ubGFzdChyZXN1bHQpLnN0YXJ0ICsgXy5sYXN0KHJlc3VsdCkubWF0Y2gubGVuZ3RoLCBzdGFja0l0ZW0ucmVnaW9uLmNsc3NcblxuICAgICAgICBpZiByZWFsU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBAc2V0VW5iYWxhbmNlZCBsaSwgcmVhbFN0YWNrXG4gICAgICAgICAgICBjbG9zZVN0YWNrSXRlbSBfLmxhc3QgcmVhbFN0YWNrXG4gICAgICAgIGVsc2UgaWYga2VlcFVuYmFsYW5jZWQubGVuZ3RoXG4gICAgICAgICAgICBAc2V0VW5iYWxhbmNlZCBsaSwga2VlcFVuYmFsYW5jZWRcbiAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGNsb3NlU3RhY2tJdGVtIF8ubGFzdCBzdGFja1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggYW5kIF8ubGFzdChzdGFjaykucmVnaW9uLmNsb3NlID09IG51bGxcbiAgICAgICAgICAgICAgICBjbG9zZVN0YWNrSXRlbSBfLmxhc3Qgc3RhY2tcbiAgICAgICAgICAgIEBzZXRVbmJhbGFuY2VkIGxpXG5cbiAgICAgICAgcmVzdWx0XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBnZXRVbmJhbGFuY2VkOiAobGkpIC0+XG5cbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICBmb3IgdSBpbiBAdW5iYWxhbmNlZFxuICAgICAgICAgICAgaWYgdS5saW5lIDwgbGlcbiAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggYW5kIF8ubGFzdChzdGFjaykucmVnaW9uLmNsc3MgPT0gdS5yZWdpb24uY2xzc1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCB1XG4gICAgICAgICAgICBpZiB1LmxpbmUgPj0gbGlcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgIGlmIHN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgcmV0dXJuIHN0YWNrXG5cbiAgICAgICAgbnVsbFxuXG4gICAgc2V0VW5iYWxhbmNlZDogKGxpLCBzdGFjaykgLT5cblxuICAgICAgICBfLnJlbW92ZSBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSA9PSBsaVxuICAgICAgICBpZiBzdGFjaz9cbiAgICAgICAgICAgIF8uZWFjaCBzdGFjaywgKHMpIC0+IHMubGluZSA9IGxpXG4gICAgICAgICAgICBAdW5iYWxhbmNlZCA9IEB1bmJhbGFuY2VkLmNvbmNhdCBzdGFja1xuICAgICAgICAgICAgQHVuYmFsYW5jZWQuc29ydCAoYSxiKSAtPlxuICAgICAgICAgICAgICAgIGlmIGEubGluZSA9PSBiLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgYS5zdGFydCAtIGIuc3RhcnRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEubGluZSAtIGIubGluZVxuXG4gICAgZGVsZXRlTGluZTogKGxpKSAtPlxuXG4gICAgICAgIF8ucmVtb3ZlIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lID09IGxpXG4gICAgICAgIF8uZWFjaCBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSAtPSAxIGlmIHUubGluZSA+PSBsaVxuXG4gICAgaW5zZXJ0TGluZTogKGxpKSAtPlxuXG4gICAgICAgIF8uZWFjaCBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSArPSAxIGlmIHUubGluZSA+PSBsaVxuXG4gICAgY2xlYXI6IC0+XG5cbiAgICAgICAgQHVuYmFsYW5jZWQgPSBbXVxuICAgICAgICBAYmxvY2tzID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhbGFuY2VyXG4iXX0=
//# sourceURL=../../coffee/editor/balancer.coffee