// koffee 1.11.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Indexer, _, clamp, elem, empty, event, kerror, post, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, empty = ref.empty, clamp = ref.clamp, elem = ref.elem, kerror = ref.kerror, $ = ref.$, _ = ref._;

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
        this.editor.on('edit', this.onEdit);
        this.editor.on('linesSet', this.onLinesSet);
        this.editor.on('lineInserted', this.onLineInserted);
        this.editor.on('willDeleteLine', this.onWillDeleteLine);
        this.editor.on('lineChanged', this.onLineChanged);
        this.editor.on('linesAppended', this.onLinesAppended);
        this.editor.on('cursor', this.close);
        this.editor.on('blur', this.close);
    }

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
                    return;
                }
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
        return post.emit('autocompleteCount', _.size(this.wordinfo));
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
            return this.parseLines(lines, {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0ZBQUE7SUFBQTs7OztBQVFBLE1BQXdELE9BQUEsQ0FBUSxLQUFSLENBQXhELEVBQUUsZUFBRixFQUFRLHlCQUFSLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsZUFBakMsRUFBdUMsbUJBQXZDLEVBQStDLFNBQS9DLEVBQWtEOztBQUVsRCxPQUFBLEdBQVUsT0FBQSxDQUFRLGlCQUFSOztBQUNWLEtBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFFSjs7O0lBRUMsc0JBQUMsTUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7OztRQUVBLDRDQUFBO1FBRUEsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFFckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsUUFBTixHQUFlLEdBQTFCO1FBQ3JCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxZQUFBLEdBQWEsSUFBQyxDQUFBLFFBQWQsR0FB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R0FBTixFQUFXLEtBQVgsRUFBa0IsS0FBbEI7UUFFcEIsSUFBMEIsaUJBQTFCO0FBQUEsbUJBQU8sWUFBUDs7QUFFQSxnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsT0FEVDtBQUNzQix1QkFBTyxJQUFDLENBQUEsT0FBRCxDQUFBO0FBRDdCO1FBR0EsSUFBRyxpQkFBSDtBQUNJLG9CQUFPLEtBQVA7QUFBQSxxQkFDUyxNQURUO29CQUVRLElBQUMsQ0FBQSxJQUFELENBQUE7QUFDQTtBQUhSLHFCQUlTLElBSlQ7b0JBS1EsSUFBRyxJQUFDLENBQUEsUUFBRCxJQUFhLENBQWhCO3dCQUNJLElBQUMsQ0FBQSxJQUFELENBQUE7QUFDQSwrQkFGSjtxQkFBQSxNQUFBO3dCQUlJLElBQUMsQ0FBQSxJQUFELENBQUE7QUFDQSwrQkFMSjs7QUFMUixhQURKOztRQVlBLElBQUMsQ0FBQSxLQUFELENBQUE7ZUFDQTtJQXBCb0I7Ozs7R0E5VEQ7O0FBb1YzQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBwb3N0LCBzdG9wRXZlbnQsIGVtcHR5LCBjbGFtcCwgZWxlbSwga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkluZGV4ZXIgPSByZXF1aXJlICcuLi9tYWluL2luZGV4ZXInXG5ldmVudCAgID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5jbGFzcyBBdXRvY29tcGxldGUgZXh0ZW5kcyBldmVudFxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlcigpXG4gICAgICAgIFxuICAgICAgICBAd29yZGluZm8gID0ge31cbiAgICAgICAgQG1hdGNoTGlzdCA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVkICAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBzcGVjaWFscyA9IFwiXy1AI1wiXG4gICAgICAgIEBlc3BlY2lhbCA9IChcIlxcXFxcIitjIGZvciBjIGluIHNwZWNpYWxzLnNwbGl0ICcnKS5qb2luICcnXG4gICAgICAgIEBoZWFkZXJSZWdFeHAgICAgICA9IG5ldyBSZWdFeHAgXCJeWzAje0Blc3BlY2lhbH1dKyRcIlxuICAgICAgICBcbiAgICAgICAgQG5vdFNwZWNpYWxSZWdFeHAgID0gbmV3IFJlZ0V4cCBcIlteI3tAZXNwZWNpYWx9XVwiXG4gICAgICAgIEBzcGVjaWFsV29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFtcXFxcdyN7QGVzcGVjaWFsfV0rfFteXFxcXHNdKVwiLCAnZydcbiAgICAgICAgQHNwbGl0UmVnRXhwICAgICAgID0gbmV3IFJlZ0V4cCBcIlteXFxcXHdcXFxcZCN7QGVzcGVjaWFsfV0rXCIsICdnJyAgICAgICAgXG4gICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2VkaXQnICAgICAgICAgICBAb25FZGl0XG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2V0JyAgICAgICBAb25MaW5lc1NldFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnICAgQG9uTGluZUluc2VydGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ3dpbGxEZWxldGVMaW5lJyBAb25XaWxsRGVsZXRlTGluZVxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQ2hhbmdlZCcgICAgQG9uTGluZUNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNBcHBlbmRlZCcgIEBvbkxpbmVzQXBwZW5kZWRcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJyAgICAgICAgIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgICAgICAgICAgQGNsb3NlXG4gICAgICAgIFxuICAgICAgICAjIHBvc3Qub24gJ2Z1bmNzQ291bnQnLCAgICAgICAgQG9uRnVuY3NDb3VudFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBvbkVkaXQ6IChpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIHN3aXRjaCBpbmZvLmFjdGlvblxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdkZWxldGUnICMgZXZlciBoYXBwZW5pbmc/XG4gICAgICAgICAgICAgICAgZXJyb3IgJ2RlbGV0ZSEhISEnXG4gICAgICAgICAgICAgICAgaWYgQHdvcmRpbmZvW0B3b3JkXT8udGVtcCBhbmQgQHdvcmRpbmZvW0B3b3JkXT8uY291bnQgPD0gMFxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQHdvcmRpbmZvW0B3b3JkXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2luc2VydCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IEB3b3JkPy5sZW5ndGhcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgZW1wdHkgQHdvcmRpbmZvXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IF8ucGlja0J5IEB3b3JkaW5mbywgKGMsdykgPT4gdy5zdGFydHNXaXRoKEB3b3JkKSBhbmQgdy5sZW5ndGggPiBAd29yZC5sZW5ndGggICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gXy50b1BhaXJzIG1hdGNoZXNcbiAgICAgICAgICAgICAgICBmb3IgbSBpbiBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgIGQgPSBAZWRpdG9yLmRpc3RhbmNlT2ZXb3JkIG1bMF1cbiAgICAgICAgICAgICAgICAgICAgbVsxXS5kaXN0YW5jZSA9IDEwMCAtIE1hdGgubWluIGQsIDEwMFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT5cbiAgICAgICAgICAgICAgICAgICAgKGJbMV0uZGlzdGFuY2UrYlsxXS5jb3VudCsxL2JbMF0ubGVuZ3RoKSAtIChhWzFdLmRpc3RhbmNlK2FbMV0uY291bnQrMS9hWzBdLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd29yZHMgPSBtYXRjaGVzLm1hcCAobSkgLT4gbVswXVxuICAgICAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBAZmlyc3RNYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgQGZpcnN0TWF0Y2ggPSB3IFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbWF0Y2hMaXN0LnB1c2ggd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpcnN0TWF0Y2g/XG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBAZmlyc3RNYXRjaC5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAb3BlbiBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBjdXJzb3IgPSAkKCcubWFpbicsIEBlZGl0b3IudmlldylcbiAgICAgICAgaWYgbm90IGN1cnNvcj9cbiAgICAgICAgICAgIGtlcnJvciBcIkF1dG9jb21wbGV0ZS5vcGVuIC0tLSBubyBjdXJzb3I/XCJcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicsIGNsYXNzOiAnYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuXG4gICAgICAgIGNyID0gY3Vyc29yLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIHNwYW5JbmZvID0gQGVkaXRvci5saW5lU3BhbkF0WFkgY3IubGVmdCwgY3IudG9wXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc3BhbkluZm8/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHAgPSBAZWRpdG9yLnBvc0F0WFkgY3IubGVmdCwgY3IudG9wXG4gICAgICAgICAgICBjaSA9IHBbMV0tQGVkaXRvci5zY3JvbGwudG9wXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gc3BhbiBmb3IgYXV0b2NvbXBsZXRlPyBjdXJzb3IgdG9wbGVmdDogI3twYXJzZUludCBjci5sZWZ0fSAje3BhcnNlSW50IGNyLnRvcH1cIiwgaW5mb1xuXG4gICAgICAgIHNwID0gc3BhbkluZm8uc3BhblxuICAgICAgICBpbm5lciA9IHNwLmlubmVySFRNTFxuICAgICAgICBAY2xvbmVzLnB1c2ggc3AuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGNsb25lcy5wdXNoIHNwLmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBjbG9uZWQucHVzaCBzcFxuICAgICAgICBcbiAgICAgICAgd3MgPSBAd29yZC5zbGljZSBAd29yZC5zZWFyY2ggL1xcdy9cbiAgICAgICAgd2kgPSB3cy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIEBjbG9uZXNbMF0uaW5uZXJIVE1MID0gaW5uZXIuc2xpY2UgMCwgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDEgXG4gICAgICAgIEBjbG9uZXNbMV0uaW5uZXJIVE1MID0gaW5uZXIuc2xpY2UgICAgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDFcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcFxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgc3AucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcsIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoTGlzdC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcsIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCBAb25Nb3VzZURvd25cbiAgICAgICAgICAgIGluZGV4ID0gMFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoTGlzdFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWl0ZW0nLCBpbmRleDppbmRleCsrXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0Q29udGVudCA9IG1cbiAgICAgICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICd3aGVlbCcsIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycsIEBvbkNsaWNrXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0ICAgICAgID0gbnVsbFxuICAgICAgICBAc3BhbiAgICAgICA9IG51bGxcbiAgICAgICAgQGNvbXBsZXRpb24gPSBudWxsXG4gICAgICAgIEBmaXJzdE1hdGNoID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgYy5yZW1vdmUoKVxuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWRcbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICBcbiAgICAgICAgQGNsb25lcyA9IFtdXG4gICAgICAgIEBjbG9uZWQgPSBbXVxuICAgICAgICBAbWF0Y2hMaXN0ICA9IFtdXG4gICAgICAgIEBcblxuICAgIG9uV2hlZWw6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LnNjcm9sbFRvcCArPSBldmVudC5kZWx0YVlcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICAgIFxuICAgIFxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IGVsZW0udXBBdHRyIGV2ZW50LnRhcmdldCwgJ2luZGV4J1xuICAgICAgICBpZiBpbmRleCAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdCBpbmRleFxuICAgICAgICAgICAgQG9uRW50ZXIoKVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIG9uRW50ZXI6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBtYXRjaExpc3RbQHNlbGVjdGVkXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaExpc3QubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAtPiBAbmF2aWdhdGUgQG1hdGNoTGlzdC5sZW5ndGggLSBAc2VsZWN0ZWRcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBjbG9uZXNcbiAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICBzcGFuT2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkWzBdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICBzcGFuT2Zmc2V0ICs9IEBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqYmVmb3JlTGVuZ3RoXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje3NwYW5PZmZzZXR9cHgpXCJcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgIFxuICAgIHBhcnNlTGluZXM6KGxpbmVzLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgICAgIHJldHVybiBpZiBub3QgbGluZXM/XG4gICAgICAgIFxuICAgICAgICBjdXJzb3JXb3JkID0gQGN1cnNvcldvcmQoKVxuICAgICAgICBmb3IgbCBpbiBsaW5lc1xuICAgICAgICAgICAgaWYgbm90IGw/LnNwbGl0P1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJBdXRvY29tcGxldGUucGFyc2VMaW5lcyAtLSBsaW5lIGhhcyBubyBzcGxpdD8gYWN0aW9uOiAje29wdC5hY3Rpb259IGxpbmU6ICN7bH1cIiwgbGluZXNcbiAgICAgICAgICAgIHdvcmRzID0gbC5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgICAgIHdvcmRzID0gd29yZHMuZmlsdGVyICh3KSA9PiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEluZGV4ZXIudGVzdFdvcmQgd1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiB3ID09IGN1cnNvcldvcmRcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQHdvcmQgPT0gdy5zbGljZSAwLCB3Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBoZWFkZXJSZWdFeHAudGVzdCB3XG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHcgaW4gd29yZHMgIyBhcHBlbmQgd29yZHMgd2l0aG91dCBsZWFkaW5nIHNwZWNpYWwgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgaSA9IHcuc2VhcmNoIEBub3RTcGVjaWFsUmVnRXhwXG4gICAgICAgICAgICAgICAgaWYgaSA+IDAgYW5kIHdbMF0gIT0gXCIjXCJcbiAgICAgICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UgaVxuICAgICAgICAgICAgICAgICAgICB3b3Jkcy5wdXNoIHcgaWYgbm90IC9eW1xcLV0/W1xcZF0rJC8udGVzdCB3XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgaW5mbyAgPSBAd29yZGluZm9bd10gPyB7fVxuICAgICAgICAgICAgICAgIGNvdW50ID0gaW5mby5jb3VudCA/IDBcbiAgICAgICAgICAgICAgICBjb3VudCArPSBvcHQ/LmNvdW50ID8gMVxuICAgICAgICAgICAgICAgIGluZm8uY291bnQgPSBjb3VudFxuICAgICAgICAgICAgICAgIGluZm8udGVtcCA9IHRydWUgaWYgb3B0LmFjdGlvbiBpcyAnY2hhbmdlJ1xuICAgICAgICAgICAgICAgIEB3b3JkaW5mb1t3XSA9IGluZm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdhdXRvY29tcGxldGVDb3VudCcsIF8uc2l6ZSBAd29yZGluZm9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBjdXJzb3JXb3JkczogLT4gXG4gICAgICAgIFxuICAgICAgICBjcCA9IEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgd29yZHMgPSBAZWRpdG9yLndvcmRSYW5nZXNJbkxpbmVBdEluZGV4IGNwWzFdLCByZWdFeHA6IEBzcGVjaWFsV29yZFJlZ0V4cCAgICAgICAgXG4gICAgICAgIFtiZWZvciwgY3Vyc3IsIGFmdGVyXSA9IHJhbmdlc1NwbGl0QXRQb3NJblJhbmdlcyBjcCwgd29yZHNcbiAgICAgICAgW0BlZGl0b3IudGV4dHNJblJhbmdlcyhiZWZvciksIEBlZGl0b3IudGV4dEluUmFuZ2UoY3Vyc3IpLCBAZWRpdG9yLnRleHRzSW5SYW5nZXMoYWZ0ZXIpXVxuICAgICAgICBcbiAgICBjdXJzb3JXb3JkOiAtPiBAY3Vyc29yV29yZHMoKVsxXVxuICAgICAgICAgICAgICAgIFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgXG4gICAgb25MaW5lc0FwcGVuZGVkOiAgKGxpbmVzKSAgICA9PiBAcGFyc2VMaW5lcyBsaW5lcywgYWN0aW9uOiAnYXBwZW5kJ1xuICAgIG9uTGluZUluc2VydGVkOiAgIChsaSkgICAgICAgPT4gQHBhcnNlTGluZXMgW0BlZGl0b3IubGluZShsaSldLCBhY3Rpb246ICdpbnNlcnQnXG4gICAgb25MaW5lQ2hhbmdlZDogICAgKGxpKSAgICAgICA9PiBAcGFyc2VMaW5lcyBbQGVkaXRvci5saW5lKGxpKV0sIGFjdGlvbjogJ2NoYW5nZScsIGNvdW50OiAwXG4gICAgb25XaWxsRGVsZXRlTGluZTogKGxpbmUpICAgICA9PiBAcGFyc2VMaW5lcyBbbGluZV0sIGFjdGlvbjogJ2RlbGV0ZScsIGNvdW50OiAtMVxuICAgIG9uTGluZXNTZXQ6ICAgICAgIChsaW5lcykgICAgPT4gQHBhcnNlTGluZXMgbGluZXMsIGFjdGlvbjogJ3NldCcgaWYgbGluZXMubGVuZ3RoXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyB0aGVuIHJldHVybiBAb25FbnRlcigpICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bidcbiAgICAgICAgICAgICAgICAgICAgQG5leHQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB3aGVuICd1cCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmV2KClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgQGxhc3QoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee