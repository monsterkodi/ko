// koffee 1.7.0

/*
0000000     0000000
000   000  000   000
000   000  000   000
000   000  000   000
0000000     0000000
 */
var Do, State, _, clamp, empty, kerror, klog, last, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, klog = ref.klog, last = ref.last, post = ref.post;

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
                    klog(changes.length);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG8uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHlEQUFBO0lBQUE7O0FBUUEsTUFBZ0QsT0FBQSxDQUFRLEtBQVIsQ0FBaEQsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUMsZUFBakMsRUFBdUM7O0FBRXZDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7QUFDUixPQUFBLENBQVEsaUJBQVI7O0FBRU07SUFFQyxZQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxpQkFBUixFQUEwQixJQUFDLENBQUEsaUJBQTNCO0lBSkQ7O2lCQU1ILEdBQUEsR0FBSyxTQUFBO2VBQUcsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsaUJBQXBCLEVBQXNDLElBQUMsQ0FBQSxpQkFBdkM7SUFBSDs7aUJBRUwsaUJBQUEsR0FBbUIsU0FBQyxJQUFELEVBQU8sV0FBUDtRQUNmLElBQUcsSUFBQSxLQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBbkI7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsRUFESjs7SUFEZTs7aUJBSW5CLGNBQUEsR0FBZ0IsU0FBQyxXQUFEO0FBQ1osWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7QUFDQSxhQUFBLDZDQUFBOztZQUNJLElBQUcsTUFBTSxDQUFDLE1BQVAsS0FBaUIsU0FBakIsSUFBbUMsc0JBQXRDO2dCQUNJLE1BQUEsQ0FBTyxpQ0FBQSxHQUFrQyxNQUF6QztBQUNBLHlCQUZKOztBQUdBLG9CQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEscUJBQ1MsU0FEVDtvQkFDeUIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxNQUFNLENBQUMsT0FBZixFQUF3QixNQUFNLENBQUMsS0FBL0I7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Q0FBQyxVQUFQLENBQUE7SUFBSDs7aUJBQ2pCLG1CQUFBLEdBQXFCLFNBQUMsQ0FBRDtlQUFPLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBRCxFQUFJLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBTixDQUFRLENBQUMsTUFBYixDQUFKO0lBQVA7Ozs7OztBQUV6QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAgMDAwMDAwMFxuIyMjXG5cbnsgXywgY2xhbXAsIGVtcHR5LCBrZXJyb3IsIGtsb2csIGxhc3QsIHBvc3QgfSA9IHJlcXVpcmUgJ2t4aydcblxuU3RhdGUgPSByZXF1aXJlICcuL3N0YXRlJ1xucmVxdWlyZSAnLi4vdG9vbHMvcmFuZ2VzJ1xuXG5jbGFzcyBEb1xuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQHJlc2V0KClcblxuICAgICAgICBwb3N0Lm9uICdmaWxlTGluZUNoYW5nZXMnIEBvbkZpbGVMaW5lQ2hhbmdlc1xuXG4gICAgZGVsOiAtPiBwb3N0LnJlbW92ZUxpc3RlbmVyICdmaWxlTGluZUNoYW5nZXMnIEBvbkZpbGVMaW5lQ2hhbmdlc1xuXG4gICAgb25GaWxlTGluZUNoYW5nZXM6IChmaWxlLCBsaW5lQ2hhbmdlcykgPT5cbiAgICAgICAgaWYgZmlsZSA9PSBAZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICBAZm9yZWlnbkNoYW5nZXMgbGluZUNoYW5nZXNcblxuICAgIGZvcmVpZ25DaGFuZ2VzOiAobGluZUNoYW5nZXMpIC0+XG4gICAgICAgIEBzdGFydCgpXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gbGluZUNoYW5nZXNcbiAgICAgICAgICAgIGlmIGNoYW5nZS5jaGFuZ2UgIT0gJ2RlbGV0ZWQnIGFuZCBub3QgY2hhbmdlLmFmdGVyP1xuICAgICAgICAgICAgICAgIGtlcnJvciBcIkRvLmZvcmVpZ25DaGFuZ2VzIC0tIG5vIGFmdGVyPyAje2NoYW5nZX1cIlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzd2l0Y2ggY2hhbmdlLmNoYW5nZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnICB0aGVuIEBjaGFuZ2UgY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5hZnRlclxuICAgICAgICAgICAgICAgIHdoZW4gJ2luc2VydGVkJyB0aGVuIEBpbnNlcnQgY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5hZnRlclxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnICB0aGVuIEBkZWxldGUgY2hhbmdlLmRvSW5kZXhcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGtlcnJvciBcIkRvLmZvcmVpZ25DaGFuZ2VzIC0tIHVua25vd24gY2hhbmdlICN7Y2hhbmdlLmNoYW5nZX1cIlxuICAgICAgICBAZW5kIGZvcmVpZ246IHRydWVcblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB0YWJTdGF0ZTogLT5cblxuICAgICAgICBoaXN0b3J5OiBAaGlzdG9yeVxuICAgICAgICByZWRvczogICBAcmVkb3NcbiAgICAgICAgc3RhdGU6ICAgQHN0YXRlXG4gICAgICAgIGZpbGU6ICAgIEBlZGl0b3IuY3VycmVudEZpbGVcblxuICAgIHNldFRhYlN0YXRlOiAoc3RhdGUpIC0+XG5cbiAgICAgICAgQGVkaXRvci5yZXN0b3JlRnJvbVRhYlN0YXRlIHN0YXRlXG5cbiAgICAgICAgQGdyb3VwQ291bnQgPSAwXG4gICAgICAgIEBoaXN0b3J5ID0gc3RhdGUuaGlzdG9yeVxuICAgICAgICBAcmVkb3MgICA9IHN0YXRlLnJlZG9zXG4gICAgICAgIEBzdGF0ZSAgID0gc3RhdGUuc3RhdGVcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICByZXNldDogLT5cblxuICAgICAgICBAZ3JvdXBDb3VudCA9IDBcbiAgICAgICAgQGhpc3RvcnkgPSBbXVxuICAgICAgICBAcmVkb3MgICA9IFtdXG4gICAgICAgIEBzdGF0ZSAgID0gbnVsbFxuXG4gICAgaGFzTGluZUNoYW5nZXM6IC0+XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBoaXN0b3J5Lmxlbmd0aCA9PSAwXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBfLmZpcnN0KEBoaXN0b3J5KS5zLmxpbmVzID09IEBlZGl0b3Iuc3RhdGUucy5saW5lc1xuICAgICAgICBfLmZpcnN0KEBoaXN0b3J5KS50ZXh0KCkgIT0gQGVkaXRvci50ZXh0KClcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc3RhcnQ6IC0+XG5cbiAgICAgICAgQGdyb3VwQ291bnQgKz0gMVxuICAgICAgICBpZiBAZ3JvdXBDb3VudCA9PSAxXG4gICAgICAgICAgICBAc3RhcnRTdGF0ZSA9IEBzdGF0ZSA9IG5ldyBTdGF0ZSBAZWRpdG9yLnN0YXRlLnNcbiAgICAgICAgICAgIGlmIGVtcHR5KEBoaXN0b3J5KSBvciBAc3RhdGUucyAhPSBsYXN0KEBoaXN0b3J5KS5zXG4gICAgICAgICAgICAgICAgQGhpc3RvcnkucHVzaCBAc3RhdGVcblxuICAgIGlzRG9pbmc6IC0+IEBncm91cENvdW50ID4gMFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMCAgICAgIDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuXG4gICAgY2hhbmdlOiAoaW5kZXgsIHRleHQpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5jaGFuZ2VMaW5lIGluZGV4LCB0ZXh0XG4gICAgaW5zZXJ0OiAoaW5kZXgsIHRleHQpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5pbnNlcnRMaW5lIGluZGV4LCB0ZXh0XG4gICAgZGVsZXRlOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIEBudW1MaW5lcygpID49IDEgYW5kIDAgPD0gaW5kZXggPCBAbnVtTGluZXMoKVxuICAgICAgICAgICAgQGVkaXRvci5lbWl0ICd3aWxsRGVsZXRlTGluZScgQGxpbmUgaW5kZXhcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5kZWxldGVMaW5lIGluZGV4XG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGVuZDogKG9wdCkgLT5cblxuICAgICAgICAjICEhISBOTyBsb2cgSEVSRSAhISFcblxuICAgICAgICBAcmVkb3MgPSBbXVxuICAgICAgICBAZ3JvdXBDb3VudCAtPSAxXG4gICAgICAgIGlmIEBncm91cENvdW50ID09IDBcbiAgICAgICAgICAgIEBtZXJnZSgpXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQHN0YXJ0U3RhdGUsIEBzdGF0ZVxuICAgICAgICAgICAgY2hhbmdlcy5mb3JlaWduID0gb3B0Py5mb3JlaWduXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuXG4gICAgdW5kbzogLT5cblxuICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGhcblxuICAgICAgICAgICAgaWYgXy5pc0VtcHR5IEByZWRvc1xuICAgICAgICAgICAgICAgIEByZWRvcy51bnNoaWZ0IEBlZGl0b3Iuc3RhdGVcblxuICAgICAgICAgICAgQHN0YXRlID0gQGhpc3RvcnkucG9wKClcbiAgICAgICAgICAgIEByZWRvcy51bnNoaWZ0IEBzdGF0ZVxuXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQGVkaXRvci5zdGF0ZSwgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ3VuZG9uZSdcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuXG4gICAgcmVkbzogLT5cblxuICAgICAgICBpZiBAcmVkb3MubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIEByZWRvcy5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgQGhpc3RvcnkucHVzaCBAcmVkb3Muc2hpZnQoKVxuXG4gICAgICAgICAgICBAc3RhdGUgPSBfLmZpcnN0IEByZWRvc1xuICAgICAgICAgICAgaWYgQHJlZG9zLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgQHJlZG9zID0gW11cblxuICAgICAgICAgICAgY2hhbmdlcyA9IEBjYWxjdWxhdGVDaGFuZ2VzIEBlZGl0b3Iuc3RhdGUsIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5zZXRTdGF0ZSBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3IuY2hhbmdlZD8gY2hhbmdlc1xuICAgICAgICAgICAgQGVkaXRvci5lbWl0ICdyZWRvbmUnXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIHNlbGVjdDogKG5ld1NlbGVjdGlvbnMpIC0+XG5cbiAgICAgICAgaWYgbmV3U2VsZWN0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBjbGVhblJhbmdlcyBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBuZXdTZWxlY3Rpb25zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRTZWxlY3Rpb25zIFtdXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgc2V0Q3Vyc29yczogKG5ld0N1cnNvcnMsIG9wdCkgLT5cblxuICAgICAgICAjIGtsb2cgJ2RvLnNldEN1cnNvcnMnIG5ld0N1cnNvcnNcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBuZXdDdXJzb3JzPyBvciBuZXdDdXJzb3JzLmxlbmd0aCA8IDFcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJEby5zZXRDdXJzb3JzIC0tIGVtcHR5IGN1cnNvcnM/XCJcblxuICAgICAgICBpZiBvcHQ/Lm1haW5cbiAgICAgICAgICAgIHN3aXRjaCBvcHQubWFpblxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpcnN0JyB0aGVuIG1haW5JbmRleCA9IDBcbiAgICAgICAgICAgICAgICB3aGVuICdsYXN0JyAgdGhlbiBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgd2hlbiAnY2xvc2VzdCdcbiAgICAgICAgICAgICAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBvc0Nsb3Nlc3RUb1Bvc0luUG9zaXRpb25zIEBlZGl0b3IubWFpbkN1cnNvcigpLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmluZGV4T2Ygb3B0Lm1haW5cbiAgICAgICAgICAgICAgICAgICAgbWFpbkluZGV4ID0gcGFyc2VJbnQgb3B0Lm1haW4gaWYgbWFpbkluZGV4IDwgMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmxlbmd0aC0xXG5cbiAgICAgICAgbWFpbkN1cnNvciA9IG5ld0N1cnNvcnNbbWFpbkluZGV4XVxuICAgICAgICBAY2xlYW5DdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBvc0Nsb3Nlc3RUb1Bvc0luUG9zaXRpb25zIG1haW5DdXJzb3IsIG5ld0N1cnNvcnNcblxuICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRNYWluIG1haW5JbmRleFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdzZXRDdXJzb3JzJyBAZWRpdG9yLm1haW5DdXJzb3IoKVsxXSBpZiBAZWRpdG9yLm5hbWUgPT0gJ2VkaXRvcidcbiAgICAgICAgIyBAc3RhdGVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjYWxjdWxhdGVDaGFuZ2VzOiAob2xkU3RhdGUsIG5ld1N0YXRlKSAtPlxuXG4gICAgICAgIG9pID0gMCAjIGluZGV4IGluIG9sZFN0YXRlXG4gICAgICAgIG5pID0gMCAjIGluZGV4IGluIG5ld1N0YXRlXG4gICAgICAgIGRkID0gMCAjIGRlbHRhIGZvciBkb0luZGV4XG4gICAgICAgIGNoYW5nZXMgPSBbXVxuXG4gICAgICAgIG9sZExpbmVzID0gb2xkU3RhdGUucy5saW5lcyAjIHdlIGFyZSB3b3JraW5nIG9uIHJhd1xuICAgICAgICBuZXdMaW5lcyA9IG5ld1N0YXRlLnMubGluZXMgIyBpbW11dGFibGVzIGhlcmUhXG5cbiAgICAgICAgaW5zZXJ0aW9ucyA9IDAgIyBudW1iZXIgb2YgaW5zZXJ0aW9uc1xuICAgICAgICBkZWxldGlvbnMgID0gMCAjIG51bWJlciBvZiBkZWxldGlvbnNcblxuICAgICAgICBpZiBvbGRMaW5lcyAhPSBuZXdMaW5lc1xuXG4gICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgd2hpbGUgb2kgPCBvbGRMaW5lcy5sZW5ndGhcblxuICAgICAgICAgICAgICAgIGlmIG5vdCBubD8gIyBuZXcgc3RhdGUgaGFzIG5vdCBlbm91Z2ggbGluZXMsIG1hcmsgcmVtYWluaW5nIGxpbmVzIGluIG9sZFN0YXRlIGFzIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRpb25zICs9IDFcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2RlbGV0ZWQnIG9sZEluZGV4OiBvaSwgZG9JbmRleDogb2krZGRcbiAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICBkZCAtPSAxXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9sID09IG5sICMgc2FtZSBsaW5lcyBpbiBvbGQgYW5kIG5ld1xuICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cbiAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgICAgIGVsc2VcblxuICAgICAgICAgICAgICAgICAgICBpZiBubCA9PSBvbGRMaW5lc1tvaSsxXSBhbmQgb2wgPT0gbmV3TGluZXNbbmkrMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2NoYW5nZWQnIG9sZEluZGV4OiBvaSwgbmV3SW5kZXg6IG5pLCBkb0luZGV4OiBvaStkZCwgYWZ0ZXI6IG5sXG4gICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnY2hhbmdlZCcgb2xkSW5kZXg6IG9pLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogb2xcbiAgICAgICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgbmwgPT0gb2xkTGluZXNbb2krMV0gYW5kIG9sZExpbmVzW29pKzFdICE9IG5ld0xpbmVzW25pKzFdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdkZWxldGVkJyBvbGRJbmRleDogb2ksIGRvSW5kZXg6IG9pK2RkXG4gICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBkZCAtPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG9sID09IG5ld0xpbmVzW25pKzFdIGFuZCBvbGRMaW5lc1tvaSsxXSAhPSBuZXdMaW5lc1tuaSsxXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnaW5zZXJ0ZWQnIG5ld0luZGV4OiBuaSwgZG9JbmRleDogb2krZGQsIGFmdGVyOiBubFxuICAgICAgICAgICAgICAgICAgICAgICAgbmkgKz0gMSBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRkICs9IDEgXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRpb25zICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSAjIGNoYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnY2hhbmdlZCcgb2xkSW5kZXg6IG9pLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogbmxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgY2hhbmdlcy5sZW5ndGhcblxuICAgICAgICAgICAgd2hpbGUgbmkgPCBuZXdMaW5lcy5sZW5ndGggIyBtYXJrIHJlbWFpbmluZyBsaW5lcyBpbiBuZXdTdGF0ZSBhcyBpbnNlcnRlZFxuXG4gICAgICAgICAgICAgICAgaW5zZXJ0aW9ucyArPSAxXG4gICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2luc2VydGVkJyBuZXdJbmRleDogbmksIGRvSW5kZXg6IG5pLCBhZnRlcjogbmxcbiAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICBjaGFuZ2VzOiBjaGFuZ2VzXG4gICAgICAgIGluc2VydHM6IGluc2VydGlvbnNcbiAgICAgICAgZGVsZXRlczogZGVsZXRpb25zXG4gICAgICAgIGN1cnNvcnM6IG9sZFN0YXRlLnMuY3Vyc29ycyAgICAhPSBuZXdTdGF0ZS5zLmN1cnNvcnNcbiAgICAgICAgc2VsZWN0czogb2xkU3RhdGUucy5zZWxlY3Rpb25zICE9IG5ld1N0YXRlLnMuc2VsZWN0aW9uc1xuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgICMgbG9va3MgYXQgbGFzdCB0d28gYWN0aW9ucyBhbmQgbWVyZ2VzIHRoZW1cbiAgICAjICAgICAgIHdoZW4gdGhleSBjb250YWluIG5vIGxpbmUgY2hhbmdlc1xuICAgICMgICAgICAgd2hlbiB0aGV5IGNvbnRhaW4gb25seSBjaGFuZ2VzIG9mIHRoZSBzYW1lIHNldCBvZiBsaW5lc1xuXG4gICAgbWVyZ2U6IC0+XG5cbiAgICAgICAgd2hpbGUgQGhpc3RvcnkubGVuZ3RoID4gMVxuICAgICAgICAgICAgYiA9IEBoaXN0b3J5W0BoaXN0b3J5Lmxlbmd0aC0yXVxuICAgICAgICAgICAgYSA9IGxhc3QgQGhpc3RvcnlcbiAgICAgICAgICAgIGlmIGEucy5saW5lcyA9PSBiLnMubGluZXNcbiAgICAgICAgICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGggPiAyXG4gICAgICAgICAgICAgICAgICAgIEBoaXN0b3J5LnNwbGljZSBAaGlzdG9yeS5sZW5ndGgtMiwgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBlbHNlIGlmIEBoaXN0b3J5Lmxlbmd0aCA+IDJcbiAgICAgICAgICAgICAgICBjID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoLTNdXG4gICAgICAgICAgICAgICAgaWYgYS5udW1MaW5lcygpID09IGIubnVtTGluZXMoKSA9PSBjLm51bUxpbmVzKClcbiAgICAgICAgICAgICAgICAgICAgZm9yIGxpIGluIFswLi4uYS5udW1MaW5lcygpXVxuICAgICAgICAgICAgICAgICAgICAgICAgbGEgPSBhLnMubGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgICAgICBsYiA9IGIucy5saW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxjID0gYy5zLmxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbGEgPT0gbGIgYW5kIGxjICE9IGxiIG9yIGxhICE9IGxiIGFuZCBsYyA9PSBsYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBAaGlzdG9yeS5zcGxpY2UgQGhpc3RvcnkubGVuZ3RoLTIsIDFcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVyblxuICAgICAgICAgICAgZWxzZSByZXR1cm5cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYW5DdXJzb3JzOiAoY3MpIC0+XG5cbiAgICAgICAgZm9yIHAgaW4gY3NcbiAgICAgICAgICAgIHBbMF0gPSBNYXRoLm1heCBwWzBdLCAwXG4gICAgICAgICAgICBwWzFdID0gY2xhbXAgMCwgQHN0YXRlLm51bUxpbmVzKCktMSwgcFsxXVxuXG4gICAgICAgIHNvcnRQb3NpdGlvbnMgY3NcblxuICAgICAgICBpZiBjcy5sZW5ndGggPiAxXG4gICAgICAgICAgICBmb3IgY2kgaW4gW2NzLmxlbmd0aC0xLi4uMF1cbiAgICAgICAgICAgICAgICBjID0gY3NbY2ldXG4gICAgICAgICAgICAgICAgcCA9IGNzW2NpLTFdXG4gICAgICAgICAgICAgICAgaWYgY1sxXSA9PSBwWzFdIGFuZCBjWzBdID09IHBbMF1cbiAgICAgICAgICAgICAgICAgICAgY3Muc3BsaWNlIGNpLCAxXG4gICAgICAgIGNzXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdGV4dDogICAgICAgICAgICAtPiBAc3RhdGUudGV4dCgpXG4gICAgbGluZTogICAgICAgIChpKSAtPiBAc3RhdGUubGluZSBpXG4gICAgY3Vyc29yOiAgICAgIChpKSAtPiBAc3RhdGUuY3Vyc29yIGlcbiAgICBoaWdobGlnaHQ6ICAgKGkpIC0+IEBzdGF0ZS5oaWdobGlnaHQgaVxuICAgIHNlbGVjdGlvbjogICAoaSkgLT4gQHN0YXRlLnNlbGVjdGlvbiBpXG5cbiAgICBsaW5lczogICAgICAgICAgIC0+IEBzdGF0ZS5saW5lcygpXG4gICAgY3Vyc29yczogICAgICAgICAtPiBAc3RhdGUuY3Vyc29ycygpXG4gICAgaGlnaGxpZ2h0czogICAgICAtPiBAc3RhdGUuaGlnaGxpZ2h0cygpXG4gICAgc2VsZWN0aW9uczogICAgICAtPiBAc3RhdGUuc2VsZWN0aW9ucygpXG5cbiAgICBudW1MaW5lczogICAgICAgIC0+IEBzdGF0ZS5udW1MaW5lcygpXG4gICAgbnVtQ3Vyc29yczogICAgICAtPiBAc3RhdGUubnVtQ3Vyc29ycygpXG4gICAgbnVtU2VsZWN0aW9uczogICAtPiBAc3RhdGUubnVtU2VsZWN0aW9ucygpXG4gICAgbnVtSGlnaGxpZ2h0czogICAtPiBAc3RhdGUubnVtSGlnaGxpZ2h0cygpXG5cbiAgICB0ZXh0SW5SYW5nZTogKHIpIC0+IEBzdGF0ZS5saW5lKHJbMF0pPy5zbGljZSByWzFdWzBdLCByWzFdWzFdXG4gICAgbWFpbkN1cnNvcjogICAgICAtPiBAc3RhdGUubWFpbkN1cnNvcigpXG4gICAgcmFuZ2VGb3JMaW5lQXRJbmRleDogKGkpIC0+IFtpLCBbMCwgQGxpbmUoaSkubGVuZ3RoXV1cblxubW9kdWxlLmV4cG9ydHMgPSBEb1xuIl19
//# sourceURL=../../coffee/editor/do.coffee