// koffee 1.3.0

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

ref = require('kxk'), kerror = ref.kerror, stopEvent = ref.stopEvent, clamp = ref.clamp, post = ref.post, empty = ref.empty, elem = ref.elem, $ = ref.$, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvRkFBQTtJQUFBOzs7O0FBUUEsTUFBd0QsT0FBQSxDQUFRLEtBQVIsQ0FBeEQsRUFBRSxtQkFBRixFQUFVLHlCQUFWLEVBQXFCLGlCQUFyQixFQUE0QixlQUE1QixFQUFrQyxpQkFBbEMsRUFBeUMsZUFBekMsRUFBK0MsU0FBL0MsRUFBa0Q7O0FBRWxELE9BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxRQUFSOztBQUVKOzs7SUFFVyxzQkFBQyxNQUFEO0FBRVQsWUFBQTtRQUZVLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7O1FBRVYsNENBQUE7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxNQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLFFBQUEsR0FBVztRQUNYLElBQUMsQ0FBQSxRQUFELEdBQVk7O0FBQUM7QUFBQTtpQkFBQSxzQ0FBQTs7NkJBQUEsSUFBQSxHQUFLO0FBQUw7O1lBQUQsQ0FBbUMsQ0FBQyxJQUFwQyxDQUF5QyxFQUF6QztRQUNaLElBQUMsQ0FBQSxZQUFELEdBQXFCLElBQUksTUFBSixDQUFXLEtBQUEsR0FBTSxJQUFDLENBQUEsUUFBUCxHQUFnQixLQUEzQjtRQUVyQixJQUFDLENBQUEsZ0JBQUQsR0FBcUIsSUFBSSxNQUFKLENBQVcsSUFBQSxHQUFLLElBQUMsQ0FBQSxRQUFOLEdBQWUsR0FBMUI7UUFDckIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLFlBQUEsR0FBYSxJQUFDLENBQUEsUUFBZCxHQUF1QixZQUFsQyxFQUErQyxHQUEvQztRQUNyQixJQUFDLENBQUEs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QixpQkFBMUI7QUFBQSxtQkFBTyxZQUFQOztBQUVBLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxPQURUO0FBQ3NCLHVCQUFPLElBQUMsQ0FBQSxPQUFELENBQUE7QUFEN0I7UUFHQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLE1BRFQ7b0JBRVEsSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBO0FBSFIscUJBSVMsSUFKVDtvQkFLUSxJQUFHLElBQUMsQ0FBQSxRQUFELElBQWEsQ0FBaEI7d0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUZKO3FCQUFBLE1BQUE7d0JBSUksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUxKOztBQUxSLGFBREo7O1FBWUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBcEJvQjs7OztHQTlURDs7QUFvVjNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IGtlcnJvciwgc3RvcEV2ZW50LCBjbGFtcCwgcG9zdCwgZW1wdHksIGVsZW0sICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuSW5kZXhlciA9IHJlcXVpcmUgJy4uL21haW4vaW5kZXhlcidcbmV2ZW50ICAgPSByZXF1aXJlICdldmVudHMnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZSBleHRlbmRzIGV2ZW50XG5cbiAgICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+IFxuICAgICAgICBcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBcbiAgICAgICAgQHdvcmRpbmZvICA9IHt9XG4gICAgICAgIEBtYXRjaExpc3QgPSBbXVxuICAgICAgICBAY2xvbmVzICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICA9IFtdXG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgc3BlY2lhbHMgPSBcIl8tQCNcIlxuICAgICAgICBAZXNwZWNpYWwgPSAoXCJcXFxcXCIrYyBmb3IgYyBpbiBzcGVjaWFscy5zcGxpdCAnJykuam9pbiAnJ1xuICAgICAgICBAaGVhZGVyUmVnRXhwICAgICAgPSBuZXcgUmVnRXhwIFwiXlswI3tAZXNwZWNpYWx9XSskXCJcbiAgICAgICAgXG4gICAgICAgIEBub3RTcGVjaWFsUmVnRXhwICA9IG5ldyBSZWdFeHAgXCJbXiN7QGVzcGVjaWFsfV1cIlxuICAgICAgICBAc3BlY2lhbFdvcmRSZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFxzK3xbXFxcXHcje0Blc3BlY2lhbH1dK3xbXlxcXFxzXSlcIiwgJ2cnXG4gICAgICAgIEBzcGxpdFJlZ0V4cCAgICAgICA9IG5ldyBSZWdFeHAgXCJbXlxcXFx3XFxcXGQje0Blc3BlY2lhbH1dK1wiLCAnZycgICAgICAgIFxuICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdlZGl0JywgICAgICAgICAgIEBvbkVkaXRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTZXQnLCAgICAgICBAb25MaW5lc1NldFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnLCAgIEBvbkxpbmVJbnNlcnRlZFxuICAgICAgICBAZWRpdG9yLm9uICd3aWxsRGVsZXRlTGluZScsIEBvbldpbGxEZWxldGVMaW5lXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVDaGFuZ2VkJywgICAgQG9uTGluZUNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNBcHBlbmRlZCcsICBAb25MaW5lc0FwcGVuZGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicsICAgICAgICAgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInLCAgICAgICAgICAgQGNsb3NlXG4gICAgICAgIFxuICAgICAgICAjIHBvc3Qub24gJ2Z1bmNzQ291bnQnLCAgICAgICAgQG9uRnVuY3NDb3VudFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBvbkVkaXQ6IChpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIHN3aXRjaCBpbmZvLmFjdGlvblxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdkZWxldGUnICMgZXZlciBoYXBwZW5pbmc/XG4gICAgICAgICAgICAgICAgZXJyb3IgJ2RlbGV0ZSEhISEnXG4gICAgICAgICAgICAgICAgaWYgQHdvcmRpbmZvW0B3b3JkXT8udGVtcCBhbmQgQHdvcmRpbmZvW0B3b3JkXT8uY291bnQgPD0gMFxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQHdvcmRpbmZvW0B3b3JkXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2luc2VydCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IEB3b3JkPy5sZW5ndGhcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgZW1wdHkgQHdvcmRpbmZvXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IF8ucGlja0J5IEB3b3JkaW5mbywgKGMsdykgPT4gdy5zdGFydHNXaXRoKEB3b3JkKSBhbmQgdy5sZW5ndGggPiBAd29yZC5sZW5ndGggICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gXy50b1BhaXJzIG1hdGNoZXNcbiAgICAgICAgICAgICAgICBmb3IgbSBpbiBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgIGQgPSBAZWRpdG9yLmRpc3RhbmNlT2ZXb3JkIG1bMF1cbiAgICAgICAgICAgICAgICAgICAgbVsxXS5kaXN0YW5jZSA9IDEwMCAtIE1hdGgubWluIGQsIDEwMFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT5cbiAgICAgICAgICAgICAgICAgICAgKGJbMV0uZGlzdGFuY2UrYlsxXS5jb3VudCsxL2JbMF0ubGVuZ3RoKSAtIChhWzFdLmRpc3RhbmNlK2FbMV0uY291bnQrMS9hWzBdLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd29yZHMgPSBtYXRjaGVzLm1hcCAobSkgLT4gbVswXVxuICAgICAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBAZmlyc3RNYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgQGZpcnN0TWF0Y2ggPSB3IFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbWF0Y2hMaXN0LnB1c2ggd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpcnN0TWF0Y2g/XG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBAZmlyc3RNYXRjaC5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAb3BlbiBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBjdXJzb3IgPSAkKCcubWFpbicsIEBlZGl0b3IudmlldylcbiAgICAgICAgaWYgbm90IGN1cnNvcj9cbiAgICAgICAgICAgIGtlcnJvciBcIkF1dG9jb21wbGV0ZS5vcGVuIC0tLSBubyBjdXJzb3I/XCJcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicsIGNsYXNzOiAnYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuXG4gICAgICAgIGNyID0gY3Vyc29yLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIHNwYW5JbmZvID0gQGVkaXRvci5saW5lU3BhbkF0WFkgY3IubGVmdCwgY3IudG9wXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc3BhbkluZm8/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHAgPSBAZWRpdG9yLnBvc0F0WFkgY3IubGVmdCwgY3IudG9wXG4gICAgICAgICAgICBjaSA9IHBbMV0tQGVkaXRvci5zY3JvbGwudG9wXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gc3BhbiBmb3IgYXV0b2NvbXBsZXRlPyBjdXJzb3IgdG9wbGVmdDogI3twYXJzZUludCBjci5sZWZ0fSAje3BhcnNlSW50IGNyLnRvcH1cIiwgaW5mb1xuXG4gICAgICAgIHNwID0gc3BhbkluZm8uc3BhblxuICAgICAgICBpbm5lciA9IHNwLmlubmVySFRNTFxuICAgICAgICBAY2xvbmVzLnB1c2ggc3AuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGNsb25lcy5wdXNoIHNwLmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBjbG9uZWQucHVzaCBzcFxuICAgICAgICBcbiAgICAgICAgd3MgPSBAd29yZC5zbGljZSBAd29yZC5zZWFyY2ggL1xcdy9cbiAgICAgICAgd2kgPSB3cy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIEBjbG9uZXNbMF0uaW5uZXJIVE1MID0gaW5uZXIuc2xpY2UgMCwgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDEgXG4gICAgICAgIEBjbG9uZXNbMV0uaW5uZXJIVE1MID0gaW5uZXIuc2xpY2UgICAgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDFcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcFxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgc3AucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcsIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoTGlzdC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcsIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCBAb25Nb3VzZURvd25cbiAgICAgICAgICAgIGluZGV4ID0gMFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoTGlzdFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWl0ZW0nLCBpbmRleDppbmRleCsrXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0Q29udGVudCA9IG1cbiAgICAgICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICd3aGVlbCcsIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycsIEBvbkNsaWNrXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0ICAgICAgID0gbnVsbFxuICAgICAgICBAc3BhbiAgICAgICA9IG51bGxcbiAgICAgICAgQGNvbXBsZXRpb24gPSBudWxsXG4gICAgICAgIEBmaXJzdE1hdGNoID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgYy5yZW1vdmUoKVxuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWRcbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICBcbiAgICAgICAgQGNsb25lcyA9IFtdXG4gICAgICAgIEBjbG9uZWQgPSBbXVxuICAgICAgICBAbWF0Y2hMaXN0ICA9IFtdXG4gICAgICAgIEBcblxuICAgIG9uV2hlZWw6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LnNjcm9sbFRvcCArPSBldmVudC5kZWx0YVlcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICAgIFxuICAgIFxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IGVsZW0udXBBdHRyIGV2ZW50LnRhcmdldCwgJ2luZGV4J1xuICAgICAgICBpZiBpbmRleCAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdCBpbmRleFxuICAgICAgICAgICAgQG9uRW50ZXIoKVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIG9uRW50ZXI6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBtYXRjaExpc3RbQHNlbGVjdGVkXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaExpc3QubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAtPiBAbmF2aWdhdGUgQG1hdGNoTGlzdC5sZW5ndGggLSBAc2VsZWN0ZWRcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBjbG9uZXNcbiAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICBzcGFuT2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkWzBdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICBzcGFuT2Zmc2V0ICs9IEBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqYmVmb3JlTGVuZ3RoXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje3NwYW5PZmZzZXR9cHgpXCJcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgIFxuICAgIHBhcnNlTGluZXM6KGxpbmVzLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgICAgIHJldHVybiBpZiBub3QgbGluZXM/XG4gICAgICAgIFxuICAgICAgICBjdXJzb3JXb3JkID0gQGN1cnNvcldvcmQoKVxuICAgICAgICBmb3IgbCBpbiBsaW5lc1xuICAgICAgICAgICAgaWYgbm90IGw/LnNwbGl0P1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJBdXRvY29tcGxldGUucGFyc2VMaW5lcyAtLSBsaW5lIGhhcyBubyBzcGxpdD8gYWN0aW9uOiAje29wdC5hY3Rpb259IGxpbmU6ICN7bH1cIiwgbGluZXNcbiAgICAgICAgICAgIHdvcmRzID0gbC5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgICAgIHdvcmRzID0gd29yZHMuZmlsdGVyICh3KSA9PiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEluZGV4ZXIudGVzdFdvcmQgd1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiB3ID09IGN1cnNvcldvcmRcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQHdvcmQgPT0gdy5zbGljZSAwLCB3Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBoZWFkZXJSZWdFeHAudGVzdCB3XG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHcgaW4gd29yZHMgIyBhcHBlbmQgd29yZHMgd2l0aG91dCBsZWFkaW5nIHNwZWNpYWwgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgaSA9IHcuc2VhcmNoIEBub3RTcGVjaWFsUmVnRXhwXG4gICAgICAgICAgICAgICAgaWYgaSA+IDAgYW5kIHdbMF0gIT0gXCIjXCJcbiAgICAgICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UgaVxuICAgICAgICAgICAgICAgICAgICB3b3Jkcy5wdXNoIHcgaWYgbm90IC9eW1xcLV0/W1xcZF0rJC8udGVzdCB3XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB3IGluIHdvcmRzXG4gICAgICAgICAgICAgICAgaW5mbyAgPSBAd29yZGluZm9bd10gPyB7fVxuICAgICAgICAgICAgICAgIGNvdW50ID0gaW5mby5jb3VudCA/IDBcbiAgICAgICAgICAgICAgICBjb3VudCArPSBvcHQ/LmNvdW50ID8gMVxuICAgICAgICAgICAgICAgIGluZm8uY291bnQgPSBjb3VudFxuICAgICAgICAgICAgICAgIGluZm8udGVtcCA9IHRydWUgaWYgb3B0LmFjdGlvbiBpcyAnY2hhbmdlJ1xuICAgICAgICAgICAgICAgIEB3b3JkaW5mb1t3XSA9IGluZm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdhdXRvY29tcGxldGVDb3VudCcsIF8uc2l6ZSBAd29yZGluZm9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBjdXJzb3JXb3JkczogLT4gXG4gICAgICAgIFxuICAgICAgICBjcCA9IEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgd29yZHMgPSBAZWRpdG9yLndvcmRSYW5nZXNJbkxpbmVBdEluZGV4IGNwWzFdLCByZWdFeHA6IEBzcGVjaWFsV29yZFJlZ0V4cCAgICAgICAgXG4gICAgICAgIFtiZWZvciwgY3Vyc3IsIGFmdGVyXSA9IHJhbmdlc1NwbGl0QXRQb3NJblJhbmdlcyBjcCwgd29yZHNcbiAgICAgICAgW0BlZGl0b3IudGV4dHNJblJhbmdlcyhiZWZvciksIEBlZGl0b3IudGV4dEluUmFuZ2UoY3Vyc3IpLCBAZWRpdG9yLnRleHRzSW5SYW5nZXMoYWZ0ZXIpXVxuICAgICAgICBcbiAgICBjdXJzb3JXb3JkOiAtPiBAY3Vyc29yV29yZHMoKVsxXVxuICAgICAgICAgICAgICAgIFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgXG4gICAgb25MaW5lc0FwcGVuZGVkOiAgKGxpbmVzKSAgICA9PiBAcGFyc2VMaW5lcyBsaW5lcywgYWN0aW9uOiAnYXBwZW5kJ1xuICAgIG9uTGluZUluc2VydGVkOiAgIChsaSkgICAgICAgPT4gQHBhcnNlTGluZXMgW0BlZGl0b3IubGluZShsaSldLCBhY3Rpb246ICdpbnNlcnQnXG4gICAgb25MaW5lQ2hhbmdlZDogICAgKGxpKSAgICAgICA9PiBAcGFyc2VMaW5lcyBbQGVkaXRvci5saW5lKGxpKV0sIGFjdGlvbjogJ2NoYW5nZScsIGNvdW50OiAwXG4gICAgb25XaWxsRGVsZXRlTGluZTogKGxpbmUpICAgICA9PiBAcGFyc2VMaW5lcyBbbGluZV0sIGFjdGlvbjogJ2RlbGV0ZScsIGNvdW50OiAtMVxuICAgIG9uTGluZXNTZXQ6ICAgICAgIChsaW5lcykgICAgPT4gQHBhcnNlTGluZXMgbGluZXMsIGFjdGlvbjogJ3NldCcgaWYgbGluZXMubGVuZ3RoXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyB0aGVuIHJldHVybiBAb25FbnRlcigpICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bidcbiAgICAgICAgICAgICAgICAgICAgQG5leHQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB3aGVuICd1cCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmV2KClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgQGxhc3QoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee