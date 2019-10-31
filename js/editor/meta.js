// koffee 1.4.0

/*
00     00  00000000  000000000   0000000
000   000  000          000     000   000
000000000  0000000      000     000000000
000 0 000  000          000     000   000
000   000  00000000     000     000   000
 */
var $, File, Meta, _, elem, empty, fs, kerror, klog, post, ranges, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, empty = ref.empty, elem = ref.elem, post = ref.post, slash = ref.slash, fs = ref.fs, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

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
        var div, k, lh, ref1, ref2, size, sw, v;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0ZBQUE7SUFBQTs7O0FBUUEsTUFBa0UsT0FBQSxDQUFRLEtBQVIsQ0FBbEUsRUFBRSx5QkFBRixFQUFhLGlCQUFiLEVBQW9CLGVBQXBCLEVBQTBCLGVBQTFCLEVBQWdDLGlCQUFoQyxFQUF1QyxXQUF2QyxFQUEyQyxlQUEzQyxFQUFpRCxtQkFBakQsRUFBeUQsU0FBekQsRUFBNEQ7O0FBRTVELE1BQUEsR0FBUyxPQUFBLENBQVEsaUJBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSOztBQUVIO0lBRUMsY0FBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLE9BQUYsRUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQWxCO1FBRVAsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsU0FBWCxFQUE4QixJQUFDLENBQUEsU0FBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQThCLElBQUMsQ0FBQSxjQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUE4QixJQUFDLENBQUEsY0FBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxhQUFYLEVBQThCLElBQUMsQ0FBQSxhQUEvQjtRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxF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ZSxJQUFmO2VBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUSxJQUFSO0lBTEs7O21CQU9ULFFBQUEsR0FBVSxTQUFDLElBQUQ7QUFFTixZQUFBO0FBQUE7QUFBQTthQUFBLHNDQUFBOztZQUNJLEtBQUEsOEVBQXNCLENBQUUsS0FBaEIsQ0FBc0IsR0FBdEI7WUFDUixJQUFHLENBQUksS0FBQSxDQUFNLEtBQU4sQ0FBSixJQUFxQixhQUFRLEtBQVIsRUFBQSxJQUFBLE1BQXhCOzZCQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxHQURKO2FBQUEsTUFBQTtxQ0FBQTs7QUFGSjs7SUFGTTs7Ozs7O0FBT2QsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMFxuMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIyNcblxueyBzdG9wRXZlbnQsIGVtcHR5LCBlbGVtLCBwb3N0LCBzbGFzaCwgZnMsIGtsb2csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5yYW5nZXMgPSByZXF1aXJlICcuLi90b29scy9yYW5nZXMnXG5GaWxlICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuXG5jbGFzcyBNZXRhXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAbWV0YXMgICAgID0gW10gIyBbIFtsaW5lSW5kZXgsIFtzdGFydCwgZW5kXSwge2hyZWY6IC4uLn1dLCAuLi4gXVxuICAgICAgICBAbGluZU1ldGFzID0ge30gIyB7IGxpbmVJbmRleDogWyBsaW5lTWV0YSwgLi4uIF0sIC4uLiB9XG5cbiAgICAgICAgQGVsZW0gPSQgXCIubWV0YVwiIEBlZGl0b3Iudmlld1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUFwcGVuZGVkJyAgICAgQG9uTGluZUFwcGVuZGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2NsZWFyTGluZXMnICAgICAgIEBvbkNsZWFyTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUluc2VydGVkJyAgICAgQG9uTGluZUluc2VydGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVEZWxldGVkJyAgICAgIEBvbkxpbmVEZWxldGVkXG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaG93bicgICAgICAgQG9uTGluZXNTaG93blxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NoaWZ0ZWQnICAgICBAb25MaW5lc1NoaWZ0ZWRcblxuICAgICAgICBpZiBAZWRpdG9yLm51bWJlcnM/XG4gICAgICAgICAgICBAZWRpdG9yLm51bWJlcnMub24gJ251bWJlckFkZGVkJyAgIEBvbk51bWJlclxuICAgICAgICAgICAgQGVkaXRvci5udW1iZXJzLm9uICdudW1iZXJDaGFuZ2VkJyBAb25OdW1iZXJcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uQ2hhbmdlZDogKGNoYW5nZUluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgbGkgPSBjaGFuZ2Uub2xkSW5kZXhcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGNoYW5nZS5jaGFuZ2UgPT0gJ2RlbGV0ZWQnXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY2xzcyA9PSBcInNlYXJjaFJlc3VsdFwiIGFuZCBtZXRhWzJdLmhyZWY/XG4gICAgICAgICAgICAgICAgICAgIFtmaWxlLCBsaW5lXSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUgbWV0YVsyXS5ocmVmXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgLT0gMVxuICAgICAgICAgICAgICAgICAgICBsb2NhbENoYW5nZSA9IF8uY2xvbmVEZWVwIGNoYW5nZVxuICAgICAgICAgICAgICAgICAgICBsb2NhbENoYW5nZS5vbGRJbmRleCA9IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDaGFuZ2UubmV3SW5kZXggPSBsaW5lXG4gICAgICAgICAgICAgICAgICAgIGxvY2FsQ2hhbmdlLmRvSW5kZXggID0gbGluZVxuICAgICAgICAgICAgICAgICAgICBsb2NhbENoYW5nZS5hZnRlciAgICA9IEBlZGl0b3IubGluZShtZXRhWzBdKVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ2ZpbGVTZWFyY2hSZXN1bHRDaGFuZ2UnLCBmaWxlLCBsb2NhbENoYW5nZVxuICAgICAgICAgICAgICAgICAgICBtZXRhWzJdLnN0YXRlID0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uc3Bhbj9cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbiA9IEBzYXZlQnV0dG9uIGxpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgbWV0YVsyXS5zcGFuLmlubmVySFRNTC5zdGFydHNXaXRoIFwiPHNwYW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFbMl0uc3Bhbi5pbm5lckhUTUwgPSBidXR0b25cblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIHNhdmVGaWxlTGluZU1ldGFzOiAoZmlsZSwgbGluZU1ldGFzKSAtPlxuXG4gICAgICAgIGZzLnJlYWRGaWxlIGZpbGUsIGVuY29kaW5nOiAndXRmOCcsIChlcnIsIGRhdGEpIC0+XG4gICAgICAgICAgICBpZiBlcnI/IHRoZW4gcmV0dXJuIGtlcnJvciBcIk1ldGEuc2F2ZUZpbGVMaW5lTWV0YXMgLS0gcmVhZEZpbGUgZXJyOiN7ZXJyfVwiXG4gICAgICAgICAgICBsaW5lcyA9IGRhdGEuc3BsaXQgL1xccj9cXG4vXG4gICAgICAgICAgICBmb3IgbGluZU1ldGEgaW4gbGluZU1ldGFzXG4gICAgICAgICAgICAgICAgbGluZXNbbGluZU1ldGFbMF1dID0gbGluZU1ldGFbMV1cbiAgICAgICAgICAgIGRhdGEgPSBsaW5lcy5qb2luICdcXG4nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEZpbGUuc2F2ZSBmaWxlLCBkYXRhLCAoZXJyLCBmaWxlKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVycj8gdGhlbiByZXR1cm4ga2Vycm9yIFwiTWV0YS5zYXZlRmlsZUxpbmVNZXRhcyAtLSB3cml0ZUZpbGUgZXJyOiN7ZXJyfVwiXG4gICAgICAgICAgICAgICAgZm9yIGxpbmVNZXRhIGluIGxpbmVNZXRhc1xuICAgICAgICAgICAgICAgICAgICBtZXRhID0gbGluZU1ldGFbMl1cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1ldGFbMl0uc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgbWV0YVsyXS5zcGFuPy5pbm5lckhUTUwgPSBsaW5lTWV0YVswXSsxXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdzZWFyY2gtc2F2ZWQnLCBmaWxlXG5cbiAgICBzYXZlTGluZTogKGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIGlmIG1ldGFbMl0uc3RhdGUgPT0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgW2ZpbGUsIGxpbmVdID0gc2xhc2guc3BsaXRGaWxlTGluZSBtZXRhWzJdLmhyZWZcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBmaWxlXG4gICAgICAgICAgICBmaWxlTGluZU1ldGFzID0ge31cbiAgICAgICAgICAgIGZvciBtZXRhIGluIEBtZXRhc1xuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uc3RhdGUgPT0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgICAgIFttZmlsZSwgbGluZV0gPSBzbGFzaC5zcGxpdEZpbGVMaW5lIG1ldGFbMl0uaHJlZlxuICAgICAgICAgICAgICAgICAgICBpZiBtZmlsZSA9PSBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlTGluZU1ldGFzW21maWxlXSA/PSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUxpbmVNZXRhc1ttZmlsZV0ucHVzaCBbbGluZS0xLCBAZWRpdG9yLmxpbmUobWV0YVswXSksIG1ldGFdXG4gICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBmaWxlLCBsaW5lTWV0YXMgb2YgZmlsZUxpbmVNZXRhc1xuICAgICAgICAgICAgICAgIEBzYXZlRmlsZUxpbmVNZXRhcyBmaWxlLCBsaW5lTWV0YXNcblxuICAgIHNhdmVDaGFuZ2VzOiAtPlxuXG4gICAgICAgIGZpbGVMaW5lTWV0YXMgPSB7fVxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgIGlmIG1ldGFbMl0uc3RhdGUgPT0gJ3Vuc2F2ZWQnXG4gICAgICAgICAgICAgICAgW2ZpbGUsIGxpbmVdID0gc2xhc2guc3BsaXRGaWxlTGluZSBtZXRhWzJdLmhyZWZcbiAgICAgICAgICAgICAgICBmaWxlTGluZU1ldGFzW2ZpbGVdID89IFtdXG4gICAgICAgICAgICAgICAgZmlsZUxpbmVNZXRhc1tmaWxlXS5wdXNoIFtsaW5lLTEsIEBlZGl0b3IubGluZShtZXRhWzBdKSwgbWV0YV1cblxuICAgICAgICBmb3IgZmlsZSwgbGluZU1ldGFzIG9mIGZpbGVMaW5lTWV0YXNcbiAgICAgICAgICAgIEBzYXZlRmlsZUxpbmVNZXRhcyBmaWxlLCBsaW5lTWV0YXNcblxuICAgICAgICBmaWxlTGluZU1ldGFzLmxlbmd0aFxuXG4gICAgc2F2ZUJ1dHRvbjogKGxpKSAtPlxuICAgICAgICBcIjxzcGFuIGNsYXNzPVxcXCJzYXZlQnV0dG9uXFxcIiBvbmNsaWNrPVxcXCJ3aW5kb3cudGVybWluYWwubWV0YS5zYXZlTGluZSgje2xpfSk7XFxcIj4mIzEyODE5MDs8L3NwYW4+XCJcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uTnVtYmVyOiAoZSkgPT5cblxuICAgICAgICBtZXRhcyA9IEBtZXRhc0F0TGluZUluZGV4IGUubGluZUluZGV4XG4gICAgICAgIGZvciBtZXRhIGluIG1ldGFzXG4gICAgICAgICAgICBtZXRhWzJdLnNwYW4gPSBlLm51bWJlclNwYW5cbiAgICAgICAgICAgIGUubnVtYmVyU3Bhbi5jbGFzc05hbWUgPSAnJ1xuICAgICAgICAgICAgZS5udW1iZXJTcGFuLnBhcmVudE5vZGUuY2xhc3NOYW1lID0gJ2xpbmVudW1iZXInXG4gICAgICAgICAgICBzd2l0Y2ggbWV0YVsyXS5jbHNzXG4gICAgICAgICAgICAgICAgd2hlbiAnc2VhcmNoUmVzdWx0JyAndGVybUNvbW1hbmQnICd0ZXJtUmVzdWx0JyAnY29mZmVlQ29tbWFuZCcgJ2NvZmZlZVJlc3VsdCcgJ2NvbW1hbmRsaXN0SXRlbScgJ2dpdEluZm9GaWxlJ1xuICAgICAgICAgICAgICAgICAgICBudW0gPSBtZXRhWzJdLnN0YXRlID09ICd1bnNhdmVkJyBhbmQgQHNhdmVCdXR0b24obWV0YVswXSlcbiAgICAgICAgICAgICAgICAgICAgbnVtID0gbWV0YVsyXS5saW5lPyBhbmQgbWV0YVsyXS5saW5lIGlmIG5vdCBudW1cbiAgICAgICAgICAgICAgICAgICAgbnVtID0gc2xhc2guc3BsaXRGaWxlTGluZShtZXRhWzJdLmhyZWYpWzFdIGlmIG5vdCBudW1cbiAgICAgICAgICAgICAgICAgICAgbnVtID0gJz8nIGlmIG5vdCBudW1cbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLnBhcmVudE5vZGUuY2xhc3NOYW1lID0gJ2xpbmVudW1iZXIgJyArIG1ldGFbMl0ubGluZUNsc3MgaWYgbWV0YVsyXS5saW5lQ2xzcz9cbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLmNsYXNzTmFtZSA9IG1ldGFbMl0ubGluZUNsc3MgaWYgbWV0YVsyXS5saW5lQ2xzcz9cbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLmlubmVySFRNTCA9IG51bVxuICAgICAgICAgICAgICAgIHdoZW4gJ3NwYWNlcidcbiAgICAgICAgICAgICAgICAgICAgZS5udW1iZXJTcGFuLmlubmVySFRNTCA9ICcmbmJzcDsnXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgc2V0TWV0YVBvczogKG1ldGEsIHR4LCB0eSkgLT5cblxuICAgICAgICBpZiBtZXRhWzJdLm5vX3hcbiAgICAgICAgICAgIG1ldGFbMl0uZGl2Py5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVkoI3t0eX1weClcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtZXRhWzJdLmRpdj8uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoI3t0eH1weCwje3R5fXB4KVwiXG5cbiAgICB1cGRhdGVQb3M6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgc2l6ZSA9IEBlZGl0b3Iuc2l6ZVxuICAgICAgICB0eCA9IHNpemUuY2hhcldpZHRoICogIG1ldGFbMV1bMF0gKyBzaXplLm9mZnNldFggKyAobWV0YVsyXS54T2Zmc2V0ID8gMClcbiAgICAgICAgdHkgPSBzaXplLmxpbmVIZWlnaHQgKiAobWV0YVswXSAtIEBlZGl0b3Iuc2Nyb2xsLnRvcCkgKyAobWV0YVsyXS55T2Zmc2V0ID8gMClcbiAgICAgICAgQHNldE1ldGFQb3MgbWV0YSwgdHgsIHR5XG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgICAwMDAgICAgICAwXG5cbiAgICBhZGREaXY6IChtZXRhKSAtPlxuXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgc3cgPSBzaXplLmNoYXJXaWR0aCAqIChtZXRhWzFdWzFdLW1ldGFbMV1bMF0pXG4gICAgICAgIGxoID0gc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogXCJtZXRhICN7bWV0YVsyXS5jbHNzID8gJyd9XCJcbiAgICAgICAgZGl2LmlubmVySFRNTCA9IG1ldGFbMl0uaHRtbCBpZiBtZXRhWzJdLmh0bWw/XG5cbiAgICAgICAgbWV0YVsyXS5kaXYgPSBkaXZcbiAgICAgICAgZGl2Lm1ldGEgPSBtZXRhXG5cbiAgICAgICAgZGl2LmNsYXNzTGlzdC5hZGQgJ3RvZ2dsZWQnIGlmIG1ldGFbMl0udG9nZ2xlZCAjIGdpdCBjaGFuZ2UgdG9nZ2xlZFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9faFxuICAgICAgICAgICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiI3tsaH1weFwiXG5cbiAgICAgICAgaWYgbWV0YVsyXS5zdHlsZT9cbiAgICAgICAgICAgIGZvciBrLHYgb2YgbWV0YVsyXS5zdHlsZVxuICAgICAgICAgICAgICAgIGRpdi5zdHlsZVtrXSA9IHZcblxuICAgICAgICBpZiBub3QgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBkaXYuc3R5bGUud2lkdGggPSBcIiN7c3d9cHhcIlxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIGRpdlxuXG4gICAgICAgIEB1cGRhdGVQb3MgbWV0YVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgICAgIDBcblxuICAgIGRlbERpdjogKG1ldGEpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbGluZSBtZXRhPycgbWV0YSBpZiBub3QgbWV0YT9bMl0/XG4gICAgICAgIG1ldGFbMl0uZGl2Py5yZW1vdmUoKVxuICAgICAgICBtZXRhWzJdLmRpdiA9IG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBhZGQ6IChtZXRhKSAtPlxuXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFttZXRhLmxpbmUsIFttZXRhLnN0YXJ0LCBtZXRhLmVuZF0sIG1ldGFdXG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwudG9wIDw9IG1ldGEubGluZSA8PSBAZWRpdG9yLnNjcm9sbC5ib3RcbiAgICAgICAgICAgIEBhZGREaXYgbGluZU1ldGFcblxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAgICAgMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAwMDBcblxuICAgIGFkZERpZmZNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBtZXRhLmRpZmYgPSB0cnVlXG4gICAgICAgIEBhZGROdW1iZXJNZXRhIG1ldGFcblxuICAgIGFkZE51bWJlck1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIG1ldGEubm9feCA9IHRydWVcbiAgICAgICAgbGluZU1ldGEgPSBAYWRkTGluZU1ldGEgW21ldGEubGluZSwgWzAsIDBdLCBtZXRhXVxuXG4gICAgICAgIGlmIEBlZGl0b3Iuc2Nyb2xsLnRvcCA8PSBtZXRhLmxpbmUgPD0gQGVkaXRvci5zY3JvbGwuYm90XG4gICAgICAgICAgICBAYWRkRGl2IGxpbmVNZXRhXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGV2ZW50LnRhcmdldC5tZXRhP1syXS5jbGljaz9cbiAgICAgICAgICAgIHJlc3VsdCA9IGV2ZW50LnRhcmdldC5tZXRhP1syXS5jbGljayBldmVudC50YXJnZXQubWV0YSwgZXZlbnRcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCBpZiByZXN1bHQgIT0gJ3VuaGFuZGxlZCdcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYXBwZW5kOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFtAZWRpdG9yLm51bUxpbmVzKCksIFswLCAwXSwgbWV0YV1cbiAgICAgICAgbGluZU1ldGFcblxuICAgIGFkZExpbmVNZXRhOiAobGluZU1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yICdpbnZhbGlkIGxpbmUgbWV0YT8nLCBsaW5lTWV0YSBpZiBub3QgbGluZU1ldGE/WzJdP1xuICAgICAgICBcbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gPz0gW11cbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0ucHVzaCBsaW5lTWV0YVxuICAgICAgICBAbWV0YXMucHVzaCBsaW5lTWV0YVxuICAgICAgICBsaW5lTWV0YVxuXG4gICAgbW92ZUxpbmVNZXRhOiAobGluZU1ldGEsIGQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnaW52YWxpZCBtb3ZlPycsIGxpbmVNZXRhLCBkIGlmIG5vdCBsaW5lTWV0YT8gb3IgZCA9PSAwXG4gICAgICAgIFxuICAgICAgICBfLnB1bGwgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0sIGxpbmVNZXRhXG4gICAgICAgIGRlbGV0ZSBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSBpZiBlbXB0eSBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXVxuICAgICAgICBsaW5lTWV0YVswXSArPSBkXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dID89IFtdXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dLnB1c2ggbGluZU1ldGFcbiAgICAgICAgQHVwZGF0ZVBvcyBsaW5lTWV0YVxuICAgICAgICBcbiAgICBvbkxpbmVBcHBlbmRlZDogKGUpID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggZS5saW5lSW5kZXhcbiAgICAgICAgICAgIG1ldGFbMV1bMV0gPSBlLnRleHQubGVuZ3RoIGlmIG1ldGFbMV1bMV0gaXMgMFxuXG4gICAgbWV0YXNBdExpbmVJbmRleDogKGxpKSAtPiBAbGluZU1ldGFzW2xpXSA/IFtdXG4gICAgICAgIFxuICAgIGhyZWZBdExpbmVJbmRleDogIChsaSkgLT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgcmV0dXJuIG1ldGFbMl0uaHJlZiBpZiBtZXRhWzJdLmhyZWY/XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAgICAwMDBcblxuICAgIG9uTGluZXNTaG93bjogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuICAgICAgICAgICAgaWYgdG9wIDw9IG1ldGFbMF0gPD0gYm90XG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uTGluZXNTaGlmdGVkOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyB0b3AtbnVtLCB0b3AtMSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGRlbERpdiBtZXRhXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGJvdC1udW0rMSwgYm90LCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBib3QrMSwgYm90LW51bSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGRlbERpdiBtZXRhXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIHRvcCwgdG9wLW51bS0xLCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggdG9wXG5cbiAgICB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3Iuc2Nyb2xsLmJvdCwgQG1ldGFzXG4gICAgICAgICAgICBAdXBkYXRlUG9zIG1ldGFcblxuICAgIG9uTGluZUluc2VydGVkOiAobGkpID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3IubnVtTGluZXMoKSwgQG1ldGFzXG4gICAgICAgICAgICBAbW92ZUxpbmVNZXRhIG1ldGEsIDFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggbGlcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvbkxpbmVEZWxldGVkOiAobGkpID0+XG5cbiAgICAgICAgd2hpbGUgbWV0YSA9IF8ubGFzdCBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgQGRlbE1ldGEgbWV0YVxuXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLm51bUxpbmVzKCksIEBtZXRhc1xuICAgICAgICAgICAgQG1vdmVMaW5lTWV0YSBtZXRhLCAtMVxuXG4gICAgICAgIEB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleCBsaVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkNsZWFyTGluZXM6ID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzXG4gICAgICAgICAgICBAZGVsRGl2IG1ldGFcbiAgICAgICAgQG1ldGFzICAgICA9IFtdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG5cbiAgICBjbGVhcjogPT5cblxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIEBtZXRhcyA9IFtdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fVxuXG4gICAgZGVsTWV0YTogKG1ldGEpIC0+XG4gICAgICAgIGlmIG5vdCBtZXRhP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnZGVsIG5vIG1ldGE/J1xuICAgICAgICBfLnB1bGwgQGxpbmVNZXRhc1ttZXRhWzBdXSwgbWV0YVxuICAgICAgICBfLnB1bGwgQG1ldGFzLCBtZXRhXG4gICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgZGVsQ2xhc3M6IChjbHNzKSAtPlxuXG4gICAgICAgIGZvciBtZXRhIGluIF8uY2xvbmUgQG1ldGFzXG4gICAgICAgICAgICBjbHNzcyA9IG1ldGE/WzJdPy5jbHNzPy5zcGxpdCAnICdcbiAgICAgICAgICAgIGlmIG5vdCBlbXB0eShjbHNzcykgYW5kIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgICAgICBAZGVsTWV0YSBtZXRhXG5cbm1vZHVsZS5leHBvcnRzID0gTWV0YVxuIl19
//# sourceURL=../../coffee/editor/meta.coffee