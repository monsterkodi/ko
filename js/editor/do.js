// koffee 1.4.0

/*
0000000     0000000
000   000  000   000
000   000  000   000
000   000  000   000
0000000     0000000
 */
var Do, State, _, clamp, empty, kerror, last, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, empty = ref.empty, clamp = ref.clamp, last = ref.last, kerror = ref.kerror, _ = ref._;

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
        var changes, dd, deletes, deletions, insertions, inserts, newLines, ni, nl, oi, ol, oldLines;
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
                    ol = oldLines[oi];
                    ni += 1;
                    nl = newLines[ni];
                } else {
                    inserts = newLines.slice(ni).findIndex(function(v) {
                        return v === ol;
                    });
                    deletes = oldLines.slice(oi).findIndex(function(v) {
                        return v === nl;
                    });
                    if (inserts > 0 && (deletes <= 0 || inserts < deletes)) {
                        while (inserts) {
                            changes.push({
                                change: 'inserted',
                                newIndex: ni,
                                doIndex: oi + dd,
                                after: nl.text
                            });
                            ni += 1;
                            dd += 1;
                            inserts -= 1;
                            insertions += 1;
                        }
                        nl = newLines[ni];
                    } else if (deletes > 0 && (inserts <= 0 || deletes < inserts)) {
                        while (deletes) {
                            changes.push({
                                change: 'deleted',
                                oldIndex: oi,
                                doIndex: oi + dd
                            });
                            oi += 1;
                            dd -= 1;
                            deletes -= 1;
                            deletions += 1;
                        }
                        ol = oldLines[oi];
                    } else {
                        changes.push({
                            change: 'changed',
                            oldIndex: oi,
                            newIndex: ni,
                            doIndex: oi + dd,
                            after: nl.text
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
                    after: nl.text
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG8uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1EQUFBO0lBQUE7O0FBUUEsTUFBMEMsT0FBQSxDQUFRLEtBQVIsQ0FBMUMsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxpQkFBZixFQUFzQixlQUF0QixFQUE0QixtQkFBNUIsRUFBb0M7O0FBRXBDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7QUFDUixPQUFBLENBQVEsaUJBQVI7O0FBRU07SUFFQyxZQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxpQkFBUixFQUEyQixJQUFDLENBQUEsaUJBQTVCO0lBSkQ7O2lCQU1ILEdBQUEsR0FBSyxTQUFBO2VBQUcsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsaUJBQXBCLEVBQXVDLElBQUMsQ0FBQSxpQkFBeEM7SUFBSDs7aUJBRUwsaUJBQUEsR0FBbUIsU0FBQyxJQUFELEVBQU8sV0FBUDtRQUNmLElBQUcsSUFBQSxLQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBbkI7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsRUFESjs7SUFEZTs7aUJBSW5CLGNBQUEsR0FBZ0IsU0FBQyxXQUFEO0FBQ1osWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7QUFDQSxhQUFBLDZDQUFBOztZQUNJLElBQUcsTUFBTSxDQUFDLE1BQVAsS0FBaUIsU0FBakIsSUFBbUMsc0JBQXRDO2dCQUNJLE1BQUEsQ0FBTyxpQ0FBQSxHQUFrQyxNQUF6QztBQUNBLHlCQUZKOztBQUdBLG9CQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEscUJBQ1MsU0FEVDtvQkFDeUIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxNQUFNLENBQUMsT0FBZixFQUF3QixNQUFNLENBQUMsS0FBL0I7QUFBaEI7QUFEVCxx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QUFBLEtBQUssQ0FBQyxVQUFQLENBQUE7SUFBSDs7aUJBQ2pCLFVBQUEsR0FBaUIsU0FBQTtlQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBUCxDQUFBO0lBQUg7O2lCQUVqQixRQUFBLEdBQWlCLFNBQUE7ZUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsQ0FBQTtJQUFIOztpQkFDakIsVUFBQSxHQUFpQixTQUFBO2VBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFQLENBQUE7SUFBSDs7aUJBQ2pCLGFBQUEsR0FBaUIsU0FBQTtlQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsYUFBUCxDQUFBO0lBQUg7O2lCQUNqQixhQUFBLEdBQWlCLFNBQUE7ZUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLGFBQVAsQ0FBQTtJQUFIOztpQkFFakIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUFPLFlBQUE7NERBQWlCLENBQUUsS0FBbkIsQ0FBeUIsQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBOUIsRUFBa0MsQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBdkM7SUFBUDs7aUJBQ2IsVUFBQSxHQUFpQixTQUFBO2VBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFQLENBQUE7SUFBSDs7aUJBQ2pCLG1CQUFBLEdBQXFCLFNBQUMsQ0FBRDtlQUFPLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBRCxFQUFJLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBTixDQUFRLENBQUMsTUFBYixDQUFKO0lBQVA7Ozs7OztBQUV6QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAgMDAwMDAwMFxuIyMjXG5cbnsgcG9zdCwgZW1wdHksIGNsYW1wLCBsYXN0LCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3RhdGUgPSByZXF1aXJlICcuL3N0YXRlJ1xucmVxdWlyZSAnLi4vdG9vbHMvcmFuZ2VzJ1xuXG5jbGFzcyBEb1xuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQHJlc2V0KClcblxuICAgICAgICBwb3N0Lm9uICdmaWxlTGluZUNoYW5nZXMnLCBAb25GaWxlTGluZUNoYW5nZXNcblxuICAgIGRlbDogLT4gcG9zdC5yZW1vdmVMaXN0ZW5lciAnZmlsZUxpbmVDaGFuZ2VzJywgQG9uRmlsZUxpbmVDaGFuZ2VzXG5cbiAgICBvbkZpbGVMaW5lQ2hhbmdlczogKGZpbGUsIGxpbmVDaGFuZ2VzKSA9PlxuICAgICAgICBpZiBmaWxlID09IEBlZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIEBmb3JlaWduQ2hhbmdlcyBsaW5lQ2hhbmdlc1xuXG4gICAgZm9yZWlnbkNoYW5nZXM6IChsaW5lQ2hhbmdlcykgLT5cbiAgICAgICAgQHN0YXJ0KClcbiAgICAgICAgZm9yIGNoYW5nZSBpbiBsaW5lQ2hhbmdlc1xuICAgICAgICAgICAgaWYgY2hhbmdlLmNoYW5nZSAhPSAnZGVsZXRlZCcgYW5kIG5vdCBjaGFuZ2UuYWZ0ZXI/XG4gICAgICAgICAgICAgICAga2Vycm9yIFwiRG8uZm9yZWlnbkNoYW5nZXMgLS0gbm8gYWZ0ZXI/ICN7Y2hhbmdlfVwiXG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN3aXRjaCBjaGFuZ2UuY2hhbmdlXG4gICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCcgIHRoZW4gQGNoYW5nZSBjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLmFmdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnIHRoZW4gQGluc2VydCBjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLmFmdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCcgIHRoZW4gQGRlbGV0ZSBjaGFuZ2UuZG9JbmRleFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAga2Vycm9yIFwiRG8uZm9yZWlnbkNoYW5nZXMgLS0gdW5rbm93biBjaGFuZ2UgI3tjaGFuZ2UuY2hhbmdlfVwiXG4gICAgICAgIEBlbmQgZm9yZWlnbjogdHJ1ZVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHRhYlN0YXRlOiAtPlxuXG4gICAgICAgIGhpc3Rvcnk6IEBoaXN0b3J5XG4gICAgICAgIHJlZG9zOiAgIEByZWRvc1xuICAgICAgICBzdGF0ZTogICBAc3RhdGVcbiAgICAgICAgZmlsZTogICAgQGVkaXRvci5jdXJyZW50RmlsZVxuXG4gICAgc2V0VGFiU3RhdGU6IChzdGF0ZSkgLT5cblxuICAgICAgICBAZWRpdG9yLnJlc3RvcmVGcm9tVGFiU3RhdGUgc3RhdGVcblxuICAgICAgICBAZ3JvdXBDb3VudCA9IDBcbiAgICAgICAgQGhpc3RvcnkgPSBzdGF0ZS5oaXN0b3J5XG4gICAgICAgIEByZWRvcyAgID0gc3RhdGUucmVkb3NcbiAgICAgICAgQHN0YXRlICAgPSBzdGF0ZS5zdGF0ZVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIHJlc2V0OiAtPlxuXG4gICAgICAgIEBncm91cENvdW50ID0gMFxuICAgICAgICBAaGlzdG9yeSA9IFtdXG4gICAgICAgIEByZWRvcyAgID0gW11cbiAgICAgICAgQHN0YXRlICAgPSBudWxsXG5cbiAgICBoYXNMaW5lQ2hhbmdlczogLT5cblxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgQGhpc3RvcnkubGVuZ3RoID09IDBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIF8uZmlyc3QoQGhpc3RvcnkpLnMubGluZXMgPT0gQGVkaXRvci5zdGF0ZS5zLmxpbmVzXG4gICAgICAgIF8uZmlyc3QoQGhpc3RvcnkpLnRleHQoKSAhPSBAZWRpdG9yLnRleHQoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzdGFydDogLT5cblxuICAgICAgICBAZ3JvdXBDb3VudCArPSAxXG4gICAgICAgIGlmIEBncm91cENvdW50ID09IDFcbiAgICAgICAgICAgIEBzdGFydFN0YXRlID0gQHN0YXRlID0gbmV3IFN0YXRlIEBlZGl0b3Iuc3RhdGUuc1xuICAgICAgICAgICAgaWYgZW1wdHkoQGhpc3RvcnkpIG9yIEBzdGF0ZS5zICE9IGxhc3QoQGhpc3RvcnkpLnNcbiAgICAgICAgICAgICAgICBAaGlzdG9yeS5wdXNoIEBzdGF0ZVxuXG4gICAgaXNEb2luZzogLT4gQGdyb3VwQ291bnQgPiAwXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgICAgMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG5cbiAgICBjaGFuZ2U6IChpbmRleCwgdGV4dCkgLT4gQHN0YXRlID0gQHN0YXRlLmNoYW5nZUxpbmUgaW5kZXgsIHRleHRcbiAgICBpbnNlcnQ6IChpbmRleCwgdGV4dCkgLT4gQHN0YXRlID0gQHN0YXRlLmluc2VydExpbmUgaW5kZXgsIHRleHRcbiAgICBkZWxldGU6IChpbmRleCkgLT5cbiAgICAgICAgaWYgQG51bUxpbmVzKCkgPj0gMSBhbmQgMCA8PSBpbmRleCA8IEBudW1MaW5lcygpXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ3dpbGxEZWxldGVMaW5lJywgQGxpbmUgaW5kZXhcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5kZWxldGVMaW5lIGluZGV4XG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGVuZDogKG9wdCkgLT5cblxuICAgICAgICAjICEhISBOTyBsb2cgSEVSRSAhISFcblxuICAgICAgICBAcmVkb3MgPSBbXVxuICAgICAgICBAZ3JvdXBDb3VudCAtPSAxXG4gICAgICAgIGlmIEBncm91cENvdW50ID09IDBcbiAgICAgICAgICAgIEBtZXJnZSgpXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQHN0YXJ0U3RhdGUsIEBzdGF0ZVxuICAgICAgICAgICAgY2hhbmdlcy5mb3JlaWduID0gb3B0Py5mb3JlaWduXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuXG4gICAgdW5kbzogLT5cblxuICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGhcblxuICAgICAgICAgICAgaWYgXy5pc0VtcHR5IEByZWRvc1xuICAgICAgICAgICAgICAgIEByZWRvcy51bnNoaWZ0IEBlZGl0b3Iuc3RhdGVcblxuICAgICAgICAgICAgQHN0YXRlID0gQGhpc3RvcnkucG9wKClcbiAgICAgICAgICAgIEByZWRvcy51bnNoaWZ0IEBzdGF0ZVxuXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQGVkaXRvci5zdGF0ZSwgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ3VuZG9uZSdcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMFxuXG4gICAgcmVkbzogLT5cblxuICAgICAgICBpZiBAcmVkb3MubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIEByZWRvcy5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgQGhpc3RvcnkucHVzaCBAcmVkb3Muc2hpZnQoKVxuXG4gICAgICAgICAgICBAc3RhdGUgPSBfLmZpcnN0IEByZWRvc1xuICAgICAgICAgICAgaWYgQHJlZG9zLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgQHJlZG9zID0gW11cblxuICAgICAgICAgICAgY2hhbmdlcyA9IEBjYWxjdWxhdGVDaGFuZ2VzIEBlZGl0b3Iuc3RhdGUsIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5zZXRTdGF0ZSBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3IuY2hhbmdlZD8gY2hhbmdlc1xuICAgICAgICAgICAgQGVkaXRvci5lbWl0ICdyZWRvbmUnXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIHNlbGVjdDogKG5ld1NlbGVjdGlvbnMpIC0+XG5cbiAgICAgICAgaWYgbmV3U2VsZWN0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBjbGVhblJhbmdlcyBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBuZXdTZWxlY3Rpb25zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRTZWxlY3Rpb25zIFtdXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgc2V0Q3Vyc29yczogKG5ld0N1cnNvcnMsIG9wdCkgLT5cblxuICAgICAgICAjIGtsb2cgJ2RvLnNldEN1cnNvcnMnIG5ld0N1cnNvcnNcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBuZXdDdXJzb3JzPyBvciBuZXdDdXJzb3JzLmxlbmd0aCA8IDFcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJEby5zZXRDdXJzb3JzIC0tIGVtcHR5IGN1cnNvcnM/XCJcblxuICAgICAgICBpZiBvcHQ/Lm1haW5cbiAgICAgICAgICAgIHN3aXRjaCBvcHQubWFpblxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpcnN0JyB0aGVuIG1haW5JbmRleCA9IDBcbiAgICAgICAgICAgICAgICB3aGVuICdsYXN0JyAgdGhlbiBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgd2hlbiAnY2xvc2VzdCdcbiAgICAgICAgICAgICAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBvc0Nsb3Nlc3RUb1Bvc0luUG9zaXRpb25zIEBlZGl0b3IubWFpbkN1cnNvcigpLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmluZGV4T2Ygb3B0Lm1haW5cbiAgICAgICAgICAgICAgICAgICAgbWFpbkluZGV4ID0gcGFyc2VJbnQgb3B0Lm1haW4gaWYgbWFpbkluZGV4IDwgMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmxlbmd0aC0xXG5cbiAgICAgICAgbWFpbkN1cnNvciA9IG5ld0N1cnNvcnNbbWFpbkluZGV4XVxuICAgICAgICBAY2xlYW5DdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgbWFpbkluZGV4ID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBvc0Nsb3Nlc3RUb1Bvc0luUG9zaXRpb25zIG1haW5DdXJzb3IsIG5ld0N1cnNvcnNcblxuICAgICAgICBAc3RhdGUgPSBAc3RhdGUuc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRNYWluIG1haW5JbmRleFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdzZXRDdXJzb3JzJyBAZWRpdG9yLm1haW5DdXJzb3IoKVsxXSBpZiBAZWRpdG9yLm5hbWUgPT0gJ2VkaXRvcidcbiAgICAgICAgIyBAc3RhdGVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjYWxjdWxhdGVDaGFuZ2VzOiAob2xkU3RhdGUsIG5ld1N0YXRlKSAtPlxuXG4gICAgICAgIG9pID0gMCAjIGluZGV4IGluIG9sZFN0YXRlXG4gICAgICAgIG5pID0gMCAjIGluZGV4IGluIG5ld1N0YXRlXG4gICAgICAgIGRkID0gMCAjIGRlbHRhIGZvciBkb0luZGV4XG4gICAgICAgIGNoYW5nZXMgPSBbXVxuXG4gICAgICAgIG9sZExpbmVzID0gb2xkU3RhdGUucy5saW5lcyAjIHdlIGFyZSB3b3JraW5nIG9uIHJhd1xuICAgICAgICBuZXdMaW5lcyA9IG5ld1N0YXRlLnMubGluZXMgIyBpbW11dGFibGVzIGhlcmUhXG5cbiAgICAgICAgaW5zZXJ0aW9ucyA9IDAgIyBudW1iZXIgb2YgaW5zZXJ0aW9uc1xuICAgICAgICBkZWxldGlvbnMgID0gMCAjIG51bWJlciBvZiBkZWxldGlvbnNcblxuICAgICAgICBpZiBvbGRMaW5lcyAhPSBuZXdMaW5lc1xuXG4gICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgd2hpbGUgb2kgPCBvbGRMaW5lcy5sZW5ndGhcblxuICAgICAgICAgICAgICAgIGlmIG5vdCBubD8gIyBuZXcgc3RhdGUgaGFzIG5vdCBlbm91Z2ggbGluZXMsIG1hcmsgcmVtYWluaW5nIGxpbmVzIGluIG9sZFN0YXRlIGFzIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRpb25zICs9IDFcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2RlbGV0ZWQnLCBvbGRJbmRleDogb2ksIGRvSW5kZXg6IG9pK2RkXG4gICAgICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgZGQgLT0gMVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBvbCA9PSBubCAjIHNhbWUgbGluZXMgaW4gb2xkIGFuZCBuZXdcbiAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGluc2VydHMgPSBuZXdMaW5lcy5zbGljZShuaSkuZmluZEluZGV4ICh2KSAtPiB2PT1vbCAjIGluc2VydGlvblxuICAgICAgICAgICAgICAgICAgICBkZWxldGVzID0gb2xkTGluZXMuc2xpY2Uob2kpLmZpbmRJbmRleCAodikgLT4gdj09bmwgIyBkZWxldGlvblxuXG4gICAgICAgICAgICAgICAgICAgIGlmIGluc2VydHMgPiAwIGFuZCAoZGVsZXRlcyA8PSAwIG9yIGluc2VydHMgPCBkZWxldGVzKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSBpbnNlcnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2luc2VydGVkJywgbmV3SW5kZXg6IG5pLCBkb0luZGV4OiBvaStkZCwgYWZ0ZXI6IG5sLnRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGQgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMgLT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGRlbGV0ZXMgPiAwIGFuZCAoaW5zZXJ0cyA8PSAwIG9yIGRlbGV0ZXMgPCBpbnNlcnRzKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSBkZWxldGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2RlbGV0ZWQnLCBvbGRJbmRleDogb2ksIGRvSW5kZXg6IG9pK2RkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRkIC09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGVzIC09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlICMgY2hhbmdlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdjaGFuZ2VkJywgb2xkSW5kZXg6IG9pLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogbmwudGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb2wgPSBvbGRMaW5lc1tvaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgICAgIHdoaWxlIG5pIDwgbmV3TGluZXMubGVuZ3RoICMgbWFyayByZW1haW5nIGxpbmVzIGluIG5ld1N0YXRlIGFzIGluc2VydGVkXG5cbiAgICAgICAgICAgICAgICBpbnNlcnRpb25zICs9IDFcbiAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnaW5zZXJ0ZWQnLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG5pLCBhZnRlcjogbmwudGV4dFxuICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuXG4gICAgICAgIGNoYW5nZXM6IGNoYW5nZXNcbiAgICAgICAgaW5zZXJ0czogaW5zZXJ0aW9uc1xuICAgICAgICBkZWxldGVzOiBkZWxldGlvbnNcbiAgICAgICAgY3Vyc29yczogb2xkU3RhdGUucy5jdXJzb3JzICAgICE9IG5ld1N0YXRlLnMuY3Vyc29yc1xuICAgICAgICBzZWxlY3RzOiBvbGRTdGF0ZS5zLnNlbGVjdGlvbnMgIT0gbmV3U3RhdGUucy5zZWxlY3Rpb25zXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgIyBsb29rcyBhdCBsYXN0IHR3byBhY3Rpb25zIGFuZCBtZXJnZXMgdGhlbVxuICAgICMgICAgICAgd2hlbiB0aGV5IGNvbnRhaW4gbm8gbGluZSBjaGFuZ2VzXG4gICAgIyAgICAgICB3aGVuIHRoZXkgY29udGFpbiBvbmx5IGNoYW5nZXMgb2YgdGhlIHNhbWUgc2V0IG9mIGxpbmVzXG5cbiAgICBtZXJnZTogLT5cblxuICAgICAgICB3aGlsZSBAaGlzdG9yeS5sZW5ndGggPiAxXG4gICAgICAgICAgICBiID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoLTJdXG4gICAgICAgICAgICBhID0gbGFzdCBAaGlzdG9yeVxuICAgICAgICAgICAgaWYgYS5zLmxpbmVzID09IGIucy5saW5lc1xuICAgICAgICAgICAgICAgIGlmIEBoaXN0b3J5Lmxlbmd0aCA+IDJcbiAgICAgICAgICAgICAgICAgICAgQGhpc3Rvcnkuc3BsaWNlIEBoaXN0b3J5Lmxlbmd0aC0yLCAxXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgaWYgQGhpc3RvcnkubGVuZ3RoID4gMlxuICAgICAgICAgICAgICAgIGMgPSBAaGlzdG9yeVtAaGlzdG9yeS5sZW5ndGgtM11cbiAgICAgICAgICAgICAgICBpZiBhLm51bUxpbmVzKCkgPT0gYi5udW1MaW5lcygpID09IGMubnVtTGluZXMoKVxuICAgICAgICAgICAgICAgICAgICBmb3IgbGkgaW4gWzAuLi5hLm51bUxpbmVzKCldXG4gICAgICAgICAgICAgICAgICAgICAgICBsYSA9IGEucy5saW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxiID0gYi5zLmxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICAgICAgbGMgPSBjLnMubGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBsYSA9PSBsYiBhbmQgbGMgIT0gbGIgb3IgbGEgIT0gbGIgYW5kIGxjID09IGxiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIEBoaXN0b3J5LnNwbGljZSBAaGlzdG9yeS5sZW5ndGgtMiwgMVxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuXG4gICAgICAgICAgICBlbHNlIHJldHVyblxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGVhbkN1cnNvcnM6IChjcykgLT5cblxuICAgICAgICBmb3IgcCBpbiBjc1xuICAgICAgICAgICAgcFswXSA9IE1hdGgubWF4IHBbMF0sIDBcbiAgICAgICAgICAgIHBbMV0gPSBjbGFtcCAwLCBAc3RhdGUubnVtTGluZXMoKS0xLCBwWzFdXG5cbiAgICAgICAgc29ydFBvc2l0aW9ucyBjc1xuXG4gICAgICAgIGlmIGNzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGZvciBjaSBpbiBbY3MubGVuZ3RoLTEuLi4wXVxuICAgICAgICAgICAgICAgIGMgPSBjc1tjaV1cbiAgICAgICAgICAgICAgICBwID0gY3NbY2ktMV1cbiAgICAgICAgICAgICAgICBpZiBjWzFdID09IHBbMV0gYW5kIGNbMF0gPT0gcFswXVxuICAgICAgICAgICAgICAgICAgICBjcy5zcGxpY2UgY2ksIDFcbiAgICAgICAgY3NcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB0ZXh0OiAgICAgICAgICAgIC0+IEBzdGF0ZS50ZXh0KClcbiAgICBsaW5lOiAgICAgICAgKGkpIC0+IEBzdGF0ZS5saW5lIGlcbiAgICBjdXJzb3I6ICAgICAgKGkpIC0+IEBzdGF0ZS5jdXJzb3IgaVxuICAgIGhpZ2hsaWdodDogICAoaSkgLT4gQHN0YXRlLmhpZ2hsaWdodCBpXG4gICAgc2VsZWN0aW9uOiAgIChpKSAtPiBAc3RhdGUuc2VsZWN0aW9uIGlcblxuICAgIGxpbmVzOiAgICAgICAgICAgLT4gQHN0YXRlLmxpbmVzKClcbiAgICBjdXJzb3JzOiAgICAgICAgIC0+IEBzdGF0ZS5jdXJzb3JzKClcbiAgICBoaWdobGlnaHRzOiAgICAgIC0+IEBzdGF0ZS5oaWdobGlnaHRzKClcbiAgICBzZWxlY3Rpb25zOiAgICAgIC0+IEBzdGF0ZS5zZWxlY3Rpb25zKClcblxuICAgIG51bUxpbmVzOiAgICAgICAgLT4gQHN0YXRlLm51bUxpbmVzKClcbiAgICBudW1DdXJzb3JzOiAgICAgIC0+IEBzdGF0ZS5udW1DdXJzb3JzKClcbiAgICBudW1TZWxlY3Rpb25zOiAgIC0+IEBzdGF0ZS5udW1TZWxlY3Rpb25zKClcbiAgICBudW1IaWdobGlnaHRzOiAgIC0+IEBzdGF0ZS5udW1IaWdobGlnaHRzKClcblxuICAgIHRleHRJblJhbmdlOiAocikgLT4gQHN0YXRlLmxpbmUoclswXSk/LnNsaWNlIHJbMV1bMF0sIHJbMV1bMV1cbiAgICBtYWluQ3Vyc29yOiAgICAgIC0+IEBzdGF0ZS5tYWluQ3Vyc29yKClcbiAgICByYW5nZUZvckxpbmVBdEluZGV4OiAoaSkgLT4gW2ksIFswLCBAbGluZShpKS5sZW5ndGhdXVxuXG5tb2R1bGUuZXhwb3J0cyA9IERvXG4iXX0=
//# sourceURL=../../coffee/editor/do.coffee