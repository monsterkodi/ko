// koffee 1.16.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsaUdBQUE7SUFBQTs7OztBQVFBLE1BQWdFLE9BQUEsQ0FBUSxLQUFSLENBQWhFLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLG1CQUE1QixFQUFvQyxlQUFwQyxFQUEwQyxtQkFBMUMsRUFBa0Q7O0FBRWxELE9BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxRQUFSOztBQUNWLEdBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtBQUVGLFFBQUE7Ozs7SUFBRyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7O1FBRUEsNENBQUE7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFDckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsUUFBTixHQUFlLEdB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bEI7UUFFcEIsSUFBMEIsaUJBQTFCO0FBQUEsbUJBQU8sWUFBUDs7QUFFQSxnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsT0FEVDtBQUNzQix1QkFBTyxJQUFDLENBQUEsT0FBRCxDQUFBO0FBRDdCO1FBR0EsSUFBRyxpQkFBSDtBQUNJLG9CQUFPLEtBQVA7QUFBQSxxQkFDUyxNQURUO29CQUVRLElBQUMsQ0FBQSxJQUFELENBQUE7QUFDQTtBQUhSLHFCQUlTLElBSlQ7b0JBS1EsSUFBRyxJQUFDLENBQUEsUUFBRCxJQUFhLENBQWhCO3dCQUNJLElBQUMsQ0FBQSxJQUFELENBQUE7QUFDQSwrQkFGSjtxQkFBQSxNQUFBO3dCQUlJLElBQUMsQ0FBQSxJQUFELENBQUE7QUFDQSwrQkFMSjs7QUFMUixhQURKOztRQVlBLElBQUMsQ0FBQSxLQUFELENBQUE7ZUFDQTtJQXBCb0I7Ozs7R0FuWkQ7O0FBeWEzQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyAkLCBfLCBjbGFtcCwgZWxlbSwgZW1wdHksIGtlcnJvciwgbGFzdCwgbWF0Y2hyLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcblxuSW5kZXhlciA9IHJlcXVpcmUgJy4uL21haW4vaW5kZXhlcidcbmV2ZW50ICAgPSByZXF1aXJlICdldmVudHMnXG5yZXEgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvcmVxJ1xuXG5jbGFzcyBBdXRvY29tcGxldGUgZXh0ZW5kcyBldmVudFxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlcigpXG4gICAgICAgIFxuICAgICAgICBAd29yZGluZm8gID0ge31cbiAgICAgICAgQG10aGRpbmZvICA9IHt9XG4gICAgICAgIEBtYXRjaExpc3QgPSBbXVxuICAgICAgICBAY2xvbmVzICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICA9IFtdXG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgc3BlY2lhbHMgPSBcIl8tQCNcIlxuICAgICAgICBAZXNwZWNpYWwgPSAoXCJcXFxcXCIrYyBmb3IgYyBpbiBzcGVjaWFscy5zcGxpdCAnJykuam9pbiAnJ1xuICAgICAgICBAaGVhZGVyUmVnRXhwICAgICAgPSBuZXcgUmVnRXhwIFwiXlswI3tAZXNwZWNpYWx9XSskXCJcbiAgICAgICAgQG5vdFNwZWNpYWxSZWdFeHAgID0gbmV3IFJlZ0V4cCBcIlteI3tAZXNwZWNpYWx9XVwiXG4gICAgICAgIEBzcGVjaWFsV29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFtcXFxcdyN7QGVzcGVjaWFsfV0rfFteXFxcXHNdKVwiICdnJ1xuICAgICAgICBAc3BsaXRSZWdFeHAgICAgICAgPSBuZXcgUmVnRXhwIFwiW15cXFxcd1xcXFxkI3tAZXNwZWNpYWx9XStcIiAnZycgICBcbiAgICAgICAgQG1ldGhvZFJlZ0V4cCAgICAgID0gLyhbQF0/XFx3K3xAKVxcLihcXHcrKS9cbiAgICAgICAgQG1vZHVsZVJlZ0V4cCAgICAgID0gL15cXHMqKFxcdyspXFxzKj1cXHMqcmVxdWlyZVxccysoW1xcJ1xcXCJdW1xcLlxcL1xcd10rW1xcJ1xcXCJdKS9cbiAgICAgICAgQG5ld1JlZ0V4cCAgICAgICAgID0gLyhbQF0/XFx3KylcXHMqPVxccypuZXdcXHMrKFxcdyspL1xuICAgICAgICBAYmFzZVJlZ0V4cCAgICAgICAgPSAvXFx3XFxzK2V4dGVuZHNcXHMrKFxcdyspL1xuICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdlZGl0JyAgICAgICAgICAgQG9uRWRpdFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NldCcgICAgICAgQG9uTGluZXNTZXRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUluc2VydGVkJyAgIEBvbkxpbmVJbnNlcnRlZFxuICAgICAgICBAZWRpdG9yLm9uICd3aWxsRGVsZXRlTGluZScgQG9uV2lsbERlbGV0ZUxpbmVcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUNoYW5nZWQnICAgIEBvbkxpbmVDaGFuZ2VkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzQXBwZW5kZWQnICBAb25MaW5lc0FwcGVuZGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgICAgICAgICBAY2xvc2VcbiAgICAgICAgQGVkaXRvci5vbiAnYmx1cicgICAgICAgICAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAganNDbGFzcyA9IFxuICAgICAgICBSZWdFeHA6IFsndGVzdCcgJ2NvbXBpbGUnICdleGVjJyAndG9TdHJpbmcnXVxuICAgICAgICBTdHJpbmc6IFsnZW5kc1dpdGgnICdzdGFydHNXaXRoJyAnc3BsaXQnICdzbGljZScgJ3N1YnN0cmluZycgJ3BhZEVuZCcgJ3BhZFN0YXJ0JyAnaW5kZXhPZicgJ21hdGNoJyAndHJpbScgJ3RyaW1FbmQnICd0cmltU3RhcnQnXVxuICAgIFxuICAgIHBhcnNlTW9kdWxlOiAobGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgICMgaWYgQG1vZHVsZVJlZ0V4cC50ZXN0IGxpbmVcbiAgICAgICAgICAgICMgbWF0Y2ggPSBsaW5lLm1hdGNoIEBtb2R1bGVSZWdFeHBcbiAgICAgICAgICAgICMgbW9kdWxlTmFtZSA9IGtzdHIuc3RyaXAgbWF0Y2hbMl0sIFwiJ1wiXG4gICAgICAgICAgICAjIGZvciBrZXkgaW4gcmVxLm1vZHVsZUtleXMgbW9kdWxlTmFtZSwgQGVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICMgQG10aGRpbmZvW21hdGNoWzFdXSA/PSB7fVxuICAgICAgICAgICAgICAgICMgQG10aGRpbmZvW21hdGNoWzFdXVtrZXldID89IDFcbiAgICBcbiAgICAgICAgaWYgQG5ld1JlZ0V4cC50ZXN0IGxpbmVcbiAgICAgICAgICAgIG1hdGNoID0gbGluZS5tYXRjaCBAbmV3UmVnRXhwXG4gICAgICAgICAgICAjIGtsb2cgbWF0Y2hbMl0sIG1hdGNoWzFdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIGNsc3MgPSBldmFsIG1hdGNoWzJdXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICBpZiBjbHNzPy5wcm90b3R5cGU/XG4gICAgICAgICAgICAgICAgaWYganNDbGFzc1ttYXRjaFsyXV1cbiAgICAgICAgICAgICAgICAgICAgQG10aGRpbmZvW21hdGNoWzFdXSA/PSB7fVxuICAgICAgICAgICAgICAgICAgICBmb3Iga2V5IGluIGpzQ2xhc3NbbWF0Y2hbMl1dXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ2FkZCcgbWF0Y2hbMV0sIGtleVxuICAgICAgICAgICAgICAgICAgICAgICAgQG10aGRpbmZvW21hdGNoWzFdXVtrZXldID89IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBAbXRoZGluZm9bbWF0Y2hbMl1dXG4gICAgICAgICAgICAgICAgICAgIEBtdGhkaW5mb1ttYXRjaFsxXV0gPz0ge31cbiAgICAgICAgICAgICAgICAgICAgZm9yIGtleSBpbiBPYmplY3Qua2V5cyBAbXRoZGluZm9bbWF0Y2hbMl1dXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ2FkZCcgbWF0Y2hbMV0sIGtleVxuICAgICAgICAgICAgICAgICAgICAgICAgQG10aGRpbmZvW21hdGNoWzFdXVtrZXldID89IDFcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAYmFzZVJlZ0V4cC50ZXN0IGxpbmVcbiAgICAgICAgICAgIG1hdGNoID0gbGluZS5tYXRjaCBAYmFzZVJlZ0V4cFxuICAgICAgICAgICAgaWYgQG10aGRpbmZvW21hdGNoWzFdXVxuICAgICAgICAgICAgICAgIGZvciBrZXkgaW4gT2JqZWN0LmtleXMgQG10aGRpbmZvW21hdGNoWzFdXVxuICAgICAgICAgICAgICAgICAgICBAd29yZGluZm9bXCJAI3trZXl9XCJdID89IGNvdW50OjFcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgIFxuICAgIHBhcnNlTWV0aG9kOiAobGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgW0BtZXRob2RSZWdFeHAsIFsnb2JqJyAnbXRoJ11dLCBsaW5lXG4gICAgICAgIGZvciBpIGluIFswLi5yZ3MubGVuZ3RoLTJdIGJ5IDJcbiAgICAgICAgICAgIEBtdGhkaW5mb1tyZ3NbaV0ubWF0Y2hdID89IHt9XG4gICAgICAgICAgICBAbXRoZGluZm9bcmdzW2ldLm1hdGNoXVtyZ3NbaSsxXS5tYXRjaF0gPz0gMFxuICAgICAgICAgICAgQG10aGRpbmZvW3Jnc1tpXS5tYXRjaF1bcmdzW2krMV0ubWF0Y2hdICs9IDFcbiAgICBcbiAgICBjb21wbGV0ZU1ldGhvZDogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBsc3QgPSBsYXN0IGluZm8uYmVmb3JlLnNwbGl0ICcgJ1xuICAgICAgICBvYmogPSBsc3Quc2xpY2UgMCAtMVxuICAgICAgICByZXR1cm4gaWYgbm90IEBtdGhkaW5mb1tvYmpdXG4gICAgICAgIG10aGRzID0gT2JqZWN0LmtleXMgQG10aGRpbmZvW29ial1cbiAgICAgICAgbWNudCA9IG10aGRzLm1hcCAobSkgPT4gW20sQG10aGRpbmZvW29ial1bbV1dXG4gICAgICAgIG1jbnQuc29ydCAoYSxiKSAtPiBhWzFdIT1iWzFdIGFuZCBiWzFdLWFbMV0gb3IgYVswXS5sb2NhbGVDb21wYXJlIGJbMF1cbiAgICAgICAgQGZpcnN0TWF0Y2ggPSBtdGhkc1swXVxuICAgICAgICBAbWF0Y2hMaXN0ICA9IG10aGRzLnNsaWNlIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgb25FZGl0OiAoaW5mbykgPT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IGluZm8uYmVmb3JlLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICBzd2l0Y2ggaW5mby5hY3Rpb25cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZGVsZXRlJyAjIGV2ZXIgaGFwcGVuaW5nP1xuICAgICAgICAgICAgICAgIGVycm9yICdkZWxldGUhISEhJ1xuICAgICAgICAgICAgICAgIGlmIEB3b3JkaW5mb1tAd29yZF0/LnRlbXAgYW5kIEB3b3JkaW5mb1tAd29yZF0/LmNvdW50IDw9IDBcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEB3b3JkaW5mb1tAd29yZF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdpbnNlcnQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm90IEB3b3JkPy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby5iZWZvcmVbLTFdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbXBsZXRlTWV0aG9kIGluZm9cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZiBlbXB0eSBAd29yZGluZm9cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBfLnBpY2tCeSBAd29yZGluZm8sIChjLHcpID0+IHcuc3RhcnRzV2l0aChAd29yZCkgYW5kIHcubGVuZ3RoID4gQHdvcmQubGVuZ3RoICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBfLnRvUGFpcnMgbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAgICBmb3IgbSBpbiBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBkID0gQGVkaXRvci5kaXN0YW5jZU9mV29yZCBtWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICBtWzFdLmRpc3RhbmNlID0gMTAwIC0gTWF0aC5taW4gZCwgMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAoYlsxXS5kaXN0YW5jZStiWzFdLmNvdW50KzEvYlswXS5sZW5ndGgpIC0gKGFbMV0uZGlzdGFuY2UrYVsxXS5jb3VudCsxL2FbMF0ubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzID0gbWF0Y2hlcy5tYXAgKG0pIC0+IG1bMF1cbiAgICAgICAgICAgICAgICAgICAgZm9yIHcgaW4gd29yZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBAZmlyc3RNYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBmaXJzdE1hdGNoID0gdyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAbWF0Y2hMaXN0LnB1c2ggd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IEBmaXJzdE1hdGNoP1xuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gQGZpcnN0TWF0Y2guc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAb3BlbiBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogKGluZm8pIC0+XG5cbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGlmIG5vdCBjdXJzb3I/XG4gICAgICAgICAgICBrZXJyb3IgXCJBdXRvY29tcGxldGUub3BlbiAtLS0gbm8gY3Vyc29yP1wiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOiAnYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBcbiAgICAgICAgY3IgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgc3BhbkluZm8gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzcGFuSW5mbz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcCA9IEBlZGl0b3IucG9zQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgICAgIGNpID0gcFsxXS1AZWRpdG9yLnNjcm9sbC50b3BcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBzcGFuIGZvciBhdXRvY29tcGxldGU/IGN1cnNvciB0b3BsZWZ0OiAje3BhcnNlSW50IGNyLmxlZnR9ICN7cGFyc2VJbnQgY3IudG9wfVwiLCBpbmZvXG5cbiAgICAgICAgc3AgPSBzcGFuSW5mby5zcGFuXG4gICAgICAgIGlubmVyID0gc3AuaW5uZXJIVE1MXG4gICAgICAgIEBjbG9uZXMucHVzaCBzcC5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAY2xvbmVzLnB1c2ggc3AuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGNsb25lZC5wdXNoIHNwXG4gICAgICAgIFxuICAgICAgICB3cyA9IEB3b3JkLnNsaWNlIEB3b3JkLnNlYXJjaCAvXFx3L1xuICAgICAgICB3aSA9IHdzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgQGNsb25lc1swXS5pbm5lckhUTUwgPSBpbm5lci5zbGljZSAwIHNwYW5JbmZvLm9mZnNldENoYXIgKyAxIFxuICAgICAgICBAY2xvbmVzWzFdLmlubmVySFRNTCA9IGlubmVyLnNsaWNlICAgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDFcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcFxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG5cbiAgICAgICAgc3AucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcgY1xuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQGNvbXBsZXRpb24ubGVuZ3RoICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hMaXN0Lmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyAgICAgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGluZGV4ID0gMFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoTGlzdFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgICAgICBpdGVtLnRleHRDb250ZW50ID0gbVxuICAgICAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGl0ZW1cbiAgICAgICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ3doZWVsJyBAb25XaGVlbFxuICAgICAgICAgICAgQGxpc3QucmVtb3ZlRXZlbnRMaXN0ZW5lciAnY2xpY2snIEBvbkNsaWNrXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0ICAgICAgID0gbnVsbFxuICAgICAgICBAc3BhbiAgICAgICA9IG51bGxcbiAgICAgICAgQGNvbXBsZXRpb24gPSBudWxsXG4gICAgICAgIEBmaXJzdE1hdGNoID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgYy5yZW1vdmUoKVxuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWRcbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICBcbiAgICAgICAgQGNsb25lcyA9IFtdXG4gICAgICAgIEBjbG9uZWQgPSBbXVxuICAgICAgICBAbWF0Y2hMaXN0ICA9IFtdXG4gICAgICAgIEBcblxuICAgIG9uV2hlZWw6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LnNjcm9sbFRvcCArPSBldmVudC5kZWx0YVlcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICAgIFxuICAgIFxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IGVsZW0udXBBdHRyIGV2ZW50LnRhcmdldCwgJ2luZGV4J1xuICAgICAgICBpZiBpbmRleCAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdCBpbmRleFxuICAgICAgICAgICAgQG9uRW50ZXIoKVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIG9uRW50ZXI6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBtYXRjaExpc3RbQHNlbGVjdGVkXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaExpc3QubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAtPiBAbmF2aWdhdGUgQG1hdGNoTGlzdC5sZW5ndGggLSBAc2VsZWN0ZWRcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBjbG9uZXNcbiAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICBzcGFuT2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkWzBdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICBzcGFuT2Zmc2V0ICs9IEBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqYmVmb3JlTGVuZ3RoXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje3NwYW5PZmZzZXR9cHgpXCJcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgIFxuICAgIHBhcnNlTGluZXNEZWxheWVkOiAobGluZXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGRlbGF5ID0gKGwsIG8pID0+ID0+IEBwYXJzZUxpbmVzIGwsIG9cbiAgICAgICAgaWYgbGluZXMubGVuZ3RoID4gMVxuICAgICAgICAgICAgc2V0VGltZW91dCAoZGVsYXkgbGluZXMsIG9wdCksIDIwMFxuICAgIFxuICAgIHBhcnNlTGluZXM6KGxpbmVzLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgICAgIHJldHVybiBpZiBub3QgbGluZXM/XG4gICAgICAgIFxuICAgICAgICBjdXJzb3JXb3JkID0gQGN1cnNvcldvcmQoKVxuICAgICAgICBmb3IgbCBpbiBsaW5lc1xuICAgICAgICAgICAgaWYgbm90IGw/LnNwbGl0P1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJBdXRvY29tcGxldGUucGFyc2VMaW5lcyAtLSBsaW5lIGhhcyBubyBzcGxpdD8gYWN0aW9uOiAje29wdC5hY3Rpb259IGxpbmU6ICN7bH1cIiwgbGluZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBwYXJzZU1ldGhvZCBsXG4gICAgICAgICAgICBAcGFyc2VNb2R1bGUgbFxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3b3JkcyA9IGwuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgICAgICB3b3JkcyA9IHdvcmRzLmZpbHRlciAodykgPT4gXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBJbmRleGVyLnRlc3RXb3JkIHdcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgdyA9PSBjdXJzb3JXb3JkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEB3b3JkID09IHcuc2xpY2UgMCwgdy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBAaGVhZGVyUmVnRXhwLnRlc3Qgd1xuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB3IGluIHdvcmRzICMgYXBwZW5kIHdvcmRzIHdpdGhvdXQgbGVhZGluZyBzcGVjaWFsIGNoYXJhY3RlclxuICAgICAgICAgICAgICAgIGkgPSB3LnNlYXJjaCBAbm90U3BlY2lhbFJlZ0V4cFxuICAgICAgICAgICAgICAgIGlmIGkgPiAwIGFuZCB3WzBdICE9IFwiI1wiXG4gICAgICAgICAgICAgICAgICAgIHcgPSB3LnNsaWNlIGlcbiAgICAgICAgICAgICAgICAgICAgd29yZHMucHVzaCB3IGlmIG5vdCAvXltcXC1dP1tcXGRdKyQvLnRlc3Qgd1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgdyBpbiB3b3Jkc1xuICAgICAgICAgICAgICAgIGluZm8gID0gQHdvcmRpbmZvW3ddID8ge31cbiAgICAgICAgICAgICAgICBjb3VudCA9IGluZm8uY291bnQgPyAwXG4gICAgICAgICAgICAgICAgY291bnQgKz0gb3B0Py5jb3VudCA/IDFcbiAgICAgICAgICAgICAgICBpbmZvLmNvdW50ID0gY291bnRcbiAgICAgICAgICAgICAgICBpbmZvLnRlbXAgPSB0cnVlIGlmIG9wdC5hY3Rpb24gaXMgJ2NoYW5nZSdcbiAgICAgICAgICAgICAgICBAd29yZGluZm9bd10gPSBpbmZvXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgY3Vyc29yV29yZHM6IC0+XG4gICAgICAgIFxuICAgICAgICBjcCA9IEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgd29yZHMgPSBAZWRpdG9yLndvcmRSYW5nZXNJbkxpbmVBdEluZGV4IGNwWzFdLCByZWdFeHA6IEBzcGVjaWFsV29yZFJlZ0V4cCAgICAgICAgXG4gICAgICAgIFtiZWZvciwgY3Vyc3IsIGFmdGVyXSA9IHJhbmdlc1NwbGl0QXRQb3NJblJhbmdlcyBjcCwgd29yZHNcbiAgICAgICAgW0BlZGl0b3IudGV4dHNJblJhbmdlcyhiZWZvciksIEBlZGl0b3IudGV4dEluUmFuZ2UoY3Vyc3IpLCBAZWRpdG9yLnRleHRzSW5SYW5nZXMoYWZ0ZXIpXVxuICAgICAgICBcbiAgICBjdXJzb3JXb3JkOiAtPiBAY3Vyc29yV29yZHMoKVsxXVxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgXG4gICAgb25MaW5lc0FwcGVuZGVkOiAgKGxpbmVzKSAgICA9PiBAcGFyc2VMaW5lcyBsaW5lcywgYWN0aW9uOiAnYXBwZW5kJ1xuICAgIG9uTGluZUluc2VydGVkOiAgIChsaSkgICAgICAgPT4gQHBhcnNlTGluZXMgW0BlZGl0b3IubGluZShsaSldLCBhY3Rpb246ICdpbnNlcnQnXG4gICAgb25MaW5lQ2hhbmdlZDogICAgKGxpKSAgICAgICA9PiBAcGFyc2VMaW5lcyBbQGVkaXRvci5saW5lKGxpKV0sIGFjdGlvbjogJ2NoYW5nZScsIGNvdW50OiAwXG4gICAgb25XaWxsRGVsZXRlTGluZTogKGxpbmUpICAgICA9PiBAcGFyc2VMaW5lcyBbbGluZV0sIGFjdGlvbjogJ2RlbGV0ZScsIGNvdW50OiAtMVxuICAgICMgb25MaW5lc1NldDogICAgICAgKGxpbmVzKSAgICA9PiBrbG9nICdvbkxpbmVzU2V0JzsgQHBhcnNlTGluZXMgbGluZXMsIGFjdGlvbjogJ3NldCcgaWYgbGluZXMubGVuZ3RoXG4gICAgb25MaW5lc1NldDogICAgICAgKGxpbmVzKSAgICA9PiBAcGFyc2VMaW5lc0RlbGF5ZWQgbGluZXMsIGFjdGlvbjogJ3NldCcgaWYgbGluZXMubGVuZ3RoXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyB0aGVuIHJldHVybiBAb25FbnRlcigpICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bidcbiAgICAgICAgICAgICAgICAgICAgQG5leHQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB3aGVuICd1cCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmV2KClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgQGxhc3QoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee