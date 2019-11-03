// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvRkFBQTtJQUFBOzs7O0FBUUEsTUFBd0QsT0FBQSxDQUFRLEtBQVIsQ0FBeEQsRUFBRSxlQUFGLEVBQVEseUJBQVIsRUFBbUIsaUJBQW5CLEVBQTBCLGlCQUExQixFQUFpQyxlQUFqQyxFQUF1QyxtQkFBdkMsRUFBK0MsU0FBL0MsRUFBa0Q7O0FBRWxELE9BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxRQUFSOztBQUVKOzs7SUFFQyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7O1FBRUEsNENBQUE7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxNQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLFFBQUEsR0FBVztRQUNYLElBQUMsQ0FBQSxRQUFELEdBQVk7O0FBQUM7QUFBQTtpQkFBQSxzQ0FBQTs7NkJBQUEsSUFBQSxHQUFLO0FBQUw7O1lBQUQsQ0FBbUMsQ0FBQyxJQUFwQyxDQUF5QyxFQUF6QztRQUNaLElBQUMsQ0FBQSxZQUFELEdBQXFCLElBQUksTUFBSixDQUFXLEtBQUEsR0FBTSxJQUFDLENBQUEsUUFBUCxHQUFnQixLQUEzQjtRQUVyQixJQUFDLENBQUEsZ0JBQUQsR0FBcUIsSUFBSSxNQUFKLENBQVcsSUFBQSxHQUFLLElBQUMsQ0FBQSxRQUFOLEdBQWUsR0FBMUI7UUFDckIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLFlBQUEsR0FBYSxJQUFDLENBQUEsUUFBZCxHQUF1QixZQUFsQyxFQUErQyxHQUEvQztRQUNyQixJQUFDLENBQUEs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QixpQkFBMUI7QUFBQSxtQkFBTyxZQUFQOztBQUVBLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxPQURUO0FBQ3NCLHVCQUFPLElBQUMsQ0FBQSxPQUFELENBQUE7QUFEN0I7UUFHQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLE1BRFQ7b0JBRVEsSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBO0FBSFIscUJBSVMsSUFKVDtvQkFLUSxJQUFHLElBQUMsQ0FBQSxRQUFELElBQWEsQ0FBaEI7d0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUZKO3FCQUFBLE1BQUE7d0JBSUksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUxKOztBQUxSLGFBREo7O1FBWUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBcEJvQjs7OztHQTlURDs7QUFvVjNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwgZW1wdHksIGNsYW1wLCBlbGVtLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuSW5kZXhlciA9IHJlcXVpcmUgJy4uL21haW4vaW5kZXhlcidcbmV2ZW50ICAgPSByZXF1aXJlICdldmVudHMnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZSBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAoQGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkaW5mbyAgPSB7fVxuICAgICAgICBAbWF0Y2hMaXN0ID0gW11cbiAgICAgICAgQGNsb25lcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIHNwZWNpYWxzID0gXCJfLUAjXCJcbiAgICAgICAgQGVzcGVjaWFsID0gKFwiXFxcXFwiK2MgZm9yIGMgaW4gc3BlY2lhbHMuc3BsaXQgJycpLmpvaW4gJydcbiAgICAgICAgQGhlYWRlclJlZ0V4cCAgICAgID0gbmV3IFJlZ0V4cCBcIl5bMCN7QGVzcGVjaWFsfV0rJFwiXG4gICAgICAgIFxuICAgICAgICBAbm90U3BlY2lhbFJlZ0V4cCAgPSBuZXcgUmVnRXhwIFwiW14je0Blc3BlY2lhbH1dXCJcbiAgICAgICAgQHNwZWNpYWxXb3JkUmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tAZXNwZWNpYWx9XSt8W15cXFxcc10pXCIsICdnJ1xuICAgICAgICBAc3BsaXRSZWdFeHAgICAgICAgPSBuZXcgUmVnRXhwIFwiW15cXFxcd1xcXFxkI3tAZXNwZWNpYWx9XStcIiwgJ2cnICAgICAgICBcbiAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnZWRpdCcgICAgICAgICAgIEBvbkVkaXRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTZXQnICAgICAgIEBvbkxpbmVzU2V0XG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVJbnNlcnRlZCcgICBAb25MaW5lSW5zZXJ0ZWRcbiAgICAgICAgQGVkaXRvci5vbiAnd2lsbERlbGV0ZUxpbmUnIEBvbldpbGxEZWxldGVMaW5lXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVDaGFuZ2VkJyAgICBAb25MaW5lQ2hhbmdlZFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc0FwcGVuZGVkJyAgQG9uTGluZXNBcHBlbmRlZFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InICAgICAgICAgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgICAgICAgICBAY2xvc2VcbiAgICAgICAgXG4gICAgICAgICMgcG9zdC5vbiAnZnVuY3NDb3VudCcsICAgICAgICBAb25GdW5jc0NvdW50XG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICBcblxuICAgIG9uRWRpdDogKGluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBAd29yZCA9IF8ubGFzdCBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgc3dpdGNoIGluZm8uYWN0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgIyBldmVyIGhhcHBlbmluZz9cbiAgICAgICAgICAgICAgICBlcnJvciAnZGVsZXRlISEhISdcbiAgICAgICAgICAgICAgICBpZiBAd29yZGluZm9bQHdvcmRdPy50ZW1wIGFuZCBAd29yZGluZm9bQHdvcmRdPy5jb3VudCA8PSAwXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAd29yZGluZm9bQHdvcmRdXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnaW5zZXJ0J1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBlbXB0eSBAd29yZGluZm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gXy5waWNrQnkgQHdvcmRpbmZvLCAoYyx3KSA9PiB3LnN0YXJ0c1dpdGgoQHdvcmQpIGFuZCB3Lmxlbmd0aCA+IEB3b3JkLmxlbmd0aCAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBfLnRvUGFpcnMgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGZvciBtIGluIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgICAgZCA9IEBlZGl0b3IuZGlzdGFuY2VPZldvcmQgbVswXVxuICAgICAgICAgICAgICAgICAgICBtWzFdLmRpc3RhbmNlID0gMTAwIC0gTWF0aC5taW4gZCwgMTAwXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG1hdGNoZXMuc29ydCAoYSxiKSAtPlxuICAgICAgICAgICAgICAgICAgICAoYlsxXS5kaXN0YW5jZStiWzFdLmNvdW50KzEvYlswXS5sZW5ndGgpIC0gKGFbMV0uZGlzdGFuY2UrYVsxXS5jb3VudCsxL2FbMF0ubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3b3JkcyA9IG1hdGNoZXMubWFwIChtKSAtPiBtWzBdXG4gICAgICAgICAgICAgICAgZm9yIHcgaW4gd29yZHNcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IEBmaXJzdE1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBAZmlyc3RNYXRjaCA9IHcgXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBtYXRjaExpc3QucHVzaCB3XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlyc3RNYXRjaD9cbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IEBmaXJzdE1hdGNoLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBvcGVuIGluZm9cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAoaW5mbykgLT5cbiAgICAgICAgXG4gICAgICAgIGN1cnNvciA9ICQoJy5tYWluJywgQGVkaXRvci52aWV3KVxuICAgICAgICBpZiBub3QgY3Vyc29yP1xuICAgICAgICAgICAga2Vycm9yIFwiQXV0b2NvbXBsZXRlLm9wZW4gLS0tIG5vIGN1cnNvcj9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJywgY2xhc3M6ICdhdXRvY29tcGxldGUtc3BhbidcbiAgICAgICAgQHNwYW4udGV4dENvbnRlbnQgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG5cbiAgICAgICAgY3IgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgc3BhbkluZm8gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzcGFuSW5mbz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcCA9IEBlZGl0b3IucG9zQXRYWSBjci5sZWZ0LCBjci50b3BcbiAgICAgICAgICAgIGNpID0gcFsxXS1AZWRpdG9yLnNjcm9sbC50b3BcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBzcGFuIGZvciBhdXRvY29tcGxldGU/IGN1cnNvciB0b3BsZWZ0OiAje3BhcnNlSW50IGNyLmxlZnR9ICN7cGFyc2VJbnQgY3IudG9wfVwiLCBpbmZvXG5cbiAgICAgICAgc3AgPSBzcGFuSW5mby5zcGFuXG4gICAgICAgIGlubmVyID0gc3AuaW5uZXJIVE1MXG4gICAgICAgIEBjbG9uZXMucHVzaCBzcC5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAY2xvbmVzLnB1c2ggc3AuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGNsb25lZC5wdXNoIHNwXG4gICAgICAgIFxuICAgICAgICB3cyA9IEB3b3JkLnNsaWNlIEB3b3JkLnNlYXJjaCAvXFx3L1xuICAgICAgICB3aSA9IHdzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgQGNsb25lc1swXS5pbm5lckhUTUwgPSBpbm5lci5zbGljZSAwLCBzcGFuSW5mby5vZmZzZXRDaGFyICsgMSBcbiAgICAgICAgQGNsb25lc1sxXS5pbm5lckhUTUwgPSBpbm5lci5zbGljZSAgICBzcGFuSW5mby5vZmZzZXRDaGFyICsgMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgc2libGluZyA9IHNwXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcC5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkIEBzcGFuXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzXG4gICAgICAgICAgICBAc3Bhbi5pbnNlcnRBZGphY2VudEVsZW1lbnQgJ2FmdGVyZW5kJywgY1xuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQGNvbXBsZXRpb24ubGVuZ3RoICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hMaXN0Lmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJywgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbk1vdXNlRG93blxuICAgICAgICAgICAgaW5kZXggPSAwXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWF0Y2hMaXN0XG4gICAgICAgICAgICAgICAgaXRlbSA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtaXRlbScsIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgICAgICBpdGVtLnRleHRDb250ZW50ID0gbVxuICAgICAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGl0ZW1cbiAgICAgICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ3doZWVsJywgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHNwYW4/LnJlbW92ZSgpXG4gICAgICAgIEBzZWxlY3RlZCAgID0gLTFcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQGZpcnN0TWF0Y2ggPSBudWxsXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ2luaXRpYWwnXG4gICAgICAgIFxuICAgICAgICBAY2xvbmVzID0gW11cbiAgICAgICAgQGNsb25lZCA9IFtdXG4gICAgICAgIEBtYXRjaExpc3QgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25XaGVlbDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgQGxpc3Quc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnQgICAgXG4gICAgXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAb25FbnRlcigpXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgb25FbnRlcjogLT4gIFxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICBzZWxlY3RlZENvbXBsZXRpb246IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQG1hdGNoTGlzdFtAc2VsZWN0ZWRdLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tcGxldGlvblxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgbmF2aWdhdGU6IChkZWx0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQG1hdGNoTGlzdC5sZW5ndGgtMSwgQHNlbGVjdGVkK2RlbHRhXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGluZGV4KSAtPlxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6IC0+IEBuYXZpZ2F0ZSAtMSAgICBcbiAgICBuZXh0OiAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6IC0+IEBuYXZpZ2F0ZSBAbWF0Y2hMaXN0Lmxlbmd0aCAtIEBzZWxlY3RlZFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgQGNsb25lc1xuICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgZm9yIGNpIGluIFsxLi4uQGNsb25lcy5sZW5ndGhdXG4gICAgICAgICAgICBjID0gQGNsb25lc1tjaV1cbiAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgIGNoYXJPZmZzZXQgPSBudW1DaGFyc1xuICAgICAgICAgICAgY2hhck9mZnNldCArPSBiZWZvcmVMZW5ndGggaWYgY2kgPT0gMVxuICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgIHNwYW5PZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbMF0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgIHNwYW5PZmZzZXQgKz0gQGVkaXRvci5zaXplLmNoYXJXaWR0aCpiZWZvcmVMZW5ndGhcbiAgICAgICAgQHNwYW4uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7c3Bhbk9mZnNldH1weClcIlxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgXG4gICAgcGFyc2VMaW5lczoobGluZXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBsaW5lcz9cbiAgICAgICAgXG4gICAgICAgIGN1cnNvcldvcmQgPSBAY3Vyc29yV29yZCgpXG4gICAgICAgIGZvciBsIGluIGxpbmVzXG4gICAgICAgICAgICBpZiBub3QgbD8uc3BsaXQ/XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkF1dG9jb21wbGV0ZS5wYXJzZUxpbmVzIC0tIGxpbmUgaGFzIG5vIHNwbGl0PyBhY3Rpb246ICN7b3B0LmFjdGlvbn0gbGluZTogI3tsfVwiLCBsaW5lc1xuICAgICAgICAgICAgd29yZHMgPSBsLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICAgICAgd29yZHMgPSB3b3Jkcy5maWx0ZXIgKHcpID0+IFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgSW5kZXhlci50ZXN0V29yZCB3XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHcgPT0gY3Vyc29yV29yZFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBAd29yZCA9PSB3LnNsaWNlIDAsIHcubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQGhlYWRlclJlZ0V4cC50ZXN0IHdcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgdyBpbiB3b3JkcyAjIGFwcGVuZCB3b3JkcyB3aXRob3V0IGxlYWRpbmcgc3BlY2lhbCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICBpID0gdy5zZWFyY2ggQG5vdFNwZWNpYWxSZWdFeHBcbiAgICAgICAgICAgICAgICBpZiBpID4gMCBhbmQgd1swXSAhPSBcIiNcIlxuICAgICAgICAgICAgICAgICAgICB3ID0gdy5zbGljZSBpXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzLnB1c2ggdyBpZiBub3QgL15bXFwtXT9bXFxkXSskLy50ZXN0IHdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHcgaW4gd29yZHNcbiAgICAgICAgICAgICAgICBpbmZvICA9IEB3b3JkaW5mb1t3XSA/IHt9XG4gICAgICAgICAgICAgICAgY291bnQgPSBpbmZvLmNvdW50ID8gMFxuICAgICAgICAgICAgICAgIGNvdW50ICs9IG9wdD8uY291bnQgPyAxXG4gICAgICAgICAgICAgICAgaW5mby5jb3VudCA9IGNvdW50XG4gICAgICAgICAgICAgICAgaW5mby50ZW1wID0gdHJ1ZSBpZiBvcHQuYWN0aW9uIGlzICdjaGFuZ2UnXG4gICAgICAgICAgICAgICAgQHdvcmRpbmZvW3ddID0gaW5mb1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBwb3N0LmVtaXQgJ2F1dG9jb21wbGV0ZUNvdW50JywgXy5zaXplIEB3b3JkaW5mb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGN1cnNvcldvcmRzOiAtPiBcbiAgICAgICAgXG4gICAgICAgIGNwID0gQGVkaXRvci5jdXJzb3JQb3MoKVxuICAgICAgICB3b3JkcyA9IEBlZGl0b3Iud29yZFJhbmdlc0luTGluZUF0SW5kZXggY3BbMV0sIHJlZ0V4cDogQHNwZWNpYWxXb3JkUmVnRXhwICAgICAgICBcbiAgICAgICAgW2JlZm9yLCBjdXJzciwgYWZ0ZXJdID0gcmFuZ2VzU3BsaXRBdFBvc0luUmFuZ2VzIGNwLCB3b3Jkc1xuICAgICAgICBbQGVkaXRvci50ZXh0c0luUmFuZ2VzKGJlZm9yKSwgQGVkaXRvci50ZXh0SW5SYW5nZShjdXJzciksIEBlZGl0b3IudGV4dHNJblJhbmdlcyhhZnRlcildXG4gICAgICAgIFxuICAgIGN1cnNvcldvcmQ6IC0+IEBjdXJzb3JXb3JkcygpWzFdXG4gICAgICAgICAgICAgICAgXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbkxpbmVzQXBwZW5kZWQ6ICAobGluZXMpICAgID0+IEBwYXJzZUxpbmVzIGxpbmVzLCBhY3Rpb246ICdhcHBlbmQnXG4gICAgb25MaW5lSW5zZXJ0ZWQ6ICAgKGxpKSAgICAgICA9PiBAcGFyc2VMaW5lcyBbQGVkaXRvci5saW5lKGxpKV0sIGFjdGlvbjogJ2luc2VydCdcbiAgICBvbkxpbmVDaGFuZ2VkOiAgICAobGkpICAgICAgID0+IEBwYXJzZUxpbmVzIFtAZWRpdG9yLmxpbmUobGkpXSwgYWN0aW9uOiAnY2hhbmdlJywgY291bnQ6IDBcbiAgICBvbldpbGxEZWxldGVMaW5lOiAobGluZSkgICAgID0+IEBwYXJzZUxpbmVzIFtsaW5lXSwgYWN0aW9uOiAnZGVsZXRlJywgY291bnQ6IC0xXG4gICAgb25MaW5lc1NldDogICAgICAgKGxpbmVzKSAgICA9PiBAcGFyc2VMaW5lcyBsaW5lcywgYWN0aW9uOiAnc2V0JyBpZiBsaW5lcy5sZW5ndGhcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInIHRoZW4gcmV0dXJuIEBvbkVudGVyKCkgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJ1xuICAgICAgICAgICAgICAgICAgICBAbmV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgQHByZXYoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICBAbGFzdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee