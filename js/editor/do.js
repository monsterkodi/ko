// koffee 1.7.0

/*
0000000     0000000
000   000  000   000
000   000  000   000
000   000  000   000
0000000     0000000
 */
var Do, State, _, clamp, empty, kerror, last, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, last = ref.last, post = ref.post;

State = require('./state');

require('../tools/ranges');

Do = (function() {
    function Do(editor) {
        this.editor = editor;
        this.onFileLineChanges = bind(this.onFileLineChanges, this);
        this.reset();
        post.on('fileLineChanges', this.onFileLineChanges);
    }

    Do.prototype.del = function() {
        return post.removeListener('fileLineChanges', this.onFileLineChanges);
    };

    Do.prototype.onFileLineChanges = function(file, lineChanges) {
        if (file === this.editor.currentFile) {
            return this.foreignChanges(lineChanges);
        }
    };

    Do.prototype.foreignChanges = function(lineChanges) {
        var change, j, len;
        this.start();
        for (j = 0, len = lineChanges.length; j < len; j++) {
            change = lineChanges[j];
            if (change.change !== 'deleted' && (change.after == null)) {
                kerror("Do.foreignChanges -- no after? " + change);
                continue;
            }
            switch (change.change) {
                case 'changed':
                    this.change(change.doIndex, change.after);
                    break;
                case 'inserted':
                    this.insert(change.doIndex, change.after);
                    break;
                case 'deleted':
                    this["delete"](change.doIndex);
                    break;
                default:
                    kerror("Do.foreignChanges -- unknown change " + change.change);
            }
        }
        return this.end({
            foreign: true
        });
    };

    Do.prototype.tabState = function() {
        return {
            history: this.history,
            redos: this.redos,
            state: this.state,
            file: this.editor.currentFile
        };
    };

    Do.prototype.setTabState = function(state) {
        this.editor.restoreFromTabState(state);
        this.groupCount = 0;
        this.history = state.history;
        this.redos = state.redos;
        return this.state = state.state;
    };

    Do.prototype.reset = function() {
        this.groupCount = 0;
        this.history = [];
        this.redos = [];
        return this.state = null;
    };

    Do.prototype.hasLineChanges = function() {
        if (this.history.length === 0) {
            return false;
        }
        if (_.first(this.history).s.lines === this.editor.state.s.lines) {
            return false;
        }
        return _.first(this.history).text() !== this.editor.text();
    };

    Do.prototype.start = function() {
        this.groupCount += 1;
        if (this.groupCount === 1) {
            this.startState = this.state = new State(this.editor.state.s);
            if (empty(this.history) || this.state.s !== last(this.history).s) {
                return this.history.push(this.state);
            }
        }
    };

    Do.prototype.isDoing = function() {
        return this.groupCount > 0;
    };

    Do.prototype.change = function(index, text) {
        return this.state = this.state.changeLine(index, text);
    };

    Do.prototype.insert = function(index, text) {
        return this.state = this.state.insertLine(index, text);
    };

    Do.prototype["delete"] = function(index) {
        if (this.numLines() >= 1 && (0 <= index && index < this.numLines())) {
            this.editor.emit('willDeleteLine', this.line(index));
            return this.state = this.state.deleteLine(index);
        }
    };

    Do.prototype.end = function(opt) {
        var base, changes;
        this.redos = [];
        this.groupCount -= 1;
        if (this.groupCount === 0) {
            this.merge();
            changes = this.calculateChanges(this.startState, this.state);
            changes.foreign = opt != null ? opt.foreign : void 0;
            this.editor.setState(this.state);
            return typeof (base = this.editor).changed === "function" ? base.changed(changes) : void 0;
        }
    };

    Do.prototype.undo = function() {
        var base, changes;
        if (this.history.length) {
            if (_.isEmpty(this.redos)) {
                this.redos.unshift(this.editor.state);
            }
            this.state = this.history.pop();
            this.redos.unshift(this.state);
            changes = this.calculateChanges(this.editor.state, this.state);
            this.editor.setState(this.state);
            if (typeof (base = this.editor).changed === "function") {
                base.changed(changes);
            }
            return this.editor.emit('undone');
        }
    };

    Do.prototype.redo = function() {
        var base, changes;
        if (this.redos.length) {
            if (this.redos.length > 1) {
                this.history.push(this.redos.shift());
            }
            this.state = _.first(this.redos);
            if (this.redos.length === 1) {
                this.redos = [];
            }
            changes = this.calculateChanges(this.editor.state, this.state);
            this.editor.setState(this.state);
            if (typeof (base = this.editor).changed === "function") {
                base.changed(changes);
            }
            return this.editor.emit('redone');
        }
    };

    Do.prototype.select = function(newSelections) {
        if (newSelections.length) {
            newSelections = cleanRanges(newSelections);
            return this.state = this.state.setSelections(newSelections);
        } else {
            return this.state = this.state.setSelections([]);
        }
    };

    Do.prototype.setCursors = function(newCursors, opt) {
        var mainCursor, mainIndex;
        if ((newCursors == null) || newCursors.length < 1) {
            return kerror("Do.setCursors -- empty cursors?");
        }
        if (opt != null ? opt.main : void 0) {
            switch (opt.main) {
                case 'first':
                    mainIndex = 0;
                    break;
                case 'last':
                    mainIndex = newCursors.length - 1;
                    break;
                case 'closest':
                    mainIndex = newCursors.indexOf(posClosestToPosInPositions(this.editor.mainCursor(), newCursors));
                    break;
                default:
                    mainIndex = newCursors.indexOf(opt.main);
                    if (mainIndex < 0) {
                        mainIndex = parseInt(opt.main);
                    }
            }
        } else {
            mainIndex = newCursors.length - 1;
        }
        mainCursor = newCursors[mainIndex];
        this.cleanCursors(newCursors);
        mainIndex = newCursors.indexOf(posClosestToPosInPositions(mainCursor, newCursors));
        this.state = this.state.setCursors(newCursors);
        return this.state = this.state.setMain(mainIndex);
    };

    Do.prototype.calculateChanges = function(oldState, newState) {
        var changes, dd, deletions, insertions, newLines, ni, nl, oi, ol, oldLines;
        oi = 0;
        ni = 0;
        dd = 0;
        changes = [];
        oldLines = oldState.s.lines;
        newLines = newState.s.lines;
        insertions = 0;
        deletions = 0;
        if (oldLines !== newLines) {
            ol = oldLines[oi];
            nl = newLines[ni];
            while (oi < oldLines.length) {
                if (nl == null) {
                    deletions += 1;
                    changes.push({
                        change: 'deleted',
                        oldIndex: oi,
                        doIndex: oi + dd
                    });
                    oi += 1;
                    dd -= 1;
                } else if (ol === nl) {
                    oi += 1;
                    ni += 1;
                    ol = oldLines[oi];
                    nl = newLines[ni];
                } else {
                    if (nl === oldLines[oi + 1] && ol === newLines[ni + 1]) {
                        changes.push({
                            change: 'changed',
                            oldIndex: oi,
                            newIndex: ni,
                            doIndex: oi + dd,
                            after: nl
                        });
                        oi += 1;
                        ni += 1;
                        changes.push({
                            change: 'changed',
                            oldIndex: oi,
                            newIndex: ni,
                            doIndex: oi + dd,
                            after: ol
                        });
                        oi += 1;
                        ni += 1;
                        ol = oldLines[oi];
                        nl = newLines[ni];
                    } else if (nl === oldLines[oi + 1] && oldLines[oi + 1] !== newLines[ni + 1]) {
                        changes.push({
                            change: 'deleted',
                            oldIndex: oi,
                            doIndex: oi + dd
                        });
                        oi += 1;
                        dd -= 1;
                        deletions += 1;
                        ol = oldLines[oi];
                    } else if (ol === newLines[ni + 1] && oldLines[oi + 1] !== newLines[ni + 1]) {
                        changes.push({
                            change: 'inserted',
                            newIndex: ni,
                            doIndex: oi + dd,
                            after: nl
                        });
                        ni += 1;
                        dd += 1;
                        insertions += 1;
                        nl = newLines[ni];
                    } else {
                        changes.push({
                            change: 'changed',
                            oldIndex: oi,
                            newIndex: ni,
                            doIndex: oi + dd,
                            after: nl
                        });
                        oi += 1;
                        ol = oldLines[oi];
                        ni += 1;
                        nl = newLines[ni];
                    }
                }
            }
            while (ni < newLines.length) {
                insertions += 1;
                changes.push({
                    change: 'inserted',
                    newIndex: ni,
                    doIndex: ni,
                    after: nl
                });
                ni += 1;
                nl = newLines[ni];
            }
        }
        return {
            changes: changes,
            inserts: insertions,
            deletes: deletions,
            cursors: oldState.s.cursors !== newState.s.cursors,
            selects: oldState.s.selections !== newState.s.selections
        };
    };

    Do.prototype.merge = function() {
        var a, b, c, j, la, lb, lc, li, ref1, ref2;
        while (this.history.length > 1) {
            b = this.history[this.history.length - 2];
            a = last(this.history);
            if (a.s.lines === b.s.lines) {
                if (this.history.length > 2) {
                    this.history.splice(this.history.length - 2, 1);
                } else {
                    return;
                }
            } else if (this.history.length > 2) {
                c = this.history[this.history.length - 3];
                if ((a.numLines() === (ref1 = b.numLines()) && ref1 === c.numLines())) {
                    for (li = j = 0, ref2 = a.numLines(); 0 <= ref2 ? j < ref2 : j > ref2; li = 0 <= ref2 ? ++j : --j) {
                        la = a.s.lines[li];
                        lb = b.s.lines[li];
                        lc = c.s.lines[li];
                        if (la === lb && lc !== lb || la !== lb && lc === lb) {
                            return;
                        }
                    }
                    this.history.splice(this.history.length - 2, 1);
                } else {
                    return;
                }
            } else {
                return;
            }
        }
    };

    Do.prototype.cleanCursors = function(cs) {
        var c, ci, j, k, len, p, ref1;
        for (j = 0, len = cs.length; j < len; j++) {
            p = cs[j];
            p[0] = Math.max(p[0], 0);
            p[1] = clamp(0, this.state.numLines() - 1, p[1]);
        }
        sortPositions(cs);
        if (cs.length > 1) {
            for (ci = k = ref1 = cs.length - 1; ref1 <= 0 ? k < 0 : k > 0; ci = ref1 <= 0 ? ++k : --k) {
                c = cs[ci];
                p = cs[ci - 1];
                if (c[1] === p[1] && c[0] === p[0]) {
                    cs.splice(ci, 1);
                }
            }
        }
        return cs;
    };

    Do.prototype.text = function() {
        return this.state.text();
    };

    Do.prototype.line = function(i) {
        return this.state.line(i);
    };

    Do.prototype.cursor = function(i) {
        return this.state.cursor(i);
    };

    Do.prototype.highlight = function(i) {
        return this.state.highlight(i);
    };

    Do.prototype.selection = function(i) {
        return this.state.selection(i);
    };

    Do.prototype.lines = function() {
        return this.state.lines();
    };

    Do.prototype.cursors = function() {
        return this.state.cursors();
    };

    Do.prototype.highlights = function() {
        return this.state.highlights();
    };

    Do.prototype.selections = function() {
        return this.state.selections();
    };

    Do.prototype.numLines = function() {
        return this.state.numLines();
    };

    Do.prototype.numCursors = function() {
        return this.state.numCursors();
    };

    Do.prototype.numSelections = function() {
        return this.state.numSelections();
    };

    Do.prototype.numHighlights = function() {
        return this.state.numHighlights();
    };

    Do.prototype.textInRange = function(r) {
        var ref1;
        return (ref1 = this.state.line(r[0])) != null ? ref1.slice(r[1][0], r[1][1]) : void 0;
    };

    Do.prototype.mainCursor = function() {
        return this.state.mainCursor();
    };

    Do.prototype.rangeForLineAtIndex = function(i) {
        return [i, [0, this.line(i).length]];
    };

    return Do;

})();

module.exports = Do;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG8uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1EQUFBO0lBQUE7O0FBUUEsTUFBMEMsT0FBQSxDQUFRLEtBQVIsQ0FBMUMsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUM7O0FBRWpDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7QUFDUixPQUFBLENBQVEsaUJBQVI7O0FBRU07SUFFQyxZQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxpQkFBUixFQUEwQixJQUFDLENBQUEsaUJBQTNCO0lBSkQ7O2lCQU1ILEdBQUEsR0FBSyxTQUFBO2VBQUcsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsaUJBQXBCLEVBQXNDLElBQUMsQ0FBQSxpQkFBdkM7SUFBSDs7aUJBRUwsaUJBQUEsR0FBbUIsU0FBQyxJQUFELEVBQU8sV0FBUDtRQUNmLElBQUcsSUFBQSxLQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBbkI7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsRUFESjs7SUFEZTs7aUJBSW5CLGNBQUEsR0FBZ0IsU0FBQyxXQUFEO0FBQ1osWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7QUFDQSxhQUFBLDZDQUFBOztZQUNJLElBQUcsTUFBTSxDQUFDLE1BQVAsS0FBaUIsU0FBakIsSUFBbUMsc0JBQXRDO2dCQUNJLE1BQUEsQ0FBTyxpQ0FBQSxHQUFrQyxNQUF6QztBQUNBLHlCQUZKOztBQUdBLG9CQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEscUJBQ1MsU0FEVDtvQkFDeUIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxNQUFNLENBQUMsT0FBZixFQUF3QixNQUFNLENBQUMsS0FBL0I7QUFBaEI7QUFEVCxx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LENBQUQ7ZUFBTyxDQUFDLENBQUQsRUFBSSxDQUFDLENBQUQsRUFBSSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQU4sQ0FBUSxDQUFDLE1BQWIsQ0FBSjtJQUFQOzs7Ozs7QUFFekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAgIDAwMDAwMDBcbiMjI1xuXG57IF8sIGNsYW1wLCBlbXB0eSwga2Vycm9yLCBsYXN0LCBwb3N0IH0gPSByZXF1aXJlICdreGsnXG5cblN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZSdcbnJlcXVpcmUgJy4uL3Rvb2xzL3JhbmdlcydcblxuY2xhc3MgRG9cblxuICAgIEA6IChAZWRpdG9yKSAtPlxuXG4gICAgICAgIEByZXNldCgpXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZUxpbmVDaGFuZ2VzJyBAb25GaWxlTGluZUNoYW5nZXNcblxuICAgIGRlbDogLT4gcG9zdC5yZW1vdmVMaXN0ZW5lciAnZmlsZUxpbmVDaGFuZ2VzJyBAb25GaWxlTGluZUNoYW5nZXNcblxuICAgIG9uRmlsZUxpbmVDaGFuZ2VzOiAoZmlsZSwgbGluZUNoYW5nZXMpID0+XG4gICAgICAgIGlmIGZpbGUgPT0gQGVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgQGZvcmVpZ25DaGFuZ2VzIGxpbmVDaGFuZ2VzXG5cbiAgICBmb3JlaWduQ2hhbmdlczogKGxpbmVDaGFuZ2VzKSAtPlxuICAgICAgICBAc3RhcnQoKVxuICAgICAgICBmb3IgY2hhbmdlIGluIGxpbmVDaGFuZ2VzXG4gICAgICAgICAgICBpZiBjaGFuZ2UuY2hhbmdlICE9ICdkZWxldGVkJyBhbmQgbm90IGNoYW5nZS5hZnRlcj9cbiAgICAgICAgICAgICAgICBrZXJyb3IgXCJEby5mb3JlaWduQ2hhbmdlcyAtLSBubyBhZnRlcj8gI3tjaGFuZ2V9XCJcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3dpdGNoIGNoYW5nZS5jaGFuZ2VcbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyAgdGhlbiBAY2hhbmdlIGNoYW5nZS5kb0luZGV4LCBjaGFuZ2UuYWZ0ZXJcbiAgICAgICAgICAgICAgICB3aGVuICdpbnNlcnRlZCcgdGhlbiBAaW5zZXJ0IGNoYW5nZS5kb0luZGV4LCBjaGFuZ2UuYWZ0ZXJcbiAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJyAgdGhlbiBAZGVsZXRlIGNoYW5nZS5kb0luZGV4XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBrZXJyb3IgXCJEby5mb3JlaWduQ2hhbmdlcyAtLSB1bmtub3duIGNoYW5nZSAje2NoYW5nZS5jaGFuZ2V9XCJcbiAgICAgICAgQGVuZCBmb3JlaWduOiB0cnVlXG5cbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdGFiU3RhdGU6IC0+XG5cbiAgICAgICAgaGlzdG9yeTogQGhpc3RvcnlcbiAgICAgICAgcmVkb3M6ICAgQHJlZG9zXG4gICAgICAgIHN0YXRlOiAgIEBzdGF0ZVxuICAgICAgICBmaWxlOiAgICBAZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiAgICBzZXRUYWJTdGF0ZTogKHN0YXRlKSAtPlxuXG4gICAgICAgIEBlZGl0b3IucmVzdG9yZUZyb21UYWJTdGF0ZSBzdGF0ZVxuXG4gICAgICAgIEBncm91cENvdW50ID0gMFxuICAgICAgICBAaGlzdG9yeSA9IHN0YXRlLmhpc3RvcnlcbiAgICAgICAgQHJlZG9zICAgPSBzdGF0ZS5yZWRvc1xuICAgICAgICBAc3RhdGUgICA9IHN0YXRlLnN0YXRlXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgcmVzZXQ6IC0+XG5cbiAgICAgICAgQGdyb3VwQ291bnQgPSAwXG4gICAgICAgIEBoaXN0b3J5ID0gW11cbiAgICAgICAgQHJlZG9zICAgPSBbXVxuICAgICAgICBAc3RhdGUgICA9IG51bGxcblxuICAgIGhhc0xpbmVDaGFuZ2VzOiAtPlxuXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBAaGlzdG9yeS5sZW5ndGggPT0gMFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgXy5maXJzdChAaGlzdG9yeSkucy5saW5lcyA9PSBAZWRpdG9yLnN0YXRlLnMubGluZXNcbiAgICAgICAgXy5maXJzdChAaGlzdG9yeSkudGV4dCgpICE9IEBlZGl0b3IudGV4dCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0OiAtPlxuXG4gICAgICAgIEBncm91cENvdW50ICs9IDFcbiAgICAgICAgaWYgQGdyb3VwQ291bnQgPT0gMVxuICAgICAgICAgICAgQHN0YXJ0U3RhdGUgPSBAc3RhdGUgPSBuZXcgU3RhdGUgQGVkaXRvci5zdGF0ZS5zXG4gICAgICAgICAgICBpZiBlbXB0eShAaGlzdG9yeSkgb3IgQHN0YXRlLnMgIT0gbGFzdChAaGlzdG9yeSkuc1xuICAgICAgICAgICAgICAgIEBoaXN0b3J5LnB1c2ggQHN0YXRlXG5cbiAgICBpc0RvaW5nOiAtPiBAZ3JvdXBDb3VudCA+IDBcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAgICAgICAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcblxuICAgIGNoYW5nZTogKGluZGV4LCB0ZXh0KSAtPiBAc3RhdGUgPSBAc3RhdGUuY2hhbmdlTGluZSBpbmRleCwgdGV4dFxuICAgIGluc2VydDogKGluZGV4LCB0ZXh0KSAtPiBAc3RhdGUgPSBAc3RhdGUuaW5zZXJ0TGluZSBpbmRleCwgdGV4dFxuICAgIGRlbGV0ZTogKGluZGV4KSAtPlxuICAgICAgICBpZiBAbnVtTGluZXMoKSA+PSAxIGFuZCAwIDw9IGluZGV4IDwgQG51bUxpbmVzKClcbiAgICAgICAgICAgIEBlZGl0b3IuZW1pdCAnd2lsbERlbGV0ZUxpbmUnIEBsaW5lIGluZGV4XG4gICAgICAgICAgICBAc3RhdGUgPSBAc3RhdGUuZGVsZXRlTGluZSBpbmRleFxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBlbmQ6IChvcHQpIC0+XG5cbiAgICAgICAgIyAhISEgTk8gbG9nIEhFUkUgISEhXG5cbiAgICAgICAgQHJlZG9zID0gW11cbiAgICAgICAgQGdyb3VwQ291bnQgLT0gMVxuICAgICAgICBpZiBAZ3JvdXBDb3VudCA9PSAwXG4gICAgICAgICAgICBAbWVyZ2UoKVxuICAgICAgICAgICAgY2hhbmdlcyA9IEBjYWxjdWxhdGVDaGFuZ2VzIEBzdGFydFN0YXRlLCBAc3RhdGVcbiAgICAgICAgICAgIGNoYW5nZXMuZm9yZWlnbiA9IG9wdD8uZm9yZWlnblxuICAgICAgICAgICAgQGVkaXRvci5zZXRTdGF0ZSBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3IuY2hhbmdlZD8gY2hhbmdlc1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDBcblxuICAgIHVuZG86IC0+XG5cbiAgICAgICAgaWYgQGhpc3RvcnkubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIF8uaXNFbXB0eSBAcmVkb3NcbiAgICAgICAgICAgICAgICBAcmVkb3MudW5zaGlmdCBAZWRpdG9yLnN0YXRlXG5cbiAgICAgICAgICAgIEBzdGF0ZSA9IEBoaXN0b3J5LnBvcCgpXG4gICAgICAgICAgICBAcmVkb3MudW5zaGlmdCBAc3RhdGVcblxuICAgICAgICAgICAgY2hhbmdlcyA9IEBjYWxjdWxhdGVDaGFuZ2VzIEBlZGl0b3Iuc3RhdGUsIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5zZXRTdGF0ZSBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3IuY2hhbmdlZD8gY2hhbmdlc1xuICAgICAgICAgICAgQGVkaXRvci5lbWl0ICd1bmRvbmUnXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDBcblxuICAgIHJlZG86IC0+XG5cbiAgICAgICAgaWYgQHJlZG9zLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBAcmVkb3MubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgIEBoaXN0b3J5LnB1c2ggQHJlZG9zLnNoaWZ0KClcblxuICAgICAgICAgICAgQHN0YXRlID0gXy5maXJzdCBAcmVkb3NcbiAgICAgICAgICAgIGlmIEByZWRvcy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgIEByZWRvcyA9IFtdXG5cbiAgICAgICAgICAgIGNoYW5nZXMgPSBAY2FsY3VsYXRlQ2hhbmdlcyBAZWRpdG9yLnN0YXRlLCBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0U3RhdGUgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLmNoYW5nZWQ/IGNoYW5nZXNcbiAgICAgICAgICAgIEBlZGl0b3IuZW1pdCAncmVkb25lJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwXG5cbiAgICBzZWxlY3Q6IChuZXdTZWxlY3Rpb25zKSAtPlxuXG4gICAgICAgIGlmIG5ld1NlbGVjdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICBuZXdTZWxlY3Rpb25zID0gY2xlYW5SYW5nZXMgbmV3U2VsZWN0aW9uc1xuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLnNldFNlbGVjdGlvbnMgbmV3U2VsZWN0aW9uc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBbXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIHNldEN1cnNvcnM6IChuZXdDdXJzb3JzLCBvcHQpIC0+XG5cbiAgICAgICAgIyBrbG9nICdkby5zZXRDdXJzb3JzJyBuZXdDdXJzb3JzXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbmV3Q3Vyc29ycz8gb3IgbmV3Q3Vyc29ycy5sZW5ndGggPCAxXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiRG8uc2V0Q3Vyc29ycyAtLSBlbXB0eSBjdXJzb3JzP1wiXG5cbiAgICAgICAgaWYgb3B0Py5tYWluXG4gICAgICAgICAgICBzd2l0Y2ggb3B0Lm1haW5cbiAgICAgICAgICAgICAgICB3aGVuICdmaXJzdCcgdGhlbiBtYWluSW5kZXggPSAwXG4gICAgICAgICAgICAgICAgd2hlbiAnbGFzdCcgIHRoZW4gbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgIHdoZW4gJ2Nsb3Nlc3QnXG4gICAgICAgICAgICAgICAgICAgIG1haW5JbmRleCA9IG5ld0N1cnNvcnMuaW5kZXhPZiBwb3NDbG9zZXN0VG9Qb3NJblBvc2l0aW9ucyBAZWRpdG9yLm1haW5DdXJzb3IoKSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5pbmRleE9mIG9wdC5tYWluXG4gICAgICAgICAgICAgICAgICAgIG1haW5JbmRleCA9IHBhcnNlSW50IG9wdC5tYWluIGlmIG1haW5JbmRleCA8IDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5sZW5ndGgtMVxuXG4gICAgICAgIG1haW5DdXJzb3IgPSBuZXdDdXJzb3JzW21haW5JbmRleF1cbiAgICAgICAgQGNsZWFuQ3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIG1haW5JbmRleCA9IG5ld0N1cnNvcnMuaW5kZXhPZiBwb3NDbG9zZXN0VG9Qb3NJblBvc2l0aW9ucyBtYWluQ3Vyc29yLCBuZXdDdXJzb3JzXG5cbiAgICAgICAgQHN0YXRlID0gQHN0YXRlLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0TWFpbiBtYWluSW5kZXhcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnc2V0Q3Vyc29ycycgQGVkaXRvci5tYWluQ3Vyc29yKClbMV0gaWYgQGVkaXRvci5uYW1lID09ICdlZGl0b3InXG4gICAgICAgICMgQHN0YXRlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgY2FsY3VsYXRlQ2hhbmdlczogKG9sZFN0YXRlLCBuZXdTdGF0ZSkgLT5cblxuICAgICAgICBvaSA9IDAgIyBpbmRleCBpbiBvbGRTdGF0ZVxuICAgICAgICBuaSA9IDAgIyBpbmRleCBpbiBuZXdTdGF0ZVxuICAgICAgICBkZCA9IDAgIyBkZWx0YSBmb3IgZG9JbmRleFxuICAgICAgICBjaGFuZ2VzID0gW11cblxuICAgICAgICBvbGRMaW5lcyA9IG9sZFN0YXRlLnMubGluZXMgIyB3ZSBhcmUgd29ya2luZyBvbiByYXdcbiAgICAgICAgbmV3TGluZXMgPSBuZXdTdGF0ZS5zLmxpbmVzICMgaW1tdXRhYmxlcyBoZXJlIVxuXG4gICAgICAgIGluc2VydGlvbnMgPSAwICMgbnVtYmVyIG9mIGluc2VydGlvbnNcbiAgICAgICAgZGVsZXRpb25zICA9IDAgIyBudW1iZXIgb2YgZGVsZXRpb25zXG5cbiAgICAgICAgaWYgb2xkTGluZXMgIT0gbmV3TGluZXNcblxuICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cbiAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgICAgIHdoaWxlIG9pIDwgb2xkTGluZXMubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICBpZiBub3Qgbmw/ICMgbmV3IHN0YXRlIGhhcyBub3QgZW5vdWdoIGxpbmVzLCBtYXJrIHJlbWFpbmluZyBsaW5lcyBpbiBvbGRTdGF0ZSBhcyBkZWxldGVkXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0aW9ucyArPSAxXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdkZWxldGVkJyBvbGRJbmRleDogb2ksIGRvSW5kZXg6IG9pK2RkXG4gICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgZGQgLT0gMVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBvbCA9PSBubCAjIHNhbWUgbGluZXMgaW4gb2xkIGFuZCBuZXdcbiAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgbmwgPT0gb2xkTGluZXNbb2krMV0gYW5kIG9sID09IG5ld0xpbmVzW25pKzFdXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdjaGFuZ2VkJyBvbGRJbmRleDogb2ksIG5ld0luZGV4OiBuaSwgZG9JbmRleDogb2krZGQsIGFmdGVyOiBubFxuICAgICAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2NoYW5nZWQnIG9sZEluZGV4OiBvaSwgbmV3SW5kZXg6IG5pLCBkb0luZGV4OiBvaStkZCwgYWZ0ZXI6IG9sXG4gICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG5sID09IG9sZExpbmVzW29pKzFdIGFuZCBvbGRMaW5lc1tvaSsxXSAhPSBuZXdMaW5lc1tuaSsxXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnZGVsZXRlZCcgb2xkSW5kZXg6IG9pLCBkb0luZGV4OiBvaStkZFxuICAgICAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgZGQgLT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRpb25zICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBvbCA9PSBuZXdMaW5lc1tuaSsxXSBhbmQgb2xkTGluZXNbb2krMV0gIT0gbmV3TGluZXNbbmkrMV1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2luc2VydGVkJyBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogbmxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pICs9IDEgXG4gICAgICAgICAgICAgICAgICAgICAgICBkZCArPSAxIFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0aW9ucyArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgIyBjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2NoYW5nZWQnIG9sZEluZGV4OiBvaSwgbmV3SW5kZXg6IG5pLCBkb0luZGV4OiBvaStkZCwgYWZ0ZXI6IG5sXG4gICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hpbGUgbmkgPCBuZXdMaW5lcy5sZW5ndGggIyBtYXJrIHJlbWFpbmluZyBsaW5lcyBpbiBuZXdTdGF0ZSBhcyBpbnNlcnRlZFxuXG4gICAgICAgICAgICAgICAgaW5zZXJ0aW9ucyArPSAxXG4gICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2luc2VydGVkJyBuZXdJbmRleDogbmksIGRvSW5kZXg6IG5pLCBhZnRlcjogbmxcbiAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICBjaGFuZ2VzOiBjaGFuZ2VzXG4gICAgICAgIGluc2VydHM6IGluc2VydGlvbnNcbiAgICAgICAgZGVsZXRlczogZGVsZXRpb25zXG4gICAgICAgIGN1cnNvcnM6IG9sZFN0YXRlLnMuY3Vyc29ycyAgICAhPSBuZXdTdGF0ZS5zLmN1cnNvcnNcbiAgICAgICAgc2VsZWN0czogb2xkU3RhdGUucy5zZWxlY3Rpb25zICE9IG5ld1N0YXRlLnMuc2VsZWN0aW9uc1xuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgICMgbG9va3MgYXQgbGFzdCB0d28gYWN0aW9ucyBhbmQgbWVyZ2VzIHRoZW1cbiAgICAjICAgICAgIHdoZW4gdGhleSBjb250YWluIG5vIGxpbmUgY2hhbmdlc1xuICAgICMgICAgICAgd2hlbiB0aGV5IGNvbnRhaW4gb25seSBjaGFuZ2VzIG9mIHRoZSBzYW1lIHNldCBvZiBsaW5lc1xuXG4gICAgbWVyZ2U6IC0+XG5cbiAgICAgICAgd2hpbGUgQGhpc3RvcnkubGVuZ3RoID4gMVxuICAgICAgICAgICAgYiA9IEBoaXN0b3J5W0BoaXN0b3J5Lmxlbmd0aC0yXVxuICAgICAgICAgICAgYSA9IGxhc3QgQGhpc3RvcnlcbiAgICAgICAgICAgIGlmIGEucy5saW5lcyA9PSBiLnMubGluZXNcbiAgICAgICAgICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGggPiAyXG4gICAgICAgICAgICAgICAgICAgIEBoaXN0b3J5LnNwbGljZSBAaGlzdG9yeS5sZW5ndGgtMiwgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBlbHNlIGlmIEBoaXN0b3J5Lmxlbmd0aCA+IDJcbiAgICAgICAgICAgICAgICBjID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoLTNdXG4gICAgICAgICAgICAgICAgaWYgYS5udW1MaW5lcygpID09IGIubnVtTGluZXMoKSA9PSBjLm51bUxpbmVzKClcbiAgICAgICAgICAgICAgICAgICAgZm9yIGxpIGluIFswLi4uYS5udW1MaW5lcygpXVxuICAgICAgICAgICAgICAgICAgICAgICAgbGEgPSBhLnMubGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgICAgICBsYiA9IGIucy5saW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxjID0gYy5zLmxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbGEgPT0gbGIgYW5kIGxjICE9IGxiIG9yIGxhICE9IGxiIGFuZCBsYyA9PSBsYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBAaGlzdG9yeS5zcGxpY2UgQGhpc3RvcnkubGVuZ3RoLTIsIDFcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVyblxuICAgICAgICAgICAgZWxzZSByZXR1cm5cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYW5DdXJzb3JzOiAoY3MpIC0+XG5cbiAgICAgICAgZm9yIHAgaW4gY3NcbiAgICAgICAgICAgIHBbMF0gPSBNYXRoLm1heCBwWzBdLCAwXG4gICAgICAgICAgICBwWzFdID0gY2xhbXAgMCwgQHN0YXRlLm51bUxpbmVzKCktMSwgcFsxXVxuXG4gICAgICAgIHNvcnRQb3NpdGlvbnMgY3NcblxuICAgICAgICBpZiBjcy5sZW5ndGggPiAxXG4gICAgICAgICAgICBmb3IgY2kgaW4gW2NzLmxlbmd0aC0xLi4uMF1cbiAgICAgICAgICAgICAgICBjID0gY3NbY2ldXG4gICAgICAgICAgICAgICAgcCA9IGNzW2NpLTFdXG4gICAgICAgICAgICAgICAgaWYgY1sxXSA9PSBwWzFdIGFuZCBjWzBdID09IHBbMF1cbiAgICAgICAgICAgICAgICAgICAgY3Muc3BsaWNlIGNpLCAxXG4gICAgICAgIGNzXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdGV4dDogICAgICAgICAgICAtPiBAc3RhdGUudGV4dCgpXG4gICAgbGluZTogICAgICAgIChpKSAtPiBAc3RhdGUubGluZSBpXG4gICAgY3Vyc29yOiAgICAgIChpKSAtPiBAc3RhdGUuY3Vyc29yIGlcbiAgICBoaWdobGlnaHQ6ICAgKGkpIC0+IEBzdGF0ZS5oaWdobGlnaHQgaVxuICAgIHNlbGVjdGlvbjogICAoaSkgLT4gQHN0YXRlLnNlbGVjdGlvbiBpXG5cbiAgICBsaW5lczogICAgICAgICAgIC0+IEBzdGF0ZS5saW5lcygpXG4gICAgY3Vyc29yczogICAgICAgICAtPiBAc3RhdGUuY3Vyc29ycygpXG4gICAgaGlnaGxpZ2h0czogICAgICAtPiBAc3RhdGUuaGlnaGxpZ2h0cygpXG4gICAgc2VsZWN0aW9uczogICAgICAtPiBAc3RhdGUuc2VsZWN0aW9ucygpXG5cbiAgICBudW1MaW5lczogICAgICAgIC0+IEBzdGF0ZS5udW1MaW5lcygpXG4gICAgbnVtQ3Vyc29yczogICAgICAtPiBAc3RhdGUubnVtQ3Vyc29ycygpXG4gICAgbnVtU2VsZWN0aW9uczogICAtPiBAc3RhdGUubnVtU2VsZWN0aW9ucygpXG4gICAgbnVtSGlnaGxpZ2h0czogICAtPiBAc3RhdGUubnVtSGlnaGxpZ2h0cygpXG5cbiAgICB0ZXh0SW5SYW5nZTogKHIpIC0+IEBzdGF0ZS5saW5lKHJbMF0pPy5zbGljZSByWzFdWzBdLCByWzFdWzFdXG4gICAgbWFpbkN1cnNvcjogICAgICAtPiBAc3RhdGUubWFpbkN1cnNvcigpXG4gICAgcmFuZ2VGb3JMaW5lQXRJbmRleDogKGkpIC0+IFtpLCBbMCwgQGxpbmUoaSkubGVuZ3RoXV1cblxubW9kdWxlLmV4cG9ydHMgPSBEb1xuIl19
//# sourceURL=../../coffee/editor/do.coffee