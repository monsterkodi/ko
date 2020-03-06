// koffee 1.12.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Indexer, _, clamp, elem, empty, event, kerror, klog, kstr, last, matchr, ref, req, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, elem = ref.elem, empty = ref.empty, kerror = ref.kerror, klog = ref.klog, kstr = ref.kstr, last = ref.last, matchr = ref.matchr, stopEvent = ref.stopEvent;

Indexer = require('../main/indexer');

event = require('events');

req = require('../tools/req');

Autocomplete = (function(superClass) {
    var jsClass;

    extend(Autocomplete, superClass);

    function Autocomplete(editor) {
        var c, specials, str;
        this.editor = editor;
        this.onLinesSet = bind(this.onLinesSet, this);
        this.onWillDeleteLine = bind(this.onWillDeleteLine, this);
        this.onLineChanged = bind(this.onLineChanged, this);
        this.onLineInserted = bind(this.onLineInserted, this);
        this.onLinesAppended = bind(this.onLinesAppended, this);
        this.onMouseDown = bind(this.onMouseDown, this);
        this.onWheel = bind(this.onWheel, this);
        this.close = bind(this.close, this);
        this.onEdit = bind(this.onEdit, this);
        Autocomplete.__super__.constructor.call(this);
        this.wordinfo = {};
        this.mthdinfo = {};
        this.matchList = [];
        this.clones = [];
        this.cloned = [];
        str = new String();
        this.close();
        specials = "_-@#";
        this.especial = ((function() {
            var j, len, ref1, results;
            ref1 = specials.split('');
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                results.push("\\" + c);
            }
            return results;
        })()).join('');
        this.headerRegExp = new RegExp("^[0" + this.especial + "]+$");
        this.notSpecialRegExp = new RegExp("[^" + this.especial + "]");
        this.specialWordRegExp = new RegExp("(\\s+|[\\w" + this.especial + "]+|[^\\s])", 'g');
        this.splitRegExp = new RegExp("[^\\w\\d" + this.especial + "]+", 'g');
        this.methodRegExp = /([@]?\w+|@)\.(\w+)/;
        this.moduleRegExp = /^\s*(\w+)\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/;
        this.newRegExp = /([@]?\w+)\s*=\s*new\s+(\w+)/;
        this.baseRegExp = /\w\s+extends\s+(\w+)/;
        this.editor.on('edit', this.onEdit);
        this.editor.on('linesSet', this.onLinesSet);
        this.editor.on('lineInserted', this.onLineInserted);
        this.editor.on('willDeleteLine', this.onWillDeleteLine);
        this.editor.on('lineChanged', this.onLineChanged);
        this.editor.on('linesAppended', this.onLinesAppended);
        this.editor.on('cursor', this.close);
        this.editor.on('blur', this.close);
    }

    jsClass = {
        RegExp: ['test', 'compile', 'exec', 'toString'],
        String: ['endsWith', 'startsWith', 'split', 'slice', 'substring', 'padEnd', 'padStart', 'indexOf', 'match', 'trim', 'trimEnd', 'trimStart']
    };

    Autocomplete.prototype.parseModule = function(line) {
        var base, base1, base2, base3, base4, base5, base6, clss, err, j, k, key, len, len1, len2, len3, match, moduleName, n, name, name1, name2, name3, q, ref1, ref2, ref3, ref4, results;
        if (this.moduleRegExp.test(line)) {
            match = line.match(this.moduleRegExp);
            moduleName = kstr.strip(match[2], "'");
            ref1 = req.moduleKeys(moduleName, this.editor.currentFile);
            for (j = 0, len = ref1.length; j < len; j++) {
                key = ref1[j];
                if ((base = this.mthdinfo)[name = match[1]] != null) {
                    base[name];
                } else {
                    base[name] = {};
                }
                if ((base1 = this.mthdinfo[match[1]])[key] != null) {
                    base1[key];
                } else {
                    base1[key] = 1;
                }
            }
        }
        if (this.newRegExp.test(line)) {
            match = line.match(this.newRegExp);
            klog(match[2], match[1]);
            try {
                clss = eval(match[2]);
            } catch (error) {
                err = error;
                true;
            }
            if ((clss != null ? clss.prototype : void 0) != null) {
                if (jsClass[match[2]]) {
                    if ((base2 = this.mthdinfo)[name1 = match[1]] != null) {
                        base2[name1];
                    } else {
                        base2[name1] = {};
                    }
                    ref2 = jsClass[match[2]];
                    for (k = 0, len1 = ref2.length; k < len1; k++) {
                        key = ref2[k];
                        if ((base3 = this.mthdinfo[match[1]])[key] != null) {
                            base3[key];
                        } else {
                            base3[key] = 1;
                        }
                    }
                }
            } else {
                if (this.mthdinfo[match[2]]) {
                    if ((base4 = this.mthdinfo)[name2 = match[1]] != null) {
                        base4[name2];
                    } else {
                        base4[name2] = {};
                    }
                    ref3 = Object.keys(this.mthdinfo[match[2]]);
                    for (n = 0, len2 = ref3.length; n < len2; n++) {
                        key = ref3[n];
                        if ((base5 = this.mthdinfo[match[1]])[key] != null) {
                            base5[key];
                        } else {
                            base5[key] = 1;
                        }
                    }
                }
            }
        }
        if (this.baseRegExp.test(line)) {
            match = line.match(this.baseRegExp);
            if (this.mthdinfo[match[1]]) {
                ref4 = Object.keys(this.mthdinfo[match[1]]);
                results = [];
                for (q = 0, len3 = ref4.length; q < len3; q++) {
                    key = ref4[q];
                    results.push((base6 = this.wordinfo)[name3 = "@" + key] != null ? base6[name3] : base6[name3] = {
                        count: 1
                    });
                }
                return results;
            }
        }
    };

    Autocomplete.prototype.parseMethod = function(line) {
        var base, base1, i, j, name, name1, ref1, results, rgs;
        rgs = matchr.ranges([this.methodRegExp, ['obj', 'mth']], line);
        results = [];
        for (i = j = 0, ref1 = rgs.length - 2; j <= ref1; i = j += 2) {
            if ((base = this.mthdinfo)[name = rgs[i].match] != null) {
                base[name];
            } else {
                base[name] = {};
            }
            if ((base1 = this.mthdinfo[rgs[i].match])[name1 = rgs[i + 1].match] != null) {
                base1[name1];
            } else {
                base1[name1] = 0;
            }
            results.push(this.mthdinfo[rgs[i].match][rgs[i + 1].match] += 1);
        }
        return results;
    };

    Autocomplete.prototype.completeMethod = function(info) {
        var lst, mcnt, mthds, obj;
        lst = last(info.before.split(' '));
        obj = lst.slice(0, -1);
        if (!this.mthdinfo[obj]) {
            return;
        }
        mthds = Object.keys(this.mthdinfo[obj]);
        mcnt = mthds.map((function(_this) {
            return function(m) {
                return [m, _this.mthdinfo[obj][m]];
            };
        })(this));
        mcnt.sort(function(a, b) {
            return a[1] !== b[1] && b[1] - a[1] || a[0].localeCompare(b[0]);
        });
        this.firstMatch = mthds[0];
        return this.matchList = mthds.slice(1);
    };

    Autocomplete.prototype.onEdit = function(info) {
        var d, j, k, len, len1, m, matches, ref1, ref2, ref3, w, words;
        this.close();
        this.word = _.last(info.before.split(this.splitRegExp));
        switch (info.action) {
            case 'delete':
                console.error('delete!!!!');
                if (((ref1 = this.wordinfo[this.word]) != null ? ref1.temp : void 0) && ((ref2 = this.wordinfo[this.word]) != null ? ref2.count : void 0) <= 0) {
                    return delete this.wordinfo[this.word];
                }
                break;
            case 'insert':
                if (!((ref3 = this.word) != null ? ref3.length : void 0)) {
                    if (info.before.slice(-1)[0] === '.') {
                        this.completeMethod(info);
                    }
                } else {
                    if (empty(this.wordinfo)) {
                        return;
                    }
                    matches = _.pickBy(this.wordinfo, (function(_this) {
                        return function(c, w) {
                            return w.startsWith(_this.word) && w.length > _this.word.length;
                        };
                    })(this));
                    matches = _.toPairs(matches);
                    for (j = 0, len = matches.length; j < len; j++) {
                        m = matches[j];
                        d = this.editor.distanceOfWord(m[0]);
                        m[1].distance = 100 - Math.min(d, 100);
                    }
                    matches.sort(function(a, b) {
                        return (b[1].distance + b[1].count + 1 / b[0].length) - (a[1].distance + a[1].count + 1 / a[0].length);
                    });
                    words = matches.map(function(m) {
                        return m[0];
                    });
                    for (k = 0, len1 = words.length; k < len1; k++) {
                        w = words[k];
                        if (!this.firstMatch) {
                            this.firstMatch = w;
                        } else {
                            this.matchList.push(w);
                        }
                    }
                }
                if (this.firstMatch == null) {
                    return;
                }
                this.completion = this.firstMatch.slice(this.word.length);
                return this.open(info);
        }
    };

    Autocomplete.prototype.open = function(info) {
        var c, ci, cr, cursor, index, inner, item, j, k, len, len1, len2, m, n, p, ref1, ref2, ref3, sibling, sp, spanInfo, wi, ws;
        cursor = $('.main', this.editor.view);
        if (cursor == null) {
            kerror("Autocomplete.open --- no cursor?");
            return;
        }
        this.span = elem('span', {
            "class": 'autocomplete-span'
        });
        this.span.textContent = this.completion;
        this.span.style.opacity = 1;
        this.span.style.background = "#44a";
        this.span.style.color = "#fff";
        cr = cursor.getBoundingClientRect();
        spanInfo = this.editor.lineSpanAtXY(cr.left, cr.top);
        if (spanInfo == null) {
            p = this.editor.posAtXY(cr.left, cr.top);
            ci = p[1] - this.editor.scroll.top;
            return kerror("no span for autocomplete? cursor topleft: " + (parseInt(cr.left)) + " " + (parseInt(cr.top)), info);
        }
        sp = spanInfo.span;
        inner = sp.innerHTML;
        this.clones.push(sp.cloneNode(true));
        this.clones.push(sp.cloneNode(true));
        this.cloned.push(sp);
        ws = this.word.slice(this.word.search(/\w/));
        wi = ws.length;
        this.clones[0].innerHTML = inner.slice(0, spanInfo.offsetChar + 1);
        this.clones[1].innerHTML = inner.slice(spanInfo.offsetChar + 1);
        sibling = sp;
        while (sibling = sibling.nextSibling) {
            this.clones.push(sibling.cloneNode(true));
            this.cloned.push(sibling);
        }
        sp.parentElement.appendChild(this.span);
        ref1 = this.cloned;
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            c.style.display = 'none';
        }
        ref2 = this.clones;
        for (k = 0, len1 = ref2.length; k < len1; k++) {
            c = ref2[k];
            this.span.insertAdjacentElement('afterend', c);
        }
        this.moveClonesBy(this.completion.length);
        if (this.matchList.length) {
            this.list = elem({
                "class": 'autocomplete-list'
            });
            this.list.addEventListener('wheel', this.onWheel);
            this.list.addEventListener('mousedown', this.onMouseDown);
            index = 0;
            ref3 = this.matchList;
            for (n = 0, len2 = ref3.length; n < len2; n++) {
                m = ref3[n];
                item = elem({
                    "class": 'autocomplete-item',
                    index: index++
                });
                item.textContent = m;
                this.list.appendChild(item);
            }
            return cursor.appendChild(this.list);
        }
    };

    Autocomplete.prototype.close = function() {
        var c, j, k, len, len1, ref1, ref2, ref3;
        if (this.list != null) {
            this.list.removeEventListener('wheel', this.onWheel);
            this.list.removeEventListener('click', this.onClick);
            this.list.remove();
        }
        if ((ref1 = this.span) != null) {
            ref1.remove();
        }
        this.selected = -1;
        this.list = null;
        this.span = null;
        this.completion = null;
        this.firstMatch = null;
        ref2 = this.clones;
        for (j = 0, len = ref2.length; j < len; j++) {
            c = ref2[j];
            c.remove();
        }
        ref3 = this.cloned;
        for (k = 0, len1 = ref3.length; k < len1; k++) {
            c = ref3[k];
            c.style.display = 'initial';
        }
        this.clones = [];
        this.cloned = [];
        this.matchList = [];
        return this;
    };

    Autocomplete.prototype.onWheel = function(event) {
        this.list.scrollTop += event.deltaY;
        return stopEvent(event);
    };

    Autocomplete.prototype.onMouseDown = function(event) {
        var index;
        index = elem.upAttr(event.target, 'index');
        if (index) {
            this.select(index);
            this.onEnter();
        }
        return stopEvent(event);
    };

    Autocomplete.prototype.onEnter = function() {
        this.editor.pasteText(this.selectedCompletion());
        return this.close();
    };

    Autocomplete.prototype.selectedCompletion = function() {
        if (this.selected >= 0) {
            return this.matchList[this.selected].slice(this.word.length);
        } else {
            return this.completion;
        }
    };

    Autocomplete.prototype.navigate = function(delta) {
        if (!this.list) {
            return;
        }
        return this.select(clamp(-1, this.matchList.length - 1, this.selected + delta));
    };

    Autocomplete.prototype.select = function(index) {
        var ref1, ref2, ref3;
        if ((ref1 = this.list.children[this.selected]) != null) {
            ref1.classList.remove('selected');
        }
        this.selected = index;
        if (this.selected >= 0) {
            if ((ref2 = this.list.children[this.selected]) != null) {
                ref2.classList.add('selected');
            }
            if ((ref3 = this.list.children[this.selected]) != null) {
                ref3.scrollIntoViewIfNeeded();
            }
        }
        this.span.innerHTML = this.selectedCompletion();
        this.moveClonesBy(this.span.innerHTML.length);
        if (this.selected < 0) {
            this.span.classList.remove('selected');
        }
        if (this.selected >= 0) {
            return this.span.classList.add('selected');
        }
    };

    Autocomplete.prototype.prev = function() {
        return this.navigate(-1);
    };

    Autocomplete.prototype.next = function() {
        return this.navigate(1);
    };

    Autocomplete.prototype.last = function() {
        return this.navigate(this.matchList.length - this.selected);
    };

    Autocomplete.prototype.moveClonesBy = function(numChars) {
        var beforeLength, c, charOffset, ci, j, offset, ref1, spanOffset;
        if (empty(this.clones)) {
            return;
        }
        beforeLength = this.clones[0].innerHTML.length;
        for (ci = j = 1, ref1 = this.clones.length; 1 <= ref1 ? j < ref1 : j > ref1; ci = 1 <= ref1 ? ++j : --j) {
            c = this.clones[ci];
            offset = parseFloat(this.cloned[ci - 1].style.transform.split('translateX(')[1]);
            charOffset = numChars;
            if (ci === 1) {
                charOffset += beforeLength;
            }
            c.style.transform = "translatex(" + (offset + this.editor.size.charWidth * charOffset) + "px)";
        }
        spanOffset = parseFloat(this.cloned[0].style.transform.split('translateX(')[1]);
        spanOffset += this.editor.size.charWidth * beforeLength;
        return this.span.style.transform = "translatex(" + spanOffset + "px)";
    };

    Autocomplete.prototype.parseLinesDelayed = function(lines, opt) {
        var delay;
        delay = (function(_this) {
            return function(l, o) {
                return function() {
                    return _this.parseLines(l, o);
                };
            };
        })(this);
        if (lines.length > 1) {
            return setTimeout(delay(lines, opt), 200);
        }
    };

    Autocomplete.prototype.parseLines = function(lines, opt) {
        var count, cursorWord, i, info, j, k, l, len, len1, len2, n, ref1, ref2, ref3, w, words;
        this.close();
        if (lines == null) {
            return;
        }
        cursorWord = this.cursorWord();
        for (j = 0, len = lines.length; j < len; j++) {
            l = lines[j];
            if ((l != null ? l.split : void 0) == null) {
                return kerror("Autocomplete.parseLines -- line has no split? action: " + opt.action + " line: " + l, lines);
            }
            this.parseMethod(l);
            this.parseModule(l);
            words = l.split(this.splitRegExp);
            words = words.filter((function(_this) {
                return function(w) {
                    if (!Indexer.testWord(w)) {
                        return false;
                    }
                    if (w === cursorWord) {
                        return false;
                    }
                    if (_this.word === w.slice(0, w.length - 1)) {
                        return false;
                    }
                    if (_this.headerRegExp.test(w)) {
                        return false;
                    }
                    return true;
                };
            })(this));
            for (k = 0, len1 = words.length; k < len1; k++) {
                w = words[k];
                i = w.search(this.notSpecialRegExp);
                if (i > 0 && w[0] !== "#") {
                    w = w.slice(i);
                    if (!/^[\-]?[\d]+$/.test(w)) {
                        words.push(w);
                    }
                }
            }
            for (n = 0, len2 = words.length; n < len2; n++) {
                w = words[n];
                info = (ref1 = this.wordinfo[w]) != null ? ref1 : {};
                count = (ref2 = info.count) != null ? ref2 : 0;
                count += (ref3 = opt != null ? opt.count : void 0) != null ? ref3 : 1;
                info.count = count;
                if (opt.action === 'change') {
                    info.temp = true;
                }
                this.wordinfo[w] = info;
            }
        }
    };

    Autocomplete.prototype.cursorWords = function() {
        var after, befor, cp, cursr, ref1, words;
        cp = this.editor.cursorPos();
        words = this.editor.wordRangesInLineAtIndex(cp[1], {
            regExp: this.specialWordRegExp
        });
        ref1 = rangesSplitAtPosInRanges(cp, words), befor = ref1[0], cursr = ref1[1], after = ref1[2];
        return [this.editor.textsInRanges(befor), this.editor.textInRange(cursr), this.editor.textsInRanges(after)];
    };

    Autocomplete.prototype.cursorWord = function() {
        return this.cursorWords()[1];
    };

    Autocomplete.prototype.onLinesAppended = function(lines) {
        return this.parseLines(lines, {
            action: 'append'
        });
    };

    Autocomplete.prototype.onLineInserted = function(li) {
        return this.parseLines([this.editor.line(li)], {
            action: 'insert'
        });
    };

    Autocomplete.prototype.onLineChanged = function(li) {
        return this.parseLines([this.editor.line(li)], {
            action: 'change',
            count: 0
        });
    };

    Autocomplete.prototype.onWillDeleteLine = function(line) {
        return this.parseLines([line], {
            action: 'delete',
            count: -1
        });
    };

    Autocomplete.prototype.onLinesSet = function(lines) {
        if (lines.length) {
            return this.parseLinesDelayed(lines, {
                action: 'set'
            });
        }
    };

    Autocomplete.prototype.handleModKeyComboEvent = function(mod, key, combo, event) {
        if (this.span == null) {
            return 'unhandled';
        }
        switch (combo) {
            case 'enter':
                return this.onEnter();
        }
        if (this.list != null) {
            switch (combo) {
                case 'down':
                    this.next();
                    return;
                case 'up':
                    if (this.selected >= 0) {
                        this.prev();
                        return;
                    } else {
                        this.last();
                        return;
                    }
            }
        }
        this.close();
        return 'unhandled';
    };

    return Autocomplete;

})(event);

module.exports = Autocomplete;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNkdBQUE7SUFBQTs7OztBQVFBLE1BQTRFLE9BQUEsQ0FBUSxLQUFSLENBQTVFLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLG1CQUE1QixFQUFvQyxlQUFwQyxFQUEwQyxlQUExQyxFQUFnRCxlQUFoRCxFQUFzRCxtQkFBdEQsRUFBOEQ7O0FBRTlELE9BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxRQUFSOztBQUNWLEdBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtBQUVGLFFBQUE7Ozs7SUFBRyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7O1FBRUEsNENBQUE7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUNiLEdBQUEsR0FBTSxJQUFJLE1BQUosQ0FBQTtRQUVOLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFFckIsSUFBQyxDQUFBLGdCQUFE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LEVBQVEsUUFBUjtZQUFrQixLQUFBLEVBQU8sQ0FBekI7U0FBaEM7SUFBZDs7MkJBQ2xCLGdCQUFBLEdBQWtCLFNBQUMsSUFBRDtlQUFjLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxJQUFELENBQVosRUFBb0I7WUFBQSxNQUFBLEVBQVEsUUFBUjtZQUFrQixLQUFBLEVBQU8sQ0FBQyxDQUExQjtTQUFwQjtJQUFkOzsyQkFFbEIsVUFBQSxHQUFrQixTQUFDLEtBQUQ7UUFBYyxJQUEyQyxLQUFLLENBQUMsTUFBakQ7bUJBQUEsSUFBQyxDQUFBLGlCQUFELENBQW1CLEtBQW5CLEVBQTBCO2dCQUFBLE1BQUEsRUFBUSxLQUFSO2FBQTFCLEVBQUE7O0lBQWQ7OzJCQVFsQixzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtRQUVwQixJQUEwQixpQkFBMUI7QUFBQSxtQkFBTyxZQUFQOztBQUVBLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxPQURUO0FBQ3NCLHVCQUFPLElBQUMsQ0FBQSxPQUFELENBQUE7QUFEN0I7UUFHQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLE1BRFQ7b0JBRVEsSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBO0FBSFIscUJBSVMsSUFKVDtvQkFLUSxJQUFHLElBQUMsQ0FBQSxRQUFELElBQWEsQ0FBaEI7d0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUZKO3FCQUFBLE1BQUE7d0JBSUksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUxKOztBQUxSLGFBREo7O1FBWUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBcEJvQjs7OztHQXJaRDs7QUEyYTNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57ICQsIF8sIGNsYW1wLCBlbGVtLCBlbXB0eSwga2Vycm9yLCBrbG9nLCBrc3RyLCBsYXN0LCBtYXRjaHIsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5JbmRleGVyID0gcmVxdWlyZSAnLi4vbWFpbi9pbmRleGVyJ1xuZXZlbnQgICA9IHJlcXVpcmUgJ2V2ZW50cydcbnJlcSAgICAgPSByZXF1aXJlICcuLi90b29scy9yZXEnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZSBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAoQGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkaW5mbyAgPSB7fVxuICAgICAgICBAbXRoZGluZm8gID0ge31cbiAgICAgICAgQG1hdGNoTGlzdCA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVkICAgID0gW11cbiAgICAgICAgc3RyID0gbmV3IFN0cmluZygpXG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgc3BlY2lhbHMgPSBcIl8tQCNcIlxuICAgICAgICBAZXNwZWNpYWwgPSAoXCJcXFxcXCIrYyBmb3IgYyBpbiBzcGVjaWFscy5zcGxpdCAnJykuam9pbiAnJ1xuICAgICAgICBAaGVhZGVyUmVnRXhwICAgICAgPSBuZXcgUmVnRXhwIFwiXlswI3tAZXNwZWNpYWx9XSskXCJcbiAgICAgICAgXG4gICAgICAgIEBub3RTcGVjaWFsUmVnRXhwICA9IG5ldyBSZWdFeHAgXCJbXiN7QGVzcGVjaWFsfV1cIlxuICAgICAgICBAc3BlY2lhbFdvcmRSZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFxzK3xbXFxcXHcje0Blc3BlY2lhbH1dK3xbXlxcXFxzXSlcIiAnZydcbiAgICAgICAgQHNwbGl0UmVnRXhwICAgICAgID0gbmV3IFJlZ0V4cCBcIlteXFxcXHdcXFxcZCN7QGVzcGVjaWFsfV0rXCIgJ2cnICAgXG4gICAgICAgIEBtZXRob2RSZWdFeHAgICAgICA9IC8oW0BdP1xcdyt8QClcXC4oXFx3KykvXG4gICAgICAgIEBtb2R1bGVSZWdFeHAgICAgICA9IC9eXFxzKihcXHcrKVxccyo9XFxzKnJlcXVpcmVcXHMrKFtcXCdcXFwiXVtcXC5cXC9cXHddK1tcXCdcXFwiXSkvXG4gICAgICAgIEBuZXdSZWdFeHAgICAgICAgICA9IC8oW0BdP1xcdyspXFxzKj1cXHMqbmV3XFxzKyhcXHcrKS9cbiAgICAgICAgQGJhc2VSZWdFeHAgICAgICAgID0gL1xcd1xccytleHRlbmRzXFxzKyhcXHcrKS9cbiAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnZWRpdCcgICAgICAgICAgIEBvbkVkaXRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTZXQnICAgICAgIEBvbkxpbmVzU2V0XG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVJbnNlcnRlZCcgICBAb25MaW5lSW5zZXJ0ZWRcbiAgICAgICAgQGVkaXRvci5vbiAnd2lsbERlbGV0ZUxpbmUnIEBvbldpbGxEZWxldGVMaW5lXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVDaGFuZ2VkJyAgICBAb25MaW5lQ2hhbmdlZFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc0FwcGVuZGVkJyAgQG9uTGluZXNBcHBlbmRlZFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InICAgICAgICAgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgICAgICAgICBAY2xvc2VcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGpzQ2xhc3MgPSBcbiAgICAgICAgUmVnRXhwOiBbJ3Rlc3QnICdjb21waWxlJyAnZXhlYycgJ3RvU3RyaW5nJ11cbiAgICAgICAgU3RyaW5nOiBbJ2VuZHNXaXRoJyAnc3RhcnRzV2l0aCcgJ3NwbGl0JyAnc2xpY2UnICdzdWJzdHJpbmcnICdwYWRFbmQnICdwYWRTdGFydCcgJ2luZGV4T2YnICdtYXRjaCcgJ3RyaW0nICd0cmltRW5kJyAndHJpbVN0YXJ0J11cbiAgICBcbiAgICBwYXJzZU1vZHVsZTogKGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbW9kdWxlUmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgbWF0Y2ggPSBsaW5lLm1hdGNoIEBtb2R1bGVSZWdFeHBcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBrc3RyLnN0cmlwIG1hdGNoWzJdLCBcIidcIlxuICAgICAgICAgICAgZm9yIGtleSBpbiByZXEubW9kdWxlS2V5cyBtb2R1bGVOYW1lLCBAZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQG10aGRpbmZvW21hdGNoWzFdXSA/PSB7fVxuICAgICAgICAgICAgICAgIEBtdGhkaW5mb1ttYXRjaFsxXV1ba2V5XSA/PSAxXG4gICAgXG4gICAgICAgIGlmIEBuZXdSZWdFeHAudGVzdCBsaW5lXG4gICAgICAgICAgICBtYXRjaCA9IGxpbmUubWF0Y2ggQG5ld1JlZ0V4cFxuICAgICAgICAgICAga2xvZyBtYXRjaFsyXSwgbWF0Y2hbMV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgY2xzcyA9IGV2YWwgbWF0Y2hbMl1cbiAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgIGlmIGNsc3M/LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICBpZiBqc0NsYXNzW21hdGNoWzJdXVxuICAgICAgICAgICAgICAgICAgICBAbXRoZGluZm9bbWF0Y2hbMV1dID89IHt9XG4gICAgICAgICAgICAgICAgICAgIGZvciBrZXkgaW4ganNDbGFzc1ttYXRjaFsyXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICMga2xvZyAnYWRkJyBtYXRjaFsxXSwga2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBAbXRoZGluZm9bbWF0Y2hbMV1dW2tleV0gPz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIEBtdGhkaW5mb1ttYXRjaFsyXV1cbiAgICAgICAgICAgICAgICAgICAgQG10aGRpbmZvW21hdGNoWzFdXSA/PSB7fVxuICAgICAgICAgICAgICAgICAgICBmb3Iga2V5IGluIE9iamVjdC5rZXlzIEBtdGhkaW5mb1ttYXRjaFsyXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICMga2xvZyAnYWRkJyBtYXRjaFsxXSwga2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBAbXRoZGluZm9bbWF0Y2hbMV1dW2tleV0gPz0gMVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBiYXNlUmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgbWF0Y2ggPSBsaW5lLm1hdGNoIEBiYXNlUmVnRXhwXG4gICAgICAgICAgICBpZiBAbXRoZGluZm9bbWF0Y2hbMV1dXG4gICAgICAgICAgICAgICAgZm9yIGtleSBpbiBPYmplY3Qua2V5cyBAbXRoZGluZm9bbWF0Y2hbMV1dXG4gICAgICAgICAgICAgICAgICAgIEB3b3JkaW5mb1tcIkAje2tleX1cIl0gPz0gY291bnQ6MVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgcGFyc2VNZXRob2Q6IChsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgcmdzID0gbWF0Y2hyLnJhbmdlcyBbQG1ldGhvZFJlZ0V4cCwgWydvYmonICdtdGgnXV0sIGxpbmVcbiAgICAgICAgZm9yIGkgaW4gWzAuLnJncy5sZW5ndGgtMl0gYnkgMlxuICAgICAgICAgICAgQG10aGRpbmZvW3Jnc1tpXS5tYXRjaF0gPz0ge31cbiAgICAgICAgICAgIEBtdGhkaW5mb1tyZ3NbaV0ubWF0Y2hdW3Jnc1tpKzFdLm1hdGNoXSA/PSAwXG4gICAgICAgICAgICBAbXRoZGluZm9bcmdzW2ldLm1hdGNoXVtyZ3NbaSsxXS5tYXRjaF0gKz0gMVxuICAgIFxuICAgIGNvbXBsZXRlTWV0aG9kOiAoaW5mbykgLT5cbiAgICAgICAgXG4gICAgICAgIGxzdCA9IGxhc3QgaW5mby5iZWZvcmUuc3BsaXQgJyAnXG4gICAgICAgIG9iaiA9IGxzdC5zbGljZSAwIC0xXG4gICAgICAgIHJldHVybiBpZiBub3QgQG10aGRpbmZvW29ial1cbiAgICAgICAgbXRoZHMgPSBPYmplY3Qua2V5cyBAbXRoZGluZm9bb2JqXVxuICAgICAgICBtY250ID0gbXRoZHMubWFwIChtKSA9PiBbbSxAbXRoZGluZm9bb2JqXVttXV1cbiAgICAgICAgbWNudC5zb3J0IChhLGIpIC0+IGFbMV0hPWJbMV0gYW5kIGJbMV0tYVsxXSBvciBhWzBdLmxvY2FsZUNvbXBhcmUgYlswXVxuICAgICAgICBAZmlyc3RNYXRjaCA9IG10aGRzWzBdXG4gICAgICAgIEBtYXRjaExpc3QgID0gbXRoZHMuc2xpY2UgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBvbkVkaXQ6IChpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIHN3aXRjaCBpbmZvLmFjdGlvblxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdkZWxldGUnICMgZXZlciBoYXBwZW5pbmc/XG4gICAgICAgICAgICAgICAgZXJyb3IgJ2RlbGV0ZSEhISEnXG4gICAgICAgICAgICAgICAgaWYgQHdvcmRpbmZvW0B3b3JkXT8udGVtcCBhbmQgQHdvcmRpbmZvW0B3b3JkXT8uY291bnQgPD0gMFxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQHdvcmRpbmZvW0B3b3JkXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2luc2VydCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLmJlZm9yZVstMV0gPT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29tcGxldGVNZXRob2QgaW5mb1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEB3b3JkaW5mb1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcyA9IF8ucGlja0J5IEB3b3JkaW5mbywgKGMsdykgPT4gdy5zdGFydHNXaXRoKEB3b3JkKSBhbmQgdy5sZW5ndGggPiBAd29yZC5sZW5ndGggICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcyA9IF8udG9QYWlycyBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgIGZvciBtIGluIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBAZWRpdG9yLmRpc3RhbmNlT2ZXb3JkIG1bMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1bMV0uZGlzdGFuY2UgPSAxMDAgLSBNYXRoLm1pbiBkLCAxMDBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIChiWzFdLmRpc3RhbmNlK2JbMV0uY291bnQrMS9iWzBdLmxlbmd0aCkgLSAoYVsxXS5kaXN0YW5jZSthWzFdLmNvdW50KzEvYVswXS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgd29yZHMgPSBtYXRjaGVzLm1hcCAobSkgLT4gbVswXVxuICAgICAgICAgICAgICAgICAgICBmb3IgdyBpbiB3b3Jkc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IEBmaXJzdE1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGZpcnN0TWF0Y2ggPSB3IFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBtYXRjaExpc3QucHVzaCB3XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpcnN0TWF0Y2g/XG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBAZmlyc3RNYXRjaC5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBvcGVuIGluZm9cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAoaW5mbykgLT5cblxuICAgICAgICBjdXJzb3IgPSQgJy5tYWluJyBAZWRpdG9yLnZpZXdcbiAgICAgICAgaWYgbm90IGN1cnNvcj9cbiAgICAgICAgICAgIGtlcnJvciBcIkF1dG9jb21wbGV0ZS5vcGVuIC0tLSBubyBjdXJzb3I/XCJcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6ICdhdXRvY29tcGxldGUtc3BhbidcbiAgICAgICAgQHNwYW4udGV4dENvbnRlbnQgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG4gICAgICAgIFxuICAgICAgICBjciA9IGN1cnNvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBzcGFuSW5mbyA9IEBlZGl0b3IubGluZVNwYW5BdFhZIGNyLmxlZnQsIGNyLnRvcFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHNwYW5JbmZvP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBwID0gQGVkaXRvci5wb3NBdFhZIGNyLmxlZnQsIGNyLnRvcFxuICAgICAgICAgICAgY2kgPSBwWzFdLUBlZGl0b3Iuc2Nyb2xsLnRvcFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHNwYW4gZm9yIGF1dG9jb21wbGV0ZT8gY3Vyc29yIHRvcGxlZnQ6ICN7cGFyc2VJbnQgY3IubGVmdH0gI3twYXJzZUludCBjci50b3B9XCIsIGluZm9cblxuICAgICAgICBzcCA9IHNwYW5JbmZvLnNwYW5cbiAgICAgICAgaW5uZXIgPSBzcC5pbm5lckhUTUxcbiAgICAgICAgQGNsb25lcy5wdXNoIHNwLmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBjbG9uZXMucHVzaCBzcC5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAY2xvbmVkLnB1c2ggc3BcbiAgICAgICAgXG4gICAgICAgIHdzID0gQHdvcmQuc2xpY2UgQHdvcmQuc2VhcmNoIC9cXHcvXG4gICAgICAgIHdpID0gd3MubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAY2xvbmVzWzBdLmlubmVySFRNTCA9IGlubmVyLnNsaWNlIDAgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDEgXG4gICAgICAgIEBjbG9uZXNbMV0uaW5uZXJIVE1MID0gaW5uZXIuc2xpY2UgICBzcGFuSW5mby5vZmZzZXRDaGFyICsgMVxuICAgICAgICBcbiAgICAgICAgc2libGluZyA9IHNwXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcblxuICAgICAgICBzcC5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkIEBzcGFuXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzXG4gICAgICAgICAgICBAc3Bhbi5pbnNlcnRBZGphY2VudEVsZW1lbnQgJ2FmdGVyZW5kJyBjXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAY29tcGxldGlvbi5sZW5ndGggICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaExpc3QubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnICAgICBAb25XaGVlbFxuICAgICAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5kZXggPSAwXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWF0Y2hMaXN0XG4gICAgICAgICAgICAgICAgaXRlbSA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgICAgIGl0ZW0udGV4dENvbnRlbnQgPSBtXG4gICAgICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgY3Vyc29yLmFwcGVuZENoaWxkIEBsaXN0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBjbG9zZTogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0P1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlRXZlbnRMaXN0ZW5lciAnd2hlZWwnIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHNwYW4/LnJlbW92ZSgpXG4gICAgICAgIEBzZWxlY3RlZCAgID0gLTFcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQGZpcnN0TWF0Y2ggPSBudWxsXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ2luaXRpYWwnXG4gICAgICAgIFxuICAgICAgICBAY2xvbmVzID0gW11cbiAgICAgICAgQGNsb25lZCA9IFtdXG4gICAgICAgIEBtYXRjaExpc3QgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25XaGVlbDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgQGxpc3Quc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnQgICAgXG4gICAgXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAb25FbnRlcigpXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgb25FbnRlcjogLT4gIFxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICBzZWxlY3RlZENvbXBsZXRpb246IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQG1hdGNoTGlzdFtAc2VsZWN0ZWRdLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tcGxldGlvblxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgbmF2aWdhdGU6IChkZWx0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQG1hdGNoTGlzdC5sZW5ndGgtMSwgQHNlbGVjdGVkK2RlbHRhXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGluZGV4KSAtPlxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6IC0+IEBuYXZpZ2F0ZSAtMSAgICBcbiAgICBuZXh0OiAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6IC0+IEBuYXZpZ2F0ZSBAbWF0Y2hMaXN0Lmxlbmd0aCAtIEBzZWxlY3RlZFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgQGNsb25lc1xuICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgZm9yIGNpIGluIFsxLi4uQGNsb25lcy5sZW5ndGhdXG4gICAgICAgICAgICBjID0gQGNsb25lc1tjaV1cbiAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgIGNoYXJPZmZzZXQgPSBudW1DaGFyc1xuICAgICAgICAgICAgY2hhck9mZnNldCArPSBiZWZvcmVMZW5ndGggaWYgY2kgPT0gMVxuICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgIHNwYW5PZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbMF0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgIHNwYW5PZmZzZXQgKz0gQGVkaXRvci5zaXplLmNoYXJXaWR0aCpiZWZvcmVMZW5ndGhcbiAgICAgICAgQHNwYW4uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7c3Bhbk9mZnNldH1weClcIlxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgXG4gICAgcGFyc2VMaW5lc0RlbGF5ZWQ6IChsaW5lcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgZGVsYXkgPSAobCwgbykgPT4gPT4gQHBhcnNlTGluZXMgbCwgb1xuICAgICAgICBpZiBsaW5lcy5sZW5ndGggPiAxXG4gICAgICAgICAgICBzZXRUaW1lb3V0IChkZWxheSBsaW5lcywgb3B0KSwgMjAwXG4gICAgXG4gICAgcGFyc2VMaW5lczoobGluZXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBsaW5lcz9cbiAgICAgICAgXG4gICAgICAgIGN1cnNvcldvcmQgPSBAY3Vyc29yV29yZCgpXG4gICAgICAgIGZvciBsIGluIGxpbmVzXG4gICAgICAgICAgICBpZiBub3QgbD8uc3BsaXQ/XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkF1dG9jb21wbGV0ZS5wYXJzZUxpbmVzIC0tIGxpbmUgaGFzIG5vIHNwbGl0PyBhY3Rpb246ICN7b3B0LmFjdGlvbn0gbGluZTogI3tsfVwiLCBsaW5lc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHBhcnNlTWV0aG9kIGxcbiAgICAgICAgICAgIEBwYXJzZU1vZHVsZSBsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdvcmRzID0gbC5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgICAgIHdvcmRzID0gd29yZHMuZmlsdGVyICh3KSA9PiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEluZGV4ZXIudGVzdFdvcmQgd1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiB3ID09IGN1cnNvcldvcmRcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQHdvcmQgPT0gdy5zbGljZSAwLCB3Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBoZWFkZXJSZWdFeHAudGVzdCB3XG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHcgaW4gd29yZHMgIyBhcHBlbmQgd29yZHMgd2l0aG91dCBsZWFkaW5nIHNwZWNpYWwgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgaSA9IHcuc2VhcmNoIEBub3RTcGVjaWFsUmVnRXhwXG4gICAgICAgICAgICAgICAgaWYgaSA+IDAgYW5kIHdbMF0gIT0gXCIjXCJcbiAgICAgICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UgaVxuICAgICAgICAgICAgICAgICAgICB3b3Jkcy5wdXNoIHcgaWYgbm90IC9eW1xcLV0/W1xcZF0rJC8udGVzdCB3XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgaW5mbyAgPSBAd29yZGluZm9bd10gPyB7fVxuICAgICAgICAgICAgICAgIGNvdW50ID0gaW5mby5jb3VudCA/IDBcbiAgICAgICAgICAgICAgICBjb3VudCArPSBvcHQ/LmNvdW50ID8gMVxuICAgICAgICAgICAgICAgIGluZm8uY291bnQgPSBjb3VudFxuICAgICAgICAgICAgICAgIGluZm8udGVtcCA9IHRydWUgaWYgb3B0LmFjdGlvbiBpcyAnY2hhbmdlJ1xuICAgICAgICAgICAgICAgIEB3b3JkaW5mb1t3XSA9IGluZm9cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBjdXJzb3JXb3JkczogLT5cbiAgICAgICAgXG4gICAgICAgIGNwID0gQGVkaXRvci5jdXJzb3JQb3MoKVxuICAgICAgICB3b3JkcyA9IEBlZGl0b3Iud29yZFJhbmdlc0luTGluZUF0SW5kZXggY3BbMV0sIHJlZ0V4cDogQHNwZWNpYWxXb3JkUmVnRXhwICAgICAgICBcbiAgICAgICAgW2JlZm9yLCBjdXJzciwgYWZ0ZXJdID0gcmFuZ2VzU3BsaXRBdFBvc0luUmFuZ2VzIGNwLCB3b3Jkc1xuICAgICAgICBbQGVkaXRvci50ZXh0c0luUmFuZ2VzKGJlZm9yKSwgQGVkaXRvci50ZXh0SW5SYW5nZShjdXJzciksIEBlZGl0b3IudGV4dHNJblJhbmdlcyhhZnRlcildXG4gICAgICAgIFxuICAgIGN1cnNvcldvcmQ6IC0+IEBjdXJzb3JXb3JkcygpWzFdXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbkxpbmVzQXBwZW5kZWQ6ICAobGluZXMpICAgID0+IEBwYXJzZUxpbmVzIGxpbmVzLCBhY3Rpb246ICdhcHBlbmQnXG4gICAgb25MaW5lSW5zZXJ0ZWQ6ICAgKGxpKSAgICAgICA9PiBAcGFyc2VMaW5lcyBbQGVkaXRvci5saW5lKGxpKV0sIGFjdGlvbjogJ2luc2VydCdcbiAgICBvbkxpbmVDaGFuZ2VkOiAgICAobGkpICAgICAgID0+IEBwYXJzZUxpbmVzIFtAZWRpdG9yLmxpbmUobGkpXSwgYWN0aW9uOiAnY2hhbmdlJywgY291bnQ6IDBcbiAgICBvbldpbGxEZWxldGVMaW5lOiAobGluZSkgICAgID0+IEBwYXJzZUxpbmVzIFtsaW5lXSwgYWN0aW9uOiAnZGVsZXRlJywgY291bnQ6IC0xXG4gICAgIyBvbkxpbmVzU2V0OiAgICAgICAobGluZXMpICAgID0+IGtsb2cgJ29uTGluZXNTZXQnOyBAcGFyc2VMaW5lcyBsaW5lcywgYWN0aW9uOiAnc2V0JyBpZiBsaW5lcy5sZW5ndGhcbiAgICBvbkxpbmVzU2V0OiAgICAgICAobGluZXMpICAgID0+IEBwYXJzZUxpbmVzRGVsYXllZCBsaW5lcywgYWN0aW9uOiAnc2V0JyBpZiBsaW5lcy5sZW5ndGhcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInIHRoZW4gcmV0dXJuIEBvbkVudGVyKCkgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJ1xuICAgICAgICAgICAgICAgICAgICBAbmV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgQHByZXYoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICBAbGFzdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee