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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQTZCLE9BQUEsQ0FBUSxLQUFSLENBQTdCLEVBQUUsaUJBQUYsRUFBUyxtQkFBVCxFQUFpQixlQUFqQixFQUF1Qjs7QUFFdkIsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLE1BQVI7O0FBRUg7SUFFVyxrQkFBQyxNQUFELEVBQVUsT0FBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLFVBQUQ7UUFFbkIsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIRDs7dUJBS2IsUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUNOLFlBQUE7UUFBQSxZQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixLQUFxQixTQUFyQixJQUFBLElBQUEsS0FBK0IsSUFBL0IsSUFBQSxJQUFBLEtBQW9DLGFBQXBDLElBQUEsSUFBQSxLQUFrRCxPQUFsRCxJQUFBLElBQUEsS0FBMEQsTUFBMUQsSUFBQSxJQUFBLEtBQWlFLE1BQXBFO21CQUNJLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBNUIsRUFEZDs7SUFETTs7dUJBVVYsV0FBQSxHQUFhLFNBQUMsUUFBRDtBQUVULFlBQUE7UUFBQSxXQUFBO0FBQWMsb0JBQU8sUUFBUDtBQUFBLHFCQUNMLFFBREs7QUFBQSxxQkFDSSxRQURKO0FBQUEscUJBQ2EsSUFEYjtBQUFBLHFCQUNrQixLQURsQjtBQUFBLHFCQUN3QixNQUR4QjtBQUFBLHFCQUMrQixJQUQvQjtBQUFBLHFCQUNvQyxLQURwQztBQUFBLHFCQUMwQyxNQUQxQzsyQkFDbUU7QUFEbkUscUJBRUwsTUFGSztBQUFBLHFCQUVF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QixTQUFDLENBQUQ7WUFBTyxJQUFlLENBQUMsQ0FBQyxJQUFGLElBQVUsRUFBekI7dUJBQUEsQ0FBQyxDQUFDLElBQUYsSUFBVSxFQUFWOztRQUFQLENBQXBCO0lBRlE7O3VCQUlaLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLFVBQUQsR0FBYztlQUNkLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIUDs7Ozs7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IGVtcHR5LCBrZXJyb3IsIGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubWF0Y2hyID0gcmVxdWlyZSAnLi4vdG9vbHMvbWF0Y2hyJ1xua2xvciAgID0gcmVxdWlyZSAna2xvcidcblxuY2xhc3MgQmFsYW5jZXJcblxuICAgIGNvbnN0cnVjdG9yOiAoQHN5bnRheCwgQGdldExpbmUpIC0+XG5cbiAgICAgICAgQHVuYmFsYW5jZWQgPSBbXVxuICAgICAgICBAYmxvY2tzID0gbnVsbFxuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgaWYgQHN5bnRheC5uYW1lIG5vdCBpbiBbJ2Jyb3dzZXInICdrbycgJ2NvbW1hbmRsaW5lJyAnbWFjcm8nICd0ZXJtJyAndGVzdCddXG4gICAgICAgICAgICBAYmxvY2tzID0ga2xvci5kaXNzZWN0IGxpbmVzLCBAc3ludGF4Lm5hbWVcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNldEZpbGVUeXBlOiAoZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgbGluZUNvbW1lbnQgPSBzd2l0Y2ggZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgJ3NoJyAnYmF0JyAnbm9vbicgJ2tvJyAndHh0JyAnZmlzaCcgICAgICAgICAgICAgIHRoZW4gJyMnXG4gICAgICAgICAgICB3aGVuICdzdHlsJyAnY3BwJyAnYycgJ2gnICdocHAnICdjeHgnICdjcycgJ2pzJyAnc2NzcycgJ3RzJyAnc3dpZnQnICAgICB0aGVuICcvLydcbiAgICAgICAgICAgIHdoZW4gJ2lzcycgJ2luaScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gJzsnXG5cbiAgICAgICAgbXVsdGlDb21tZW50ID0gc3dpdGNoIGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIG9wZW46JyMjIycgIGNsb3NlOicjIyMnXG4gICAgICAgICAgICB3aGVuICdodG1sJyAnbWQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIG9wZW46JzwhLS0nIGNsb3NlOictLT4nXG4gICAgICAgICAgICB3aGVuICdzdHlsJyAnY3BwJyAnYycgJ2gnICdocHAnICdjeHgnICdjcycgJ2pzJyAnc2NzcycgJ3RzJyAnc3dpZnQnICAgICB0aGVuIG9wZW46Jy8qJyAgIGNsb3NlOicqLydcblxuICAgICAgICBAcmVnaW9ucyA9XG4gICAgICAgICAgICBkb3VibGVTdHJpbmc6IGNsc3M6J3N0cmluZyBkb3VibGUnIG9wZW46J1wiJyBjbG9zZTonXCInXG5cbiAgICAgICAgaWYgbGluZUNvbW1lbnRcbiAgICAgICAgICAgIEByZWdpb25zLmxpbmVDb21tZW50ID0gY2xzczonY29tbWVudCcgb3BlbjpsaW5lQ29tbWVudCwgY2xvc2U6bnVsbCwgZm9yY2U6dHJ1ZVxuICAgICAgICAgICAgQGhlYWRlclJlZ0V4cCA9IG5ldyBSZWdFeHAoXCJeKFxcXFxzKiN7Xy5lc2NhcGVSZWdFeHAgQHJlZ2lvbnMubGluZUNvbW1lbnQub3Blbn1cXFxccyopPyhcXFxccyowWzBcXFxcc10rKSRcIilcblxuICAgICAgICBpZiBtdWx0aUNvbW1lbnRcbiAgICAgICAgICAgIEByZWdpb25zLm11bHRpQ29tbWVudCA9XG4gICAgICAgICAgICAgICAgY2xzczogICdjb21tZW50IHRyaXBsZSdcbiAgICAgICAgICAgICAgICBvcGVuOiAgbXVsdGlDb21tZW50Lm9wZW5cbiAgICAgICAgICAgICAgICBjbG9zZTogbXVsdGlDb21tZW50LmNsb3NlXG4gICAgICAgICAgICAgICAgbXVsdGk6IHRydWVcblxuICAgICAgICBzd2l0Y2ggZmlsZVR5cGVcblxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLm11bHRpU3RyaW5nICAgPSBjbHNzOidzdHJpbmcgdHJpcGxlJyAgICAgICAgb3BlbjonXCJcIlwiJyBjbG9zZTogJ1wiXCJcIicgbXVsdGk6IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5tdWx0aVN0cmluZzIgID0gY2xzczonc3RyaW5nIHRyaXBsZSBza2lubnknIG9wZW46XCInJydcIiwgY2xvc2U6IFwiJycnXCIsIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaW50ZXJwb2xhdGlvbiA9IGNsc3M6J2ludGVycG9sYXRpb24nICAgICAgICBvcGVuOicjeycgIGNsb3NlOiAnfScgICBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLnNpbmdsZVN0cmluZyAgPSBjbHNzOidzdHJpbmcgc2luZ2xlJyAgICAgICAgb3BlbjpcIidcIiwgY2xvc2U6IFwiJ1wiXG5cbiAgICAgICAgICAgIHdoZW4gJ2pzJyAndHMnXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuc2luZ2xlU3RyaW5nICA9IGNsc3M6ICdzdHJpbmcgc2luZ2xlJyAgb3BlbjogXCInXCIsIGNsb3NlOiBcIidcIlxuXG4gICAgICAgICAgICB3aGVuICdub29uJyAnaXNzJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLmxpbmVDb21tZW50LnNvbG8gPSB0cnVlICMgb25seSBzcGFjZXMgYmVmb3JlIGNvbW1lbnRzIGFsbG93ZWRcblxuICAgICAgICAgICAgd2hlbiAnbWQnXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMubXVsdGlTdHJpbmcgICA9IGNsc3M6J3N0cmluZyB0cmlwbGUnIG9wZW46J2BgYCcgICBjbG9zZTogJ2BgYCcgbXVsdGk6IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXI1ICAgICAgID0gY2xzczonbWFya2Rvd24gaDUnICAgb3BlbjonIyMjIyMnIGNsb3NlOiBudWxsLCBzb2xvOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyNCAgICAgICA9IGNsc3M6J21hcmtkb3duIGg0JyAgIG9wZW46JyMjIyMnICBjbG9zZTogbnVsbCwgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjMgICAgICAgPSBjbHNzOidtYXJrZG93biBoMycgICBvcGVuOicjIyMnICAgY2xvc2U6IG51bGwsIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXIyICAgICAgID0gY2xzczonbWFya2Rvd24gaDInICAgb3BlbjonIyMnICAgIGNsb3NlOiBudWxsLCBzb2xvOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyMSAgICAgICA9IGNsc3M6J21hcmtkb3duIGgxJyAgIG9wZW46JyMnICAgICBjbG9zZTogbnVsbCwgc29sbzogdHJ1ZVxuXG4gICAgICAgIEBvcGVuUmVnaW9ucyA9IF8uZmlsdGVyIEByZWdpb25zLCAocikgLT4gci5jbG9zZSA9PSBudWxsXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgZGlzc0ZvckxpbmU6IChsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIHRleHQgPSBAZ2V0TGluZSBsaVxuXG4gICAgICAgIGlmIG5vdCB0ZXh0P1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImRpc3NGb3JMaW5lIC0tIG5vIGxpbmUgYXQgaW5kZXggI3tsaX0/XCJcblxuICAgICAgICAjIHIgPSBAbWVyZ2VSZWdpb25zIEBwYXJzZSh0ZXh0LCBsaSksIHRleHQsIGxpXG4gICAgICAgIFxuICAgICAgICBpZiBAYmxvY2tzP1tsaV0gXG4gICAgICAgICAgICAjIGxvZyAnYmxjaycgbGksIEBibG9ja3NbbGldXG4gICAgICAgICAgICAjIGxvZyAnZGlzcycgbGksIHJcbiAgICAgICAgICAgIHJldHVybiBAYmxvY2tzW2xpXVxuICAgICAgICByID0gQG1lcmdlUmVnaW9ucyBAcGFyc2UodGV4dCwgbGkpLCB0ZXh0LCBsaVxuICAgICAgICByXG5cbiAgICBkaXNzRm9yTGluZUFuZFJhbmdlczogKGxpbmUsIHJncykgLT5cblxuICAgICAgICByZWdpb25zID0gQG1lcmdlUmVnaW9ucyBAcGFyc2UobGluZSwgMCksIGxpbmUsIDBcbiAgICAgICAgbWF0Y2hyLm1lcmdlIHJlZ2lvbnMsIG1hdGNoci5kaXNzZWN0IHJnc1xuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG1lcmdlUmVnaW9uczogKHJlZ2lvbnMsIHRleHQsIGxpKSAtPlxuXG4gICAgICAgIHVuYmFsYW5jZWQgPSBAZ2V0VW5iYWxhbmNlZCBsaVxuXG4gICAgICAgIG1lcmdlZCA9IFtdXG4gICAgICAgIHAgPSAwXG5cbiAgICAgICAgYWRkRGlzcyA9IChzdGFydCwgZW5kLCBmb3JjZSkgPT5cblxuICAgICAgICAgICAgc2xpY2UgPSB0ZXh0LnNsaWNlIHN0YXJ0LCBlbmRcbiAgICAgICAgICAgIGlmIG5vdCBmb3JjZSBhbmQgdW5iYWxhbmNlZD8gYW5kIF8ubGFzdCh1bmJhbGFuY2VkKS5yZWdpb24uY2xzcyAhPSAnaW50ZXJwb2xhdGlvbidcbiAgICAgICAgICAgICAgICBkaXNzID0gQGRpc3NGb3JDbGFzcyBzbGljZSwgMCwgXy5sYXN0KHVuYmFsYW5jZWQpLnJlZ2lvbi5jbHNzXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgZW5kIDwgdGV4dC5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICBzbGljZSArPSAnIHgnICMgbGl0dGxlIGhhY2sgdG8gZ2V0IGZ1bmN0aW9uIGNhbGwgZGV0ZWN0aW9uIHRvIHdvcmtcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IEBzeW50YXguY29uc3RydWN0b3IuZGlzc0ZvclRleHRBbmRTeW50YXggc2xpY2UsIEBzeW50YXgubmFtZVxuICAgICAgICAgICAgICAgICAgICBkaXNzLnBvcCgpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBkaXNzID0gQHN5bnRheC5jb25zdHJ1Y3Rvci5kaXNzRm9yVGV4dEFuZFN5bnRheCBzbGljZSwgQHN5bnRheC5uYW1lXG4gICAgICAgICAgICBpZiBzdGFydFxuICAgICAgICAgICAgICAgIF8uZWFjaCBkaXNzLCAoZCkgLT4gZC5zdGFydCArPSBzdGFydFxuICAgICAgICAgICAgbWVyZ2VkID0gbWVyZ2VkLmNvbmNhdCBkaXNzXG5cbiAgICAgICAgd2hpbGUgcmVnaW9uID0gcmVnaW9ucy5zaGlmdCgpXG5cbiAgICAgICAgICAgIGlmIHJlZ2lvbi5zdGFydCA+IHBcbiAgICAgICAgICAgICAgICBhZGREaXNzIHAsIHJlZ2lvbi5zdGFydFxuICAgICAgICAgICAgaWYgcmVnaW9uLmNsc3MgPT0gJ2ludGVycG9sYXRpb24nXG4gICAgICAgICAgICAgICAgYWRkRGlzcyByZWdpb24uc3RhcnQsIHJlZ2lvbi5zdGFydCtyZWdpb24ubWF0Y2gubGVuZ3RoLCB0cnVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWVyZ2VkLnB1c2ggcmVnaW9uXG4gICAgICAgICAgICBwID0gcmVnaW9uLnN0YXJ0ICsgcmVnaW9uLm1hdGNoLmxlbmd0aFxuXG4gICAgICAgIGlmIHAgPCB0ZXh0Lmxlbmd0aFxuICAgICAgICAgICAgYWRkRGlzcyBwLCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgIG1lcmdlZFxuXG4gICAgZGlzc0ZvckNsYXNzOiAodGV4dCwgc3RhcnQsIGNsc3MpIC0+XG5cbiAgICAgICAgaWYgQGhlYWRlclJlZ0V4cD8udGVzdCB0ZXh0XG4gICAgICAgICAgICBjbHNzICs9ICcgaGVhZGVyJ1xuXG4gICAgICAgIGRpc3MgPSBbXVxuICAgICAgICBtID0gJydcbiAgICAgICAgcCA9IHMgPSBzdGFydFxuICAgICAgICB3aGlsZSBwIDwgdGV4dC5sZW5ndGhcblxuICAgICAgICAgICAgYyA9IHRleHRbcF1cbiAgICAgICAgICAgIHAgKz0gMVxuXG4gICAgICAgICAgICBpZiBjICE9ICcgJ1xuICAgICAgICAgICAgICAgIHMgPSBwLTEgaWYgbSA9PSAnJ1xuICAgICAgICAgICAgICAgIG0gKz0gY1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIHAgPCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBtICE9ICcnXG5cbiAgICAgICAgICAgICAgICBkaXNzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHNcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IG1cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNsc3NcbiAgICAgICAgICAgICAgICBtID0gJydcbiAgICAgICAgZGlzc1xuXG4gICAgIyMjXG4gICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMjI1xuXG4gICAgcGFyc2U6ICh0ZXh0LCBsaSkgLT5cblxuICAgICAgICBwICAgICAgID0gMFxuICAgICAgICBlc2NhcGVzID0gMFxuXG4gICAgICAgIHN0YWNrICAgPSBbXVxuICAgICAgICByZXN1bHQgID0gW11cblxuICAgICAgICB1bmJhbGFuY2VkICAgICA9IG51bGxcbiAgICAgICAga2VlcFVuYmFsYW5jZWQgPSBbXVxuXG4gICAgICAgIGlmIHVuYmFsYW5jZWQgPSBAZ2V0VW5iYWxhbmNlZCBsaVxuICAgICAgICAgICAgZm9yIGxpbmVTdGFydFJlZ2lvbiBpbiB1bmJhbGFuY2VkXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogIDBcbiAgICAgICAgICAgICAgICAgICAgcmVnaW9uOiBsaW5lU3RhcnRSZWdpb24ucmVnaW9uXG4gICAgICAgICAgICAgICAgICAgIGZha2U6ICAgdHJ1ZVxuXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDBcblxuICAgICAgICBwdXNoVG9wID0gLT5cblxuICAgICAgICAgICAgaWYgIHRvcCA9IF8ubGFzdCBzdGFja1xuICAgICAgICAgICAgICAgIGxyICA9IF8ubGFzdCByZXN1bHRcbiAgICAgICAgICAgICAgICBsZSAgPSBscj8gYW5kIGxyLnN0YXJ0ICsgbHIubWF0Y2gubGVuZ3RoIG9yIDBcblxuICAgICAgICAgICAgICAgIGlmIHAtMSAtIGxlID4gMCBhbmQgbGUgPCB0ZXh0Lmxlbmd0aC0xXG5cbiAgICAgICAgICAgICAgICAgICAgdG9wID0gXy5jbG9uZURlZXAgdG9wXG4gICAgICAgICAgICAgICAgICAgIHRvcC5zdGFydCA9IGxlXG4gICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IHRleHQuc2xpY2UgbGUsIHAtMVxuICAgICAgICAgICAgICAgICAgICB0b3AudmFsdWUgPSB0b3AucmVnaW9uLmNsc3NcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRvcC5yZWdpb25cblxuICAgICAgICAgICAgICAgICAgICBhZHZhbmNlID0gLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIHRvcC5tYXRjaC5sZW5ndGggYW5kIHRvcC5tYXRjaFswXSA9PSAnICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0b3AubWF0Y2guc2xpY2UgMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5zdGFydCArPSAxXG4gICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoKVxuXG4gICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IHRvcC5tYXRjaC50cmltUmlnaHQoKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIHRvcC5tYXRjaC5sZW5ndGhcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdG9wLnZhbHVlIGluIFsnc3RyaW5nIHNpbmdsZScgJ3N0cmluZyBkb3VibGUnICdzdHJpbmcgdHJpcGxlJyAnc3RyaW5nIHRyaXBsZSBza2lubnknXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwbGl0ID0gdG9wLm1hdGNoLnNwbGl0IC9cXHNcXHMrL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNwbGl0Lmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoIHRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgd29yZCA9IHNwbGl0LnNoaWZ0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZG1hdGNoID0gdG9wLm1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB3b3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCB0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9IF8uY2xvbmVEZWVwIHRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLnN0YXJ0ICs9IHdvcmQubGVuZ3RoICsgMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gb2xkbWF0Y2guc2xpY2Ugd29yZC5sZW5ndGggKyAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCB0b3BcblxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICAgICAgcHVzaEZvcmNlUmVnaW9uID0gKHJlZ2lvbikgPT5cblxuICAgICAgICAgICAgc3RhcnQgPSBwLTErcmVnaW9uLm9wZW4ubGVuZ3RoXG5cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgIG1hdGNoOiByZWdpb24ub3BlblxuICAgICAgICAgICAgICAgIHZhbHVlOiByZWdpb24uY2xzcyArICcgbWFya2VyJ1xuXG4gICAgICAgICAgICBpZiBzdGFydCA8IHRleHQubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0IEBkaXNzRm9yQ2xhc3MgdGV4dCwgc3RhcnQsIHJlZ2lvbi5jbHNzXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAgICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgICAgICBwdXNoUmVnaW9uID0gKHJlZ2lvbikgLT5cblxuICAgICAgICAgICAgcHVzaFRvcCgpXG5cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgIG1hdGNoOiByZWdpb24ub3BlblxuICAgICAgICAgICAgICAgIHZhbHVlOiByZWdpb24uY2xzcyArICcgbWFya2VyJ1xuXG4gICAgICAgICAgICBzdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgc3RhcnQ6ICBwLTErcmVnaW9uLm9wZW4ubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmVnaW9uOiByZWdpb25cblxuICAgICAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgICAgIHBvcFJlZ2lvbiA9IChyZXN0KSAtPlxuXG4gICAgICAgICAgICB0b3AgPSBfLmxhc3Qgc3RhY2tcblxuICAgICAgICAgICAgaWYgdG9wPy5yZWdpb24uY2xvc2U/IGFuZCByZXN0LnN0YXJ0c1dpdGggdG9wLnJlZ2lvbi5jbG9zZVxuXG4gICAgICAgICAgICAgICAgcHVzaFRvcCgpXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICBpZiB0b3AuZmFrZVxuICAgICAgICAgICAgICAgICAgICBrZWVwVW5iYWxhbmNlZC51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogIHAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnaW9uOiB0b3AucmVnaW9uXG5cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogcC0xXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0b3AucmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IHRvcC5yZWdpb24uY2xvc2VcblxuICAgICAgICAgICAgICAgIHAgKz0gdG9wLnJlZ2lvbi5jbG9zZS5sZW5ndGgtMVxuICAgICAgICAgICAgICAgIHJldHVybiB0b3BcbiAgICAgICAgICAgIGZhbHNlXG5cbiAgICAgICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDBcblxuICAgICAgICB3aGlsZSBwIDwgdGV4dC5sZW5ndGhcblxuICAgICAgICAgICAgY2ggPSB0ZXh0W3BdXG4gICAgICAgICAgICBwICs9IDFcblxuICAgICAgICAgICAgdG9wID0gXy5sYXN0IHN0YWNrXG5cbiAgICAgICAgICAgIGlmIGNoID09ICdcXFxcJyB0aGVuIGVzY2FwZXMrK1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIGNoID09ICcgJ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgZXNjYXBlc1xuICAgICAgICAgICAgICAgICAgICBpZiBlc2NhcGVzICUgMiBhbmQgKGNoICE9IFwiI1wiIG9yIHRvcCBhbmQgdG9wLnJlZ2lvbi52YWx1ZSAhPSAnaW50ZXJwb2xhdGlvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICBlc2NhcGVzID0gMCAjIGNoYXJhY3RlciBpcyBlc2NhcGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWUgICAgIyBqdXN0IGNvbnRpbnVlIHRvIG5leHRcbiAgICAgICAgICAgICAgICAgICAgZXNjYXBlcyA9IDBcblxuICAgICAgICAgICAgICAgIGlmIGNoID09ICc6J1xuICAgICAgICAgICAgICAgICAgICBpZiBAc3ludGF4Lm5hbWUgPT0gJ2pzb24nICMgaGlnaGxpZ2h0IGpzb24gZGljdGlvbmFyeSBrZXlzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBfLmxhc3QocmVzdWx0KS52YWx1ZSA9PSAnc3RyaW5nIGRvdWJsZSBtYXJrZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgcmVzdWx0Lmxlbmd0aCA+IDEgYW5kIHJlc3VsdFtyZXN1bHQubGVuZ3RoLTJdLnZhbHVlID09ICdzdHJpbmcgZG91YmxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aC0yXS52YWx1ZSA9ICdzdHJpbmcgZGljdGlvbmFyeSBrZXknXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogcC0xXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogY2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnZGljdGlvbmFyeSBtYXJrZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIHJlc3QgPSB0ZXh0LnNsaWNlIHAtMVxuXG4gICAgICAgICAgICBpZiBlbXB0eSh0b3ApIG9yIHRvcC5yZWdpb24/LmNsc3MgPT0gJ2ludGVycG9sYXRpb24nXG5cbiAgICAgICAgICAgICAgICBpZiBwb3BSZWdpb24gcmVzdFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgQHJlZ2lvbnMubXVsdGlDb21tZW50IGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMubXVsdGlDb21tZW50Lm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5tdWx0aUNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQHJlZ2lvbnMubXVsdGlTdHJpbmcgYW5kIHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9ucy5tdWx0aVN0cmluZy5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQHJlZ2lvbnMubXVsdGlTdHJpbmcyIGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMubXVsdGlTdHJpbmcyLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5tdWx0aVN0cmluZzJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgZW1wdHkgdG9wXG4gICAgICAgICAgICAgICAgICAgIGZvcmNlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHB1c2hlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGZvciBvcGVuUmVnaW9uIGluIEBvcGVuUmVnaW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgcmVzdC5zdGFydHNXaXRoIG9wZW5SZWdpb24ub3BlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24ubWluWD8gYW5kIHAtMSA8IG9wZW5SZWdpb24ubWluWCB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3BlblJlZ2lvbi5tYXhYPyBhbmQgcC0xID4gb3BlblJlZ2lvbi5tYXhYIHRoZW4gY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBub3Qgb3BlblJlZ2lvbi5zb2xvIG9yIGVtcHR5IHRleHQuc2xpY2UoMCwgcC0xKS50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3BlblJlZ2lvbi5mb3JjZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaEZvcmNlUmVnaW9uIG9wZW5SZWdpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBvcGVuUmVnaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrIGlmIGZvcmNlZFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBwdXNoZWRcblxuICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLnJlZ2V4cCBhbmQgY2ggPT0gQHJlZ2lvbnMucmVnZXhwLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5yZWdleHBcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICBpZiBjaCA9PSBAcmVnaW9ucy5zaW5nbGVTdHJpbmc/Lm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5zaW5nbGVTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICBpZiBjaCA9PSBAcmVnaW9ucy5kb3VibGVTdHJpbmcub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLmRvdWJsZVN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgICAgICBpZiB0b3AucmVnaW9uLmNsc3MgaW4gWydzdHJpbmcgZG91YmxlJyAnc3RyaW5nIHRyaXBsZSddXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgQHJlZ2lvbnMuaW50ZXJwb2xhdGlvbiBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLmludGVycG9sYXRpb24ub3BlbiAjIHN0cmluZyBpbnRlcnBvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLmludGVycG9sYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBpZiBwb3BSZWdpb24gcmVzdFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIHJlYWxTdGFjayA9IHN0YWNrLmZpbHRlciAocykgLT4gbm90IHMuZmFrZSBhbmQgcy5yZWdpb24uY2xvc2UgIT0gbnVsbCBhbmQgcy5yZWdpb24ubXVsdGlcblxuICAgICAgICBjbG9zZVN0YWNrSXRlbSA9IChzdGFja0l0ZW0pID0+XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0IEBkaXNzRm9yQ2xhc3MgdGV4dCwgXy5sYXN0KHJlc3VsdCkuc3RhcnQgKyBfLmxhc3QocmVzdWx0KS5tYXRjaC5sZW5ndGgsIHN0YWNrSXRlbS5yZWdpb24uY2xzc1xuXG4gICAgICAgIGlmIHJlYWxTdGFjay5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRVbmJhbGFuY2VkIGxpLCByZWFsU3RhY2tcbiAgICAgICAgICAgIGNsb3NlU3RhY2tJdGVtIF8ubGFzdCByZWFsU3RhY2tcbiAgICAgICAgZWxzZSBpZiBrZWVwVW5iYWxhbmNlZC5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRVbmJhbGFuY2VkIGxpLCBrZWVwVW5iYWxhbmNlZFxuICAgICAgICAgICAgaWYgc3RhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgY2xvc2VTdGFja0l0ZW0gXy5sYXN0IHN0YWNrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCBhbmQgXy5sYXN0KHN0YWNrKS5yZWdpb24uY2xvc2UgPT0gbnVsbFxuICAgICAgICAgICAgICAgIGNsb3NlU3RhY2tJdGVtIF8ubGFzdCBzdGFja1xuICAgICAgICAgICAgQHNldFVuYmFsYW5jZWQgbGlcblxuICAgICAgICByZXN1bHRcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGdldFVuYmFsYW5jZWQ6IChsaSkgLT5cblxuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIGZvciB1IGluIEB1bmJhbGFuY2VkXG4gICAgICAgICAgICBpZiB1LmxpbmUgPCBsaVxuICAgICAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCBhbmQgXy5sYXN0KHN0YWNrKS5yZWdpb24uY2xzcyA9PSB1LnJlZ2lvbi5jbHNzXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoIHVcbiAgICAgICAgICAgIGlmIHUubGluZSA+PSBsaVxuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgaWYgc3RhY2subGVuZ3RoXG4gICAgICAgICAgICByZXR1cm4gc3RhY2tcblxuICAgICAgICBudWxsXG5cbiAgICBzZXRVbmJhbGFuY2VkOiAobGksIHN0YWNrKSAtPlxuXG4gICAgICAgIF8ucmVtb3ZlIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lID09IGxpXG4gICAgICAgIGlmIHN0YWNrP1xuICAgICAgICAgICAgXy5lYWNoIHN0YWNrLCAocykgLT4gcy5saW5lID0gbGlcbiAgICAgICAgICAgIEB1bmJhbGFuY2VkID0gQHVuYmFsYW5jZWQuY29uY2F0IHN0YWNrXG4gICAgICAgICAgICBAdW5iYWxhbmNlZC5zb3J0IChhLGIpIC0+XG4gICAgICAgICAgICAgICAgaWYgYS5saW5lID09IGIubGluZVxuICAgICAgICAgICAgICAgICAgICBhLnN0YXJ0IC0gYi5zdGFydFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYS5saW5lIC0gYi5saW5lXG5cbiAgICBkZWxldGVMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgXy5yZW1vdmUgQHVuYmFsYW5jZWQsICh1KSAtPiB1LmxpbmUgPT0gbGlcbiAgICAgICAgXy5lYWNoIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lIC09IDEgaWYgdS5saW5lID49IGxpXG5cbiAgICBpbnNlcnRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgXy5lYWNoIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lICs9IDEgaWYgdS5saW5lID49IGxpXG5cbiAgICBjbGVhcjogLT5cblxuICAgICAgICBAdW5iYWxhbmNlZCA9IFtdXG4gICAgICAgIEBibG9ja3MgPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID0gQmFsYW5jZXJcbiJdfQ==
//# sourceURL=../../coffee/editor/balancer.coffee