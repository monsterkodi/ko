// koffee 1.14.0

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
            saveIndex: this.saveIndex,
            history: this.history,
            redos: this.redos,
            state: this.state,
            file: this.editor.currentFile
        };
    };

    Do.prototype.setTabState = function(state) {
        this.editor.restoreFromTabState(state);
        this.groupCount = 0;
        this.saveIndex = state.saveIndex;
        this.history = state.history;
        this.redos = state.redos;
        return this.state = state.state;
    };

    Do.prototype.reset = function() {
        this.groupCount = 0;
        this.saveIndex = 0;
        this.history = [];
        this.redos = [];
        return this.state = null;
    };

    Do.prototype.hasChanges = function() {
        var ref1;
        if (this.history.length > this.saveIndex && ((ref1 = this.history[this.saveIndex]) != null ? ref1.text() : void 0) === this.editor.text()) {
            return false;
        }
        return true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG8uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2VkaXRvciIsInNvdXJjZXMiOlsiZG8uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1EQUFBO0lBQUE7O0FBUUEsTUFBMEMsT0FBQSxDQUFRLEtBQVIsQ0FBMUMsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUM7O0FBRWpDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7QUFDUixPQUFBLENBQVEsaUJBQVI7O0FBRU07SUFFQyxZQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxpQkFBUixFQUEwQixJQUFDLENBQUEsaUJBQTNCO0lBSkQ7O2lCQU1ILEdBQUEsR0FBSyxTQUFBO2VBQUcsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsaUJBQXBCLEVBQXNDLElBQUMsQ0FBQSxpQkFBdkM7SUFBSDs7aUJBRUwsaUJBQUEsR0FBbUIsU0FBQyxJQUFELEVBQU8sV0FBUDtRQUNmLElBQUcsSUFBQSxLQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBbkI7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsRUFESjs7SUFEZTs7aUJBSW5CLGNBQUEsR0FBZ0IsU0FBQyxXQUFEO0FBQ1osWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7QUFDQSxhQUFBLDZDQUFBOztZQUNJLElBQUcsTUFBTSxDQUFDLE1BQVAsS0FBaUIsU0FBakIsSUFBbUMsc0JBQXRDO2dCQUNJLE1BQUEsQ0FBTyxpQ0FBQSxHQUFrQyxNQUF6QztBQUNBLHlCQUZKOztBQUdBLG9CQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEscUJBQ1MsU0FEVDtvQkFDeUIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxNQUFNLENBQUMsT0FBZixFQUF3QixN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LENBQUQsRUFBSSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQU4sQ0FBUSxDQUFDLE1BQWIsQ0FBSjtJQUFQOzs7Ozs7QUFFekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAgIDAwMDAwMDBcbiMjI1xuXG57IF8sIGNsYW1wLCBlbXB0eSwga2Vycm9yLCBsYXN0LCBwb3N0IH0gPSByZXF1aXJlICdreGsnXG5cblN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZSdcbnJlcXVpcmUgJy4uL3Rvb2xzL3JhbmdlcydcblxuY2xhc3MgRG8gXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAcmVzZXQoKVxuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVMaW5lQ2hhbmdlcycgQG9uRmlsZUxpbmVDaGFuZ2VzXG5cbiAgICBkZWw6IC0+IHBvc3QucmVtb3ZlTGlzdGVuZXIgJ2ZpbGVMaW5lQ2hhbmdlcycgQG9uRmlsZUxpbmVDaGFuZ2VzXG5cbiAgICBvbkZpbGVMaW5lQ2hhbmdlczogKGZpbGUsIGxpbmVDaGFuZ2VzKSA9PlxuICAgICAgICBpZiBmaWxlID09IEBlZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIEBmb3JlaWduQ2hhbmdlcyBsaW5lQ2hhbmdlc1xuXG4gICAgZm9yZWlnbkNoYW5nZXM6IChsaW5lQ2hhbmdlcykgLT5cbiAgICAgICAgQHN0YXJ0KClcbiAgICAgICAgZm9yIGNoYW5nZSBpbiBsaW5lQ2hhbmdlc1xuICAgICAgICAgICAgaWYgY2hhbmdlLmNoYW5nZSAhPSAnZGVsZXRlZCcgYW5kIG5vdCBjaGFuZ2UuYWZ0ZXI/XG4gICAgICAgICAgICAgICAga2Vycm9yIFwiRG8uZm9yZWlnbkNoYW5nZXMgLS0gbm8gYWZ0ZXI/ICN7Y2hhbmdlfVwiXG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN3aXRjaCBjaGFuZ2UuY2hhbmdlXG4gICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCcgIHRoZW4gQGNoYW5nZSBjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLmFmdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnIHRoZW4gQGluc2VydCBjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLmFmdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCcgIHRoZW4gQGRlbGV0ZSBjaGFuZ2UuZG9JbmRleFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAga2Vycm9yIFwiRG8uZm9yZWlnbkNoYW5nZXMgLS0gdW5rbm93biBjaGFuZ2UgI3tjaGFuZ2UuY2hhbmdlfVwiXG4gICAgICAgIEBlbmQgZm9yZWlnbjogdHJ1ZVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHRhYlN0YXRlOiAtPlxuXG4gICAgICAgIHNhdmVJbmRleDogQHNhdmVJbmRleFxuICAgICAgICBoaXN0b3J5OiAgIEBoaXN0b3J5XG4gICAgICAgIHJlZG9zOiAgICAgQHJlZG9zXG4gICAgICAgIHN0YXRlOiAgICAgQHN0YXRlXG4gICAgICAgIGZpbGU6ICAgICAgQGVkaXRvci5jdXJyZW50RmlsZVxuXG4gICAgc2V0VGFiU3RhdGU6IChzdGF0ZSkgLT5cblxuICAgICAgICBAZWRpdG9yLnJlc3RvcmVGcm9tVGFiU3RhdGUgc3RhdGVcblxuICAgICAgICBAZ3JvdXBDb3VudCA9IDBcbiAgICAgICAgQHNhdmVJbmRleCAgPSBzdGF0ZS5zYXZlSW5kZXhcbiAgICAgICAgQGhpc3RvcnkgICAgPSBzdGF0ZS5oaXN0b3J5XG4gICAgICAgIEByZWRvcyAgICAgID0gc3RhdGUucmVkb3NcbiAgICAgICAgQHN0YXRlICAgICAgPSBzdGF0ZS5zdGF0ZVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIHJlc2V0OiAtPlxuXG4gICAgICAgIEBncm91cENvdW50ID0gMFxuICAgICAgICBAc2F2ZUluZGV4ICA9IDBcbiAgICAgICAgQGhpc3RvcnkgICAgPSBbXVxuICAgICAgICBAcmVkb3MgICAgICA9IFtdXG4gICAgICAgIEBzdGF0ZSAgICAgID0gbnVsbFxuXG4gICAgaGFzQ2hhbmdlczogLT5cblxuICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGggPiBAc2F2ZUluZGV4IGFuZCBAaGlzdG9yeVtAc2F2ZUluZGV4XT8udGV4dCgpID09IEBlZGl0b3IudGV4dCgpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc3RhcnQ6IC0+XG5cbiAgICAgICAgQGdyb3VwQ291bnQgKz0gMVxuICAgICAgICBpZiBAZ3JvdXBDb3VudCA9PSAxXG4gICAgICAgICAgICBAc3RhcnRTdGF0ZSA9IEBzdGF0ZSA9IG5ldyBTdGF0ZSBAZWRpdG9yLnN0YXRlLnNcbiAgICAgICAgICAgIGlmIGVtcHR5KEBoaXN0b3J5KSBvciBAc3RhdGUucyAhPSBsYXN0KEBoaXN0b3J5KS5zXG4gICAgICAgICAgICAgICAgQGhpc3RvcnkucHVzaCBAc3RhdGVcblxuICAgIGlzRG9pbmc6IC0+IEBncm91cENvdW50ID4gMFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMCAgICAgIDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuXG4gICAgY2hhbmdlOiAoaW5kZXgsIHRleHQpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5jaGFuZ2VMaW5lIGluZGV4LCB0ZXh0XG4gICAgaW5zZXJ0OiAoaW5kZXgsIHRleHQpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5pbnNlcnRMaW5lIGluZGV4LCB0ZXh0XG4gICAgZGVsZXRlOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIEBudW1MaW5lcygpID49IDEgYW5kIDAgPD0gaW5kZXggPCBAbnVtTGluZXMoKVxuICAgICAgICAgICAgQGVkaXRvci5lbWl0ICd3aWxsRGVsZXRlTGluZScgQGxpbmUgaW5kZXhcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5kZWxldGVMaW5lIGluZGV4XG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGVuZDogKG9wdCkgLT5cblxuICAgICAgICAjICEhISBOTyBsb2cgSEVSRSAhISFcblxuICAgICAgICBAcmVkb3MgPSBbXVxuICAgICAgICBAZ3JvdXBDb3VudCAtPSAxXG4gICAgICAgIGlmIEBncm91cENvdW50ID09IDBcbiAgICAgICAgICAgIEBtZXJnZSgpXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQHN0YXJ0U3RhdGUsIEBzdGF0ZVxuICAgICAgICAgICAgY2hhbmdlcy5mb3JlaWduID0gb3B0Py5mb3JlaWduXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuXG4gICAgdW5kbzogLT5cblxuICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGhcblxuICAgICAgICAgICAgaWYgXy5pc0VtcHR5IEByZWRvc1xuICAgICAgICAgICAgICAgIEByZWRvcy51bnNoaWZ0IEBlZGl0b3Iuc3RhdGVcblxuICAgICAgICAgICAgQHN0YXRlID0gQGhpc3RvcnkucG9wKClcbiAgICAgICAgICAgIEByZWRvcy51bnNoaWZ0IEBzdGF0ZVxuXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQGVkaXRvci5zdGF0ZSwgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ3VuZG9uZSdcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuXG4gICAgcmVkbzogLT5cblxuICAgICAgICBpZiBAcmVkb3MubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIEByZWRvcy5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgQGhpc3RvcnkucHVzaCBAcmVkb3Muc2hpZnQoKVxuXG4gICAgICAgICAgICBAc3RhdGUgPSBfLmZpcnN0IEByZWRvc1xuICAgICAgICAgICAgaWYgQHJlZG9zLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgQHJlZG9zID0gW11cblxuICAgICAgICAgICAgY2hhbmdlcyA9IEBjYWxjdWxhdGVDaGFuZ2VzIEBlZGl0b3Iuc3RhdGUsIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5zZXRTdGF0ZSBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3IuY2hhbmdlZD8gY2hhbmdlc1xuICAgICAgICAgICAgQGVkaXRvci5lbWl0ICdyZWRvbmUnXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIHNlbGVjdDogKG5ld1NlbGVjdGlvbnMpIC0+XG5cbiAgICAgICAgaWYgbmV3U2VsZWN0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBjbGVhblJhbmdlcyBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBuZXdTZWxlY3Rpb25zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRTZWxlY3Rpb25zIFtdXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgc2V0Q3Vyc29yczogKG5ld0N1cnNvcnMsIG9wdCkgLT5cblxuICAgICAgICAjIGtsb2cgJ2RvLnNldEN1cnNvcnMnIG5ld0N1cnNvcnNcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBuZXdDdXJzb3JzPyBvciBuZXdDdXJzb3JzLmxlbmd0aCA8IDFcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJEby5zZXRDdXJzb3JzIC0tIGVtcHR5IGN1cnNvcnM/XCJcblxuICAgICAgICBpZiBvcHQ/Lm1haW5cbiAgICAgICAgICAgIHN3aXRjaCBvcHQubWFpblxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpcnN0JyB0aGVuIG1haW5JbmRleCA9IDBcbiAgICAgICAgICAgICAgICB3aGVuICdsYXN0JyAgdGhlbiBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgd2hlbiAnY2xvc2VzdCdcbiAgICAgICAgICAgICAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBvc0Nsb3Nlc3RUb1Bvc0luUG9zaXRpb25zIEBlZGl0b3IubWFpbkN1cnNvcigpLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmluZGV4T2Ygb3B0Lm1haW5cbiAgICAgICAgICAgICAgICAgICAgbWFpbkluZGV4ID0gcGFyc2VJbnQgb3B0Lm1haW4gaWYgbWFpbkluZGV4IDwgMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmxlbmd0aC0xXG5cbiAgICAgICAgbWFpbkN1cnNvciA9IG5ld0N1cnNvcnNbbWFpbkluZGV4XVxuICAgICAgICBAY2xlYW5DdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBvc0Nsb3Nlc3RUb1Bvc0luUG9zaXRpb25zIG1haW5DdXJzb3IsIG5ld0N1cnNvcnNcblxuICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRNYWluIG1haW5JbmRleFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdzZXRDdXJzb3JzJyBAZWRpdG9yLm1haW5DdXJzb3IoKVsxXSBpZiBAZWRpdG9yLm5hbWUgPT0gJ2VkaXRvcidcbiAgICAgICAgIyBAc3RhdGVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjYWxjdWxhdGVDaGFuZ2VzOiAob2xkU3RhdGUsIG5ld1N0YXRlKSAtPlxuXG4gICAgICAgIG9pID0gMCAjIGluZGV4IGluIG9sZFN0YXRlXG4gICAgICAgIG5pID0gMCAjIGluZGV4IGluIG5ld1N0YXRlXG4gICAgICAgIGRkID0gMCAjIGRlbHRhIGZvciBkb0luZGV4XG4gICAgICAgIGNoYW5nZXMgPSBbXVxuXG4gICAgICAgIG9sZExpbmVzID0gb2xkU3RhdGUucy5saW5lcyAjIHdlIGFyZSB3b3JraW5nIG9uIHJhd1xuICAgICAgICBuZXdMaW5lcyA9IG5ld1N0YXRlLnMubGluZXMgIyBpbW11dGFibGVzIGhlcmUhXG5cbiAgICAgICAgaW5zZXJ0aW9ucyA9IDAgIyBudW1iZXIgb2YgaW5zZXJ0aW9uc1xuICAgICAgICBkZWxldGlvbnMgID0gMCAjIG51bWJlciBvZiBkZWxldGlvbnNcblxuICAgICAgICBpZiBvbGRMaW5lcyAhPSBuZXdMaW5lc1xuXG4gICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgd2hpbGUgb2kgPCBvbGRMaW5lcy5sZW5ndGhcblxuICAgICAgICAgICAgICAgIGlmIG5vdCBubD8gIyBuZXcgc3RhdGUgaGFzIG5vdCBlbm91Z2ggbGluZXMsIG1hcmsgcmVtYWluaW5nIGxpbmVzIGluIG9sZFN0YXRlIGFzIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRpb25zICs9IDFcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2RlbGV0ZWQnIG9sZEluZGV4OiBvaSwgZG9JbmRleDogb2krZGRcbiAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICBkZCAtPSAxXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9sID09IG5sICMgc2FtZSBsaW5lcyBpbiBvbGQgYW5kIG5ld1xuICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cbiAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgICAgIGVsc2VcblxuICAgICAgICAgICAgICAgICAgICBpZiBubCA9PSBvbGRMaW5lc1tvaSsxXSBhbmQgb2wgPT0gbmV3TGluZXNbbmkrMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2NoYW5nZWQnIG9sZEluZGV4OiBvaSwgbmV3SW5kZXg6IG5pLCBkb0luZGV4OiBvaStkZCwgYWZ0ZXI6IG5sXG4gICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnY2hhbmdlZCcgb2xkSW5kZXg6IG9pLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogb2xcbiAgICAgICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgbmwgPT0gb2xkTGluZXNbb2krMV0gYW5kIG9sZExpbmVzW29pKzFdICE9IG5ld0xpbmVzW25pKzFdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdkZWxldGVkJyBvbGRJbmRleDogb2ksIGRvSW5kZXg6IG9pK2RkXG4gICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBkZCAtPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG9sID09IG5ld0xpbmVzW25pKzFdIGFuZCBvbGRMaW5lc1tvaSsxXSAhPSBuZXdMaW5lc1tuaSsxXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnaW5zZXJ0ZWQnIG5ld0luZGV4OiBuaSwgZG9JbmRleDogb2krZGQsIGFmdGVyOiBubFxuICAgICAgICAgICAgICAgICAgICAgICAgbmkgKz0gMSBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRkICs9IDEgXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRpb25zICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSAjIGNoYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnY2hhbmdlZCcgb2xkSW5kZXg6IG9pLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogbmxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGlsZSBuaSA8IG5ld0xpbmVzLmxlbmd0aCAjIG1hcmsgcmVtYWluaW5nIGxpbmVzIGluIG5ld1N0YXRlIGFzIGluc2VydGVkXG5cbiAgICAgICAgICAgICAgICBpbnNlcnRpb25zICs9IDFcbiAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnaW5zZXJ0ZWQnIG5ld0luZGV4OiBuaSwgZG9JbmRleDogbmksIGFmdGVyOiBubFxuICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuXG4gICAgICAgIGNoYW5nZXM6IGNoYW5nZXNcbiAgICAgICAgaW5zZXJ0czogaW5zZXJ0aW9uc1xuICAgICAgICBkZWxldGVzOiBkZWxldGlvbnNcbiAgICAgICAgY3Vyc29yczogb2xkU3RhdGUucy5jdXJzb3JzICAgICE9IG5ld1N0YXRlLnMuY3Vyc29yc1xuICAgICAgICBzZWxlY3RzOiBvbGRTdGF0ZS5zLnNlbGVjdGlvbnMgIT0gbmV3U3RhdGUucy5zZWxlY3Rpb25zXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgIyBsb29rcyBhdCBsYXN0IHR3byBhY3Rpb25zIGFuZCBtZXJnZXMgdGhlbVxuICAgICMgICAgICAgd2hlbiB0aGV5IGNvbnRhaW4gbm8gbGluZSBjaGFuZ2VzXG4gICAgIyAgICAgICB3aGVuIHRoZXkgY29udGFpbiBvbmx5IGNoYW5nZXMgb2YgdGhlIHNhbWUgc2V0IG9mIGxpbmVzXG5cbiAgICBtZXJnZTogLT5cblxuICAgICAgICB3aGlsZSBAaGlzdG9yeS5sZW5ndGggPiAxXG4gICAgICAgICAgICBiID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoLTJdXG4gICAgICAgICAgICBhID0gbGFzdCBAaGlzdG9yeVxuICAgICAgICAgICAgaWYgYS5zLmxpbmVzID09IGIucy5saW5lc1xuICAgICAgICAgICAgICAgIGlmIEBoaXN0b3J5Lmxlbmd0aCA+IDJcbiAgICAgICAgICAgICAgICAgICAgQGhpc3Rvcnkuc3BsaWNlIEBoaXN0b3J5Lmxlbmd0aC0yLCAxXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgaWYgQGhpc3RvcnkubGVuZ3RoID4gMlxuICAgICAgICAgICAgICAgIGMgPSBAaGlzdG9yeVtAaGlzdG9yeS5sZW5ndGgtM11cbiAgICAgICAgICAgICAgICBpZiBhLm51bUxpbmVzKCkgPT0gYi5udW1MaW5lcygpID09IGMubnVtTGluZXMoKVxuICAgICAgICAgICAgICAgICAgICBmb3IgbGkgaW4gWzAuLi5hLm51bUxpbmVzKCldXG4gICAgICAgICAgICAgICAgICAgICAgICBsYSA9IGEucy5saW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxiID0gYi5zLmxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICAgICAgbGMgPSBjLnMubGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBsYSA9PSBsYiBhbmQgbGMgIT0gbGIgb3IgbGEgIT0gbGIgYW5kIGxjID09IGxiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIEBoaXN0b3J5LnNwbGljZSBAaGlzdG9yeS5sZW5ndGgtMiwgMVxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuXG4gICAgICAgICAgICBlbHNlIHJldHVyblxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGVhbkN1cnNvcnM6IChjcykgLT5cblxuICAgICAgICBmb3IgcCBpbiBjc1xuICAgICAgICAgICAgcFswXSA9IE1hdGgubWF4IHBbMF0sIDBcbiAgICAgICAgICAgIHBbMV0gPSBjbGFtcCAwLCBAc3RhdGUubnVtTGluZXMoKS0xLCBwWzFdXG5cbiAgICAgICAgc29ydFBvc2l0aW9ucyBjc1xuXG4gICAgICAgIGlmIGNzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGZvciBjaSBpbiBbY3MubGVuZ3RoLTEuLi4wXVxuICAgICAgICAgICAgICAgIGMgPSBjc1tjaV1cbiAgICAgICAgICAgICAgICBwID0gY3NbY2ktMV1cbiAgICAgICAgICAgICAgICBpZiBjWzFdID09IHBbMV0gYW5kIGNbMF0gPT0gcFswXVxuICAgICAgICAgICAgICAgICAgICBjcy5zcGxpY2UgY2ksIDFcbiAgICAgICAgY3NcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB0ZXh0OiAgICAgICAgICAgIC0+IEBzdGF0ZS50ZXh0KClcbiAgICBsaW5lOiAgICAgICAgKGkpIC0+IEBzdGF0ZS5saW5lIGlcbiAgICBjdXJzb3I6ICAgICAgKGkpIC0+IEBzdGF0ZS5jdXJzb3IgaVxuICAgIGhpZ2hsaWdodDogICAoaSkgLT4gQHN0YXRlLmhpZ2hsaWdodCBpXG4gICAgc2VsZWN0aW9uOiAgIChpKSAtPiBAc3RhdGUuc2VsZWN0aW9uIGlcblxuICAgIGxpbmVzOiAgICAgICAgICAgLT4gQHN0YXRlLmxpbmVzKClcbiAgICBjdXJzb3JzOiAgICAgICAgIC0+IEBzdGF0ZS5jdXJzb3JzKClcbiAgICBoaWdobGlnaHRzOiAgICAgIC0+IEBzdGF0ZS5oaWdobGlnaHRzKClcbiAgICBzZWxlY3Rpb25zOiAgICAgIC0+IEBzdGF0ZS5zZWxlY3Rpb25zKClcblxuICAgIG51bUxpbmVzOiAgICAgICAgLT4gQHN0YXRlLm51bUxpbmVzKClcbiAgICBudW1DdXJzb3JzOiAgICAgIC0+IEBzdGF0ZS5udW1DdXJzb3JzKClcbiAgICBudW1TZWxlY3Rpb25zOiAgIC0+IEBzdGF0ZS5udW1TZWxlY3Rpb25zKClcbiAgICBudW1IaWdobGlnaHRzOiAgIC0+IEBzdGF0ZS5udW1IaWdobGlnaHRzKClcblxuICAgIHRleHRJblJhbmdlOiAocikgLT4gQHN0YXRlLmxpbmUoclswXSk/LnNsaWNlIHJbMV1bMF0sIHJbMV1bMV1cbiAgICBtYWluQ3Vyc29yOiAgICAgIC0+IEBzdGF0ZS5tYWluQ3Vyc29yKClcbiAgICByYW5nZUZvckxpbmVBdEluZGV4OiAoaSkgLT4gW2ksIFswLCBAbGluZShpKS5sZW5ndGhdXVxuXG5tb2R1bGUuZXhwb3J0cyA9IERvXG4iXX0=
//# sourceURL=../../coffee/editor/do.coffee