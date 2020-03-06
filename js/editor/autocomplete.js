// koffee 1.12.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Indexer, _, clamp, elem, empty, event, kerror, last, matchr, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, elem = ref.elem, empty = ref.empty, kerror = ref.kerror, last = ref.last, matchr = ref.matchr, stopEvent = ref.stopEvent;

Indexer = require('../main/indexer');

event = require('events');

Autocomplete = (function(superClass) {
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
        this.methodRegExp = /([\@]?\w+|@)\.(\w+)/;
        this.editor.on('edit', this.onEdit);
        this.editor.on('linesSet', this.onLinesSet);
        this.editor.on('lineInserted', this.onLineInserted);
        this.editor.on('willDeleteLine', this.onWillDeleteLine);
        this.editor.on('lineChanged', this.onLineChanged);
        this.editor.on('linesAppended', this.onLinesAppended);
        this.editor.on('cursor', this.close);
        this.editor.on('blur', this.close);
    }

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNEZBQUE7SUFBQTs7OztBQVFBLE1BQWdFLE9BQUEsQ0FBUSxLQUFSLENBQWhFLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLG1CQUE1QixFQUFvQyxlQUFwQyxFQUEwQyxtQkFBMUMsRUFBa0Q7O0FBRWxELE9BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxRQUFSOztBQUVKOzs7SUFFQyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7O1FBRUEsNENBQUE7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFFckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsUUFBTixHQUFlLEdBQTFCO1FBQ3JCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLE1BQUos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QUZKO3FCQUFBLE1BQUE7d0JBSUksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUxKOztBQUxSLGFBREo7O1FBWUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBcEJvQjs7OztHQWxXRDs7QUF3WDNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57ICQsIF8sIGNsYW1wLCBlbGVtLCBlbXB0eSwga2Vycm9yLCBsYXN0LCBtYXRjaHIsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5JbmRleGVyID0gcmVxdWlyZSAnLi4vbWFpbi9pbmRleGVyJ1xuZXZlbnQgICA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgQXV0b2NvbXBsZXRlIGV4dGVuZHMgZXZlbnRcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBcbiAgICAgICAgQHdvcmRpbmZvICA9IHt9XG4gICAgICAgIEBtdGhkaW5mbyAgPSB7fVxuICAgICAgICBAbWF0Y2hMaXN0ID0gW11cbiAgICAgICAgQGNsb25lcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIHNwZWNpYWxzID0gXCJfLUAjXCJcbiAgICAgICAgQGVzcGVjaWFsID0gKFwiXFxcXFwiK2MgZm9yIGMgaW4gc3BlY2lhbHMuc3BsaXQgJycpLmpvaW4gJydcbiAgICAgICAgQGhlYWRlclJlZ0V4cCAgICAgID0gbmV3IFJlZ0V4cCBcIl5bMCN7QGVzcGVjaWFsfV0rJFwiXG4gICAgICAgIFxuICAgICAgICBAbm90U3BlY2lhbFJlZ0V4cCAgPSBuZXcgUmVnRXhwIFwiW14je0Blc3BlY2lhbH1dXCJcbiAgICAgICAgQHNwZWNpYWxXb3JkUmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tAZXNwZWNpYWx9XSt8W15cXFxcc10pXCIgJ2cnXG4gICAgICAgIEBzcGxpdFJlZ0V4cCAgICAgICA9IG5ldyBSZWdFeHAgXCJbXlxcXFx3XFxcXGQje0Blc3BlY2lhbH1dK1wiICdnJyAgIFxuICAgICAgICBAbWV0aG9kUmVnRXhwICAgICAgPSAvKFtcXEBdP1xcdyt8QClcXC4oXFx3KykvXG4gICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2VkaXQnICAgICAgICAgICBAb25FZGl0XG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2V0JyAgICAgICBAb25MaW5lc1NldFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnICAgQG9uTGluZUluc2VydGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ3dpbGxEZWxldGVMaW5lJyBAb25XaWxsRGVsZXRlTGluZVxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQ2hhbmdlZCcgICAgQG9uTGluZUNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNBcHBlbmRlZCcgIEBvbkxpbmVzQXBwZW5kZWRcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJyAgICAgICAgIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgICAgICAgICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgcGFyc2VNZXRob2Q6IChsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgcmdzID0gbWF0Y2hyLnJhbmdlcyBbQG1ldGhvZFJlZ0V4cCwgWydvYmonICdtdGgnXV0sIGxpbmVcbiAgICAgICAgZm9yIGkgaW4gWzAuLnJncy5sZW5ndGgtMl0gYnkgMlxuICAgICAgICAgICAgQG10aGRpbmZvW3Jnc1tpXS5tYXRjaF0gPz0ge31cbiAgICAgICAgICAgIEBtdGhkaW5mb1tyZ3NbaV0ubWF0Y2hdW3Jnc1tpKzFdLm1hdGNoXSA/PSAwXG4gICAgICAgICAgICBAbXRoZGluZm9bcmdzW2ldLm1hdGNoXVtyZ3NbaSsxXS5tYXRjaF0gKz0gMVxuICAgIFxuICAgIGNvbXBsZXRlTWV0aG9kOiAoaW5mbykgLT5cbiAgICAgICAgXG4gICAgICAgIGxzdCA9IGxhc3QgaW5mby5iZWZvcmUuc3BsaXQgJyAnXG4gICAgICAgIG9iaiA9IGxzdC5zbGljZSAwIC0xXG4gICAgICAgIHJldHVybiBpZiBub3QgQG10aGRpbmZvW29ial1cbiAgICAgICAgbXRoZHMgPSBPYmplY3Qua2V5cyBAbXRoZGluZm9bb2JqXVxuICAgICAgICBtY250ID0gbXRoZHMubWFwIChtKSA9PiBbbSxAbXRoZGluZm9bb2JqXVttXV1cbiAgICAgICAgbWNudC5zb3J0IChhLGIpIC0+IGFbMV0hPWJbMV0gYW5kIGJbMV0tYVsxXSBvciBhWzBdLmxvY2FsZUNvbXBhcmUgYlswXVxuICAgICAgICBAZmlyc3RNYXRjaCA9IG10aGRzWzBdXG4gICAgICAgIEBtYXRjaExpc3QgID0gbXRoZHMuc2xpY2UgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBvbkVkaXQ6IChpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIHN3aXRjaCBpbmZvLmFjdGlvblxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdkZWxldGUnICMgZXZlciBoYXBwZW5pbmc/XG4gICAgICAgICAgICAgICAgZXJyb3IgJ2RlbGV0ZSEhISEnXG4gICAgICAgICAgICAgICAgaWYgQHdvcmRpbmZvW0B3b3JkXT8udGVtcCBhbmQgQHdvcmRpbmZvW0B3b3JkXT8uY291bnQgPD0gMFxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQHdvcmRpbmZvW0B3b3JkXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2luc2VydCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLmJlZm9yZVstMV0gPT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29tcGxldGVNZXRob2QgaW5mb1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEB3b3JkaW5mb1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcyA9IF8ucGlja0J5IEB3b3JkaW5mbywgKGMsdykgPT4gdy5zdGFydHNXaXRoKEB3b3JkKSBhbmQgdy5sZW5ndGggPiBAd29yZC5sZW5ndGggICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcyA9IF8udG9QYWlycyBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgIGZvciBtIGluIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBAZWRpdG9yLmRpc3RhbmNlT2ZXb3JkIG1bMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1bMV0uZGlzdGFuY2UgPSAxMDAgLSBNYXRoLm1pbiBkLCAxMDBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIChiWzFdLmRpc3RhbmNlK2JbMV0uY291bnQrMS9iWzBdLmxlbmd0aCkgLSAoYVsxXS5kaXN0YW5jZSthWzFdLmNvdW50KzEvYVswXS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgd29yZHMgPSBtYXRjaGVzLm1hcCAobSkgLT4gbVswXVxuICAgICAgICAgICAgICAgICAgICBmb3IgdyBpbiB3b3Jkc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IEBmaXJzdE1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGZpcnN0TWF0Y2ggPSB3IFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBtYXRjaExpc3QucHVzaCB3XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpcnN0TWF0Y2g/XG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBAZmlyc3RNYXRjaC5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBvcGVuIGluZm9cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAoaW5mbykgLT5cblxuICAgICAgICBjdXJzb3IgPSAkKCcubWFpbicsIEBlZGl0b3IudmlldylcbiAgICAgICAgaWYgbm90IGN1cnNvcj9cbiAgICAgICAgICAgIGtlcnJvciBcIkF1dG9jb21wbGV0ZS5vcGVuIC0tLSBubyBjdXJzb3I/XCJcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicsIGNsYXNzOiAnYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBcbiAgICAgICAgY3IgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgc3BhbkluZm8gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzcGFuSW5mbz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcCA9IEBlZGl0b3IucG9zQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgICAgIGNpID0gcFsxXS1AZWRpdG9yLnNjcm9sbC50b3BcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBzcGFuIGZvciBhdXRvY29tcGxldGU/IGN1cnNvciB0b3BsZWZ0OiAje3BhcnNlSW50IGNyLmxlZnR9ICN7cGFyc2VJbnQgY3IudG9wfVwiLCBpbmZvXG5cbiAgICAgICAgc3AgPSBzcGFuSW5mby5zcGFuXG4gICAgICAgIGlubmVyID0gc3AuaW5uZXJIVE1MXG4gICAgICAgIEBjbG9uZXMucHVzaCBzcC5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAY2xvbmVzLnB1c2ggc3AuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGNsb25lZC5wdXNoIHNwXG4gICAgICAgIFxuICAgICAgICB3cyA9IEB3b3JkLnNsaWNlIEB3b3JkLnNlYXJjaCAvXFx3L1xuICAgICAgICB3aSA9IHdzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgQGNsb25lc1swXS5pbm5lckhUTUwgPSBpbm5lci5zbGljZSAwIHNwYW5JbmZvLm9mZnNldENoYXIgKyAxIFxuICAgICAgICBAY2xvbmVzWzFdLmlubmVySFRNTCA9IGlubmVyLnNsaWNlICAgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDFcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcFxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG5cbiAgICAgICAgc3AucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcgY1xuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQGNvbXBsZXRpb24ubGVuZ3RoICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hMaXN0Lmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyAgICAgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGluZGV4ID0gMFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoTGlzdFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgICAgICBpdGVtLnRleHRDb250ZW50ID0gbVxuICAgICAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGl0ZW1cbiAgICAgICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ3doZWVsJyBAb25XaGVlbFxuICAgICAgICAgICAgQGxpc3QucmVtb3ZlRXZlbnRMaXN0ZW5lciAnY2xpY2snIEBvbkNsaWNrXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0ICAgICAgID0gbnVsbFxuICAgICAgICBAc3BhbiAgICAgICA9IG51bGxcbiAgICAgICAgQGNvbXBsZXRpb24gPSBudWxsXG4gICAgICAgIEBmaXJzdE1hdGNoID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgYy5yZW1vdmUoKVxuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWRcbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICBcbiAgICAgICAgQGNsb25lcyA9IFtdXG4gICAgICAgIEBjbG9uZWQgPSBbXVxuICAgICAgICBAbWF0Y2hMaXN0ICA9IFtdXG4gICAgICAgIEBcblxuICAgIG9uV2hlZWw6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LnNjcm9sbFRvcCArPSBldmVudC5kZWx0YVlcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICAgIFxuICAgIFxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IGVsZW0udXBBdHRyIGV2ZW50LnRhcmdldCwgJ2luZGV4J1xuICAgICAgICBpZiBpbmRleCAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdCBpbmRleFxuICAgICAgICAgICAgQG9uRW50ZXIoKVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIG9uRW50ZXI6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBtYXRjaExpc3RbQHNlbGVjdGVkXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaExpc3QubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAtPiBAbmF2aWdhdGUgQG1hdGNoTGlzdC5sZW5ndGggLSBAc2VsZWN0ZWRcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBjbG9uZXNcbiAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICBzcGFuT2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkWzBdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICBzcGFuT2Zmc2V0ICs9IEBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqYmVmb3JlTGVuZ3RoXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje3NwYW5PZmZzZXR9cHgpXCJcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgIFxuICAgIHBhcnNlTGluZXNEZWxheWVkOiAobGluZXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGRlbGF5ID0gKGwsIG8pID0+ID0+IEBwYXJzZUxpbmVzIGwsIG9cbiAgICAgICAgaWYgbGluZXMubGVuZ3RoID4gMVxuICAgICAgICAgICAgc2V0VGltZW91dCAoZGVsYXkgbGluZXMsIG9wdCksIDIwMFxuICAgIFxuICAgIHBhcnNlTGluZXM6KGxpbmVzLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgICAgIHJldHVybiBpZiBub3QgbGluZXM/XG4gICAgICAgIFxuICAgICAgICBjdXJzb3JXb3JkID0gQGN1cnNvcldvcmQoKVxuICAgICAgICBmb3IgbCBpbiBsaW5lc1xuICAgICAgICAgICAgaWYgbm90IGw/LnNwbGl0P1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJBdXRvY29tcGxldGUucGFyc2VMaW5lcyAtLSBsaW5lIGhhcyBubyBzcGxpdD8gYWN0aW9uOiAje29wdC5hY3Rpb259IGxpbmU6ICN7bH1cIiwgbGluZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBwYXJzZU1ldGhvZCBsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdvcmRzID0gbC5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgICAgIHdvcmRzID0gd29yZHMuZmlsdGVyICh3KSA9PiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEluZGV4ZXIudGVzdFdvcmQgd1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiB3ID09IGN1cnNvcldvcmRcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQHdvcmQgPT0gdy5zbGljZSAwLCB3Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBoZWFkZXJSZWdFeHAudGVzdCB3XG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHcgaW4gd29yZHMgIyBhcHBlbmQgd29yZHMgd2l0aG91dCBsZWFkaW5nIHNwZWNpYWwgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgaSA9IHcuc2VhcmNoIEBub3RTcGVjaWFsUmVnRXhwXG4gICAgICAgICAgICAgICAgaWYgaSA+IDAgYW5kIHdbMF0gIT0gXCIjXCJcbiAgICAgICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UgaVxuICAgICAgICAgICAgICAgICAgICB3b3Jkcy5wdXNoIHcgaWYgbm90IC9eW1xcLV0/W1xcZF0rJC8udGVzdCB3XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgaW5mbyAgPSBAd29yZGluZm9bd10gPyB7fVxuICAgICAgICAgICAgICAgIGNvdW50ID0gaW5mby5jb3VudCA/IDBcbiAgICAgICAgICAgICAgICBjb3VudCArPSBvcHQ/LmNvdW50ID8gMVxuICAgICAgICAgICAgICAgIGluZm8uY291bnQgPSBjb3VudFxuICAgICAgICAgICAgICAgIGluZm8udGVtcCA9IHRydWUgaWYgb3B0LmFjdGlvbiBpcyAnY2hhbmdlJ1xuICAgICAgICAgICAgICAgIEB3b3JkaW5mb1t3XSA9IGluZm9cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBjdXJzb3JXb3JkczogLT5cbiAgICAgICAgXG4gICAgICAgIGNwID0gQGVkaXRvci5jdXJzb3JQb3MoKVxuICAgICAgICB3b3JkcyA9IEBlZGl0b3Iud29yZFJhbmdlc0luTGluZUF0SW5kZXggY3BbMV0sIHJlZ0V4cDogQHNwZWNpYWxXb3JkUmVnRXhwICAgICAgICBcbiAgICAgICAgW2JlZm9yLCBjdXJzciwgYWZ0ZXJdID0gcmFuZ2VzU3BsaXRBdFBvc0luUmFuZ2VzIGNwLCB3b3Jkc1xuICAgICAgICBbQGVkaXRvci50ZXh0c0luUmFuZ2VzKGJlZm9yKSwgQGVkaXRvci50ZXh0SW5SYW5nZShjdXJzciksIEBlZGl0b3IudGV4dHNJblJhbmdlcyhhZnRlcildXG4gICAgICAgIFxuICAgIGN1cnNvcldvcmQ6IC0+IEBjdXJzb3JXb3JkcygpWzFdXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbkxpbmVzQXBwZW5kZWQ6ICAobGluZXMpICAgID0+IEBwYXJzZUxpbmVzIGxpbmVzLCBhY3Rpb246ICdhcHBlbmQnXG4gICAgb25MaW5lSW5zZXJ0ZWQ6ICAgKGxpKSAgICAgICA9PiBAcGFyc2VMaW5lcyBbQGVkaXRvci5saW5lKGxpKV0sIGFjdGlvbjogJ2luc2VydCdcbiAgICBvbkxpbmVDaGFuZ2VkOiAgICAobGkpICAgICAgID0+IEBwYXJzZUxpbmVzIFtAZWRpdG9yLmxpbmUobGkpXSwgYWN0aW9uOiAnY2hhbmdlJywgY291bnQ6IDBcbiAgICBvbldpbGxEZWxldGVMaW5lOiAobGluZSkgICAgID0+IEBwYXJzZUxpbmVzIFtsaW5lXSwgYWN0aW9uOiAnZGVsZXRlJywgY291bnQ6IC0xXG4gICAgIyBvbkxpbmVzU2V0OiAgICAgICAobGluZXMpICAgID0+IGtsb2cgJ29uTGluZXNTZXQnOyBAcGFyc2VMaW5lcyBsaW5lcywgYWN0aW9uOiAnc2V0JyBpZiBsaW5lcy5sZW5ndGhcbiAgICBvbkxpbmVzU2V0OiAgICAgICAobGluZXMpICAgID0+IEBwYXJzZUxpbmVzRGVsYXllZCBsaW5lcywgYWN0aW9uOiAnc2V0JyBpZiBsaW5lcy5sZW5ndGhcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInIHRoZW4gcmV0dXJuIEBvbkVudGVyKCkgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJ1xuICAgICAgICAgICAgICAgICAgICBAbmV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgQHByZXYoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICBAbGFzdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee