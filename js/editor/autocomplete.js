// koffee 1.14.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Indexer, _, clamp, elem, empty, event, kerror, kstr, last, matchr, ref, req, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, elem = ref.elem, empty = ref.empty, kerror = ref.kerror, kstr = ref.kstr, last = ref.last, matchr = ref.matchr, stopEvent = ref.stopEvent;

Indexer = require('../main/indexer');

event = require('events');

req = require('../tools/req');

Autocomplete = (function(superClass) {
    var jsClass;

    extend(Autocomplete, superClass);

    function Autocomplete(editor) {
        var c, specials;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsdUdBQUE7SUFBQTs7OztBQVFBLE1BQXNFLE9BQUEsQ0FBUSxLQUFSLENBQXRFLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLG1CQUE1QixFQUFvQyxlQUFwQyxFQUEwQyxlQUExQyxFQUFnRCxtQkFBaEQsRUFBd0Q7O0FBRXhELE9BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxRQUFSOztBQUNWLEdBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtBQUVGLFFBQUE7Ozs7SUFBRyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7O1FBRUEsNENBQUE7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFDckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEs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LElBQUQsQ0FBWixFQUFvQjtZQUFBLE1BQUEsRUFBUSxRQUFSO1lBQWtCLEtBQUEsRUFBTyxDQUFDLENBQTFCO1NBQXBCO0lBQWQ7OzJCQUVsQixVQUFBLEdBQWtCLFNBQUMsS0FBRDtRQUFjLElBQTJDLEtBQUssQ0FBQyxNQUFqRDttQkFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBbkIsRUFBMEI7Z0JBQUEsTUFBQSxFQUFRLEtBQVI7YUFBMUIsRUFBQTs7SUFBZDs7MkJBUWxCLHNCQUFBLEdBQXdCLFNBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxLQUFYLEVBQWtCLEtBQWxCO1FBRXBCLElBQTBCLGlCQUExQjtBQUFBLG1CQUFPLFlBQVA7O0FBRUEsZ0JBQU8sS0FBUDtBQUFBLGlCQUNTLE9BRFQ7QUFDc0IsdUJBQU8sSUFBQyxDQUFBLE9BQUQsQ0FBQTtBQUQ3QjtRQUdBLElBQUcsaUJBQUg7QUFDSSxvQkFBTyxLQUFQO0FBQUEscUJBQ1MsTUFEVDtvQkFFUSxJQUFDLENBQUEsSUFBRCxDQUFBO0FBQ0E7QUFIUixxQkFJUyxJQUpUO29CQUtRLElBQUcsSUFBQyxDQUFBLFFBQUQsSUFBYSxDQUFoQjt3QkFDSSxJQUFDLENBQUEsSUFBRCxDQUFBO0FBQ0EsK0JBRko7cUJBQUEsTUFBQTt3QkFJSSxJQUFDLENBQUEsSUFBRCxDQUFBO0FBQ0EsK0JBTEo7O0FBTFIsYUFESjs7UUFZQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUFwQm9COzs7O0dBblpEOztBQXlhM0IsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuIyMjXG5cbnsgJCwgXywgY2xhbXAsIGVsZW0sIGVtcHR5LCBrZXJyb3IsIGtzdHIsIGxhc3QsIG1hdGNociwgc3RvcEV2ZW50IH0gPSByZXF1aXJlICdreGsnXG5cbkluZGV4ZXIgPSByZXF1aXJlICcuLi9tYWluL2luZGV4ZXInXG5ldmVudCAgID0gcmVxdWlyZSAnZXZlbnRzJ1xucmVxICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3JlcSdcblxuY2xhc3MgQXV0b2NvbXBsZXRlIGV4dGVuZHMgZXZlbnRcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBcbiAgICAgICAgQHdvcmRpbmZvICA9IHt9XG4gICAgICAgIEBtdGhkaW5mbyAgPSB7fVxuICAgICAgICBAbWF0Y2hMaXN0ID0gW11cbiAgICAgICAgQGNsb25lcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIHNwZWNpYWxzID0gXCJfLUAjXCJcbiAgICAgICAgQGVzcGVjaWFsID0gKFwiXFxcXFwiK2MgZm9yIGMgaW4gc3BlY2lhbHMuc3BsaXQgJycpLmpvaW4gJydcbiAgICAgICAgQGhlYWRlclJlZ0V4cCAgICAgID0gbmV3IFJlZ0V4cCBcIl5bMCN7QGVzcGVjaWFsfV0rJFwiXG4gICAgICAgIEBub3RTcGVjaWFsUmVnRXhwICA9IG5ldyBSZWdFeHAgXCJbXiN7QGVzcGVjaWFsfV1cIlxuICAgICAgICBAc3BlY2lhbFdvcmRSZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFxzK3xbXFxcXHcje0Blc3BlY2lhbH1dK3xbXlxcXFxzXSlcIiAnZydcbiAgICAgICAgQHNwbGl0UmVnRXhwICAgICAgID0gbmV3IFJlZ0V4cCBcIlteXFxcXHdcXFxcZCN7QGVzcGVjaWFsfV0rXCIgJ2cnICAgXG4gICAgICAgIEBtZXRob2RSZWdFeHAgICAgICA9IC8oW0BdP1xcdyt8QClcXC4oXFx3KykvXG4gICAgICAgIEBtb2R1bGVSZWdFeHAgICAgICA9IC9eXFxzKihcXHcrKVxccyo9XFxzKnJlcXVpcmVcXHMrKFtcXCdcXFwiXVtcXC5cXC9cXHddK1tcXCdcXFwiXSkvXG4gICAgICAgIEBuZXdSZWdFeHAgICAgICAgICA9IC8oW0BdP1xcdyspXFxzKj1cXHMqbmV3XFxzKyhcXHcrKS9cbiAgICAgICAgQGJhc2VSZWdFeHAgICAgICAgID0gL1xcd1xccytleHRlbmRzXFxzKyhcXHcrKS9cbiAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnZWRpdCcgICAgICAgICAgIEBvbkVkaXRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTZXQnICAgICAgIEBvbkxpbmVzU2V0XG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVJbnNlcnRlZCcgICBAb25MaW5lSW5zZXJ0ZWRcbiAgICAgICAgQGVkaXRvci5vbiAnd2lsbERlbGV0ZUxpbmUnIEBvbldpbGxEZWxldGVMaW5lXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVDaGFuZ2VkJyAgICBAb25MaW5lQ2hhbmdlZFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc0FwcGVuZGVkJyAgQG9uTGluZXNBcHBlbmRlZFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InICAgICAgICAgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgICAgICAgICBAY2xvc2VcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGpzQ2xhc3MgPSBcbiAgICAgICAgUmVnRXhwOiBbJ3Rlc3QnICdjb21waWxlJyAnZXhlYycgJ3RvU3RyaW5nJ11cbiAgICAgICAgU3RyaW5nOiBbJ2VuZHNXaXRoJyAnc3RhcnRzV2l0aCcgJ3NwbGl0JyAnc2xpY2UnICdzdWJzdHJpbmcnICdwYWRFbmQnICdwYWRTdGFydCcgJ2luZGV4T2YnICdtYXRjaCcgJ3RyaW0nICd0cmltRW5kJyAndHJpbVN0YXJ0J11cbiAgICBcbiAgICBwYXJzZU1vZHVsZTogKGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbW9kdWxlUmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgbWF0Y2ggPSBsaW5lLm1hdGNoIEBtb2R1bGVSZWdFeHBcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBrc3RyLnN0cmlwIG1hdGNoWzJdLCBcIidcIlxuICAgICAgICAgICAgZm9yIGtleSBpbiByZXEubW9kdWxlS2V5cyBtb2R1bGVOYW1lLCBAZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQG10aGRpbmZvW21hdGNoWzFdXSA/PSB7fVxuICAgICAgICAgICAgICAgIEBtdGhkaW5mb1ttYXRjaFsxXV1ba2V5XSA/PSAxXG4gICAgXG4gICAgICAgIGlmIEBuZXdSZWdFeHAudGVzdCBsaW5lXG4gICAgICAgICAgICBtYXRjaCA9IGxpbmUubWF0Y2ggQG5ld1JlZ0V4cFxuICAgICAgICAgICAgIyBrbG9nIG1hdGNoWzJdLCBtYXRjaFsxXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjbHNzID0gZXZhbCBtYXRjaFsyXVxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgaWYgY2xzcz8ucHJvdG90eXBlP1xuICAgICAgICAgICAgICAgIGlmIGpzQ2xhc3NbbWF0Y2hbMl1dXG4gICAgICAgICAgICAgICAgICAgIEBtdGhkaW5mb1ttYXRjaFsxXV0gPz0ge31cbiAgICAgICAgICAgICAgICAgICAgZm9yIGtleSBpbiBqc0NsYXNzW21hdGNoWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgIyBrbG9nICdhZGQnIG1hdGNoWzFdLCBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIEBtdGhkaW5mb1ttYXRjaFsxXV1ba2V5XSA/PSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgQG10aGRpbmZvW21hdGNoWzJdXVxuICAgICAgICAgICAgICAgICAgICBAbXRoZGluZm9bbWF0Y2hbMV1dID89IHt9XG4gICAgICAgICAgICAgICAgICAgIGZvciBrZXkgaW4gT2JqZWN0LmtleXMgQG10aGRpbmZvW21hdGNoWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgIyBrbG9nICdhZGQnIG1hdGNoWzFdLCBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIEBtdGhkaW5mb1ttYXRjaFsxXV1ba2V5XSA/PSAxXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGJhc2VSZWdFeHAudGVzdCBsaW5lXG4gICAgICAgICAgICBtYXRjaCA9IGxpbmUubWF0Y2ggQGJhc2VSZWdFeHBcbiAgICAgICAgICAgIGlmIEBtdGhkaW5mb1ttYXRjaFsxXV1cbiAgICAgICAgICAgICAgICBmb3Iga2V5IGluIE9iamVjdC5rZXlzIEBtdGhkaW5mb1ttYXRjaFsxXV1cbiAgICAgICAgICAgICAgICAgICAgQHdvcmRpbmZvW1wiQCN7a2V5fVwiXSA/PSBjb3VudDoxXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBwYXJzZU1ldGhvZDogKGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICByZ3MgPSBtYXRjaHIucmFuZ2VzIFtAbWV0aG9kUmVnRXhwLCBbJ29iaicgJ210aCddXSwgbGluZVxuICAgICAgICBmb3IgaSBpbiBbMC4ucmdzLmxlbmd0aC0yXSBieSAyXG4gICAgICAgICAgICBAbXRoZGluZm9bcmdzW2ldLm1hdGNoXSA/PSB7fVxuICAgICAgICAgICAgQG10aGRpbmZvW3Jnc1tpXS5tYXRjaF1bcmdzW2krMV0ubWF0Y2hdID89IDBcbiAgICAgICAgICAgIEBtdGhkaW5mb1tyZ3NbaV0ubWF0Y2hdW3Jnc1tpKzFdLm1hdGNoXSArPSAxXG4gICAgXG4gICAgY29tcGxldGVNZXRob2Q6IChpbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAgbHN0ID0gbGFzdCBpbmZvLmJlZm9yZS5zcGxpdCAnICdcbiAgICAgICAgb2JqID0gbHN0LnNsaWNlIDAgLTFcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbXRoZGluZm9bb2JqXVxuICAgICAgICBtdGhkcyA9IE9iamVjdC5rZXlzIEBtdGhkaW5mb1tvYmpdXG4gICAgICAgIG1jbnQgPSBtdGhkcy5tYXAgKG0pID0+IFttLEBtdGhkaW5mb1tvYmpdW21dXVxuICAgICAgICBtY250LnNvcnQgKGEsYikgLT4gYVsxXSE9YlsxXSBhbmQgYlsxXS1hWzFdIG9yIGFbMF0ubG9jYWxlQ29tcGFyZSBiWzBdXG4gICAgICAgIEBmaXJzdE1hdGNoID0gbXRoZHNbMF1cbiAgICAgICAgQG1hdGNoTGlzdCAgPSBtdGhkcy5zbGljZSAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICBcblxuICAgIG9uRWRpdDogKGluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBAd29yZCA9IF8ubGFzdCBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgc3dpdGNoIGluZm8uYWN0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgIyBldmVyIGhhcHBlbmluZz9cbiAgICAgICAgICAgICAgICBlcnJvciAnZGVsZXRlISEhISdcbiAgICAgICAgICAgICAgICBpZiBAd29yZGluZm9bQHdvcmRdPy50ZW1wIGFuZCBAd29yZGluZm9bQHdvcmRdPy5jb3VudCA8PSAwXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAd29yZGluZm9bQHdvcmRdXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnaW5zZXJ0J1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZm8uYmVmb3JlWy0xXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb21wbGV0ZU1ldGhvZCBpbmZvXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWYgZW1wdHkgQHdvcmRpbmZvXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzID0gXy5waWNrQnkgQHdvcmRpbmZvLCAoYyx3KSA9PiB3LnN0YXJ0c1dpdGgoQHdvcmQpIGFuZCB3Lmxlbmd0aCA+IEB3b3JkLmxlbmd0aCAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzID0gXy50b1BhaXJzIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgICAgZm9yIG0gaW4gbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAgICAgICAgZCA9IEBlZGl0b3IuZGlzdGFuY2VPZldvcmQgbVswXVxuICAgICAgICAgICAgICAgICAgICAgICAgbVsxXS5kaXN0YW5jZSA9IDEwMCAtIE1hdGgubWluIGQsIDEwMFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMuc29ydCAoYSxiKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgKGJbMV0uZGlzdGFuY2UrYlsxXS5jb3VudCsxL2JbMF0ubGVuZ3RoKSAtIChhWzFdLmRpc3RhbmNlK2FbMV0uY291bnQrMS9hWzBdLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB3b3JkcyA9IG1hdGNoZXMubWFwIChtKSAtPiBtWzBdXG4gICAgICAgICAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgQGZpcnN0TWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZmlyc3RNYXRjaCA9IHcgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQG1hdGNoTGlzdC5wdXNoIHdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlyc3RNYXRjaD9cbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IEBmaXJzdE1hdGNoLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQG9wZW4gaW5mb1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9wZW46IChpbmZvKSAtPlxuXG4gICAgICAgIGN1cnNvciA9JCAnLm1haW4nIEBlZGl0b3Iudmlld1xuICAgICAgICBpZiBub3QgY3Vyc29yP1xuICAgICAgICAgICAga2Vycm9yIFwiQXV0b2NvbXBsZXRlLm9wZW4gLS0tIG5vIGN1cnNvcj9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczogJ2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCA9IEBjb21wbGV0aW9uXG4gICAgICAgIEBzcGFuLnN0eWxlLm9wYWNpdHkgICAgPSAxXG4gICAgICAgIEBzcGFuLnN0eWxlLmJhY2tncm91bmQgPSBcIiM0NGFcIlxuICAgICAgICBAc3Bhbi5zdHlsZS5jb2xvciAgICAgID0gXCIjZmZmXCJcbiAgICAgICAgXG4gICAgICAgIGNyID0gY3Vyc29yLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIHNwYW5JbmZvID0gQGVkaXRvci5saW5lU3BhbkF0WFkgY3IubGVmdCwgY3IudG9wXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc3BhbkluZm8/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHAgPSBAZWRpdG9yLnBvc0F0WFkgY3IubGVmdCwgY3IudG9wXG4gICAgICAgICAgICBjaSA9IHBbMV0tQGVkaXRvci5zY3JvbGwudG9wXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gc3BhbiBmb3IgYXV0b2NvbXBsZXRlPyBjdXJzb3IgdG9wbGVmdDogI3twYXJzZUludCBjci5sZWZ0fSAje3BhcnNlSW50IGNyLnRvcH1cIiwgaW5mb1xuXG4gICAgICAgIHNwID0gc3BhbkluZm8uc3BhblxuICAgICAgICBpbm5lciA9IHNwLmlubmVySFRNTFxuICAgICAgICBAY2xvbmVzLnB1c2ggc3AuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGNsb25lcy5wdXNoIHNwLmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBjbG9uZWQucHVzaCBzcFxuICAgICAgICBcbiAgICAgICAgd3MgPSBAd29yZC5zbGljZSBAd29yZC5zZWFyY2ggL1xcdy9cbiAgICAgICAgd2kgPSB3cy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIEBjbG9uZXNbMF0uaW5uZXJIVE1MID0gaW5uZXIuc2xpY2UgMCBzcGFuSW5mby5vZmZzZXRDaGFyICsgMSBcbiAgICAgICAgQGNsb25lc1sxXS5pbm5lckhUTUwgPSBpbm5lci5zbGljZSAgIHNwYW5JbmZvLm9mZnNldENoYXIgKyAxXG4gICAgICAgIFxuICAgICAgICBzaWJsaW5nID0gc3BcbiAgICAgICAgd2hpbGUgc2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmdcbiAgICAgICAgICAgIEBjbG9uZXMucHVzaCBzaWJsaW5nLmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBAY2xvbmVkLnB1c2ggc2libGluZ1xuXG4gICAgICAgIHNwLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWRcbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXNcbiAgICAgICAgICAgIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoTGlzdC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgICAgIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgICAgIGZvciBtIGluIEBtYXRjaExpc3RcbiAgICAgICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1pdGVtJyBpbmRleDppbmRleCsrXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0Q29udGVudCA9IG1cbiAgICAgICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICd3aGVlbCcgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAZmlyc3RNYXRjaCA9IG51bGxcbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXNcbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgXG4gICAgICAgIEBjbG9uZXMgPSBbXVxuICAgICAgICBAY2xvbmVkID0gW11cbiAgICAgICAgQG1hdGNoTGlzdCAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbldoZWVsOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5zY3JvbGxUb3AgKz0gZXZlbnQuZGVsdGFZXG4gICAgICAgIHN0b3BFdmVudCBldmVudCAgICBcbiAgICBcbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBvbkVudGVyKClcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBvbkVudGVyOiAtPiAgXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQGNsb3NlKClcblxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbWF0Y2hMaXN0W0BzZWxlY3RlZF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21wbGV0aW9uXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdFxuICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAbWF0Y2hMaXN0Lmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgQHNwYW4uaW5uZXJIVE1MID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQHNwYW4uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QuYWRkICAgICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgcHJldjogLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6IC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogLT4gQG5hdmlnYXRlIEBtYXRjaExpc3QubGVuZ3RoIC0gQHNlbGVjdGVkXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG5cbiAgICBtb3ZlQ2xvbmVzQnk6IChudW1DaGFycykgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBAY2xvbmVzXG4gICAgICAgIGJlZm9yZUxlbmd0aCA9IEBjbG9uZXNbMF0uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBmb3IgY2kgaW4gWzEuLi5AY2xvbmVzLmxlbmd0aF1cbiAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkW2NpLTFdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICAgICAgY2hhck9mZnNldCA9IG51bUNoYXJzXG4gICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICBjLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje29mZnNldCtAZWRpdG9yLnNpemUuY2hhcldpZHRoKmNoYXJPZmZzZXR9cHgpXCJcbiAgICAgICAgc3Bhbk9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFswXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgc3Bhbk9mZnNldCArPSBAZWRpdG9yLnNpemUuY2hhcldpZHRoKmJlZm9yZUxlbmd0aFxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tzcGFuT2Zmc2V0fXB4KVwiXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICBcbiAgICBwYXJzZUxpbmVzRGVsYXllZDogKGxpbmVzLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBkZWxheSA9IChsLCBvKSA9PiA9PiBAcGFyc2VMaW5lcyBsLCBvXG4gICAgICAgIGlmIGxpbmVzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIHNldFRpbWVvdXQgKGRlbGF5IGxpbmVzLCBvcHQpLCAyMDBcbiAgICBcbiAgICBwYXJzZUxpbmVzOihsaW5lcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcblxuICAgICAgICByZXR1cm4gaWYgbm90IGxpbmVzP1xuICAgICAgICBcbiAgICAgICAgY3Vyc29yV29yZCA9IEBjdXJzb3JXb3JkKClcbiAgICAgICAgZm9yIGwgaW4gbGluZXNcbiAgICAgICAgICAgIGlmIG5vdCBsPy5zcGxpdD9cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiQXV0b2NvbXBsZXRlLnBhcnNlTGluZXMgLS0gbGluZSBoYXMgbm8gc3BsaXQ/IGFjdGlvbjogI3tvcHQuYWN0aW9ufSBsaW5lOiAje2x9XCIsIGxpbmVzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAcGFyc2VNZXRob2QgbFxuICAgICAgICAgICAgQHBhcnNlTW9kdWxlIGxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd29yZHMgPSBsLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICAgICAgd29yZHMgPSB3b3Jkcy5maWx0ZXIgKHcpID0+IFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgSW5kZXhlci50ZXN0V29yZCB3XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHcgPT0gY3Vyc29yV29yZFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBAd29yZCA9PSB3LnNsaWNlIDAsIHcubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQGhlYWRlclJlZ0V4cC50ZXN0IHdcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgdyBpbiB3b3JkcyAjIGFwcGVuZCB3b3JkcyB3aXRob3V0IGxlYWRpbmcgc3BlY2lhbCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICBpID0gdy5zZWFyY2ggQG5vdFNwZWNpYWxSZWdFeHBcbiAgICAgICAgICAgICAgICBpZiBpID4gMCBhbmQgd1swXSAhPSBcIiNcIlxuICAgICAgICAgICAgICAgICAgICB3ID0gdy5zbGljZSBpXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzLnB1c2ggdyBpZiBub3QgL15bXFwtXT9bXFxkXSskLy50ZXN0IHdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHcgaW4gd29yZHNcbiAgICAgICAgICAgICAgICBpbmZvICA9IEB3b3JkaW5mb1t3XSA/IHt9XG4gICAgICAgICAgICAgICAgY291bnQgPSBpbmZvLmNvdW50ID8gMFxuICAgICAgICAgICAgICAgIGNvdW50ICs9IG9wdD8uY291bnQgPyAxXG4gICAgICAgICAgICAgICAgaW5mby5jb3VudCA9IGNvdW50XG4gICAgICAgICAgICAgICAgaW5mby50ZW1wID0gdHJ1ZSBpZiBvcHQuYWN0aW9uIGlzICdjaGFuZ2UnXG4gICAgICAgICAgICAgICAgQHdvcmRpbmZvW3ddID0gaW5mb1xuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGN1cnNvcldvcmRzOiAtPlxuICAgICAgICBcbiAgICAgICAgY3AgPSBAZWRpdG9yLmN1cnNvclBvcygpXG4gICAgICAgIHdvcmRzID0gQGVkaXRvci53b3JkUmFuZ2VzSW5MaW5lQXRJbmRleCBjcFsxXSwgcmVnRXhwOiBAc3BlY2lhbFdvcmRSZWdFeHAgICAgICAgIFxuICAgICAgICBbYmVmb3IsIGN1cnNyLCBhZnRlcl0gPSByYW5nZXNTcGxpdEF0UG9zSW5SYW5nZXMgY3AsIHdvcmRzXG4gICAgICAgIFtAZWRpdG9yLnRleHRzSW5SYW5nZXMoYmVmb3IpLCBAZWRpdG9yLnRleHRJblJhbmdlKGN1cnNyKSwgQGVkaXRvci50ZXh0c0luUmFuZ2VzKGFmdGVyKV1cbiAgICAgICAgXG4gICAgY3Vyc29yV29yZDogLT4gQGN1cnNvcldvcmRzKClbMV1cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9uTGluZXNBcHBlbmRlZDogIChsaW5lcykgICAgPT4gQHBhcnNlTGluZXMgbGluZXMsIGFjdGlvbjogJ2FwcGVuZCdcbiAgICBvbkxpbmVJbnNlcnRlZDogICAobGkpICAgICAgID0+IEBwYXJzZUxpbmVzIFtAZWRpdG9yLmxpbmUobGkpXSwgYWN0aW9uOiAnaW5zZXJ0J1xuICAgIG9uTGluZUNoYW5nZWQ6ICAgIChsaSkgICAgICAgPT4gQHBhcnNlTGluZXMgW0BlZGl0b3IubGluZShsaSldLCBhY3Rpb246ICdjaGFuZ2UnLCBjb3VudDogMFxuICAgIG9uV2lsbERlbGV0ZUxpbmU6IChsaW5lKSAgICAgPT4gQHBhcnNlTGluZXMgW2xpbmVdLCBhY3Rpb246ICdkZWxldGUnLCBjb3VudDogLTFcbiAgICAjIG9uTGluZXNTZXQ6ICAgICAgIChsaW5lcykgICAgPT4ga2xvZyAnb25MaW5lc1NldCc7IEBwYXJzZUxpbmVzIGxpbmVzLCBhY3Rpb246ICdzZXQnIGlmIGxpbmVzLmxlbmd0aFxuICAgIG9uTGluZXNTZXQ6ICAgICAgIChsaW5lcykgICAgPT4gQHBhcnNlTGluZXNEZWxheWVkIGxpbmVzLCBhY3Rpb246ICdzZXQnIGlmIGxpbmVzLmxlbmd0aFxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicgdGhlbiByZXR1cm4gQG9uRW50ZXIoKSAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0PyBcbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nXG4gICAgICAgICAgICAgICAgICAgIEBuZXh0KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnXG4gICAgICAgICAgICAgICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJldigpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsYXN0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAY2xvc2UoKSAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlXG4iXX0=
//# sourceURL=../../coffee/editor/autocomplete.coffee