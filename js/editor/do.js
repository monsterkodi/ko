// koffee 1.11.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG8uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2VkaXRvciIsInNvdXJjZXMiOlsiZG8uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1EQUFBO0lBQUE7O0FBUUEsTUFBMEMsT0FBQSxDQUFRLEtBQVIsQ0FBMUMsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUM7O0FBRWpDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7QUFDUixPQUFBLENBQVEsaUJBQVI7O0FBRU07SUFFQyxZQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxpQkFBUixFQUEwQixJQUFDLENBQUEsaUJBQTNCO0lBSkQ7O2lCQU1ILEdBQUEsR0FBSyxTQUFBO2VBQUcsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsaUJBQXBCLEVBQXNDLElBQUMsQ0FBQSxpQkFBdkM7SUFBSDs7aUJBRUwsaUJBQUEsR0FBbUIsU0FBQyxJQUFELEVBQU8sV0FBUDtRQUNmLElBQUcsSUFBQSxLQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBbkI7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsRUFESjs7SUFEZTs7aUJBSW5CLGNBQUEsR0FBZ0IsU0FBQyxXQUFEO0FBQ1osWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7QUFDQSxhQUFBLDZDQUFBOztZQUNJLElBQUcsTUFBTSxDQUFDLE1BQVAsS0FBaUIsU0FBakIsSUFBbUMsc0JBQXRDO2dCQUNJLE1BQUEsQ0FBTyxpQ0FBQSxHQUFrQyxNQUF6QztBQUNBLHlCQUZKOztBQUdBLG9CQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEscUJBQ1MsU0FEVDtvQkFDeUIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxNQUFNLENBQUMsT0FBZixFQUF3QixN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QUg7O2lCQUNqQixtQkFBQSxHQUFxQixTQUFDLENBQUQ7ZUFBTyxDQUFDLENBQUQsRUFBSSxDQUFDLENBQUQsRUFBSSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQU4sQ0FBUSxDQUFDLE1BQWIsQ0FBSjtJQUFQOzs7Ozs7QUFFekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAgIDAwMDAwMDBcbiMjI1xuXG57IF8sIGNsYW1wLCBlbXB0eSwga2Vycm9yLCBsYXN0LCBwb3N0IH0gPSByZXF1aXJlICdreGsnXG5cblN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZSdcbnJlcXVpcmUgJy4uL3Rvb2xzL3JhbmdlcydcblxuY2xhc3MgRG8gXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAcmVzZXQoKVxuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVMaW5lQ2hhbmdlcycgQG9uRmlsZUxpbmVDaGFuZ2VzXG5cbiAgICBkZWw6IC0+IHBvc3QucmVtb3ZlTGlzdGVuZXIgJ2ZpbGVMaW5lQ2hhbmdlcycgQG9uRmlsZUxpbmVDaGFuZ2VzXG5cbiAgICBvbkZpbGVMaW5lQ2hhbmdlczogKGZpbGUsIGxpbmVDaGFuZ2VzKSA9PlxuICAgICAgICBpZiBmaWxlID09IEBlZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIEBmb3JlaWduQ2hhbmdlcyBsaW5lQ2hhbmdlc1xuXG4gICAgZm9yZWlnbkNoYW5nZXM6IChsaW5lQ2hhbmdlcykgLT5cbiAgICAgICAgQHN0YXJ0KClcbiAgICAgICAgZm9yIGNoYW5nZSBpbiBsaW5lQ2hhbmdlc1xuICAgICAgICAgICAgaWYgY2hhbmdlLmNoYW5nZSAhPSAnZGVsZXRlZCcgYW5kIG5vdCBjaGFuZ2UuYWZ0ZXI/XG4gICAgICAgICAgICAgICAga2Vycm9yIFwiRG8uZm9yZWlnbkNoYW5nZXMgLS0gbm8gYWZ0ZXI/ICN7Y2hhbmdlfVwiXG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN3aXRjaCBjaGFuZ2UuY2hhbmdlXG4gICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCcgIHRoZW4gQGNoYW5nZSBjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLmFmdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnIHRoZW4gQGluc2VydCBjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLmFmdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCcgIHRoZW4gQGRlbGV0ZSBjaGFuZ2UuZG9JbmRleFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAga2Vycm9yIFwiRG8uZm9yZWlnbkNoYW5nZXMgLS0gdW5rbm93biBjaGFuZ2UgI3tjaGFuZ2UuY2hhbmdlfVwiXG4gICAgICAgIEBlbmQgZm9yZWlnbjogdHJ1ZVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHRhYlN0YXRlOiAtPlxuXG4gICAgICAgIGhpc3Rvcnk6IEBoaXN0b3J5XG4gICAgICAgIHJlZG9zOiAgIEByZWRvc1xuICAgICAgICBzdGF0ZTogICBAc3RhdGVcbiAgICAgICAgZmlsZTogICAgQGVkaXRvci5jdXJyZW50RmlsZVxuXG4gICAgc2V0VGFiU3RhdGU6IChzdGF0ZSkgLT5cblxuICAgICAgICBAZWRpdG9yLnJlc3RvcmVGcm9tVGFiU3RhdGUgc3RhdGVcblxuICAgICAgICBAZ3JvdXBDb3VudCA9IDBcbiAgICAgICAgQGhpc3RvcnkgPSBzdGF0ZS5oaXN0b3J5XG4gICAgICAgIEByZWRvcyAgID0gc3RhdGUucmVkb3NcbiAgICAgICAgQHN0YXRlICAgPSBzdGF0ZS5zdGF0ZVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIHJlc2V0OiAtPlxuXG4gICAgICAgIEBncm91cENvdW50ID0gMFxuICAgICAgICBAaGlzdG9yeSA9IFtdXG4gICAgICAgIEByZWRvcyAgID0gW11cbiAgICAgICAgQHN0YXRlICAgPSBudWxsXG5cbiAgICBoYXNMaW5lQ2hhbmdlczogLT5cblxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgQGhpc3RvcnkubGVuZ3RoID09IDBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIF8uZmlyc3QoQGhpc3RvcnkpLnMubGluZXMgPT0gQGVkaXRvci5zdGF0ZS5zLmxpbmVzXG4gICAgICAgIF8uZmlyc3QoQGhpc3RvcnkpLnRleHQoKSAhPSBAZWRpdG9yLnRleHQoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzdGFydDogLT5cblxuICAgICAgICBAZ3JvdXBDb3VudCArPSAxXG4gICAgICAgIGlmIEBncm91cENvdW50ID09IDFcbiAgICAgICAgICAgIEBzdGFydFN0YXRlID0gQHN0YXRlID0gbmV3IFN0YXRlIEBlZGl0b3Iuc3RhdGUuc1xuICAgICAgICAgICAgaWYgZW1wdHkoQGhpc3RvcnkpIG9yIEBzdGF0ZS5zICE9IGxhc3QoQGhpc3RvcnkpLnNcbiAgICAgICAgICAgICAgICBAaGlzdG9yeS5wdXNoIEBzdGF0ZVxuXG4gICAgaXNEb2luZzogLT4gQGdyb3VwQ291bnQgPiAwXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgICAgMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG5cbiAgICBjaGFuZ2U6IChpbmRleCwgdGV4dCkgLT4gQHN0YXRlID0gQHN0YXRlLmNoYW5nZUxpbmUgaW5kZXgsIHRleHRcbiAgICBpbnNlcnQ6IChpbmRleCwgdGV4dCkgLT4gQHN0YXRlID0gQHN0YXRlLmluc2VydExpbmUgaW5kZXgsIHRleHRcbiAgICBkZWxldGU6IChpbmRleCkgLT5cbiAgICAgICAgaWYgQG51bUxpbmVzKCkgPj0gMSBhbmQgMCA8PSBpbmRleCA8IEBudW1MaW5lcygpXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ3dpbGxEZWxldGVMaW5lJyBAbGluZSBpbmRleFxuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLmRlbGV0ZUxpbmUgaW5kZXhcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgZW5kOiAob3B0KSAtPlxuXG4gICAgICAgICMgISEhIE5PIGxvZyBIRVJFICEhIVxuXG4gICAgICAgIEByZWRvcyA9IFtdXG4gICAgICAgIEBncm91cENvdW50IC09IDFcbiAgICAgICAgaWYgQGdyb3VwQ291bnQgPT0gMFxuICAgICAgICAgICAgQG1lcmdlKClcbiAgICAgICAgICAgIGNoYW5nZXMgPSBAY2FsY3VsYXRlQ2hhbmdlcyBAc3RhcnRTdGF0ZSwgQHN0YXRlXG4gICAgICAgICAgICBjaGFuZ2VzLmZvcmVpZ24gPSBvcHQ/LmZvcmVpZ25cbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0U3RhdGUgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLmNoYW5nZWQ/IGNoYW5nZXNcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG5cbiAgICB1bmRvOiAtPlxuXG4gICAgICAgIGlmIEBoaXN0b3J5Lmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBfLmlzRW1wdHkgQHJlZG9zXG4gICAgICAgICAgICAgICAgQHJlZG9zLnVuc2hpZnQgQGVkaXRvci5zdGF0ZVxuXG4gICAgICAgICAgICBAc3RhdGUgPSBAaGlzdG9yeS5wb3AoKVxuICAgICAgICAgICAgQHJlZG9zLnVuc2hpZnQgQHN0YXRlXG5cbiAgICAgICAgICAgIGNoYW5nZXMgPSBAY2FsY3VsYXRlQ2hhbmdlcyBAZWRpdG9yLnN0YXRlLCBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0U3RhdGUgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLmNoYW5nZWQ/IGNoYW5nZXNcbiAgICAgICAgICAgIEBlZGl0b3IuZW1pdCAndW5kb25lJ1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG5cbiAgICByZWRvOiAtPlxuXG4gICAgICAgIGlmIEByZWRvcy5sZW5ndGhcblxuICAgICAgICAgICAgaWYgQHJlZG9zLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICBAaGlzdG9yeS5wdXNoIEByZWRvcy5zaGlmdCgpXG5cbiAgICAgICAgICAgIEBzdGF0ZSA9IF8uZmlyc3QgQHJlZG9zXG4gICAgICAgICAgICBpZiBAcmVkb3MubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgICBAcmVkb3MgPSBbXVxuXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQGVkaXRvci5zdGF0ZSwgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ3JlZG9uZSdcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMFxuXG4gICAgc2VsZWN0OiAobmV3U2VsZWN0aW9ucykgLT5cblxuICAgICAgICBpZiBuZXdTZWxlY3Rpb25zLmxlbmd0aFxuICAgICAgICAgICAgbmV3U2VsZWN0aW9ucyA9IGNsZWFuUmFuZ2VzIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRTZWxlY3Rpb25zIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLnNldFNlbGVjdGlvbnMgW11cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBzZXRDdXJzb3JzOiAobmV3Q3Vyc29ycywgb3B0KSAtPlxuXG4gICAgICAgICMga2xvZyAnZG8uc2V0Q3Vyc29ycycgbmV3Q3Vyc29yc1xuICAgICAgICBcbiAgICAgICAgaWYgbm90IG5ld0N1cnNvcnM/IG9yIG5ld0N1cnNvcnMubGVuZ3RoIDwgMVxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkRvLnNldEN1cnNvcnMgLS0gZW1wdHkgY3Vyc29ycz9cIlxuXG4gICAgICAgIGlmIG9wdD8ubWFpblxuICAgICAgICAgICAgc3dpdGNoIG9wdC5tYWluXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlyc3QnIHRoZW4gbWFpbkluZGV4ID0gMFxuICAgICAgICAgICAgICAgIHdoZW4gJ2xhc3QnICB0aGVuIG1haW5JbmRleCA9IG5ld0N1cnNvcnMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICB3aGVuICdjbG9zZXN0J1xuICAgICAgICAgICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmluZGV4T2YgcG9zQ2xvc2VzdFRvUG9zSW5Qb3NpdGlvbnMgQGVkaXRvci5tYWluQ3Vyc29yKCksIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG1haW5JbmRleCA9IG5ld0N1cnNvcnMuaW5kZXhPZiBvcHQubWFpblxuICAgICAgICAgICAgICAgICAgICBtYWluSW5kZXggPSBwYXJzZUludCBvcHQubWFpbiBpZiBtYWluSW5kZXggPCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1haW5JbmRleCA9IG5ld0N1cnNvcnMubGVuZ3RoLTFcblxuICAgICAgICBtYWluQ3Vyc29yID0gbmV3Q3Vyc29yc1ttYWluSW5kZXhdXG4gICAgICAgIEBjbGVhbkN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmluZGV4T2YgcG9zQ2xvc2VzdFRvUG9zSW5Qb3NpdGlvbnMgbWFpbkN1cnNvciwgbmV3Q3Vyc29yc1xuXG4gICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQHN0YXRlID0gQHN0YXRlLnNldE1haW4gbWFpbkluZGV4XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgJ3NldEN1cnNvcnMnIEBlZGl0b3IubWFpbkN1cnNvcigpWzFdIGlmIEBlZGl0b3IubmFtZSA9PSAnZWRpdG9yJ1xuICAgICAgICAjIEBzdGF0ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGNhbGN1bGF0ZUNoYW5nZXM6IChvbGRTdGF0ZSwgbmV3U3RhdGUpIC0+XG5cbiAgICAgICAgb2kgPSAwICMgaW5kZXggaW4gb2xkU3RhdGVcbiAgICAgICAgbmkgPSAwICMgaW5kZXggaW4gbmV3U3RhdGVcbiAgICAgICAgZGQgPSAwICMgZGVsdGEgZm9yIGRvSW5kZXhcbiAgICAgICAgY2hhbmdlcyA9IFtdXG5cbiAgICAgICAgb2xkTGluZXMgPSBvbGRTdGF0ZS5zLmxpbmVzICMgd2UgYXJlIHdvcmtpbmcgb24gcmF3XG4gICAgICAgIG5ld0xpbmVzID0gbmV3U3RhdGUucy5saW5lcyAjIGltbXV0YWJsZXMgaGVyZSFcblxuICAgICAgICBpbnNlcnRpb25zID0gMCAjIG51bWJlciBvZiBpbnNlcnRpb25zXG4gICAgICAgIGRlbGV0aW9ucyAgPSAwICMgbnVtYmVyIG9mIGRlbGV0aW9uc1xuXG4gICAgICAgIGlmIG9sZExpbmVzICE9IG5ld0xpbmVzXG5cbiAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuXG4gICAgICAgICAgICB3aGlsZSBvaSA8IG9sZExpbmVzLmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgaWYgbm90IG5sPyAjIG5ldyBzdGF0ZSBoYXMgbm90IGVub3VnaCBsaW5lcywgbWFyayByZW1haW5pbmcgbGluZXMgaW4gb2xkU3RhdGUgYXMgZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICBkZWxldGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnZGVsZXRlZCcgb2xkSW5kZXg6IG9pLCBkb0luZGV4OiBvaStkZFxuICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgIGRkIC09IDFcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgb2wgPT0gbmwgIyBzYW1lIGxpbmVzIGluIG9sZCBhbmQgbmV3XG4gICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuXG4gICAgICAgICAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIG5sID09IG9sZExpbmVzW29pKzFdIGFuZCBvbCA9PSBuZXdMaW5lc1tuaSsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnY2hhbmdlZCcgb2xkSW5kZXg6IG9pLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogbmxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdjaGFuZ2VkJyBvbGRJbmRleDogb2ksIG5ld0luZGV4OiBuaSwgZG9JbmRleDogb2krZGQsIGFmdGVyOiBvbFxuICAgICAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBubCA9PSBvbGRMaW5lc1tvaSsxXSBhbmQgb2xkTGluZXNbb2krMV0gIT0gbmV3TGluZXNbbmkrMV1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2RlbGV0ZWQnIG9sZEluZGV4OiBvaSwgZG9JbmRleDogb2krZGRcbiAgICAgICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGRkIC09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0aW9ucyArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgb2wgPT0gbmV3TGluZXNbbmkrMV0gYW5kIG9sZExpbmVzW29pKzFdICE9IG5ld0xpbmVzW25pKzFdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdpbnNlcnRlZCcgbmV3SW5kZXg6IG5pLCBkb0luZGV4OiBvaStkZCwgYWZ0ZXI6IG5sXG4gICAgICAgICAgICAgICAgICAgICAgICBuaSArPSAxIFxuICAgICAgICAgICAgICAgICAgICAgICAgZGQgKz0gMSBcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlICMgY2hhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdjaGFuZ2VkJyBvbGRJbmRleDogb2ksIG5ld0luZGV4OiBuaSwgZG9JbmRleDogb2krZGQsIGFmdGVyOiBubFxuICAgICAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHdoaWxlIG5pIDwgbmV3TGluZXMubGVuZ3RoICMgbWFyayByZW1haW5pbmcgbGluZXMgaW4gbmV3U3RhdGUgYXMgaW5zZXJ0ZWRcblxuICAgICAgICAgICAgICAgIGluc2VydGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdpbnNlcnRlZCcgbmV3SW5kZXg6IG5pLCBkb0luZGV4OiBuaSwgYWZ0ZXI6IG5sXG4gICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgY2hhbmdlczogY2hhbmdlc1xuICAgICAgICBpbnNlcnRzOiBpbnNlcnRpb25zXG4gICAgICAgIGRlbGV0ZXM6IGRlbGV0aW9uc1xuICAgICAgICBjdXJzb3JzOiBvbGRTdGF0ZS5zLmN1cnNvcnMgICAgIT0gbmV3U3RhdGUucy5jdXJzb3JzXG4gICAgICAgIHNlbGVjdHM6IG9sZFN0YXRlLnMuc2VsZWN0aW9ucyAhPSBuZXdTdGF0ZS5zLnNlbGVjdGlvbnNcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICAjIGxvb2tzIGF0IGxhc3QgdHdvIGFjdGlvbnMgYW5kIG1lcmdlcyB0aGVtXG4gICAgIyAgICAgICB3aGVuIHRoZXkgY29udGFpbiBubyBsaW5lIGNoYW5nZXNcbiAgICAjICAgICAgIHdoZW4gdGhleSBjb250YWluIG9ubHkgY2hhbmdlcyBvZiB0aGUgc2FtZSBzZXQgb2YgbGluZXNcblxuICAgIG1lcmdlOiAtPlxuXG4gICAgICAgIHdoaWxlIEBoaXN0b3J5Lmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGIgPSBAaGlzdG9yeVtAaGlzdG9yeS5sZW5ndGgtMl1cbiAgICAgICAgICAgIGEgPSBsYXN0IEBoaXN0b3J5XG4gICAgICAgICAgICBpZiBhLnMubGluZXMgPT0gYi5zLmxpbmVzXG4gICAgICAgICAgICAgICAgaWYgQGhpc3RvcnkubGVuZ3RoID4gMlxuICAgICAgICAgICAgICAgICAgICBAaGlzdG9yeS5zcGxpY2UgQGhpc3RvcnkubGVuZ3RoLTIsIDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgZWxzZSBpZiBAaGlzdG9yeS5sZW5ndGggPiAyXG4gICAgICAgICAgICAgICAgYyA9IEBoaXN0b3J5W0BoaXN0b3J5Lmxlbmd0aC0zXVxuICAgICAgICAgICAgICAgIGlmIGEubnVtTGluZXMoKSA9PSBiLm51bUxpbmVzKCkgPT0gYy5udW1MaW5lcygpXG4gICAgICAgICAgICAgICAgICAgIGZvciBsaSBpbiBbMC4uLmEubnVtTGluZXMoKV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxhID0gYS5zLmxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICAgICAgbGIgPSBiLnMubGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgICAgICBsYyA9IGMucy5saW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGxhID09IGxiIGFuZCBsYyAhPSBsYiBvciBsYSAhPSBsYiBhbmQgbGMgPT0gbGJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgQGhpc3Rvcnkuc3BsaWNlIEBoaXN0b3J5Lmxlbmd0aC0yLCAxXG4gICAgICAgICAgICAgICAgZWxzZSByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgcmV0dXJuXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFuQ3Vyc29yczogKGNzKSAtPlxuXG4gICAgICAgIGZvciBwIGluIGNzXG4gICAgICAgICAgICBwWzBdID0gTWF0aC5tYXggcFswXSwgMFxuICAgICAgICAgICAgcFsxXSA9IGNsYW1wIDAsIEBzdGF0ZS5udW1MaW5lcygpLTEsIHBbMV1cblxuICAgICAgICBzb3J0UG9zaXRpb25zIGNzXG5cbiAgICAgICAgaWYgY3MubGVuZ3RoID4gMVxuICAgICAgICAgICAgZm9yIGNpIGluIFtjcy5sZW5ndGgtMS4uLjBdXG4gICAgICAgICAgICAgICAgYyA9IGNzW2NpXVxuICAgICAgICAgICAgICAgIHAgPSBjc1tjaS0xXVxuICAgICAgICAgICAgICAgIGlmIGNbMV0gPT0gcFsxXSBhbmQgY1swXSA9PSBwWzBdXG4gICAgICAgICAgICAgICAgICAgIGNzLnNwbGljZSBjaSwgMVxuICAgICAgICBjc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHRleHQ6ICAgICAgICAgICAgLT4gQHN0YXRlLnRleHQoKVxuICAgIGxpbmU6ICAgICAgICAoaSkgLT4gQHN0YXRlLmxpbmUgaVxuICAgIGN1cnNvcjogICAgICAoaSkgLT4gQHN0YXRlLmN1cnNvciBpXG4gICAgaGlnaGxpZ2h0OiAgIChpKSAtPiBAc3RhdGUuaGlnaGxpZ2h0IGlcbiAgICBzZWxlY3Rpb246ICAgKGkpIC0+IEBzdGF0ZS5zZWxlY3Rpb24gaVxuXG4gICAgbGluZXM6ICAgICAgICAgICAtPiBAc3RhdGUubGluZXMoKVxuICAgIGN1cnNvcnM6ICAgICAgICAgLT4gQHN0YXRlLmN1cnNvcnMoKVxuICAgIGhpZ2hsaWdodHM6ICAgICAgLT4gQHN0YXRlLmhpZ2hsaWdodHMoKVxuICAgIHNlbGVjdGlvbnM6ICAgICAgLT4gQHN0YXRlLnNlbGVjdGlvbnMoKVxuXG4gICAgbnVtTGluZXM6ICAgICAgICAtPiBAc3RhdGUubnVtTGluZXMoKVxuICAgIG51bUN1cnNvcnM6ICAgICAgLT4gQHN0YXRlLm51bUN1cnNvcnMoKVxuICAgIG51bVNlbGVjdGlvbnM6ICAgLT4gQHN0YXRlLm51bVNlbGVjdGlvbnMoKVxuICAgIG51bUhpZ2hsaWdodHM6ICAgLT4gQHN0YXRlLm51bUhpZ2hsaWdodHMoKVxuXG4gICAgdGV4dEluUmFuZ2U6IChyKSAtPiBAc3RhdGUubGluZShyWzBdKT8uc2xpY2UgclsxXVswXSwgclsxXVsxXVxuICAgIG1haW5DdXJzb3I6ICAgICAgLT4gQHN0YXRlLm1haW5DdXJzb3IoKVxuICAgIHJhbmdlRm9yTGluZUF0SW5kZXg6IChpKSAtPiBbaSwgWzAsIEBsaW5lKGkpLmxlbmd0aF1dXG5cbm1vZHVsZS5leHBvcnRzID0gRG9cbiJdfQ==
//# sourceURL=../../coffee/editor/do.coffee