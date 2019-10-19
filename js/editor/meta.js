// koffee 1.3.0

/*
00     00  00000000  000000000   0000000
000   000  000          000     000   000
000000000  0000000      000     000000000
000 0 000  000          000     000   000
000   000  00000000     000     000   000
 */
var $, File, Meta, _, elem, empty, fs, kerror, post, ranges, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, empty = ref.empty, elem = ref.elem, post = ref.post, slash = ref.slash, fs = ref.fs, kerror = ref.kerror, $ = ref.$, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsOEVBQUE7SUFBQTs7O0FBUUEsTUFBNEQsT0FBQSxDQUFRLEtBQVIsQ0FBNUQsRUFBRSx5QkFBRixFQUFhLGlCQUFiLEVBQW9CLGVBQXBCLEVBQTBCLGVBQTFCLEVBQWdDLGlCQUFoQyxFQUF1QyxXQUF2QyxFQUEyQyxtQkFBM0MsRUFBbUQsU0FBbkQsRUFBc0Q7O0FBRXRELE1BQUEsR0FBUyxPQUFBLENBQVEsaUJBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSOztBQUVIO0lBRVcsY0FBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7Ozs7UUFFVixJQUFDLENBQUEsS0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLE9BQUYsRUFBVyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQW5CO1FBRVAsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsU0FBWCxFQUErQixJQUFDLENBQUEsU0FBaEM7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQStCLElBQUMsQ0FBQSxjQUFoQztRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBK0IsSUFBQyxDQUFBLFlBQWhDO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUErQixJQUFDLENBQUEsY0FBaEM7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxhQUFYLEVBQStCLElBQUMsQ0FBQSxhQUFoQztRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBK0IsSUFBQyxDQUFBLFlBQWhDO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FB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QyxJQUFEO0FBRU4sWUFBQTtBQUFBO0FBQUE7YUFBQSxzQ0FBQTs7WUFDSSxLQUFBLDhFQUFzQixDQUFFLEtBQWhCLENBQXNCLEdBQXRCO1lBQ1IsSUFBRyxDQUFJLEtBQUEsQ0FBTSxLQUFOLENBQUosSUFBcUIsYUFBUSxLQUFSLEVBQUEsSUFBQSxNQUF4Qjs2QkFDSSxJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQsR0FESjthQUFBLE1BQUE7cUNBQUE7O0FBRko7O0lBRk07Ozs7OztBQU9kLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDBcbjAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgc3RvcEV2ZW50LCBlbXB0eSwgZWxlbSwgcG9zdCwgc2xhc2gsIGZzLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxucmFuZ2VzID0gcmVxdWlyZSAnLi4vdG9vbHMvcmFuZ2VzJ1xuRmlsZSAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcblxuY2xhc3MgTWV0YVxuXG4gICAgY29uc3RydWN0b3I6IChAZWRpdG9yKSAtPlxuXG4gICAgICAgIEBtZXRhcyAgICAgPSBbXSAjIFsgW2xpbmVJbmRleCwgW3N0YXJ0LCBlbmRdLCB7aHJlZjogLi4ufV0sIC4uLiBdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fSAjIHsgbGluZUluZGV4OiBbIGxpbmVNZXRhLCAuLi4gXSwgLi4uIH1cblxuICAgICAgICBAZWxlbSA9JCBcIi5tZXRhXCIsIEBlZGl0b3Iudmlld1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnLCAgICAgICAgICBAb25DaGFuZ2VkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVBcHBlbmRlZCcsICAgICBAb25MaW5lQXBwZW5kZWRcbiAgICAgICAgQGVkaXRvci5vbiAnY2xlYXJMaW5lcycsICAgICAgIEBvbkNsZWFyTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUluc2VydGVkJywgICAgIEBvbkxpbmVJbnNlcnRlZFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lRGVsZXRlZCcsICAgICAgQG9uTGluZURlbGV0ZWRcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1Nob3duJywgICAgICAgQG9uTGluZXNTaG93blxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NoaWZ0ZWQnLCAgICAgQG9uTGluZXNTaGlmdGVkXG5cbiAgICAgICAgaWYgQGVkaXRvci5udW1iZXJzP1xuICAgICAgICAgICAgQGVkaXRvci5udW1iZXJzLm9uICdudW1iZXJBZGRlZCcsICAgQG9uTnVtYmVyXG4gICAgICAgICAgICBAZWRpdG9yLm51bWJlcnMub24gJ251bWJlckNoYW5nZWQnLCBAb25OdW1iZXJcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCBAb25Nb3VzZURvd25cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkNoYW5nZWQ6IChjaGFuZ2VJbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIGxpID0gY2hhbmdlLm9sZEluZGV4XG4gICAgICAgICAgICBjb250aW51ZSBpZiBjaGFuZ2UuY2hhbmdlID09ICdkZWxldGVkJ1xuICAgICAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgICAgICBpZiBtZXRhWzJdLmNsc3MgPT0gXCJzZWFyY2hSZXN1bHRcIiBhbmQgbWV0YVsyXS5ocmVmP1xuICAgICAgICAgICAgICAgICAgICBbZmlsZSwgbGluZV0gPSBzbGFzaC5zcGxpdEZpbGVMaW5lIG1ldGFbMl0uaHJlZlxuICAgICAgICAgICAgICAgICAgICBsaW5lIC09IDFcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDaGFuZ2UgPSBfLmNsb25lRGVlcCBjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDaGFuZ2Uub2xkSW5kZXggPSBsaW5lXG4gICAgICAgICAgICAgICAgICAgIGxvY2FsQ2hhbmdlLm5ld0luZGV4ID0gbGluZVxuICAgICAgICAgICAgICAgICAgICBsb2NhbENoYW5nZS5kb0luZGV4ICA9IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDaGFuZ2UuYWZ0ZXIgICAgPSBAZWRpdG9yLmxpbmUobWV0YVswXSlcbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5lbWl0ICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJywgZmlsZSwgbG9jYWxDaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgbWV0YVsyXS5zdGF0ZSA9ICd1bnNhdmVkJ1xuICAgICAgICAgICAgICAgICAgICBpZiBtZXRhWzJdLnNwYW4/XG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b24gPSBAc2F2ZUJ1dHRvbiBsaVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IG1ldGFbMl0uc3Bhbi5pbm5lckhUTUwuc3RhcnRzV2l0aCBcIjxzcGFuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhWzJdLnNwYW4uaW5uZXJIVE1MID0gYnV0dG9uXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwXG5cbiAgICBzYXZlRmlsZUxpbmVNZXRhczogKGZpbGUsIGxpbmVNZXRhcykgLT5cblxuICAgICAgICBmcy5yZWFkRmlsZSBmaWxlLCBlbmNvZGluZzogJ3V0ZjgnLCAoZXJyLCBkYXRhKSAtPlxuICAgICAgICAgICAgaWYgZXJyPyB0aGVuIHJldHVybiBrZXJyb3IgXCJNZXRhLnNhdmVGaWxlTGluZU1ldGFzIC0tIHJlYWRGaWxlIGVycjoje2Vycn1cIlxuICAgICAgICAgICAgbGluZXMgPSBkYXRhLnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgZm9yIGxpbmVNZXRhIGluIGxpbmVNZXRhc1xuICAgICAgICAgICAgICAgIGxpbmVzW2xpbmVNZXRhWzBdXSA9IGxpbmVNZXRhWzFdXG4gICAgICAgICAgICBkYXRhID0gbGluZXMuam9pbiAnXFxuJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBGaWxlLnNhdmUgZmlsZSwgZGF0YSwgKGVyciwgZmlsZSkgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnI/IHRoZW4gcmV0dXJuIGtlcnJvciBcIk1ldGEuc2F2ZUZpbGVMaW5lTWV0YXMgLS0gd3JpdGVGaWxlIGVycjoje2Vycn1cIlxuICAgICAgICAgICAgICAgIGZvciBsaW5lTWV0YSBpbiBsaW5lTWV0YXNcbiAgICAgICAgICAgICAgICAgICAgbWV0YSA9IGxpbmVNZXRhWzJdXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtZXRhWzJdLnN0YXRlXG4gICAgICAgICAgICAgICAgICAgIG1ldGFbMl0uc3Bhbj8uaW5uZXJIVE1MID0gbGluZU1ldGFbMF0rMVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2VhcmNoLXNhdmVkJywgZmlsZVxuXG4gICAgc2F2ZUxpbmU6IChsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBpZiBtZXRhWzJdLnN0YXRlID09ICd1bnNhdmVkJ1xuICAgICAgICAgICAgICAgIFtmaWxlLCBsaW5lXSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUgbWV0YVsyXS5ocmVmXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZmlsZVxuICAgICAgICAgICAgZmlsZUxpbmVNZXRhcyA9IHt9XG4gICAgICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgICAgICBpZiBtZXRhWzJdLnN0YXRlID09ICd1bnNhdmVkJ1xuICAgICAgICAgICAgICAgICAgICBbbWZpbGUsIGxpbmVdID0gc2xhc2guc3BsaXRGaWxlTGluZSBtZXRhWzJdLmhyZWZcbiAgICAgICAgICAgICAgICAgICAgaWYgbWZpbGUgPT0gZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUxpbmVNZXRhc1ttZmlsZV0gPz0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVMaW5lTWV0YXNbbWZpbGVdLnB1c2ggW2xpbmUtMSwgQGVkaXRvci5saW5lKG1ldGFbMF0pLCBtZXRhXVxuICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgZmlsZSwgbGluZU1ldGFzIG9mIGZpbGVMaW5lTWV0YXNcbiAgICAgICAgICAgICAgICBAc2F2ZUZpbGVMaW5lTWV0YXMgZmlsZSwgbGluZU1ldGFzXG5cbiAgICBzYXZlQ2hhbmdlczogLT5cblxuICAgICAgICBmaWxlTGluZU1ldGFzID0ge31cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzXG4gICAgICAgICAgICBpZiBtZXRhWzJdLnN0YXRlID09ICd1bnNhdmVkJ1xuICAgICAgICAgICAgICAgIFtmaWxlLCBsaW5lXSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUgbWV0YVsyXS5ocmVmXG4gICAgICAgICAgICAgICAgZmlsZUxpbmVNZXRhc1tmaWxlXSA/PSBbXVxuICAgICAgICAgICAgICAgIGZpbGVMaW5lTWV0YXNbZmlsZV0ucHVzaCBbbGluZS0xLCBAZWRpdG9yLmxpbmUobWV0YVswXSksIG1ldGFdXG5cbiAgICAgICAgZm9yIGZpbGUsIGxpbmVNZXRhcyBvZiBmaWxlTGluZU1ldGFzXG4gICAgICAgICAgICBAc2F2ZUZpbGVMaW5lTWV0YXMgZmlsZSwgbGluZU1ldGFzXG5cbiAgICAgICAgZmlsZUxpbmVNZXRhcy5sZW5ndGhcblxuICAgIHNhdmVCdXR0b246IChsaSkgLT5cbiAgICAgICAgXCI8c3BhbiBjbGFzcz1cXFwic2F2ZUJ1dHRvblxcXCIgb25jbGljaz1cXFwid2luZG93LnRlcm1pbmFsLm1ldGEuc2F2ZUxpbmUoI3tsaX0pO1xcXCI+JiMxMjgxOTA7PC9zcGFuPlwiXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbk51bWJlcjogKGUpID0+XG5cbiAgICAgICAgbWV0YXMgPSBAbWV0YXNBdExpbmVJbmRleCBlLmxpbmVJbmRleFxuICAgICAgICBmb3IgbWV0YSBpbiBtZXRhc1xuICAgICAgICAgICAgbWV0YVsyXS5zcGFuID0gZS5udW1iZXJTcGFuXG4gICAgICAgICAgICBlLm51bWJlclNwYW4uY2xhc3NOYW1lID0gJydcbiAgICAgICAgICAgIGUubnVtYmVyU3Bhbi5wYXJlbnROb2RlLmNsYXNzTmFtZSA9ICdsaW5lbnVtYmVyJ1xuICAgICAgICAgICAgc3dpdGNoIG1ldGFbMl0uY2xzc1xuICAgICAgICAgICAgICAgIHdoZW4gJ3NlYXJjaFJlc3VsdCcsICd0ZXJtQ29tbWFuZCcsICd0ZXJtUmVzdWx0JywgJ2NvZmZlZUNvbW1hbmQnLCAnY29mZmVlUmVzdWx0JywgJ2NvbW1hbmRsaXN0SXRlbScsICdnaXRJbmZvRmlsZSdcbiAgICAgICAgICAgICAgICAgICAgbnVtID0gbWV0YVsyXS5zdGF0ZSA9PSAndW5zYXZlZCcgYW5kIEBzYXZlQnV0dG9uKG1ldGFbMF0pXG4gICAgICAgICAgICAgICAgICAgIG51bSA9IG1ldGFbMl0ubGluZT8gYW5kIG1ldGFbMl0ubGluZSBpZiBub3QgbnVtXG4gICAgICAgICAgICAgICAgICAgIG51bSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUobWV0YVsyXS5ocmVmKVsxXSBpZiBub3QgbnVtXG4gICAgICAgICAgICAgICAgICAgIG51bSA9ICc/JyBpZiBub3QgbnVtXG4gICAgICAgICAgICAgICAgICAgIGUubnVtYmVyU3Bhbi5wYXJlbnROb2RlLmNsYXNzTmFtZSA9ICdsaW5lbnVtYmVyICcgKyBtZXRhWzJdLmxpbmVDbHNzIGlmIG1ldGFbMl0ubGluZUNsc3M/XG4gICAgICAgICAgICAgICAgICAgIGUubnVtYmVyU3Bhbi5jbGFzc05hbWUgPSBtZXRhWzJdLmxpbmVDbHNzIGlmIG1ldGFbMl0ubGluZUNsc3M/XG4gICAgICAgICAgICAgICAgICAgIGUubnVtYmVyU3Bhbi5pbm5lckhUTUwgPSBudW1cbiAgICAgICAgICAgICAgICB3aGVuICdzcGFjZXInXG4gICAgICAgICAgICAgICAgICAgIGUubnVtYmVyU3Bhbi5pbm5lckhUTUwgPSAnJm5ic3A7J1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIHNldE1ldGFQb3M6IChtZXRhLCB0eCwgdHkpIC0+XG5cbiAgICAgICAgaWYgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBtZXRhWzJdLmRpdj8uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVZKCN7dHl9cHgpXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWV0YVsyXS5kaXY/LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKCN7dHh9cHgsI3t0eX1weClcIlxuXG4gICAgdXBkYXRlUG9zOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgdHggPSBzaXplLmNoYXJXaWR0aCAqICBtZXRhWzFdWzBdICsgc2l6ZS5vZmZzZXRYICsgKG1ldGFbMl0ueE9mZnNldCA/IDApXG4gICAgICAgIHR5ID0gc2l6ZS5saW5lSGVpZ2h0ICogKG1ldGFbMF0gLSBAZWRpdG9yLnNjcm9sbC50b3ApICsgKG1ldGFbMl0ueU9mZnNldCA/IDApXG4gICAgICAgIEBzZXRNZXRhUG9zIG1ldGEsIHR4LCB0eVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgICAgMFxuXG4gICAgYWRkRGl2OiAobWV0YSkgLT5cblxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIHN3ID0gc2l6ZS5jaGFyV2lkdGggKiAobWV0YVsxXVsxXS1tZXRhWzFdWzBdKVxuICAgICAgICBsaCA9IHNpemUubGluZUhlaWdodFxuXG4gICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IFwibWV0YSAje21ldGFbMl0uY2xzcyA/ICcnfVwiXG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSBtZXRhWzJdLmh0bWwgaWYgbWV0YVsyXS5odG1sP1xuXG4gICAgICAgIG1ldGFbMl0uZGl2ID0gZGl2XG4gICAgICAgIGRpdi5tZXRhID0gbWV0YVxuXG4gICAgICAgIGRpdi5jbGFzc0xpc3QuYWRkICd0b2dnbGVkJyBpZiBtZXRhWzJdLnRvZ2dsZWQgIyBnaXQgY2hhbmdlIHRvZ2dsZWRcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBtZXRhWzJdLm5vX2hcbiAgICAgICAgICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIiN7bGh9cHhcIlxuXG4gICAgICAgIGlmIG1ldGFbMl0uc3R5bGU/XG4gICAgICAgICAgICBmb3Igayx2IG9mIG1ldGFbMl0uc3R5bGVcbiAgICAgICAgICAgICAgICBkaXYuc3R5bGVba10gPSB2XG5cbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9feFxuICAgICAgICAgICAgZGl2LnN0eWxlLndpZHRoID0gXCIje3N3fXB4XCJcblxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBkaXZcblxuICAgICAgICBAdXBkYXRlUG9zIG1ldGFcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAgICAwXG5cbiAgICBkZWxEaXY6IChtZXRhKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ25vIGxpbmUgbWV0YT8nLCBtZXRhIGlmIG5vdCBtZXRhP1syXT9cbiAgICAgICAgbWV0YVsyXS5kaXY/LnJlbW92ZSgpXG4gICAgICAgIG1ldGFbMl0uZGl2ID0gbnVsbFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIGFkZDogKG1ldGEpIC0+XG5cbiAgICAgICAgbGluZU1ldGEgPSBAYWRkTGluZU1ldGEgW21ldGEubGluZSwgW21ldGEuc3RhcnQsIG1ldGEuZW5kXSwgbWV0YV1cblxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC50b3AgPD0gbWV0YS5saW5lIDw9IEBlZGl0b3Iuc2Nyb2xsLmJvdFxuICAgICAgICAgICAgQGFkZERpdiBsaW5lTWV0YVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMCAgICAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgICAgIDAwMFxuXG4gICAgYWRkRGlmZk1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIG1ldGEuZGlmZiA9IHRydWVcbiAgICAgICAgQGFkZE51bWJlck1ldGEgbWV0YVxuXG4gICAgYWRkTnVtYmVyTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgbWV0YS5ub194ID0gdHJ1ZVxuICAgICAgICBsaW5lTWV0YSA9IEBhZGRMaW5lTWV0YSBbbWV0YS5saW5lLCBbMCwgMF0sIG1ldGFdXG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwudG9wIDw9IG1ldGEubGluZSA8PSBAZWRpdG9yLnNjcm9sbC5ib3RcbiAgICAgICAgICAgIEBhZGREaXYgbGluZU1ldGFcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgZXZlbnQudGFyZ2V0Lm1ldGE/WzJdLmNsaWNrP1xuICAgICAgICAgICAgcmVzdWx0ID0gZXZlbnQudGFyZ2V0Lm1ldGE/WzJdLmNsaWNrIGV2ZW50LnRhcmdldC5tZXRhLCBldmVudFxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50IGlmIHJlc3VsdCAhPSAndW5oYW5kbGVkJ1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBhcHBlbmQ6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgbGluZU1ldGEgPSBAYWRkTGluZU1ldGEgW0BlZGl0b3IubnVtTGluZXMoKSwgWzAsIDBdLCBtZXRhXVxuICAgICAgICBsaW5lTWV0YVxuXG4gICAgYWRkTGluZU1ldGE6IChsaW5lTWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ2ludmFsaWQgbGluZSBtZXRhPycsIGxpbmVNZXRhIGlmIG5vdCBsaW5lTWV0YT9bMl0/XG4gICAgICAgIFxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSA/PSBbXVxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXS5wdXNoIGxpbmVNZXRhXG4gICAgICAgIEBtZXRhcy5wdXNoIGxpbmVNZXRhXG4gICAgICAgIGxpbmVNZXRhXG5cbiAgICBtb3ZlTGluZU1ldGE6IChsaW5lTWV0YSwgZCkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yICdpbnZhbGlkIG1vdmU/JywgbGluZU1ldGEsIGQgaWYgbm90IGxpbmVNZXRhPyBvciBkID09IDBcbiAgICAgICAgXG4gICAgICAgIF8ucHVsbCBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSwgbGluZU1ldGFcbiAgICAgICAgZGVsZXRlIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dIGlmIGVtcHR5IEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dXG4gICAgICAgIGxpbmVNZXRhWzBdICs9IGRcbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gPz0gW11cbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0ucHVzaCBsaW5lTWV0YVxuICAgICAgICBAdXBkYXRlUG9zIGxpbmVNZXRhXG4gICAgICAgIFxuICAgIG9uTGluZUFwcGVuZGVkOiAoZSkgPT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBlLmxpbmVJbmRleFxuICAgICAgICAgICAgbWV0YVsxXVsxXSA9IGUudGV4dC5sZW5ndGggaWYgbWV0YVsxXVsxXSBpcyAwXG5cbiAgICBtZXRhc0F0TGluZUluZGV4OiAobGkpIC0+IEBsaW5lTWV0YXNbbGldID8gW11cbiAgICAgICAgXG4gICAgaHJlZkF0TGluZUluZGV4OiAgKGxpKSAtPlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICByZXR1cm4gbWV0YVsyXS5ocmVmIGlmIG1ldGFbMl0uaHJlZj9cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuXG4gICAgb25MaW5lc1Nob3duOiAodG9wLCBib3QsIG51bSkgPT5cbiAgICAgICAgXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc1xuICAgICAgICAgICAgQGRlbERpdiBtZXRhXG4gICAgICAgICAgICBpZiB0b3AgPD0gbWV0YVswXSA8PSBib3RcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25MaW5lc1NoaWZ0ZWQ6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIHRvcC1udW0sIHRvcC0xLCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAZGVsRGl2IG1ldGFcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgYm90LW51bSsxLCBib3QsIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBhZGREaXYgbWV0YVxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGJvdCsxLCBib3QtbnVtLCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAZGVsRGl2IG1ldGFcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgdG9wLCB0b3AtbnVtLTEsIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBhZGREaXYgbWV0YVxuXG4gICAgICAgIEB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleCB0b3BcblxuICAgIHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgc2l6ZSA9IEBlZGl0b3Iuc2l6ZVxuICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgQGVkaXRvci5zY3JvbGwuYm90LCBAbWV0YXNcbiAgICAgICAgICAgIEB1cGRhdGVQb3MgbWV0YVxuXG4gICAgb25MaW5lSW5zZXJ0ZWQ6IChsaSkgPT5cblxuICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgQGVkaXRvci5udW1MaW5lcygpLCBAbWV0YXNcbiAgICAgICAgICAgIEBtb3ZlTGluZU1ldGEgbWV0YSwgMVxuXG4gICAgICAgIEB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleCBsaVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIG9uTGluZURlbGV0ZWQ6IChsaSkgPT5cblxuICAgICAgICB3aGlsZSBtZXRhID0gXy5sYXN0IEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBAZGVsTWV0YSBtZXRhXG5cbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3IubnVtTGluZXMoKSwgQG1ldGFzXG4gICAgICAgICAgICBAbW92ZUxpbmVNZXRhIG1ldGEsIC0xXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IGxpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIG9uQ2xlYXJMaW5lczogPT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG5cbiAgICBjbGVhcjogPT5cblxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIEBtZXRhcyA9IFtdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fVxuXG4gICAgZGVsTWV0YTogKG1ldGEpIC0+XG4gICAgICAgIGlmIG5vdCBtZXRhP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnZGVsIG5vIG1ldGE/J1xuICAgICAgICBfLnB1bGwgQGxpbmVNZXRhc1ttZXRhWzBdXSwgbWV0YVxuICAgICAgICBfLnB1bGwgQG1ldGFzLCBtZXRhXG4gICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgZGVsQ2xhc3M6IChjbHNzKSAtPlxuXG4gICAgICAgIGZvciBtZXRhIGluIF8uY2xvbmUgQG1ldGFzXG4gICAgICAgICAgICBjbHNzcyA9IG1ldGE/WzJdPy5jbHNzPy5zcGxpdCAnICdcbiAgICAgICAgICAgIGlmIG5vdCBlbXB0eShjbHNzcykgYW5kIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgICAgICBAZGVsTWV0YSBtZXRhXG5cbm1vZHVsZS5leHBvcnRzID0gTWV0YVxuIl19
//# sourceURL=../../coffee/editor/meta.coffee