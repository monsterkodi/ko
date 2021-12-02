// koffee 1.18.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Indexer, _, clamp, elem, empty, event, kerror, last, matchr, ref, req, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, elem = ref.elem, empty = ref.empty, kerror = ref.kerror, last = ref.last, matchr = ref.matchr, stopEvent = ref.stopEvent;

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
        var base, base1, base2, base3, base4, clss, err, j, k, key, len, len1, len2, match, n, name, name1, name2, ref1, ref2, ref3, results;
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
                    if ((base = this.mthdinfo)[name = match[1]] != null) {
                        base[name];
                    } else {
                        base[name] = {};
                    }
                    ref1 = jsClass[match[2]];
                    for (j = 0, len = ref1.length; j < len; j++) {
                        key = ref1[j];
                        if ((base1 = this.mthdinfo[match[1]])[key] != null) {
                            base1[key];
                        } else {
                            base1[key] = 1;
                        }
                    }
                }
            } else {
                if (this.mthdinfo[match[2]]) {
                    if ((base2 = this.mthdinfo)[name1 = match[1]] != null) {
                        base2[name1];
                    } else {
                        base2[name1] = {};
                    }
                    ref2 = Object.keys(this.mthdinfo[match[2]]);
                    for (k = 0, len1 = ref2.length; k < len1; k++) {
                        key = ref2[k];
                        if ((base3 = this.mthdinfo[match[1]])[key] != null) {
                            base3[key];
                        } else {
                            base3[key] = 1;
                        }
                    }
                }
            }
        }
        if (this.baseRegExp.test(line)) {
            match = line.match(this.baseRegExp);
            if (this.mthdinfo[match[1]]) {
                ref3 = Object.keys(this.mthdinfo[match[1]]);
                results = [];
                for (n = 0, len2 = ref3.length; n < len2; n++) {
                    key = ref3[n];
                    results.push((base4 = this.wordinfo)[name2 = "@" + key] != null ? base4[name2] : base4[name2] = {
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
            this.list.addEventListener('wheel', this.onWheel, {
                passive: true
            });
            this.list.addEventListener('mousedown', this.onMouseDown, {
                passive: true
            });
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
            if (l.length > 240) {
                continue;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsaUdBQUE7SUFBQTs7OztBQVFBLE1BQWdFLE9BQUEsQ0FBUSxLQUFSLENBQWhFLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLG1CQUE1QixFQUFvQyxlQUFwQyxFQUEwQyxtQkFBMUMsRUFBa0Q7O0FBRWxELE9BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxRQUFSOztBQUNWLEdBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtBQUVGLFFBQUE7Ozs7SUFBRyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7O1FBRUEsNENBQUE7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFDckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsUUFBTixHQUFlLEdB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QW1CLEtBQW5CLEVBQTBCO2dCQUFBLE1BQUEsRUFBUSxLQUFSO2FBQTFCLEVBQUE7O0lBQWQ7OzJCQVFsQixzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtRQUVwQixJQUEwQixpQkFBMUI7QUFBQSxtQkFBTyxZQUFQOztBQUVBLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxPQURUO0FBQ3NCLHVCQUFPLElBQUMsQ0FBQSxPQUFELENBQUE7QUFEN0I7UUFHQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLE1BRFQ7b0JBRVEsSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBO0FBSFIscUJBSVMsSUFKVDtvQkFLUSxJQUFHLElBQUMsQ0FBQSxRQUFELElBQWEsQ0FBaEI7d0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUZKO3FCQUFBLE1BQUE7d0JBSUksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUxKOztBQUxSLGFBREo7O1FBWUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBcEJvQjs7OztHQXZaRDs7QUE2YTNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57ICQsIF8sIGNsYW1wLCBlbGVtLCBlbXB0eSwga2Vycm9yLCBsYXN0LCBtYXRjaHIsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5JbmRleGVyID0gcmVxdWlyZSAnLi4vbWFpbi9pbmRleGVyJ1xuZXZlbnQgICA9IHJlcXVpcmUgJ2V2ZW50cydcbnJlcSAgICAgPSByZXF1aXJlICcuLi90b29scy9yZXEnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZSBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAoQGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkaW5mbyAgPSB7fVxuICAgICAgICBAbXRoZGluZm8gID0ge31cbiAgICAgICAgQG1hdGNoTGlzdCA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVkICAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBzcGVjaWFscyA9IFwiXy1AI1wiXG4gICAgICAgIEBlc3BlY2lhbCA9IChcIlxcXFxcIitjIGZvciBjIGluIHNwZWNpYWxzLnNwbGl0ICcnKS5qb2luICcnXG4gICAgICAgIEBoZWFkZXJSZWdFeHAgICAgICA9IG5ldyBSZWdFeHAgXCJeWzAje0Blc3BlY2lhbH1dKyRcIlxuICAgICAgICBAbm90U3BlY2lhbFJlZ0V4cCAgPSBuZXcgUmVnRXhwIFwiW14je0Blc3BlY2lhbH1dXCJcbiAgICAgICAgQHNwZWNpYWxXb3JkUmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tAZXNwZWNpYWx9XSt8W15cXFxcc10pXCIgJ2cnXG4gICAgICAgIEBzcGxpdFJlZ0V4cCAgICAgICA9IG5ldyBSZWdFeHAgXCJbXlxcXFx3XFxcXGQje0Blc3BlY2lhbH1dK1wiICdnJyAgIFxuICAgICAgICBAbWV0aG9kUmVnRXhwICAgICAgPSAvKFtAXT9cXHcrfEApXFwuKFxcdyspL1xuICAgICAgICBAbW9kdWxlUmVnRXhwICAgICAgPSAvXlxccyooXFx3KylcXHMqPVxccypyZXF1aXJlXFxzKyhbXFwnXFxcIl1bXFwuXFwvXFx3XStbXFwnXFxcIl0pL1xuICAgICAgICBAbmV3UmVnRXhwICAgICAgICAgPSAvKFtAXT9cXHcrKVxccyo9XFxzKm5ld1xccysoXFx3KykvXG4gICAgICAgIEBiYXNlUmVnRXhwICAgICAgICA9IC9cXHdcXHMrZXh0ZW5kc1xccysoXFx3KykvXG4gICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2VkaXQnICAgICAgICAgICBAb25FZGl0XG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2V0JyAgICAgICBAb25MaW5lc1NldFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnICAgQG9uTGluZUluc2VydGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ3dpbGxEZWxldGVMaW5lJyBAb25XaWxsRGVsZXRlTGluZVxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQ2hhbmdlZCcgICAgQG9uTGluZUNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNBcHBlbmRlZCcgIEBvbkxpbmVzQXBwZW5kZWRcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJyAgICAgICAgIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgICAgICAgICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBqc0NsYXNzID0gXG4gICAgICAgIFJlZ0V4cDogWyd0ZXN0JyAnY29tcGlsZScgJ2V4ZWMnICd0b1N0cmluZyddXG4gICAgICAgIFN0cmluZzogWydlbmRzV2l0aCcgJ3N0YXJ0c1dpdGgnICdzcGxpdCcgJ3NsaWNlJyAnc3Vic3RyaW5nJyAncGFkRW5kJyAncGFkU3RhcnQnICdpbmRleE9mJyAnbWF0Y2gnICd0cmltJyAndHJpbUVuZCcgJ3RyaW1TdGFydCddXG4gICAgXG4gICAgcGFyc2VNb2R1bGU6IChsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgIyBpZiBAbW9kdWxlUmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgIyBtYXRjaCA9IGxpbmUubWF0Y2ggQG1vZHVsZVJlZ0V4cFxuICAgICAgICAgICAgIyBtb2R1bGVOYW1lID0ga3N0ci5zdHJpcCBtYXRjaFsyXSwgXCInXCJcbiAgICAgICAgICAgICMgZm9yIGtleSBpbiByZXEubW9kdWxlS2V5cyBtb2R1bGVOYW1lLCBAZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgIyBAbXRoZGluZm9bbWF0Y2hbMV1dID89IHt9XG4gICAgICAgICAgICAgICAgIyBAbXRoZGluZm9bbWF0Y2hbMV1dW2tleV0gPz0gMVxuICAgIFxuICAgICAgICBpZiBAbmV3UmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgbWF0Y2ggPSBsaW5lLm1hdGNoIEBuZXdSZWdFeHBcbiAgICAgICAgICAgICMga2xvZyBtYXRjaFsyXSwgbWF0Y2hbMV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgY2xzcyA9IGV2YWwgbWF0Y2hbMl1cbiAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgIGlmIGNsc3M/LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICBpZiBqc0NsYXNzW21hdGNoWzJdXVxuICAgICAgICAgICAgICAgICAgICBAbXRoZGluZm9bbWF0Y2hbMV1dID89IHt9XG4gICAgICAgICAgICAgICAgICAgIGZvciBrZXkgaW4ganNDbGFzc1ttYXRjaFsyXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICMga2xvZyAnYWRkJyBtYXRjaFsxXSwga2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBAbXRoZGluZm9bbWF0Y2hbMV1dW2tleV0gPz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIEBtdGhkaW5mb1ttYXRjaFsyXV1cbiAgICAgICAgICAgICAgICAgICAgQG10aGRpbmZvW21hdGNoWzFdXSA/PSB7fVxuICAgICAgICAgICAgICAgICAgICBmb3Iga2V5IGluIE9iamVjdC5rZXlzIEBtdGhkaW5mb1ttYXRjaFsyXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICMga2xvZyAnYWRkJyBtYXRjaFsxXSwga2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBAbXRoZGluZm9bbWF0Y2hbMV1dW2tleV0gPz0gMVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBiYXNlUmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgbWF0Y2ggPSBsaW5lLm1hdGNoIEBiYXNlUmVnRXhwXG4gICAgICAgICAgICBpZiBAbXRoZGluZm9bbWF0Y2hbMV1dXG4gICAgICAgICAgICAgICAgZm9yIGtleSBpbiBPYmplY3Qua2V5cyBAbXRoZGluZm9bbWF0Y2hbMV1dXG4gICAgICAgICAgICAgICAgICAgIEB3b3JkaW5mb1tcIkAje2tleX1cIl0gPz0gY291bnQ6MVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgcGFyc2VNZXRob2Q6IChsaW5lKSAtPlxuXG4gICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgW0BtZXRob2RSZWdFeHAsIFsnb2JqJyAnbXRoJ11dLCBsaW5lXG4gICAgICAgIGZvciBpIGluIFswLi5yZ3MubGVuZ3RoLTJdIGJ5IDJcbiAgICAgICAgICAgIEBtdGhkaW5mb1tyZ3NbaV0ubWF0Y2hdID89IHt9XG4gICAgICAgICAgICBAbXRoZGluZm9bcmdzW2ldLm1hdGNoXVtyZ3NbaSsxXS5tYXRjaF0gPz0gMFxuICAgICAgICAgICAgQG10aGRpbmZvW3Jnc1tpXS5tYXRjaF1bcmdzW2krMV0ubWF0Y2hdICs9IDFcbiAgICBcbiAgICBjb21wbGV0ZU1ldGhvZDogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBsc3QgPSBsYXN0IGluZm8uYmVmb3JlLnNwbGl0ICcgJ1xuICAgICAgICBvYmogPSBsc3Quc2xpY2UgMCAtMVxuICAgICAgICByZXR1cm4gaWYgbm90IEBtdGhkaW5mb1tvYmpdXG4gICAgICAgIG10aGRzID0gT2JqZWN0LmtleXMgQG10aGRpbmZvW29ial1cbiAgICAgICAgbWNudCA9IG10aGRzLm1hcCAobSkgPT4gW20sQG10aGRpbmZvW29ial1bbV1dXG4gICAgICAgIG1jbnQuc29ydCAoYSxiKSAtPiBhWzFdIT1iWzFdIGFuZCBiWzFdLWFbMV0gb3IgYVswXS5sb2NhbGVDb21wYXJlIGJbMF1cbiAgICAgICAgQGZpcnN0TWF0Y2ggPSBtdGhkc1swXVxuICAgICAgICBAbWF0Y2hMaXN0ICA9IG10aGRzLnNsaWNlIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgb25FZGl0OiAoaW5mbykgPT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IGluZm8uYmVmb3JlLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICBzd2l0Y2ggaW5mby5hY3Rpb25cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZGVsZXRlJyAjIGV2ZXIgaGFwcGVuaW5nP1xuICAgICAgICAgICAgICAgIGVycm9yICdkZWxldGUhISEhJ1xuICAgICAgICAgICAgICAgIGlmIEB3b3JkaW5mb1tAd29yZF0/LnRlbXAgYW5kIEB3b3JkaW5mb1tAd29yZF0/LmNvdW50IDw9IDBcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEB3b3JkaW5mb1tAd29yZF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdpbnNlcnQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm90IEB3b3JkPy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby5iZWZvcmVbLTFdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbXBsZXRlTWV0aG9kIGluZm9cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZiBlbXB0eSBAd29yZGluZm9cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBfLnBpY2tCeSBAd29yZGluZm8sIChjLHcpID0+IHcuc3RhcnRzV2l0aChAd29yZCkgYW5kIHcubGVuZ3RoID4gQHdvcmQubGVuZ3RoICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBfLnRvUGFpcnMgbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAgICBmb3IgbSBpbiBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBkID0gQGVkaXRvci5kaXN0YW5jZU9mV29yZCBtWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICBtWzFdLmRpc3RhbmNlID0gMTAwIC0gTWF0aC5taW4gZCwgMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAoYlsxXS5kaXN0YW5jZStiWzFdLmNvdW50KzEvYlswXS5sZW5ndGgpIC0gKGFbMV0uZGlzdGFuY2UrYVsxXS5jb3VudCsxL2FbMF0ubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzID0gbWF0Y2hlcy5tYXAgKG0pIC0+IG1bMF1cbiAgICAgICAgICAgICAgICAgICAgZm9yIHcgaW4gd29yZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBAZmlyc3RNYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBmaXJzdE1hdGNoID0gdyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAbWF0Y2hMaXN0LnB1c2ggd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IEBmaXJzdE1hdGNoP1xuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gQGZpcnN0TWF0Y2guc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAb3BlbiBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogKGluZm8pIC0+XG5cbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGlmIG5vdCBjdXJzb3I/XG4gICAgICAgICAgICBrZXJyb3IgXCJBdXRvY29tcGxldGUub3BlbiAtLS0gbm8gY3Vyc29yP1wiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOiAnYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBcbiAgICAgICAgY3IgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgc3BhbkluZm8gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzcGFuSW5mbz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcCA9IEBlZGl0b3IucG9zQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgICAgIGNpID0gcFsxXS1AZWRpdG9yLnNjcm9sbC50b3BcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBzcGFuIGZvciBhdXRvY29tcGxldGU/IGN1cnNvciB0b3BsZWZ0OiAje3BhcnNlSW50IGNyLmxlZnR9ICN7cGFyc2VJbnQgY3IudG9wfVwiLCBpbmZvXG5cbiAgICAgICAgc3AgPSBzcGFuSW5mby5zcGFuXG4gICAgICAgIGlubmVyID0gc3AuaW5uZXJIVE1MXG4gICAgICAgIEBjbG9uZXMucHVzaCBzcC5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAY2xvbmVzLnB1c2ggc3AuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGNsb25lZC5wdXNoIHNwXG4gICAgICAgIFxuICAgICAgICB3cyA9IEB3b3JkLnNsaWNlIEB3b3JkLnNlYXJjaCAvXFx3L1xuICAgICAgICB3aSA9IHdzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgQGNsb25lc1swXS5pbm5lckhUTUwgPSBpbm5lci5zbGljZSAwIHNwYW5JbmZvLm9mZnNldENoYXIgKyAxIFxuICAgICAgICBAY2xvbmVzWzFdLmlubmVySFRNTCA9IGlubmVyLnNsaWNlICAgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDFcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcFxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG5cbiAgICAgICAgc3AucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcgY1xuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQGNvbXBsZXRpb24ubGVuZ3RoICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hMaXN0Lmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyAgICAgQG9uV2hlZWwgICAgICwgcGFzc2l2ZTp0cnVlXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93biAsIHBhc3NpdmU6dHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgICAgIGZvciBtIGluIEBtYXRjaExpc3RcbiAgICAgICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1pdGVtJyBpbmRleDppbmRleCsrXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0Q29udGVudCA9IG1cbiAgICAgICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICd3aGVlbCcgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAZmlyc3RNYXRjaCA9IG51bGxcbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXNcbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgXG4gICAgICAgIEBjbG9uZXMgPSBbXVxuICAgICAgICBAY2xvbmVkID0gW11cbiAgICAgICAgQG1hdGNoTGlzdCAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbldoZWVsOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5zY3JvbGxUb3AgKz0gZXZlbnQuZGVsdGFZXG4gICAgICAgIHN0b3BFdmVudCBldmVudCAgICBcbiAgICBcbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBvbkVudGVyKClcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBvbkVudGVyOiAtPiAgXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQGNsb3NlKClcblxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbWF0Y2hMaXN0W0BzZWxlY3RlZF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21wbGV0aW9uXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdFxuICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAbWF0Y2hMaXN0Lmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgQHNwYW4uaW5uZXJIVE1MID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQHNwYW4uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QuYWRkICAgICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgcHJldjogLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6IC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogLT4gQG5hdmlnYXRlIEBtYXRjaExpc3QubGVuZ3RoIC0gQHNlbGVjdGVkXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG5cbiAgICBtb3ZlQ2xvbmVzQnk6IChudW1DaGFycykgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBAY2xvbmVzXG4gICAgICAgIGJlZm9yZUxlbmd0aCA9IEBjbG9uZXNbMF0uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBmb3IgY2kgaW4gWzEuLi5AY2xvbmVzLmxlbmd0aF1cbiAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkW2NpLTFdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICAgICAgY2hhck9mZnNldCA9IG51bUNoYXJzXG4gICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICBjLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje29mZnNldCtAZWRpdG9yLnNpemUuY2hhcldpZHRoKmNoYXJPZmZzZXR9cHgpXCJcbiAgICAgICAgc3Bhbk9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFswXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgc3Bhbk9mZnNldCArPSBAZWRpdG9yLnNpemUuY2hhcldpZHRoKmJlZm9yZUxlbmd0aFxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tzcGFuT2Zmc2V0fXB4KVwiXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICBcbiAgICBwYXJzZUxpbmVzRGVsYXllZDogKGxpbmVzLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBkZWxheSA9IChsLCBvKSA9PiA9PiBAcGFyc2VMaW5lcyBsLCBvXG4gICAgICAgIGlmIGxpbmVzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIHNldFRpbWVvdXQgKGRlbGF5IGxpbmVzLCBvcHQpLCAyMDBcbiAgICBcbiAgICBwYXJzZUxpbmVzOihsaW5lcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcblxuICAgICAgICByZXR1cm4gaWYgbm90IGxpbmVzP1xuICAgICAgICBcbiAgICAgICAgY3Vyc29yV29yZCA9IEBjdXJzb3JXb3JkKClcbiAgICAgICAgZm9yIGwgaW4gbGluZXNcbiAgICAgICAgICAgIGlmIG5vdCBsPy5zcGxpdD9cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiQXV0b2NvbXBsZXRlLnBhcnNlTGluZXMgLS0gbGluZSBoYXMgbm8gc3BsaXQ/IGFjdGlvbjogI3tvcHQuYWN0aW9ufSBsaW5lOiAje2x9XCIsIGxpbmVzXG5cbiAgICAgICAgICAgIGlmIGwubGVuZ3RoID4gMjQwIFxuICAgICAgICAgICAgICAgICMgaWYgbC5zdGFydHNXaXRoICcvLyMgc291cmNlTWFwcGluZydcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHBhcnNlTWV0aG9kIGxcbiAgICAgICAgICAgIEBwYXJzZU1vZHVsZSBsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdvcmRzID0gbC5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgICAgIHdvcmRzID0gd29yZHMuZmlsdGVyICh3KSA9PiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEluZGV4ZXIudGVzdFdvcmQgd1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiB3ID09IGN1cnNvcldvcmRcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQHdvcmQgPT0gdy5zbGljZSAwLCB3Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBoZWFkZXJSZWdFeHAudGVzdCB3XG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHcgaW4gd29yZHMgIyBhcHBlbmQgd29yZHMgd2l0aG91dCBsZWFkaW5nIHNwZWNpYWwgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgaSA9IHcuc2VhcmNoIEBub3RTcGVjaWFsUmVnRXhwXG4gICAgICAgICAgICAgICAgaWYgaSA+IDAgYW5kIHdbMF0gIT0gXCIjXCJcbiAgICAgICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UgaVxuICAgICAgICAgICAgICAgICAgICB3b3Jkcy5wdXNoIHcgaWYgbm90IC9eW1xcLV0/W1xcZF0rJC8udGVzdCB3XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgaW5mbyAgPSBAd29yZGluZm9bd10gPyB7fVxuICAgICAgICAgICAgICAgIGNvdW50ID0gaW5mby5jb3VudCA/IDBcbiAgICAgICAgICAgICAgICBjb3VudCArPSBvcHQ/LmNvdW50ID8gMVxuICAgICAgICAgICAgICAgIGluZm8uY291bnQgPSBjb3VudFxuICAgICAgICAgICAgICAgIGluZm8udGVtcCA9IHRydWUgaWYgb3B0LmFjdGlvbiBpcyAnY2hhbmdlJ1xuICAgICAgICAgICAgICAgIEB3b3JkaW5mb1t3XSA9IGluZm9cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBjdXJzb3JXb3JkczogLT5cbiAgICAgICAgXG4gICAgICAgIGNwID0gQGVkaXRvci5jdXJzb3JQb3MoKVxuICAgICAgICB3b3JkcyA9IEBlZGl0b3Iud29yZFJhbmdlc0luTGluZUF0SW5kZXggY3BbMV0sIHJlZ0V4cDogQHNwZWNpYWxXb3JkUmVnRXhwICAgICAgICBcbiAgICAgICAgW2JlZm9yLCBjdXJzciwgYWZ0ZXJdID0gcmFuZ2VzU3BsaXRBdFBvc0luUmFuZ2VzIGNwLCB3b3Jkc1xuICAgICAgICBbQGVkaXRvci50ZXh0c0luUmFuZ2VzKGJlZm9yKSwgQGVkaXRvci50ZXh0SW5SYW5nZShjdXJzciksIEBlZGl0b3IudGV4dHNJblJhbmdlcyhhZnRlcildXG4gICAgICAgIFxuICAgIGN1cnNvcldvcmQ6IC0+IEBjdXJzb3JXb3JkcygpWzFdXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbkxpbmVzQXBwZW5kZWQ6ICAobGluZXMpICAgID0+IEBwYXJzZUxpbmVzIGxpbmVzLCBhY3Rpb246ICdhcHBlbmQnXG4gICAgb25MaW5lSW5zZXJ0ZWQ6ICAgKGxpKSAgICAgICA9PiBAcGFyc2VMaW5lcyBbQGVkaXRvci5saW5lKGxpKV0sIGFjdGlvbjogJ2luc2VydCdcbiAgICBvbkxpbmVDaGFuZ2VkOiAgICAobGkpICAgICAgID0+IEBwYXJzZUxpbmVzIFtAZWRpdG9yLmxpbmUobGkpXSwgYWN0aW9uOiAnY2hhbmdlJywgY291bnQ6IDBcbiAgICBvbldpbGxEZWxldGVMaW5lOiAobGluZSkgICAgID0+IEBwYXJzZUxpbmVzIFtsaW5lXSwgYWN0aW9uOiAnZGVsZXRlJywgY291bnQ6IC0xXG4gICAgIyBvbkxpbmVzU2V0OiAgICAgICAobGluZXMpICAgID0+IGtsb2cgJ29uTGluZXNTZXQnOyBAcGFyc2VMaW5lcyBsaW5lcywgYWN0aW9uOiAnc2V0JyBpZiBsaW5lcy5sZW5ndGhcbiAgICBvbkxpbmVzU2V0OiAgICAgICAobGluZXMpICAgID0+IEBwYXJzZUxpbmVzRGVsYXllZCBsaW5lcywgYWN0aW9uOiAnc2V0JyBpZiBsaW5lcy5sZW5ndGhcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInIHRoZW4gcmV0dXJuIEBvbkVudGVyKCkgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJ1xuICAgICAgICAgICAgICAgICAgICBAbmV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgQHByZXYoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICBAbGFzdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee