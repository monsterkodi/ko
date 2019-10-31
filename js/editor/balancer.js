// koffee 1.4.0

/*
0000000     0000000   000       0000000   000   000   0000000  00000000  00000000
000   000  000   000  000      000   000  0000  000  000       000       000   000
0000000    000000000  000      000000000  000 0 000  000       0000000   0000000
000   000  000   000  000      000   000  000  0000  000       000       000   000
0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000
 */
var Balancer, _, empty, kerror, klog, klor, matchr, ref;

ref = require('kxk'), empty = ref.empty, kerror = ref.kerror, klog = ref.klog, _ = ref._;

matchr = require('../tools/matchr');

klor = require('klor');

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
                    value: clss
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
                    top.value = top.region.clss;
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
                        if ((ref1 = top.value) === 'string single' || ref1 === 'string double' || ref1 === 'string triple' || ref1 === 'string triple skinny') {
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
                    value: region.clss + ' marker'
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
                value: region.clss + ' marker'
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
                    value: top.region.clss + ' marker',
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
                    if (escapes % 2 && (ch !== "#" || top && top.region.value !== 'interpolation')) {
                        escapes = 0;
                        continue;
                    }
                    escapes = 0;
                }
                if (ch === ':') {
                    if (this.syntax.name === 'json') {
                        if (_.last(result).value === 'string double marker') {
                            if (result.length > 1 && result[result.length - 2].value === 'string double') {
                                result[result.length - 2].value = 'string dictionary key';
                                result.push({
                                    start: p - 1,
                                    match: ch,
                                    value: 'dictionary marker'
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQTZCLE9BQUEsQ0FBUSxLQUFSLENBQTdCLEVBQUUsaUJBQUYsRUFBUyxtQkFBVCxFQUFpQixlQUFqQixFQUF1Qjs7QUFFdkIsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLE1BQVI7O0FBRUg7SUFFQyxrQkFBQyxNQUFELEVBQVUsT0FBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLFVBQUQ7UUFFVCxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUhYOzt1QkFLSCxRQUFBLEdBQVUsU0FBQyxLQUFEO0FBQ04sWUFBQTtRQUFBLFlBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLEtBQXFCLFNBQXJCLElBQUEsSUFBQSxLQUErQixJQUEvQixJQUFBLElBQUEsS0FBb0MsYUFBcEMsSUFBQSxJQUFBLEtBQWtELE9BQWxELElBQUEsSUFBQSxLQUEwRCxNQUExRCxJQUFBLElBQUEsS0FBaUUsTUFBcEU7bUJBQ0ksSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLENBQUMsT0FBTCxDQUFhLEtBQWIsRUFBb0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUE1QixFQURkOztJQURNOzt1QkFVVixXQUFBLEdBQWEsU0FBQyxRQUFEO0FBRVQsWUFBQTtRQUFBLFdBQUE7QUFBYyxvQkFBTyxRQUFQO0FBQUEscUJBQ0wsUUFESztBQUFBLHFCQUNJLFFBREo7QUFBQSxxQkFDYSxJQURiO0FBQUEscUJBQ2tCLEtBRGxCO0FBQUEscUJBQ3dCLE1BRHhCO0FBQUEscUJBQytCLElBRC9CO0FBQUEscUJBQ29DLEtBRHBDO0FBQUEscUJBQzBDLE1BRDFDOzJCQUNtRTtBQURuRSxxQkFFTCxNQUZLO0FBQUEscUJBRUUs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LFNBQUMsQ0FBRDtZQUFPLElBQWUsQ0FBQyxDQUFDLElBQUYsSUFBVSxFQUF6Qjt1QkFBQSxDQUFDLENBQUMsSUFBRixJQUFVLEVBQVY7O1FBQVAsQ0FBcEI7SUFGUTs7dUJBSVosS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsVUFBRCxHQUFjO2VBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUhQOzs7Ozs7QUFLWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgZW1wdHksIGtlcnJvciwga2xvZywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tYXRjaHIgPSByZXF1aXJlICcuLi90b29scy9tYXRjaHInXG5rbG9yICAgPSByZXF1aXJlICdrbG9yJ1xuXG5jbGFzcyBCYWxhbmNlclxuXG4gICAgQDogKEBzeW50YXgsIEBnZXRMaW5lKSAtPlxuXG4gICAgICAgIEB1bmJhbGFuY2VkID0gW11cbiAgICAgICAgQGJsb2NrcyA9IG51bGxcblxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG4gICAgICAgIGlmIEBzeW50YXgubmFtZSBub3QgaW4gWydicm93c2VyJyAna28nICdjb21tYW5kbGluZScgJ21hY3JvJyAndGVybScgJ3Rlc3QnXVxuICAgICAgICAgICAgQGJsb2NrcyA9IGtsb3IuZGlzc2VjdCBsaW5lcywgQHN5bnRheC5uYW1lXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzZXRGaWxlVHlwZTogKGZpbGVUeXBlKSAtPlxuXG4gICAgICAgIGxpbmVDb21tZW50ID0gc3dpdGNoIGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICdzaCcgJ2JhdCcgJ25vb24nICdrbycgJ3R4dCcgJ2Zpc2gnICAgICAgICAgICAgICB0aGVuICcjJ1xuICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAgICAgdGhlbiAnLy8nXG4gICAgICAgICAgICB3aGVuICdpc3MnICdpbmknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICc7J1xuXG4gICAgICAgIG11bHRpQ29tbWVudCA9IHN3aXRjaCBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOicjIyMnICBjbG9zZTonIyMjJ1xuICAgICAgICAgICAgd2hlbiAnaHRtbCcgJ21kJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOic8IS0tJyBjbG9zZTonLS0+J1xuICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAgICAgdGhlbiBvcGVuOicvKicgICBjbG9zZTonKi8nXG5cbiAgICAgICAgQHJlZ2lvbnMgPVxuICAgICAgICAgICAgZG91YmxlU3RyaW5nOiBjbHNzOidzdHJpbmcgZG91YmxlJyBvcGVuOidcIicgY2xvc2U6J1wiJ1xuXG4gICAgICAgIGlmIGxpbmVDb21tZW50XG4gICAgICAgICAgICBAcmVnaW9ucy5saW5lQ29tbWVudCA9IGNsc3M6J2NvbW1lbnQnIG9wZW46bGluZUNvbW1lbnQsIGNsb3NlOm51bGwsIGZvcmNlOnRydWVcbiAgICAgICAgICAgIEBoZWFkZXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiXihcXFxccyoje18uZXNjYXBlUmVnRXhwIEByZWdpb25zLmxpbmVDb21tZW50Lm9wZW59XFxcXHMqKT8oXFxcXHMqMFswXFxcXHNdKykkXCIpXG5cbiAgICAgICAgaWYgbXVsdGlDb21tZW50XG4gICAgICAgICAgICBAcmVnaW9ucy5tdWx0aUNvbW1lbnQgPVxuICAgICAgICAgICAgICAgIGNsc3M6ICAnY29tbWVudCB0cmlwbGUnXG4gICAgICAgICAgICAgICAgb3BlbjogIG11bHRpQ29tbWVudC5vcGVuXG4gICAgICAgICAgICAgICAgY2xvc2U6IG11bHRpQ29tbWVudC5jbG9zZVxuICAgICAgICAgICAgICAgIG11bHRpOiB0cnVlXG5cbiAgICAgICAgc3dpdGNoIGZpbGVUeXBlXG5cbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5tdWx0aVN0cmluZyAgID0gY2xzczonc3RyaW5nIHRyaXBsZScgICAgICAgIG9wZW46J1wiXCJcIicgY2xvc2U6ICdcIlwiXCInIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMubXVsdGlTdHJpbmcyICA9IGNsc3M6J3N0cmluZyB0cmlwbGUgc2tpbm55JyBvcGVuOlwiJycnXCIsIGNsb3NlOiBcIicnJ1wiLCBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmludGVycG9sYXRpb24gPSBjbHNzOidpbnRlcnBvbGF0aW9uJyAgICAgICAgb3BlbjonI3snICBjbG9zZTogJ30nICAgbXVsdGk6IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5zaW5nbGVTdHJpbmcgID0gY2xzczonc3RyaW5nIHNpbmdsZScgICAgICAgIG9wZW46XCInXCIsIGNsb3NlOiBcIidcIlxuXG4gICAgICAgICAgICB3aGVuICdqcycgJ3RzJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLnNpbmdsZVN0cmluZyAgPSBjbHNzOiAnc3RyaW5nIHNpbmdsZScgIG9wZW46IFwiJ1wiLCBjbG9zZTogXCInXCJcblxuICAgICAgICAgICAgd2hlbiAnbm9vbicgJ2lzcydcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5saW5lQ29tbWVudC5zb2xvID0gdHJ1ZSAjIG9ubHkgc3BhY2VzIGJlZm9yZSBjb21tZW50cyBhbGxvd2VkXG5cbiAgICAgICAgICAgIHdoZW4gJ21kJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLm11bHRpU3RyaW5nICAgPSBjbHNzOidzdHJpbmcgdHJpcGxlJyBvcGVuOidgYGAnICAgY2xvc2U6ICdgYGAnIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyNSAgICAgICA9IGNsc3M6J21hcmtkb3duIGg1JyAgIG9wZW46JyMjIyMjJyBjbG9zZTogbnVsbCwgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjQgICAgICAgPSBjbHNzOidtYXJrZG93biBoNCcgICBvcGVuOicjIyMjJyAgY2xvc2U6IG51bGwsIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXIzICAgICAgID0gY2xzczonbWFya2Rvd24gaDMnICAgb3BlbjonIyMjJyAgIGNsb3NlOiBudWxsLCBzb2xvOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyMiAgICAgICA9IGNsc3M6J21hcmtkb3duIGgyJyAgIG9wZW46JyMjJyAgICBjbG9zZTogbnVsbCwgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjEgICAgICAgPSBjbHNzOidtYXJrZG93biBoMScgICBvcGVuOicjJyAgICAgY2xvc2U6IG51bGwsIHNvbG86IHRydWVcblxuICAgICAgICBAb3BlblJlZ2lvbnMgPSBfLmZpbHRlciBAcmVnaW9ucywgKHIpIC0+IHIuY2xvc2UgPT0gbnVsbFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGRpc3NGb3JMaW5lOiAobGkpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gQGdldExpbmUgbGlcblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJkaXNzRm9yTGluZSAtLSBubyBsaW5lIGF0IGluZGV4ICN7bGl9P1wiXG5cbiAgICAgICAgIyByID0gQG1lcmdlUmVnaW9ucyBAcGFyc2UodGV4dCwgbGkpLCB0ZXh0LCBsaVxuICAgICAgICBcbiAgICAgICAgaWYgQGJsb2Nrcz9bbGldIFxuICAgICAgICAgICAgIyBsb2cgJ2JsY2snIGxpLCBAYmxvY2tzW2xpXVxuICAgICAgICAgICAgIyBsb2cgJ2Rpc3MnIGxpLCByXG4gICAgICAgICAgICByZXR1cm4gQGJsb2Nrc1tsaV1cbiAgICAgICAgciA9IEBtZXJnZVJlZ2lvbnMgQHBhcnNlKHRleHQsIGxpKSwgdGV4dCwgbGlcbiAgICAgICAgclxuXG4gICAgZGlzc0ZvckxpbmVBbmRSYW5nZXM6IChsaW5lLCByZ3MpIC0+XG5cbiAgICAgICAgcmVnaW9ucyA9IEBtZXJnZVJlZ2lvbnMgQHBhcnNlKGxpbmUsIDApLCBsaW5lLCAwXG4gICAgICAgIG1hdGNoci5tZXJnZSByZWdpb25zLCBtYXRjaHIuZGlzc2VjdCByZ3NcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBtZXJnZVJlZ2lvbnM6IChyZWdpb25zLCB0ZXh0LCBsaSkgLT5cblxuICAgICAgICB1bmJhbGFuY2VkID0gQGdldFVuYmFsYW5jZWQgbGlcblxuICAgICAgICBtZXJnZWQgPSBbXVxuICAgICAgICBwID0gMFxuXG4gICAgICAgIGFkZERpc3MgPSAoc3RhcnQsIGVuZCwgZm9yY2UpID0+XG5cbiAgICAgICAgICAgIHNsaWNlID0gdGV4dC5zbGljZSBzdGFydCwgZW5kXG4gICAgICAgICAgICBpZiBub3QgZm9yY2UgYW5kIHVuYmFsYW5jZWQ/IGFuZCBfLmxhc3QodW5iYWxhbmNlZCkucmVnaW9uLmNsc3MgIT0gJ2ludGVycG9sYXRpb24nXG4gICAgICAgICAgICAgICAgZGlzcyA9IEBkaXNzRm9yQ2xhc3Mgc2xpY2UsIDAsIF8ubGFzdCh1bmJhbGFuY2VkKS5yZWdpb24uY2xzc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIGVuZCA8IHRleHQubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgc2xpY2UgKz0gJyB4JyAjIGxpdHRsZSBoYWNrIHRvIGdldCBmdW5jdGlvbiBjYWxsIGRldGVjdGlvbiB0byB3b3JrXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBAc3ludGF4LmNvbnN0cnVjdG9yLmRpc3NGb3JUZXh0QW5kU3ludGF4IHNsaWNlLCBAc3ludGF4Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZGlzcy5wb3AoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IEBzeW50YXguY29uc3RydWN0b3IuZGlzc0ZvclRleHRBbmRTeW50YXggc2xpY2UsIEBzeW50YXgubmFtZVxuICAgICAgICAgICAgaWYgc3RhcnRcbiAgICAgICAgICAgICAgICBfLmVhY2ggZGlzcywgKGQpIC0+IGQuc3RhcnQgKz0gc3RhcnRcbiAgICAgICAgICAgIG1lcmdlZCA9IG1lcmdlZC5jb25jYXQgZGlzc1xuXG4gICAgICAgIHdoaWxlIHJlZ2lvbiA9IHJlZ2lvbnMuc2hpZnQoKVxuXG4gICAgICAgICAgICBpZiByZWdpb24uc3RhcnQgPiBwXG4gICAgICAgICAgICAgICAgYWRkRGlzcyBwLCByZWdpb24uc3RhcnRcbiAgICAgICAgICAgIGlmIHJlZ2lvbi5jbHNzID09ICdpbnRlcnBvbGF0aW9uJ1xuICAgICAgICAgICAgICAgIGFkZERpc3MgcmVnaW9uLnN0YXJ0LCByZWdpb24uc3RhcnQrcmVnaW9uLm1hdGNoLmxlbmd0aCwgdHJ1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1lcmdlZC5wdXNoIHJlZ2lvblxuICAgICAgICAgICAgcCA9IHJlZ2lvbi5zdGFydCArIHJlZ2lvbi5tYXRjaC5sZW5ndGhcblxuICAgICAgICBpZiBwIDwgdGV4dC5sZW5ndGhcbiAgICAgICAgICAgIGFkZERpc3MgcCwgdGV4dC5sZW5ndGhcblxuICAgICAgICBtZXJnZWRcblxuICAgIGRpc3NGb3JDbGFzczogKHRleHQsIHN0YXJ0LCBjbHNzKSAtPlxuXG4gICAgICAgIGlmIEBoZWFkZXJSZWdFeHA/LnRlc3QgdGV4dFxuICAgICAgICAgICAgY2xzcyArPSAnIGhlYWRlcidcblxuICAgICAgICBkaXNzID0gW11cbiAgICAgICAgbSA9ICcnXG4gICAgICAgIHAgPSBzID0gc3RhcnRcbiAgICAgICAgd2hpbGUgcCA8IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIGMgPSB0ZXh0W3BdXG4gICAgICAgICAgICBwICs9IDFcblxuICAgICAgICAgICAgaWYgYyAhPSAnICdcbiAgICAgICAgICAgICAgICBzID0gcC0xIGlmIG0gPT0gJydcbiAgICAgICAgICAgICAgICBtICs9IGNcbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBwIDwgdGV4dC5sZW5ndGhcblxuICAgICAgICAgICAgaWYgbSAhPSAnJ1xuXG4gICAgICAgICAgICAgICAgZGlzcy5wdXNoXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoOiBtXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjbHNzXG4gICAgICAgICAgICAgICAgbSA9ICcnXG4gICAgICAgIGRpc3NcblxuICAgICMjI1xuICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIyNcblxuICAgIHBhcnNlOiAodGV4dCwgbGkpIC0+XG5cbiAgICAgICAgcCAgICAgICA9IDBcbiAgICAgICAgZXNjYXBlcyA9IDBcblxuICAgICAgICBzdGFjayAgID0gW11cbiAgICAgICAgcmVzdWx0ICA9IFtdXG5cbiAgICAgICAgdW5iYWxhbmNlZCAgICAgPSBudWxsXG4gICAgICAgIGtlZXBVbmJhbGFuY2VkID0gW11cblxuICAgICAgICBpZiB1bmJhbGFuY2VkID0gQGdldFVuYmFsYW5jZWQgbGlcbiAgICAgICAgICAgIGZvciBsaW5lU3RhcnRSZWdpb24gaW4gdW5iYWxhbmNlZFxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICAwXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogbGluZVN0YXJ0UmVnaW9uLnJlZ2lvblxuICAgICAgICAgICAgICAgICAgICBmYWtlOiAgIHRydWVcblxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICAgICAgcHVzaFRvcCA9IC0+XG5cbiAgICAgICAgICAgIGlmICB0b3AgPSBfLmxhc3Qgc3RhY2tcbiAgICAgICAgICAgICAgICBsciAgPSBfLmxhc3QgcmVzdWx0XG4gICAgICAgICAgICAgICAgbGUgID0gbHI/IGFuZCBsci5zdGFydCArIGxyLm1hdGNoLmxlbmd0aCBvciAwXG5cbiAgICAgICAgICAgICAgICBpZiBwLTEgLSBsZSA+IDAgYW5kIGxlIDwgdGV4dC5sZW5ndGgtMVxuXG4gICAgICAgICAgICAgICAgICAgIHRvcCA9IF8uY2xvbmVEZWVwIHRvcFxuICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgPSBsZVxuICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0ZXh0LnNsaWNlIGxlLCBwLTFcbiAgICAgICAgICAgICAgICAgICAgdG9wLnZhbHVlID0gdG9wLnJlZ2lvbi5jbHNzXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0b3AucmVnaW9uXG5cbiAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSA9IC0+XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB0b3AubWF0Y2gubGVuZ3RoIGFuZCB0b3AubWF0Y2hbMF0gPT0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gdG9wLm1hdGNoLnNsaWNlIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKClcblxuICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0b3AubWF0Y2gudHJpbVJpZ2h0KClcblxuICAgICAgICAgICAgICAgICAgICBpZiB0b3AubWF0Y2gubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRvcC52YWx1ZSBpbiBbJ3N0cmluZyBzaW5nbGUnICdzdHJpbmcgZG91YmxlJyAnc3RyaW5nIHRyaXBsZScgJ3N0cmluZyB0cmlwbGUgc2tpbm55J11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGxpdCA9IHRvcC5tYXRjaC5zcGxpdCAvXFxzXFxzKy9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBzcGxpdC5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCB0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIHdvcmQgPSBzcGxpdC5zaGlmdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRtYXRjaCA9IHRvcC5tYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gd29yZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2ggdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSBfLmNsb25lRGVlcCB0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5zdGFydCArPSB3b3JkLmxlbmd0aCArIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IG9sZG1hdGNoLnNsaWNlIHdvcmQubGVuZ3RoICsgMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2ggdG9wXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgICAgIHB1c2hGb3JjZVJlZ2lvbiA9IChyZWdpb24pID0+XG5cbiAgICAgICAgICAgIHN0YXJ0ID0gcC0xK3JlZ2lvbi5vcGVuLmxlbmd0aFxuXG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICBtYXRjaDogcmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcblxuICAgICAgICAgICAgaWYgc3RhcnQgPCB0ZXh0Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCBAZGlzc0ZvckNsYXNzIHRleHQsIHN0YXJ0LCByZWdpb24uY2xzc1xuXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICAgICAgcHVzaFJlZ2lvbiA9IChyZWdpb24pIC0+XG5cbiAgICAgICAgICAgIHB1c2hUb3AoKVxuXG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICBtYXRjaDogcmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcblxuICAgICAgICAgICAgc3RhY2sucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiAgcC0xK3JlZ2lvbi5vcGVuLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJlZ2lvbjogcmVnaW9uXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDBcblxuICAgICAgICBwb3BSZWdpb24gPSAocmVzdCkgLT5cblxuICAgICAgICAgICAgdG9wID0gXy5sYXN0IHN0YWNrXG5cbiAgICAgICAgICAgIGlmIHRvcD8ucmVnaW9uLmNsb3NlPyBhbmQgcmVzdC5zdGFydHNXaXRoIHRvcC5yZWdpb24uY2xvc2VcblxuICAgICAgICAgICAgICAgIHB1c2hUb3AoKVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgdG9wLmZha2VcbiAgICAgICAgICAgICAgICAgICAga2VlcFVuYmFsYW5jZWQudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICBwLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogdG9wLnJlZ2lvblxuXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdG9wLnJlZ2lvbi5jbHNzICsgJyBtYXJrZXInXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoOiB0b3AucmVnaW9uLmNsb3NlXG5cbiAgICAgICAgICAgICAgICBwICs9IHRvcC5yZWdpb24uY2xvc2UubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9wXG4gICAgICAgICAgICBmYWxzZVxuXG4gICAgICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwXG5cbiAgICAgICAgd2hpbGUgcCA8IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIGNoID0gdGV4dFtwXVxuICAgICAgICAgICAgcCArPSAxXG5cbiAgICAgICAgICAgIHRvcCA9IF8ubGFzdCBzdGFja1xuXG4gICAgICAgICAgICBpZiBjaCA9PSAnXFxcXCcgdGhlbiBlc2NhcGVzKytcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBjaCA9PSAnICdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIGVzY2FwZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgZXNjYXBlcyAlIDIgYW5kIChjaCAhPSBcIiNcIiBvciB0b3AgYW5kIHRvcC5yZWdpb24udmFsdWUgIT0gJ2ludGVycG9sYXRpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgZXNjYXBlcyA9IDAgIyBjaGFyYWN0ZXIgaXMgZXNjYXBlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlICAgICMganVzdCBjb250aW51ZSB0byBuZXh0XG4gICAgICAgICAgICAgICAgICAgIGVzY2FwZXMgPSAwXG5cbiAgICAgICAgICAgICAgICBpZiBjaCA9PSAnOidcbiAgICAgICAgICAgICAgICAgICAgaWYgQHN5bnRheC5uYW1lID09ICdqc29uJyAjIGhpZ2hsaWdodCBqc29uIGRpY3Rpb25hcnkga2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgXy5sYXN0KHJlc3VsdCkudmFsdWUgPT0gJ3N0cmluZyBkb3VibGUgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJlc3VsdC5sZW5ndGggPiAxIGFuZCByZXN1bHRbcmVzdWx0Lmxlbmd0aC0yXS52YWx1ZSA9PSAnc3RyaW5nIGRvdWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGgtMl0udmFsdWUgPSAnc3RyaW5nIGRpY3Rpb25hcnkga2V5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2RpY3Rpb25hcnkgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICByZXN0ID0gdGV4dC5zbGljZSBwLTFcblxuICAgICAgICAgICAgaWYgZW1wdHkodG9wKSBvciB0b3AucmVnaW9uPy5jbHNzID09ICdpbnRlcnBvbGF0aW9uJ1xuXG4gICAgICAgICAgICAgICAgaWYgcG9wUmVnaW9uIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLm11bHRpQ29tbWVudCBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLm11bHRpQ29tbWVudC5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlDb21tZW50XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEByZWdpb25zLm11bHRpU3RyaW5nIGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMubXVsdGlTdHJpbmcub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLm11bHRpU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEByZWdpb25zLm11bHRpU3RyaW5nMiBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLm11bHRpU3RyaW5nMi5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlTdHJpbmcyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIGVtcHR5IHRvcFxuICAgICAgICAgICAgICAgICAgICBmb3JjZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBwdXNoZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBmb3Igb3BlblJlZ2lvbiBpbiBAb3BlblJlZ2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJlc3Quc3RhcnRzV2l0aCBvcGVuUmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBvcGVuUmVnaW9uLm1pblg/IGFuZCBwLTEgPCBvcGVuUmVnaW9uLm1pblggdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24ubWF4WD8gYW5kIHAtMSA+IG9wZW5SZWdpb24ubWF4WCB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IG9wZW5SZWdpb24uc29sbyBvciBlbXB0eSB0ZXh0LnNsaWNlKDAsIHAtMSkudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24uZm9yY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hGb3JjZVJlZ2lvbiBvcGVuUmVnaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gb3BlblJlZ2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBicmVhayBpZiBmb3JjZWRcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgcHVzaGVkXG5cbiAgICAgICAgICAgICAgICBpZiBAcmVnaW9ucy5yZWdleHAgYW5kIGNoID09IEByZWdpb25zLnJlZ2V4cC5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMucmVnZXhwXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gQHJlZ2lvbnMuc2luZ2xlU3RyaW5nPy5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMuc2luZ2xlU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gQHJlZ2lvbnMuZG91YmxlU3RyaW5nLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5kb3VibGVTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICAgICAgaWYgdG9wLnJlZ2lvbi5jbHNzIGluIFsnc3RyaW5nIGRvdWJsZScgJ3N0cmluZyB0cmlwbGUnXVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLmludGVycG9sYXRpb24gYW5kIHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uLm9wZW4gIyBzdHJpbmcgaW50ZXJwb2xhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgcG9wUmVnaW9uIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICByZWFsU3RhY2sgPSBzdGFjay5maWx0ZXIgKHMpIC0+IG5vdCBzLmZha2UgYW5kIHMucmVnaW9uLmNsb3NlICE9IG51bGwgYW5kIHMucmVnaW9uLm11bHRpXG5cbiAgICAgICAgY2xvc2VTdGFja0l0ZW0gPSAoc3RhY2tJdGVtKSA9PlxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCBAZGlzc0ZvckNsYXNzIHRleHQsIF8ubGFzdChyZXN1bHQpLnN0YXJ0ICsgXy5sYXN0KHJlc3VsdCkubWF0Y2gubGVuZ3RoLCBzdGFja0l0ZW0ucmVnaW9uLmNsc3NcblxuICAgICAgICBpZiByZWFsU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBAc2V0VW5iYWxhbmNlZCBsaSwgcmVhbFN0YWNrXG4gICAgICAgICAgICBjbG9zZVN0YWNrSXRlbSBfLmxhc3QgcmVhbFN0YWNrXG4gICAgICAgIGVsc2UgaWYga2VlcFVuYmFsYW5jZWQubGVuZ3RoXG4gICAgICAgICAgICBAc2V0VW5iYWxhbmNlZCBsaSwga2VlcFVuYmFsYW5jZWRcbiAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGNsb3NlU3RhY2tJdGVtIF8ubGFzdCBzdGFja1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggYW5kIF8ubGFzdChzdGFjaykucmVnaW9uLmNsb3NlID09IG51bGxcbiAgICAgICAgICAgICAgICBjbG9zZVN0YWNrSXRlbSBfLmxhc3Qgc3RhY2tcbiAgICAgICAgICAgIEBzZXRVbmJhbGFuY2VkIGxpXG5cbiAgICAgICAgcmVzdWx0XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBnZXRVbmJhbGFuY2VkOiAobGkpIC0+XG5cbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICBmb3IgdSBpbiBAdW5iYWxhbmNlZFxuICAgICAgICAgICAgaWYgdS5saW5lIDwgbGlcbiAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggYW5kIF8ubGFzdChzdGFjaykucmVnaW9uLmNsc3MgPT0gdS5yZWdpb24uY2xzc1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCB1XG4gICAgICAgICAgICBpZiB1LmxpbmUgPj0gbGlcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgIGlmIHN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgcmV0dXJuIHN0YWNrXG5cbiAgICAgICAgbnVsbFxuXG4gICAgc2V0VW5iYWxhbmNlZDogKGxpLCBzdGFjaykgLT5cblxuICAgICAgICBfLnJlbW92ZSBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSA9PSBsaVxuICAgICAgICBpZiBzdGFjaz9cbiAgICAgICAgICAgIF8uZWFjaCBzdGFjaywgKHMpIC0+IHMubGluZSA9IGxpXG4gICAgICAgICAgICBAdW5iYWxhbmNlZCA9IEB1bmJhbGFuY2VkLmNvbmNhdCBzdGFja1xuICAgICAgICAgICAgQHVuYmFsYW5jZWQuc29ydCAoYSxiKSAtPlxuICAgICAgICAgICAgICAgIGlmIGEubGluZSA9PSBiLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgYS5zdGFydCAtIGIuc3RhcnRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEubGluZSAtIGIubGluZVxuXG4gICAgZGVsZXRlTGluZTogKGxpKSAtPlxuXG4gICAgICAgIF8ucmVtb3ZlIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lID09IGxpXG4gICAgICAgIF8uZWFjaCBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSAtPSAxIGlmIHUubGluZSA+PSBsaVxuXG4gICAgaW5zZXJ0TGluZTogKGxpKSAtPlxuXG4gICAgICAgIF8uZWFjaCBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSArPSAxIGlmIHUubGluZSA+PSBsaVxuXG4gICAgY2xlYXI6IC0+XG5cbiAgICAgICAgQHVuYmFsYW5jZWQgPSBbXVxuICAgICAgICBAYmxvY2tzID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhbGFuY2VyXG4iXX0=
//# sourceURL=../../coffee/editor/balancer.coffee