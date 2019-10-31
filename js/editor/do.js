// koffee 1.4.0

/*
0000000     0000000
000   000  000   000
000   000  000   000
000   000  000   000
0000000     0000000
 */
var Do, State, _, clamp, empty, kerror, klog, last, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, kerror = ref.kerror, empty = ref.empty, clamp = ref.clamp, last = ref.last, klog = ref.klog, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG8uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHlEQUFBO0lBQUE7O0FBUUEsTUFBZ0QsT0FBQSxDQUFRLEtBQVIsQ0FBaEQsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGlCQUF2QixFQUE4QixlQUE5QixFQUFvQyxlQUFwQyxFQUEwQzs7QUFFMUMsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztBQUNSLE9BQUEsQ0FBUSxpQkFBUjs7QUFFTTtJQUVDLFlBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOztRQUVBLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLGlCQUFSLEVBQTJCLElBQUMsQ0FBQSxpQkFBNUI7SUFKRDs7aUJBTUgsR0FBQSxHQUFLLFNBQUE7ZUFBRyxJQUFJLENBQUMsY0FBTCxDQUFvQixpQkFBcEIsRUFBdUMsSUFBQyxDQUFBLGlCQUF4QztJQUFIOztpQkFFTCxpQkFBQSxHQUFtQixTQUFDLElBQUQsRUFBTyxXQUFQO1FBQ2YsSUFBRyxJQUFBLEtBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFuQjttQkFDSSxJQUFDLENBQUEsY0FBRCxDQUFnQixXQUFoQixFQURKOztJQURlOztpQkFJbkIsY0FBQSxHQUFnQixTQUFDLFdBQUQ7QUFDWixZQUFBO1FBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQUNBLGFBQUEsNkNBQUE7O1lBQ0ksSUFBRyxNQUFNLENBQUMsTUFBUCxLQUFpQixTQUFqQixJQUFtQyxzQkFBdEM7Z0JBQ0ksTUFBQSxDQUFPLGlDQUFBLEdBQWtDLE1BQXpDO0FBQ0EseUJBRko7O0FBR0Esb0JBQU8sTUFBTSxDQUFDLE1BQWQ7QUFBQSxxQkFDUyxTQURUO29CQUN5QixJQUFDLENBQUEsTUFBRCxDQUFRLE1BQU0sQ0FBQyxPQUFmLEVBQXdCLE1BQU0sQ0FBQyxLQUEv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QUE7ZUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsQ0FBQTtJQUFIOztpQkFDakIsVUFBQSxHQUFpQixTQUFBO2VBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFQLENBQUE7SUFBSDs7aUJBRWpCLFFBQUEsR0FBaUIsU0FBQTtlQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBUCxDQUFBO0lBQUg7O2lCQUNqQixVQUFBLEdBQWlCLFNBQUE7ZUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsQ0FBQTtJQUFIOztpQkFDakIsYUFBQSxHQUFpQixTQUFBO2VBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxhQUFQLENBQUE7SUFBSDs7aUJBQ2pCLGFBQUEsR0FBaUIsU0FBQTtlQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsYUFBUCxDQUFBO0lBQUg7O2lCQUVqQixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTs0REFBaUIsQ0FBRSxLQUFuQixDQUF5QixDQUFFLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUE5QixFQUFrQyxDQUFFLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUF2QztJQUFQOztpQkFDYixVQUFBLEdBQWlCLFNBQUE7ZUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsQ0FBQTtJQUFIOztpQkFDakIsbUJBQUEsR0FBcUIsU0FBQyxDQUFEO2VBQU8sQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFELEVBQUksSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFOLENBQVEsQ0FBQyxNQUFiLENBQUo7SUFBUDs7Ozs7O0FBRXpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwICAgICAwMDAwMDAwXG4jIyNcblxueyBwb3N0LCBrZXJyb3IsIGVtcHR5LCBjbGFtcCwgbGFzdCwga2xvZywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TdGF0ZSA9IHJlcXVpcmUgJy4vc3RhdGUnXG5yZXF1aXJlICcuLi90b29scy9yYW5nZXMnXG5cbmNsYXNzIERvXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAcmVzZXQoKVxuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVMaW5lQ2hhbmdlcycsIEBvbkZpbGVMaW5lQ2hhbmdlc1xuXG4gICAgZGVsOiAtPiBwb3N0LnJlbW92ZUxpc3RlbmVyICdmaWxlTGluZUNoYW5nZXMnLCBAb25GaWxlTGluZUNoYW5nZXNcblxuICAgIG9uRmlsZUxpbmVDaGFuZ2VzOiAoZmlsZSwgbGluZUNoYW5nZXMpID0+XG4gICAgICAgIGlmIGZpbGUgPT0gQGVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgQGZvcmVpZ25DaGFuZ2VzIGxpbmVDaGFuZ2VzXG5cbiAgICBmb3JlaWduQ2hhbmdlczogKGxpbmVDaGFuZ2VzKSAtPlxuICAgICAgICBAc3RhcnQoKVxuICAgICAgICBmb3IgY2hhbmdlIGluIGxpbmVDaGFuZ2VzXG4gICAgICAgICAgICBpZiBjaGFuZ2UuY2hhbmdlICE9ICdkZWxldGVkJyBhbmQgbm90IGNoYW5nZS5hZnRlcj9cbiAgICAgICAgICAgICAgICBrZXJyb3IgXCJEby5mb3JlaWduQ2hhbmdlcyAtLSBubyBhZnRlcj8gI3tjaGFuZ2V9XCJcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3dpdGNoIGNoYW5nZS5jaGFuZ2VcbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyAgdGhlbiBAY2hhbmdlIGNoYW5nZS5kb0luZGV4LCBjaGFuZ2UuYWZ0ZXJcbiAgICAgICAgICAgICAgICB3aGVuICdpbnNlcnRlZCcgdGhlbiBAaW5zZXJ0IGNoYW5nZS5kb0luZGV4LCBjaGFuZ2UuYWZ0ZXJcbiAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJyAgdGhlbiBAZGVsZXRlIGNoYW5nZS5kb0luZGV4XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBrZXJyb3IgXCJEby5mb3JlaWduQ2hhbmdlcyAtLSB1bmtub3duIGNoYW5nZSAje2NoYW5nZS5jaGFuZ2V9XCJcbiAgICAgICAgQGVuZCBmb3JlaWduOiB0cnVlXG5cbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdGFiU3RhdGU6IC0+XG5cbiAgICAgICAgaGlzdG9yeTogQGhpc3RvcnlcbiAgICAgICAgcmVkb3M6ICAgQHJlZG9zXG4gICAgICAgIHN0YXRlOiAgIEBzdGF0ZVxuICAgICAgICBmaWxlOiAgICBAZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiAgICBzZXRUYWJTdGF0ZTogKHN0YXRlKSAtPlxuXG4gICAgICAgIEBlZGl0b3IucmVzdG9yZUZyb21UYWJTdGF0ZSBzdGF0ZVxuXG4gICAgICAgIEBncm91cENvdW50ID0gMFxuICAgICAgICBAaGlzdG9yeSA9IHN0YXRlLmhpc3RvcnlcbiAgICAgICAgQHJlZG9zICAgPSBzdGF0ZS5yZWRvc1xuICAgICAgICBAc3RhdGUgICA9IHN0YXRlLnN0YXRlXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgcmVzZXQ6IC0+XG5cbiAgICAgICAgQGdyb3VwQ291bnQgPSAwXG4gICAgICAgIEBoaXN0b3J5ID0gW11cbiAgICAgICAgQHJlZG9zICAgPSBbXVxuICAgICAgICBAc3RhdGUgICA9IG51bGxcblxuICAgIGhhc0xpbmVDaGFuZ2VzOiAtPlxuXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBAaGlzdG9yeS5sZW5ndGggPT0gMFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgXy5maXJzdChAaGlzdG9yeSkucy5saW5lcyA9PSBAZWRpdG9yLnN0YXRlLnMubGluZXNcbiAgICAgICAgXy5maXJzdChAaGlzdG9yeSkudGV4dCgpICE9IEBlZGl0b3IudGV4dCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0OiAtPlxuXG4gICAgICAgIEBncm91cENvdW50ICs9IDFcbiAgICAgICAgaWYgQGdyb3VwQ291bnQgPT0gMVxuICAgICAgICAgICAgQHN0YXJ0U3RhdGUgPSBAc3RhdGUgPSBuZXcgU3RhdGUgQGVkaXRvci5zdGF0ZS5zXG4gICAgICAgICAgICBpZiBlbXB0eShAaGlzdG9yeSkgb3IgQHN0YXRlLnMgIT0gbGFzdChAaGlzdG9yeSkuc1xuICAgICAgICAgICAgICAgIEBoaXN0b3J5LnB1c2ggQHN0YXRlXG5cbiAgICBpc0RvaW5nOiAtPiBAZ3JvdXBDb3VudCA+IDBcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAgICAgICAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcblxuICAgIGNoYW5nZTogKGluZGV4LCB0ZXh0KSAtPiBAc3RhdGUgPSBAc3RhdGUuY2hhbmdlTGluZSBpbmRleCwgdGV4dFxuICAgIGluc2VydDogKGluZGV4LCB0ZXh0KSAtPiBAc3RhdGUgPSBAc3RhdGUuaW5zZXJ0TGluZSBpbmRleCwgdGV4dFxuICAgIGRlbGV0ZTogKGluZGV4KSAtPlxuICAgICAgICBpZiBAbnVtTGluZXMoKSA+PSAxIGFuZCAwIDw9IGluZGV4IDwgQG51bUxpbmVzKClcbiAgICAgICAgICAgIEBlZGl0b3IuZW1pdCAnd2lsbERlbGV0ZUxpbmUnLCBAbGluZSBpbmRleFxuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLmRlbGV0ZUxpbmUgaW5kZXhcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgZW5kOiAob3B0KSAtPlxuXG4gICAgICAgICMgISEhIE5PIGxvZyBIRVJFICEhIVxuXG4gICAgICAgIEByZWRvcyA9IFtdXG4gICAgICAgIEBncm91cENvdW50IC09IDFcbiAgICAgICAgaWYgQGdyb3VwQ291bnQgPT0gMFxuICAgICAgICAgICAgQG1lcmdlKClcbiAgICAgICAgICAgIGNoYW5nZXMgPSBAY2FsY3VsYXRlQ2hhbmdlcyBAc3RhcnRTdGF0ZSwgQHN0YXRlXG4gICAgICAgICAgICBjaGFuZ2VzLmZvcmVpZ24gPSBvcHQ/LmZvcmVpZ25cbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0U3RhdGUgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLmNoYW5nZWQ/IGNoYW5nZXNcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG5cbiAgICB1bmRvOiAtPlxuXG4gICAgICAgIGlmIEBoaXN0b3J5Lmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBfLmlzRW1wdHkgQHJlZG9zXG4gICAgICAgICAgICAgICAgQHJlZG9zLnVuc2hpZnQgQGVkaXRvci5zdGF0ZVxuXG4gICAgICAgICAgICBAc3RhdGUgPSBAaGlzdG9yeS5wb3AoKVxuICAgICAgICAgICAgQHJlZG9zLnVuc2hpZnQgQHN0YXRlXG5cbiAgICAgICAgICAgIGNoYW5nZXMgPSBAY2FsY3VsYXRlQ2hhbmdlcyBAZWRpdG9yLnN0YXRlLCBAc3RhdGVcbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0U3RhdGUgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLmNoYW5nZWQ/IGNoYW5nZXNcbiAgICAgICAgICAgIEBlZGl0b3IuZW1pdCAndW5kb25lJ1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwXG5cbiAgICByZWRvOiAtPlxuXG4gICAgICAgIGlmIEByZWRvcy5sZW5ndGhcblxuICAgICAgICAgICAgaWYgQHJlZG9zLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICBAaGlzdG9yeS5wdXNoIEByZWRvcy5zaGlmdCgpXG5cbiAgICAgICAgICAgIEBzdGF0ZSA9IF8uZmlyc3QgQHJlZG9zXG4gICAgICAgICAgICBpZiBAcmVkb3MubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgICBAcmVkb3MgPSBbXVxuXG4gICAgICAgICAgICBjaGFuZ2VzID0gQGNhbGN1bGF0ZUNoYW5nZXMgQGVkaXRvci5zdGF0ZSwgQHN0YXRlXG4gICAgICAgICAgICBAZWRpdG9yLnNldFN0YXRlIEBzdGF0ZVxuICAgICAgICAgICAgQGVkaXRvci5jaGFuZ2VkPyBjaGFuZ2VzXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ3JlZG9uZSdcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMFxuXG4gICAgc2VsZWN0OiAobmV3U2VsZWN0aW9ucykgLT5cblxuICAgICAgICBpZiBuZXdTZWxlY3Rpb25zLmxlbmd0aFxuICAgICAgICAgICAgbmV3U2VsZWN0aW9ucyA9IGNsZWFuUmFuZ2VzIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRTZWxlY3Rpb25zIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLnNldFNlbGVjdGlvbnMgW11cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBzZXRDdXJzb3JzOiAobmV3Q3Vyc29ycywgb3B0KSAtPlxuXG4gICAgICAgICMga2xvZyAnZG8uc2V0Q3Vyc29ycycgbmV3Q3Vyc29yc1xuICAgICAgICBcbiAgICAgICAgaWYgbm90IG5ld0N1cnNvcnM/IG9yIG5ld0N1cnNvcnMubGVuZ3RoIDwgMVxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkRvLnNldEN1cnNvcnMgLS0gZW1wdHkgY3Vyc29ycz9cIlxuXG4gICAgICAgIGlmIG9wdD8ubWFpblxuICAgICAgICAgICAgc3dpdGNoIG9wdC5tYWluXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlyc3QnIHRoZW4gbWFpbkluZGV4ID0gMFxuICAgICAgICAgICAgICAgIHdoZW4gJ2xhc3QnICB0aGVuIG1haW5JbmRleCA9IG5ld0N1cnNvcnMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICB3aGVuICdjbG9zZXN0J1xuICAgICAgICAgICAgICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmluZGV4T2YgcG9zQ2xvc2VzdFRvUG9zSW5Qb3NpdGlvbnMgQGVkaXRvci5tYWluQ3Vyc29yKCksIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG1haW5JbmRleCA9IG5ld0N1cnNvcnMuaW5kZXhPZiBvcHQubWFpblxuICAgICAgICAgICAgICAgICAgICBtYWluSW5kZXggPSBwYXJzZUludCBvcHQubWFpbiBpZiBtYWluSW5kZXggPCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1haW5JbmRleCA9IG5ld0N1cnNvcnMubGVuZ3RoLTFcblxuICAgICAgICBtYWluQ3Vyc29yID0gbmV3Q3Vyc29yc1ttYWluSW5kZXhdXG4gICAgICAgIEBjbGVhbkN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBtYWluSW5kZXggPSBuZXdDdXJzb3JzLmluZGV4T2YgcG9zQ2xvc2VzdFRvUG9zSW5Qb3NpdGlvbnMgbWFpbkN1cnNvciwgbmV3Q3Vyc29yc1xuXG4gICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQHN0YXRlID0gQHN0YXRlLnNldE1haW4gbWFpbkluZGV4XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgJ3NldEN1cnNvcnMnIEBlZGl0b3IubWFpbkN1cnNvcigpWzFdIGlmIEBlZGl0b3IubmFtZSA9PSAnZWRpdG9yJ1xuICAgICAgICAjIEBzdGF0ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGNhbGN1bGF0ZUNoYW5nZXM6IChvbGRTdGF0ZSwgbmV3U3RhdGUpIC0+XG5cbiAgICAgICAgb2kgPSAwICMgaW5kZXggaW4gb2xkU3RhdGVcbiAgICAgICAgbmkgPSAwICMgaW5kZXggaW4gbmV3U3RhdGVcbiAgICAgICAgZGQgPSAwICMgZGVsdGEgZm9yIGRvSW5kZXhcbiAgICAgICAgY2hhbmdlcyA9IFtdXG5cbiAgICAgICAgb2xkTGluZXMgPSBvbGRTdGF0ZS5zLmxpbmVzICMgd2UgYXJlIHdvcmtpbmcgb24gcmF3XG4gICAgICAgIG5ld0xpbmVzID0gbmV3U3RhdGUucy5saW5lcyAjIGltbXV0YWJsZXMgaGVyZSFcblxuICAgICAgICBpbnNlcnRpb25zID0gMCAjIG51bWJlciBvZiBpbnNlcnRpb25zXG4gICAgICAgIGRlbGV0aW9ucyAgPSAwICMgbnVtYmVyIG9mIGRlbGV0aW9uc1xuXG4gICAgICAgIGlmIG9sZExpbmVzICE9IG5ld0xpbmVzXG5cbiAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuXG4gICAgICAgICAgICB3aGlsZSBvaSA8IG9sZExpbmVzLmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgaWYgbm90IG5sPyAjIG5ldyBzdGF0ZSBoYXMgbm90IGVub3VnaCBsaW5lcywgbWFyayByZW1haW5pbmcgbGluZXMgaW4gb2xkU3RhdGUgYXMgZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICBkZWxldGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnZGVsZXRlZCcsIG9sZEluZGV4OiBvaSwgZG9JbmRleDogb2krZGRcbiAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICBkZCAtPSAxXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9sID09IG5sICMgc2FtZSBsaW5lcyBpbiBvbGQgYW5kIG5ld1xuICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgIG9sID0gb2xkTGluZXNbb2ldXG4gICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0cyA9IG5ld0xpbmVzLnNsaWNlKG5pKS5maW5kSW5kZXggKHYpIC0+IHY9PW9sICMgaW5zZXJ0aW9uXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZXMgPSBvbGRMaW5lcy5zbGljZShvaSkuZmluZEluZGV4ICh2KSAtPiB2PT1ubCAjIGRlbGV0aW9uXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5zZXJ0cyA+IDAgYW5kIChkZWxldGVzIDw9IDAgb3IgaW5zZXJ0cyA8IGRlbGV0ZXMpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIGluc2VydHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnaW5zZXJ0ZWQnLCBuZXdJbmRleDogbmksIGRvSW5kZXg6IG9pK2RkLCBhZnRlcjogbmwudGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZCArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0cyAtPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0aW9ucyArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBubCA9IG5ld0xpbmVzW25pXVxuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZGVsZXRlcyA+IDAgYW5kIChpbnNlcnRzIDw9IDAgb3IgZGVsZXRlcyA8IGluc2VydHMpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIGRlbGV0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnZGVsZXRlZCcsIG9sZEluZGV4OiBvaSwgZG9JbmRleDogb2krZGRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGQgLT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZXMgLT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0aW9ucyArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgIyBjaGFuZ2VcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTogJ2NoYW5nZWQnLCBvbGRJbmRleDogb2ksIG5ld0luZGV4OiBuaSwgZG9JbmRleDogb2krZGQsIGFmdGVyOiBubC50ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICBvaSArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBvbCA9IG9sZExpbmVzW29pXVxuICAgICAgICAgICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgbmwgPSBuZXdMaW5lc1tuaV1cblxuICAgICAgICAgICAgd2hpbGUgbmkgPCBuZXdMaW5lcy5sZW5ndGggIyBtYXJrIHJlbWFpbmcgbGluZXMgaW4gbmV3U3RhdGUgYXMgaW5zZXJ0ZWRcblxuICAgICAgICAgICAgICAgIGluc2VydGlvbnMgKz0gMVxuICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6ICdpbnNlcnRlZCcsIG5ld0luZGV4OiBuaSwgZG9JbmRleDogbmksIGFmdGVyOiBubC50ZXh0XG4gICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgIG5sID0gbmV3TGluZXNbbmldXG5cbiAgICAgICAgY2hhbmdlczogY2hhbmdlc1xuICAgICAgICBpbnNlcnRzOiBpbnNlcnRpb25zXG4gICAgICAgIGRlbGV0ZXM6IGRlbGV0aW9uc1xuICAgICAgICBjdXJzb3JzOiBvbGRTdGF0ZS5zLmN1cnNvcnMgICAgIT0gbmV3U3RhdGUucy5jdXJzb3JzXG4gICAgICAgIHNlbGVjdHM6IG9sZFN0YXRlLnMuc2VsZWN0aW9ucyAhPSBuZXdTdGF0ZS5zLnNlbGVjdGlvbnNcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICAjIGxvb2tzIGF0IGxhc3QgdHdvIGFjdGlvbnMgYW5kIG1lcmdlcyB0aGVtXG4gICAgIyAgICAgICB3aGVuIHRoZXkgY29udGFpbiBubyBsaW5lIGNoYW5nZXNcbiAgICAjICAgICAgIHdoZW4gdGhleSBjb250YWluIG9ubHkgY2hhbmdlcyBvZiB0aGUgc2FtZSBzZXQgb2YgbGluZXNcblxuICAgIG1lcmdlOiAtPlxuXG4gICAgICAgIHdoaWxlIEBoaXN0b3J5Lmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGIgPSBAaGlzdG9yeVtAaGlzdG9yeS5sZW5ndGgtMl1cbiAgICAgICAgICAgIGEgPSBsYXN0IEBoaXN0b3J5XG4gICAgICAgICAgICBpZiBhLnMubGluZXMgPT0gYi5zLmxpbmVzXG4gICAgICAgICAgICAgICAgaWYgQGhpc3RvcnkubGVuZ3RoID4gMlxuICAgICAgICAgICAgICAgICAgICBAaGlzdG9yeS5zcGxpY2UgQGhpc3RvcnkubGVuZ3RoLTIsIDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgZWxzZSBpZiBAaGlzdG9yeS5sZW5ndGggPiAyXG4gICAgICAgICAgICAgICAgYyA9IEBoaXN0b3J5W0BoaXN0b3J5Lmxlbmd0aC0zXVxuICAgICAgICAgICAgICAgIGlmIGEubnVtTGluZXMoKSA9PSBiLm51bUxpbmVzKCkgPT0gYy5udW1MaW5lcygpXG4gICAgICAgICAgICAgICAgICAgIGZvciBsaSBpbiBbMC4uLmEubnVtTGluZXMoKV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxhID0gYS5zLmxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICAgICAgbGIgPSBiLnMubGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgICAgICBsYyA9IGMucy5saW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGxhID09IGxiIGFuZCBsYyAhPSBsYiBvciBsYSAhPSBsYiBhbmQgbGMgPT0gbGJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgQGhpc3Rvcnkuc3BsaWNlIEBoaXN0b3J5Lmxlbmd0aC0yLCAxXG4gICAgICAgICAgICAgICAgZWxzZSByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgcmV0dXJuXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFuQ3Vyc29yczogKGNzKSAtPlxuXG4gICAgICAgIGZvciBwIGluIGNzXG4gICAgICAgICAgICBwWzBdID0gTWF0aC5tYXggcFswXSwgMFxuICAgICAgICAgICAgcFsxXSA9IGNsYW1wIDAsIEBzdGF0ZS5udW1MaW5lcygpLTEsIHBbMV1cblxuICAgICAgICBzb3J0UG9zaXRpb25zIGNzXG5cbiAgICAgICAgaWYgY3MubGVuZ3RoID4gMVxuICAgICAgICAgICAgZm9yIGNpIGluIFtjcy5sZW5ndGgtMS4uLjBdXG4gICAgICAgICAgICAgICAgYyA9IGNzW2NpXVxuICAgICAgICAgICAgICAgIHAgPSBjc1tjaS0xXVxuICAgICAgICAgICAgICAgIGlmIGNbMV0gPT0gcFsxXSBhbmQgY1swXSA9PSBwWzBdXG4gICAgICAgICAgICAgICAgICAgIGNzLnNwbGljZSBjaSwgMVxuICAgICAgICBjc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHRleHQ6ICAgICAgICAgICAgLT4gQHN0YXRlLnRleHQoKVxuICAgIGxpbmU6ICAgICAgICAoaSkgLT4gQHN0YXRlLmxpbmUgaVxuICAgIGN1cnNvcjogICAgICAoaSkgLT4gQHN0YXRlLmN1cnNvciBpXG4gICAgaGlnaGxpZ2h0OiAgIChpKSAtPiBAc3RhdGUuaGlnaGxpZ2h0IGlcbiAgICBzZWxlY3Rpb246ICAgKGkpIC0+IEBzdGF0ZS5zZWxlY3Rpb24gaVxuXG4gICAgbGluZXM6ICAgICAgICAgICAtPiBAc3RhdGUubGluZXMoKVxuICAgIGN1cnNvcnM6ICAgICAgICAgLT4gQHN0YXRlLmN1cnNvcnMoKVxuICAgIGhpZ2hsaWdodHM6ICAgICAgLT4gQHN0YXRlLmhpZ2hsaWdodHMoKVxuICAgIHNlbGVjdGlvbnM6ICAgICAgLT4gQHN0YXRlLnNlbGVjdGlvbnMoKVxuXG4gICAgbnVtTGluZXM6ICAgICAgICAtPiBAc3RhdGUubnVtTGluZXMoKVxuICAgIG51bUN1cnNvcnM6ICAgICAgLT4gQHN0YXRlLm51bUN1cnNvcnMoKVxuICAgIG51bVNlbGVjdGlvbnM6ICAgLT4gQHN0YXRlLm51bVNlbGVjdGlvbnMoKVxuICAgIG51bUhpZ2hsaWdodHM6ICAgLT4gQHN0YXRlLm51bUhpZ2hsaWdodHMoKVxuXG4gICAgdGV4dEluUmFuZ2U6IChyKSAtPiBAc3RhdGUubGluZShyWzBdKT8uc2xpY2UgclsxXVswXSwgclsxXVsxXVxuICAgIG1haW5DdXJzb3I6ICAgICAgLT4gQHN0YXRlLm1haW5DdXJzb3IoKVxuICAgIHJhbmdlRm9yTGluZUF0SW5kZXg6IChpKSAtPiBbaSwgWzAsIEBsaW5lKGkpLmxlbmd0aF1dXG5cbm1vZHVsZS5leHBvcnRzID0gRG9cbiJdfQ==
//# sourceURL=../../coffee/editor/do.coffee