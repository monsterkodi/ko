// koffee 1.11.0

/*
00     00  00000000  000000000   0000000
000   000  000          000     000   000
000000000  0000000      000     000000000
000 0 000  000          000     000   000
000   000  00000000     000     000   000
 */
var $, File, Meta, _, elem, empty, fs, kerror, post, ranges, ref, slash, stopEvent, sw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, slash = ref.slash, empty = ref.empty, elem = ref.elem, fs = ref.fs, sw = ref.sw, kerror = ref.kerror, $ = ref.$, _ = ref._;

ranges = require('../tools/ranges');

File = require('../tools/file');

Meta = (function() {
    function Meta(editor) {
        this.editor = editor;
        this.clear = bind(this.clear, this);
        this.onClearLines = bind(this.onClearLines, this);
        this.onLineDeleted = bind(this.onLineDeleted, this);
        this.onLineInserted = bind(this.onLineInserted, this);
        this.onLinesShifted = bind(this.onLinesShifted, this);
        this.onLinesShown = bind(this.onLinesShown, this);
        this.onLineAppended = bind(this.onLineAppended, this);
        this.onNumber = bind(this.onNumber, this);
        this.onChanged = bind(this.onChanged, this);
        this.metas = [];
        this.lineMetas = {};
        this.elem = $(".meta", this.editor.view);
        this.editor.on('changed', this.onChanged);
        this.editor.on('lineAppended', this.onLineAppended);
        this.editor.on('clearLines', this.onClearLines);
        this.editor.on('lineInserted', this.onLineInserted);
        this.editor.on('lineDeleted', this.onLineDeleted);
        this.editor.on('linesShown', this.onLinesShown);
        this.editor.on('linesShifted', this.onLinesShifted);
        if (this.editor.numbers != null) {
            this.editor.numbers.on('numberAdded', this.onNumber);
            this.editor.numbers.on('numberChanged', this.onNumber);
        }
        this.elem.addEventListener('mousedown', this.onMouseDown);
    }

    Meta.prototype.onChanged = function(changeInfo) {
        var button, change, file, i, len, li, line, localChange, meta, ref1, results;
        ref1 = changeInfo.changes;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            li = change.oldIndex;
            if (change.change === 'deleted') {
                continue;
            }
            results.push((function() {
                var j, len1, ref2, ref3, results1;
                ref2 = this.metasAtLineIndex(li);
                results1 = [];
                for (j = 0, len1 = ref2.length; j < len1; j++) {
                    meta = ref2[j];
                    if (meta[2].clss === "searchResult" && (meta[2].href != null)) {
                        ref3 = slash.splitFileLine(meta[2].href), file = ref3[0], line = ref3[1];
                        line -= 1;
                        localChange = _.cloneDeep(change);
                        localChange.oldIndex = line;
                        localChange.newIndex = line;
                        localChange.doIndex = line;
                        localChange.after = this.editor.line(meta[0]);
                        this.editor.emit('fileSearchResultChange', file, localChange);
                        meta[2].state = 'unsaved';
                        if (meta[2].span != null) {
                            button = this.saveButton(li);
                            if (!meta[2].span.innerHTML.startsWith("<span")) {
                                results1.push(meta[2].span.innerHTML = button);
                            } else {
                                results1.push(void 0);
                            }
                        } else {
                            results1.push(void 0);
                        }
                    } else {
                        results1.push(void 0);
                    }
                }
                return results1;
            }).call(this));
        }
        return results;
    };

    Meta.prototype.saveFileLineMetas = function(file, lineMetas) {
        return fs.readFile(file, {
            encoding: 'utf8'
        }, function(err, data) {
            var i, len, lineMeta, lines;
            if (err != null) {
                return kerror("Meta.saveFileLineMetas -- readFile err:" + err);
            }
            lines = data.split(/\r?\n/);
            for (i = 0, len = lineMetas.length; i < len; i++) {
                lineMeta = lineMetas[i];
                lines[lineMeta[0]] = lineMeta[1];
            }
            data = lines.join('\n');
            return File.save(file, data, function(err, file) {
                var j, len1, meta, ref1;
                if (err != null) {
                    return kerror("Meta.saveFileLineMetas -- writeFile err:" + err);
                }
                for (j = 0, len1 = lineMetas.length; j < len1; j++) {
                    lineMeta = lineMetas[j];
                    meta = lineMeta[2];
                    delete meta[2].state;
                    if ((ref1 = meta[2].span) != null) {
                        ref1.innerHTML = lineMeta[0] + 1;
                    }
                }
                return post.emit('search-saved', file);
            });
        });
    };

    Meta.prototype.saveLine = function(li) {
        var file, fileLineMetas, i, j, len, len1, line, lineMetas, meta, mfile, ref1, ref2, ref3, ref4, results;
        ref1 = this.metasAtLineIndex(li);
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            if (meta[2].state === 'unsaved') {
                ref2 = slash.splitFileLine(meta[2].href), file = ref2[0], line = ref2[1];
                break;
            }
        }
        if (file) {
            fileLineMetas = {};
            ref3 = this.metas;
            for (j = 0, len1 = ref3.length; j < len1; j++) {
                meta = ref3[j];
                if (meta[2].state === 'unsaved') {
                    ref4 = slash.splitFileLine(meta[2].href), mfile = ref4[0], line = ref4[1];
                    if (mfile === file) {
                        if (fileLineMetas[mfile] != null) {
                            fileLineMetas[mfile];
                        } else {
                            fileLineMetas[mfile] = [];
                        }
                        fileLineMetas[mfile].push([line - 1, this.editor.line(meta[0]), meta]);
                    }
                }
            }
            results = [];
            for (file in fileLineMetas) {
                lineMetas = fileLineMetas[file];
                results.push(this.saveFileLineMetas(file, lineMetas));
            }
            return results;
        }
    };

    Meta.prototype.saveChanges = function() {
        var file, fileLineMetas, i, len, line, lineMetas, meta, ref1, ref2;
        fileLineMetas = {};
        ref1 = this.metas;
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            if (meta[2].state === 'unsaved') {
                ref2 = slash.splitFileLine(meta[2].href), file = ref2[0], line = ref2[1];
                if (fileLineMetas[file] != null) {
                    fileLineMetas[file];
                } else {
                    fileLineMetas[file] = [];
                }
                fileLineMetas[file].push([line - 1, this.editor.line(meta[0]), meta]);
            }
        }
        for (file in fileLineMetas) {
            lineMetas = fileLineMetas[file];
            this.saveFileLineMetas(file, lineMetas);
        }
        return fileLineMetas.length;
    };

    Meta.prototype.saveButton = function(li) {
        return "<span class=\"saveButton\" onclick=\"window.terminal.meta.saveLine(" + li + ");\">&#128190;</span>";
    };

    Meta.prototype.onNumber = function(e) {
        var i, len, meta, metas, num, results;
        metas = this.metasAtLineIndex(e.lineIndex);
        results = [];
        for (i = 0, len = metas.length; i < len; i++) {
            meta = metas[i];
            meta[2].span = e.numberSpan;
            e.numberSpan.className = '';
            e.numberSpan.parentNode.className = 'linenumber';
            switch (meta[2].clss) {
                case 'searchResult':
                case 'termCommand':
                case 'termResult':
                case 'coffeeCommand':
                case 'coffeeResult':
                case 'commandlistItem':
                case 'gitInfoFile':
                    num = meta[2].state === 'unsaved' && this.saveButton(meta[0]);
                    if (!num) {
                        num = (meta[2].line != null) && meta[2].line;
                    }
                    if (!num) {
                        num = slash.splitFileLine(meta[2].href)[1];
                    }
                    if (!num) {
                        num = '?';
                    }
                    if (meta[2].lineClss != null) {
                        e.numberSpan.parentNode.className = 'linenumber ' + meta[2].lineClss;
                    }
                    if (meta[2].lineClss != null) {
                        e.numberSpan.className = meta[2].lineClss;
                    }
                    results.push(e.numberSpan.innerHTML = num);
                    break;
                case 'spacer':
                    results.push(e.numberSpan.innerHTML = '&nbsp;');
                    break;
                default:
                    results.push(void 0);
            }
        }
        return results;
    };

    Meta.prototype.setMetaPos = function(meta, tx, ty) {
        var ref1, ref2;
        if (meta[2].no_x) {
            return (ref1 = meta[2].div) != null ? ref1.style.transform = "translateY(" + ty + "px)" : void 0;
        } else {
            return (ref2 = meta[2].div) != null ? ref2.style.transform = "translate(" + tx + "px," + ty + "px)" : void 0;
        }
    };

    Meta.prototype.updatePos = function(meta) {
        var ref1, ref2, size, tx, ty;
        size = this.editor.size;
        tx = size.charWidth * meta[1][0] + size.offsetX + ((ref1 = meta[2].xOffset) != null ? ref1 : 0);
        ty = size.lineHeight * (meta[0] - this.editor.scroll.top) + ((ref2 = meta[2].yOffset) != null ? ref2 : 0);
        return this.setMetaPos(meta, tx, ty);
    };

    Meta.prototype.addDiv = function(meta) {
        var div, k, lh, ref1, ref2, size, v;
        size = this.editor.size;
        sw = size.charWidth * (meta[1][1] - meta[1][0]);
        lh = size.lineHeight;
        div = elem({
            "class": "meta " + ((ref1 = meta[2].clss) != null ? ref1 : '')
        });
        if (meta[2].html != null) {
            div.innerHTML = meta[2].html;
        }
        meta[2].div = div;
        div.meta = meta;
        if (meta[2].toggled) {
            div.classList.add('toggled');
        }
        if (!meta[2].no_h) {
            div.style.height = lh + "px";
        }
        if (meta[2].style != null) {
            ref2 = meta[2].style;
            for (k in ref2) {
                v = ref2[k];
                div.style[k] = v;
            }
        }
        if (!meta[2].no_x) {
            div.style.width = sw + "px";
        }
        this.elem.appendChild(div);
        return this.updatePos(meta);
    };

    Meta.prototype.delDiv = function(meta) {
        var ref1;
        if ((meta != null ? meta[2] : void 0) == null) {
            return kerror('no line meta?', meta);
        }
        if ((ref1 = meta[2].div) != null) {
            ref1.remove();
        }
        return meta[2].div = null;
    };

    Meta.prototype.add = function(meta) {
        var lineMeta, ref1;
        lineMeta = this.addLineMeta([meta.line, [meta.start, meta.end], meta]);
        if ((this.editor.scroll.top <= (ref1 = meta.line) && ref1 <= this.editor.scroll.bot)) {
            return this.addDiv(lineMeta);
        }
    };

    Meta.prototype.addDiffMeta = function(meta) {
        meta.diff = true;
        return this.addNumberMeta(meta);
    };

    Meta.prototype.addNumberMeta = function(meta) {
        var lineMeta, ref1;
        meta.no_x = true;
        lineMeta = this.addLineMeta([meta.line, [0, 0], meta]);
        if ((this.editor.scroll.top <= (ref1 = meta.line) && ref1 <= this.editor.scroll.bot)) {
            return this.addDiv(lineMeta);
        }
    };

    Meta.prototype.onMouseDown = function(event) {
        var ref1, ref2, result;
        if (((ref1 = event.target.meta) != null ? ref1[2].click : void 0) != null) {
            result = (ref2 = event.target.meta) != null ? ref2[2].click(event.target.meta, event) : void 0;
            if (result !== 'unhandled') {
                return stopEvent(event);
            }
        }
    };

    Meta.prototype.append = function(meta) {
        var lineMeta;
        lineMeta = this.addLineMeta([this.editor.numLines(), [0, 0], meta]);
        return lineMeta;
    };

    Meta.prototype.addLineMeta = function(lineMeta) {
        var base, name;
        if ((lineMeta != null ? lineMeta[2] : void 0) == null) {
            return kerror('invalid line meta?', lineMeta);
        }
        if ((base = this.lineMetas)[name = lineMeta[0]] != null) {
            base[name];
        } else {
            base[name] = [];
        }
        this.lineMetas[lineMeta[0]].push(lineMeta);
        this.metas.push(lineMeta);
        return lineMeta;
    };

    Meta.prototype.moveLineMeta = function(lineMeta, d) {
        var base, name;
        if ((lineMeta == null) || d === 0) {
            return kerror('invalid move?', lineMeta, d);
        }
        _.pull(this.lineMetas[lineMeta[0]], lineMeta);
        if (empty(this.lineMetas[lineMeta[0]])) {
            delete this.lineMetas[lineMeta[0]];
        }
        lineMeta[0] += d;
        if ((base = this.lineMetas)[name = lineMeta[0]] != null) {
            base[name];
        } else {
            base[name] = [];
        }
        this.lineMetas[lineMeta[0]].push(lineMeta);
        return this.updatePos(lineMeta);
    };

    Meta.prototype.onLineAppended = function(e) {
        var i, len, meta, ref1, results;
        ref1 = this.metasAtLineIndex(e.lineIndex);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            if (meta[1][1] === 0) {
                results.push(meta[1][1] = e.text.length);
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Meta.prototype.metasAtLineIndex = function(li) {
        var ref1;
        return (ref1 = this.lineMetas[li]) != null ? ref1 : [];
    };

    Meta.prototype.hrefAtLineIndex = function(li) {
        var i, len, meta, ref1;
        ref1 = this.metasAtLineIndex(li);
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            if (meta[2].href != null) {
                return meta[2].href;
            }
        }
    };

    Meta.prototype.onLinesShown = function(top, bot, num) {
        var i, len, meta, ref1, ref2, results;
        ref1 = this.metas;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.delDiv(meta);
            if ((top <= (ref2 = meta[0]) && ref2 <= bot)) {
                results.push(this.addDiv(meta));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Meta.prototype.onLinesShifted = function(top, bot, num) {
        var i, j, l, len, len1, len2, len3, m, meta, ref1, ref2, ref3, ref4;
        if (num > 0) {
            ref1 = rangesFromTopToBotInRanges(top - num, top - 1, this.metas);
            for (i = 0, len = ref1.length; i < len; i++) {
                meta = ref1[i];
                this.delDiv(meta);
            }
            ref2 = rangesFromTopToBotInRanges(bot - num + 1, bot, this.metas);
            for (j = 0, len1 = ref2.length; j < len1; j++) {
                meta = ref2[j];
                this.addDiv(meta);
            }
        } else {
            ref3 = rangesFromTopToBotInRanges(bot + 1, bot - num, this.metas);
            for (l = 0, len2 = ref3.length; l < len2; l++) {
                meta = ref3[l];
                this.delDiv(meta);
            }
            ref4 = rangesFromTopToBotInRanges(top, top - num - 1, this.metas);
            for (m = 0, len3 = ref4.length; m < len3; m++) {
                meta = ref4[m];
                this.addDiv(meta);
            }
        }
        return this.updatePositionsBelowLineIndex(top);
    };

    Meta.prototype.updatePositionsBelowLineIndex = function(li) {
        var i, len, meta, ref1, results, size;
        size = this.editor.size;
        ref1 = rangesFromTopToBotInRanges(li, this.editor.scroll.bot, this.metas);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            results.push(this.updatePos(meta));
        }
        return results;
    };

    Meta.prototype.onLineInserted = function(li) {
        var i, len, meta, ref1;
        ref1 = rangesFromTopToBotInRanges(li, this.editor.numLines(), this.metas);
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.moveLineMeta(meta, 1);
        }
        return this.updatePositionsBelowLineIndex(li);
    };

    Meta.prototype.onLineDeleted = function(li) {
        var i, len, meta, ref1;
        while (meta = _.last(this.metasAtLineIndex(li))) {
            this.delMeta(meta);
        }
        ref1 = rangesFromTopToBotInRanges(li, this.editor.numLines(), this.metas);
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.moveLineMeta(meta, -1);
        }
        return this.updatePositionsBelowLineIndex(li);
    };

    Meta.prototype.onClearLines = function() {
        var i, len, meta, ref1;
        ref1 = this.metas;
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.delDiv(meta);
        }
        this.metas = [];
        this.lineMetas = {};
        return this.elem.innerHTML = "";
    };

    Meta.prototype.clear = function() {
        this.elem.innerHTML = "";
        this.metas = [];
        return this.lineMetas = {};
    };

    Meta.prototype.delMeta = function(meta) {
        if (meta == null) {
            return kerror('del no meta?');
        }
        _.pull(this.lineMetas[meta[0]], meta);
        _.pull(this.metas, meta);
        return this.delDiv(meta);
    };

    Meta.prototype.delClass = function(clss) {
        var clsss, i, len, meta, ref1, ref2, ref3, results;
        ref1 = _.clone(this.metas);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            clsss = meta != null ? (ref2 = meta[2]) != null ? (ref3 = ref2.clss) != null ? ref3.split(' ') : void 0 : void 0 : void 0;
            if (!empty(clsss) && indexOf.call(clsss, clss) >= 0) {
                results.push(this.delMeta(meta));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    return Meta;

})();

module.exports = Meta;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJtZXRhLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrRkFBQTtJQUFBOzs7QUFRQSxNQUFnRSxPQUFBLENBQVEsS0FBUixDQUFoRSxFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixpQkFBbkIsRUFBMEIsaUJBQTFCLEVBQWlDLGVBQWpDLEVBQXVDLFdBQXZDLEVBQTJDLFdBQTNDLEVBQStDLG1CQUEvQyxFQUF1RCxTQUF2RCxFQUEwRDs7QUFFMUQsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLGVBQVI7O0FBRUg7SUFFQyxjQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxLQUFELEdBQWE7UUFDYixJQUFDLENBQUEsU0FBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLElBQUQsR0FBTyxDQUFBLENBQUUsT0FBRixFQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBbEI7UUFFUCxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxTQUFYLEVBQThCLElBQUMsQ0FBQSxTQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBOEIsSUFBQyxDQUFBLGNBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQThCLElBQUMsQ0FBQSxjQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGFBQVgsRUFBOEIsSUFBQyxDQUFBLGFBQS9CO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUE4QixJQUFDLENBQUEsWUFB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LElBQUYsQ0FBTyxJQUFDLENBQUEsS0FBUixFQUFlLElBQWY7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRLElBQVI7SUFMSzs7bUJBT1QsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUVOLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksS0FBQSw4RUFBc0IsQ0FBRSxLQUFoQixDQUFzQixHQUF0QjtZQUNSLElBQUcsQ0FBSSxLQUFBLENBQU0sS0FBTixDQUFKLElBQXFCLGFBQVEsS0FBUixFQUFBLElBQUEsTUFBeEI7NkJBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFULEdBREo7YUFBQSxNQUFBO3FDQUFBOztBQUZKOztJQUZNOzs7Ozs7QUFPZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwXG4wMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwgc2xhc2gsIGVtcHR5LCBlbGVtLCBmcywgc3csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5yYW5nZXMgPSByZXF1aXJlICcuLi90b29scy9yYW5nZXMnXG5GaWxlICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuXG5jbGFzcyBNZXRhXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAbWV0YXMgICAgID0gW10gIyBbIFtsaW5lSW5kZXgsIFtzdGFydCwgZW5kXSwge2hyZWY6IC4uLn1dLCAuLi4gXVxuICAgICAgICBAbGluZU1ldGFzID0ge30gIyB7IGxpbmVJbmRleDogWyBsaW5lTWV0YSwgLi4uIF0sIC4uLiB9XG5cbiAgICAgICAgQGVsZW0gPSQgXCIubWV0YVwiIEBlZGl0b3Iudmlld1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUFwcGVuZGVkJyAgICAgQG9uTGluZUFwcGVuZGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2NsZWFyTGluZXMnICAgICAgIEBvbkNsZWFyTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUluc2VydGVkJyAgICAgQG9uTGluZUluc2VydGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVEZWxldGVkJyAgICAgIEBvbkxpbmVEZWxldGVkXG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaG93bicgICAgICAgQG9uTGluZXNTaG93blxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NoaWZ0ZWQnICAgICBAb25MaW5lc1NoaWZ0ZWRcblxuICAgICAgICBpZiBAZWRpdG9yLm51bWJlcnM/XG4gICAgICAgICAgICBAZWRpdG9yLm51bWJlcnMub24gJ251bWJlckFkZGVkJyAgIEBvbk51bWJlclxuICAgICAgICAgICAgQGVkaXRvci5udW1iZXJzLm9uICdudW1iZXJDaGFuZ2VkJyBAb25OdW1iZXJcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uQ2hhbmdlZDogKGNoYW5nZUluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgbGkgPSBjaGFuZ2Uub2xkSW5kZXhcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGNoYW5nZS5jaGFuZ2UgPT0gJ2RlbGV0ZWQnXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY2xzcyA9PSBcInNlYXJjaFJlc3VsdFwiIGFuZCBtZXRhWzJdLmhyZWY/XG4gICAgICAgICAgICAgICAgICAgIFtmaWxlLCBsaW5lXSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUgbWV0YVsyXS5ocmVmXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgLT0gMVxuICAgICAgICAgICAgICAgICAgICBsb2NhbENoYW5nZSA9IF8uY2xvbmVEZWVwIGNoYW5nZVxuICAgICAgICAgICAgICAgICAgICBsb2NhbENoYW5nZS5vbGRJbmRleCA9IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDaGFuZ2UubmV3SW5kZXggPSBsaW5lXG4gICAgICAgICAgICAgICAgICAgIGxvY2FsQ2hhbmdlLmRvSW5kZXggID0gbGluZVxuICAgICAgICAgICAgICAgICAgICBsb2NhbENoYW5nZS5hZnRlciAgICA9IEBlZGl0b3IubGluZShtZXRhWzBdKVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ2ZpbGVTZWFyY2hSZXN1bHRDaGFuZ2UnLCBmaWxlLCBsb2NhbENoYW5nZVxuICAgICAgICAgICAgICAgICAgICBtZXRhWzJdLnN0YXRlID0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uc3Bhbj9cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbiA9IEBzYXZlQnV0dG9uIGxpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgbWV0YVsyXS5zcGFuLmlubmVySFRNTC5zdGFydHNXaXRoIFwiPHNwYW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFbMl0uc3Bhbi5pbm5lckhUTUwgPSBidXR0b25cblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIHNhdmVGaWxlTGluZU1ldGFzOiAoZmlsZSwgbGluZU1ldGFzKSAtPlxuXG4gICAgICAgIGZzLnJlYWRGaWxlIGZpbGUsIGVuY29kaW5nOiAndXRmOCcsIChlcnIsIGRhdGEpIC0+XG4gICAgICAgICAgICBpZiBlcnI/IHRoZW4gcmV0dXJuIGtlcnJvciBcIk1ldGEuc2F2ZUZpbGVMaW5lTWV0YXMgLS0gcmVhZEZpbGUgZXJyOiN7ZXJyfVwiXG4gICAgICAgICAgICBsaW5lcyA9IGRhdGEuc3BsaXQgL1xccj9cXG4vXG4gICAgICAgICAgICBmb3IgbGluZU1ldGEgaW4gbGluZU1ldGFzXG4gICAgICAgICAgICAgICAgbGluZXNbbGluZU1ldGFbMF1dID0gbGluZU1ldGFbMV1cbiAgICAgICAgICAgIGRhdGEgPSBsaW5lcy5qb2luICdcXG4nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEZpbGUuc2F2ZSBmaWxlLCBkYXRhLCAoZXJyLCBmaWxlKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVycj8gdGhlbiByZXR1cm4ga2Vycm9yIFwiTWV0YS5zYXZlRmlsZUxpbmVNZXRhcyAtLSB3cml0ZUZpbGUgZXJyOiN7ZXJyfVwiXG4gICAgICAgICAgICAgICAgZm9yIGxpbmVNZXRhIGluIGxpbmVNZXRhc1xuICAgICAgICAgICAgICAgICAgICBtZXRhID0gbGluZU1ldGFbMl1cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1ldGFbMl0uc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgbWV0YVsyXS5zcGFuPy5pbm5lckhUTUwgPSBsaW5lTWV0YVswXSsxXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdzZWFyY2gtc2F2ZWQnLCBmaWxlXG5cbiAgICBzYXZlTGluZTogKGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIGlmIG1ldGFbMl0uc3RhdGUgPT0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgW2ZpbGUsIGxpbmVdID0gc2xhc2guc3BsaXRGaWxlTGluZSBtZXRhWzJdLmhyZWZcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBmaWxlXG4gICAgICAgICAgICBmaWxlTGluZU1ldGFzID0ge31cbiAgICAgICAgICAgIGZvciBtZXRhIGluIEBtZXRhc1xuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uc3RhdGUgPT0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgICAgIFttZmlsZSwgbGluZV0gPSBzbGFzaC5zcGxpdEZpbGVMaW5lIG1ldGFbMl0uaHJlZlxuICAgICAgICAgICAgICAgICAgICBpZiBtZmlsZSA9PSBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlTGluZU1ldGFzW21maWxlXSA/PSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUxpbmVNZXRhc1ttZmlsZV0ucHVzaCBbbGluZS0xLCBAZWRpdG9yLmxpbmUobWV0YVswXSksIG1ldGFdXG4gICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBmaWxlLCBsaW5lTWV0YXMgb2YgZmlsZUxpbmVNZXRhc1xuICAgICAgICAgICAgICAgIEBzYXZlRmlsZUxpbmVNZXRhcyBmaWxlLCBsaW5lTWV0YXNcblxuICAgIHNhdmVDaGFuZ2VzOiAtPlxuXG4gICAgICAgIGZpbGVMaW5lTWV0YXMgPSB7fVxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgIGlmIG1ldGFbMl0uc3RhdGUgPT0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgW2ZpbGUsIGxpbmVdID0gc2xhc2guc3BsaXRGaWxlTGluZSBtZXRhWzJdLmhyZWZcbiAgICAgICAgICAgICAgICBmaWxlTGluZU1ldGFzW2ZpbGVdID89IFtdXG4gICAgICAgICAgICAgICAgZmlsZUxpbmVNZXRhc1tmaWxlXS5wdXNoIFtsaW5lLTEsIEBlZGl0b3IubGluZShtZXRhWzBdKSwgbWV0YV1cblxuICAgICAgICBmb3IgZmlsZSwgbGluZU1ldGFzIG9mIGZpbGVMaW5lTWV0YXNcbiAgICAgICAgICAgIEBzYXZlRmlsZUxpbmVNZXRhcyBmaWxlLCBsaW5lTWV0YXNcblxuICAgICAgICBmaWxlTGluZU1ldGFzLmxlbmd0aFxuXG4gICAgc2F2ZUJ1dHRvbjogKGxpKSAtPlxuICAgICAgICBcIjxzcGFuIGNsYXNzPVxcXCJzYXZlQnV0dG9uXFxcIiBvbmNsaWNrPVxcXCJ3aW5kb3cudGVybWluYWwubWV0YS5zYXZlTGluZSgje2xpfSk7XFxcIj4mIzEyODE5MDs8L3NwYW4+XCJcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uTnVtYmVyOiAoZSkgPT5cblxuICAgICAgICBtZXRhcyA9IEBtZXRhc0F0TGluZUluZGV4IGUubGluZUluZGV4XG4gICAgICAgIGZvciBtZXRhIGluIG1ldGFzXG4gICAgICAgICAgICBtZXRhWzJdLnNwYW4gPSBlLm51bWJlclNwYW5cbiAgICAgICAgICAgIGUubnVtYmVyU3Bhbi5jbGFzc05hbWUgPSAnJ1xuICAgICAgICAgICAgZS5udW1iZXJTcGFuLnBhcmVudE5vZGUuY2xhc3NOYW1lID0gJ2xpbmVudW1iZXInXG4gICAgICAgICAgICBzd2l0Y2ggbWV0YVsyXS5jbHNzXG4gICAgICAgICAgICAgICAgd2hlbiAnc2VhcmNoUmVzdWx0JyAndGVybUNvbW1hbmQnICd0ZXJtUmVzdWx0JyAnY29mZmVlQ29tbWFuZCcgJ2NvZmZlZVJlc3VsdCcgJ2NvbW1hbmRsaXN0SXRlbScgJ2dpdEluZm9GaWxlJ1xuICAgICAgICAgICAgICAgICAgICBudW0gPSBtZXRhWzJdLnN0YXRlID09ICd1bnNhdmVkJyBhbmQgQHNhdmVCdXR0b24obWV0YVswXSlcbiAgICAgICAgICAgICAgICAgICAgbnVtID0gbWV0YVsyXS5saW5lPyBhbmQgbWV0YVsyXS5saW5lIGlmIG5vdCBudW1cbiAgICAgICAgICAgICAgICAgICAgbnVtID0gc2xhc2guc3BsaXRGaWxlTGluZShtZXRhWzJdLmhyZWYpWzFdIGlmIG5vdCBudW1cbiAgICAgICAgICAgICAgICAgICAgbnVtID0gJz8nIGlmIG5vdCBudW1cbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLnBhcmVudE5vZGUuY2xhc3NOYW1lID0gJ2xpbmVudW1iZXIgJyArIG1ldGFbMl0ubGluZUNsc3MgaWYgbWV0YVsyXS5saW5lQ2xzcz9cbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLmNsYXNzTmFtZSA9IG1ldGFbMl0ubGluZUNsc3MgaWYgbWV0YVsyXS5saW5lQ2xzcz9cbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLmlubmVySFRNTCA9IG51bVxuICAgICAgICAgICAgICAgIHdoZW4gJ3NwYWNlcidcbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLmlubmVySFRNTCA9ICcmbmJzcDsnXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgc2V0TWV0YVBvczogKG1ldGEsIHR4LCB0eSkgLT5cblxuICAgICAgICBpZiBtZXRhWzJdLm5vX3hcbiAgICAgICAgICAgIG1ldGFbMl0uZGl2Py5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVkoI3t0eX1weClcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtZXRhWzJdLmRpdj8uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoI3t0eH1weCwje3R5fXB4KVwiXG5cbiAgICB1cGRhdGVQb3M6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgc2l6ZSA9IEBlZGl0b3Iuc2l6ZVxuICAgICAgICB0eCA9IHNpemUuY2hhcldpZHRoICogIG1ldGFbMV1bMF0gKyBzaXplLm9mZnNldFggKyAobWV0YVsyXS54T2Zmc2V0ID8gMClcbiAgICAgICAgdHkgPSBzaXplLmxpbmVIZWlnaHQgKiAobWV0YVswXSAtIEBlZGl0b3Iuc2Nyb2xsLnRvcCkgKyAobWV0YVsyXS55T2Zmc2V0ID8gMClcbiAgICAgICAgQHNldE1ldGFQb3MgbWV0YSwgdHgsIHR5XG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgICAwMDAgICAgICAwXG5cbiAgICBhZGREaXY6IChtZXRhKSAtPlxuXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgc3cgPSBzaXplLmNoYXJXaWR0aCAqIChtZXRhWzFdWzFdLW1ldGFbMV1bMF0pXG4gICAgICAgIGxoID0gc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogXCJtZXRhICN7bWV0YVsyXS5jbHNzID8gJyd9XCJcbiAgICAgICAgZGl2LmlubmVySFRNTCA9IG1ldGFbMl0uaHRtbCBpZiBtZXRhWzJdLmh0bWw/XG5cbiAgICAgICAgbWV0YVsyXS5kaXYgPSBkaXZcbiAgICAgICAgZGl2Lm1ldGEgPSBtZXRhXG5cbiAgICAgICAgZGl2LmNsYXNzTGlzdC5hZGQgJ3RvZ2dsZWQnIGlmIG1ldGFbMl0udG9nZ2xlZCAjIGdpdCBjaGFuZ2UgdG9nZ2xlZFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9faFxuICAgICAgICAgICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiI3tsaH1weFwiXG5cbiAgICAgICAgaWYgbWV0YVsyXS5zdHlsZT9cbiAgICAgICAgICAgIGZvciBrLHYgb2YgbWV0YVsyXS5zdHlsZVxuICAgICAgICAgICAgICAgIGRpdi5zdHlsZVtrXSA9IHZcblxuICAgICAgICBpZiBub3QgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBkaXYuc3R5bGUud2lkdGggPSBcIiN7c3d9cHhcIlxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIGRpdlxuXG4gICAgICAgIEB1cGRhdGVQb3MgbWV0YVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgICAgIDBcblxuICAgIGRlbERpdjogKG1ldGEpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbGluZSBtZXRhPycgbWV0YSBpZiBub3QgbWV0YT9bMl0/XG4gICAgICAgIG1ldGFbMl0uZGl2Py5yZW1vdmUoKVxuICAgICAgICBtZXRhWzJdLmRpdiA9IG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBhZGQ6IChtZXRhKSAtPlxuXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFttZXRhLmxpbmUsIFttZXRhLnN0YXJ0LCBtZXRhLmVuZF0sIG1ldGFdXG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwudG9wIDw9IG1ldGEubGluZSA8PSBAZWRpdG9yLnNjcm9sbC5ib3RcbiAgICAgICAgICAgIEBhZGREaXYgbGluZU1ldGFcblxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAgICAgMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAwMDBcblxuICAgIGFkZERpZmZNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBtZXRhLmRpZmYgPSB0cnVlXG4gICAgICAgIEBhZGROdW1iZXJNZXRhIG1ldGFcblxuICAgIGFkZE51bWJlck1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIG1ldGEubm9feCA9IHRydWVcbiAgICAgICAgbGluZU1ldGEgPSBAYWRkTGluZU1ldGEgW21ldGEubGluZSwgWzAsIDBdLCBtZXRhXVxuXG4gICAgICAgIGlmIEBlZGl0b3Iuc2Nyb2xsLnRvcCA8PSBtZXRhLmxpbmUgPD0gQGVkaXRvci5zY3JvbGwuYm90XG4gICAgICAgICAgICBAYWRkRGl2IGxpbmVNZXRhXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGV2ZW50LnRhcmdldC5tZXRhP1syXS5jbGljaz9cbiAgICAgICAgICAgIHJlc3VsdCA9IGV2ZW50LnRhcmdldC5tZXRhP1syXS5jbGljayBldmVudC50YXJnZXQubWV0YSwgZXZlbnRcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCBpZiByZXN1bHQgIT0gJ3VuaGFuZGxlZCdcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYXBwZW5kOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFtAZWRpdG9yLm51bUxpbmVzKCksIFswLCAwXSwgbWV0YV1cbiAgICAgICAgbGluZU1ldGFcblxuICAgIGFkZExpbmVNZXRhOiAobGluZU1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yICdpbnZhbGlkIGxpbmUgbWV0YT8nLCBsaW5lTWV0YSBpZiBub3QgbGluZU1ldGE/WzJdP1xuICAgICAgICBcbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gPz0gW11cbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0ucHVzaCBsaW5lTWV0YVxuICAgICAgICBAbWV0YXMucHVzaCBsaW5lTWV0YVxuICAgICAgICBsaW5lTWV0YVxuXG4gICAgbW92ZUxpbmVNZXRhOiAobGluZU1ldGEsIGQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnaW52YWxpZCBtb3ZlPycsIGxpbmVNZXRhLCBkIGlmIG5vdCBsaW5lTWV0YT8gb3IgZCA9PSAwXG4gICAgICAgIFxuICAgICAgICBfLnB1bGwgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0sIGxpbmVNZXRhXG4gICAgICAgIGRlbGV0ZSBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSBpZiBlbXB0eSBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXVxuICAgICAgICBsaW5lTWV0YVswXSArPSBkXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dID89IFtdXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dLnB1c2ggbGluZU1ldGFcbiAgICAgICAgQHVwZGF0ZVBvcyBsaW5lTWV0YVxuICAgICAgICBcbiAgICBvbkxpbmVBcHBlbmRlZDogKGUpID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggZS5saW5lSW5kZXhcbiAgICAgICAgICAgIG1ldGFbMV1bMV0gPSBlLnRleHQubGVuZ3RoIGlmIG1ldGFbMV1bMV0gaXMgMFxuXG4gICAgbWV0YXNBdExpbmVJbmRleDogKGxpKSAtPiBAbGluZU1ldGFzW2xpXSA/IFtdXG4gICAgICAgIFxuICAgIGhyZWZBdExpbmVJbmRleDogIChsaSkgLT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgcmV0dXJuIG1ldGFbMl0uaHJlZiBpZiBtZXRhWzJdLmhyZWY/XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAgICAwMDBcblxuICAgIG9uTGluZXNTaG93bjogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuICAgICAgICAgICAgaWYgdG9wIDw9IG1ldGFbMF0gPD0gYm90XG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uTGluZXNTaGlmdGVkOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyB0b3AtbnVtLCB0b3AtMSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGRlbERpdiBtZXRhXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGJvdC1udW0rMSwgYm90LCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBib3QrMSwgYm90LW51bSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGRlbERpdiBtZXRhXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIHRvcCwgdG9wLW51bS0xLCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggdG9wXG5cbiAgICB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3Iuc2Nyb2xsLmJvdCwgQG1ldGFzXG4gICAgICAgICAgICBAdXBkYXRlUG9zIG1ldGFcblxuICAgIG9uTGluZUluc2VydGVkOiAobGkpID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3IubnVtTGluZXMoKSwgQG1ldGFzXG4gICAgICAgICAgICBAbW92ZUxpbmVNZXRhIG1ldGEsIDFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggbGlcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvbkxpbmVEZWxldGVkOiAobGkpID0+XG5cbiAgICAgICAgd2hpbGUgbWV0YSA9IF8ubGFzdCBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgQGRlbE1ldGEgbWV0YVxuXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLm51bUxpbmVzKCksIEBtZXRhc1xuICAgICAgICAgICAgQG1vdmVMaW5lTWV0YSBtZXRhLCAtMVxuXG4gICAgICAgIEB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleCBsaVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkNsZWFyTGluZXM6ID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzXG4gICAgICAgICAgICBAZGVsRGl2IG1ldGFcbiAgICAgICAgQG1ldGFzICAgICA9IFtdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG5cbiAgICBjbGVhcjogPT5cblxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIEBtZXRhcyA9IFtdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fVxuXG4gICAgZGVsTWV0YTogKG1ldGEpIC0+XG4gICAgICAgIGlmIG5vdCBtZXRhP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnZGVsIG5vIG1ldGE/J1xuICAgICAgICBfLnB1bGwgQGxpbmVNZXRhc1ttZXRhWzBdXSwgbWV0YVxuICAgICAgICBfLnB1bGwgQG1ldGFzLCBtZXRhXG4gICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgZGVsQ2xhc3M6IChjbHNzKSAtPlxuXG4gICAgICAgIGZvciBtZXRhIGluIF8uY2xvbmUgQG1ldGFzXG4gICAgICAgICAgICBjbHNzcyA9IG1ldGE/WzJdPy5jbHNzPy5zcGxpdCAnICdcbiAgICAgICAgICAgIGlmIG5vdCBlbXB0eShjbHNzcykgYW5kIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgICAgICBAZGVsTWV0YSBtZXRhXG5cbm1vZHVsZS5leHBvcnRzID0gTWV0YVxuIl19
//# sourceURL=../../coffee/editor/meta.coffee