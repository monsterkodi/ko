// koffee 0.56.0

/*
 0000000   0000000   000      000000000  00000000  00000000   
000       000   000  000         000     000       000   000  
0000000   000000000  000         000     0000000   0000000    
     000  000   000  000         000     000       000   000  
0000000   000   000  0000000     000     00000000  000   000
 */
var _, salt;

_ = require('kxk')._;

salt = require('../../tools/salt');

module.exports = {
    actions: {
        startSalter: {
            name: 'ASCII Header Mode',
            text: "if cursor is not in ascii-header: \ninsert ascii-header of text in selection or word at cursor.\nswitch to ascii-header mode in any case.",
            combo: 'command+3',
            accel: 'ctrl+3'
        }
    },
    startSalter: function(opt) {
        var ci, col, cols, cp, indt, j, len, li, newCursors, r, ref, rgs, s, stxt, word;
        cp = this.cursorPos();
        if (!(opt != null ? opt.word : void 0) && (rgs = this.salterRangesAtPos(cp))) {
            cols = this.columnsInSalt((function() {
                var j, len, results;
                results = [];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    results.push(this.textInRange(r));
                }
                return results;
            }).call(this));
            ci = 0;
            while (ci < cols.length && cp[0] > cols[ci]) {
                ci += 1;
            }
            col = cols[ci];
            this["do"].start();
            newCursors = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    results.push([col, r[0]]);
                }
                return results;
            })();
            this["do"].setCursors(newCursors, {
                main: 'last'
            });
            this["do"].select([]);
            this["do"].end();
        } else {
            word = (ref = opt != null ? opt.word : void 0) != null ? ref : this.selectionTextOrWordAtCursor().trim();
            if (this.textInRange(this.rangeForLineAtIndex(cp[1])).trim().length) {
                indt = _.padStart('', this.indentationAtLineIndex(cp[1]));
            } else {
                indt = this.indentStringForLineAtIndex(cp[1]);
            }
            stxt = word.length && salt(word).split('\n') || ['', '', '', '', ''];
            stxt = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = stxt.length; j < len; j++) {
                    s = stxt[j];
                    results.push("" + indt + this.lineComment + " " + s + "  ");
                }
                return results;
            }).call(this);
            this["do"].start();
            newCursors = [];
            li = cp[1];
            for (j = 0, len = stxt.length; j < len; j++) {
                s = stxt[j];
                this["do"].insert(li, s);
                if (s.endsWith(this.lineComment + "   ")) {
                    newCursors.push([s.length - 2, li]);
                } else {
                    newCursors.push([s.length, li]);
                }
                li += 1;
            }
            this["do"].setCursors(newCursors, {
                main: 'last'
            });
            this["do"].select([]);
            this["do"].end();
        }
        return this.setSalterMode(true);
    },
    endSalter: function() {
        return this.setSalterMode(false);
    },
    setSalterMode: function(active) {
        var ref, ref1;
        if (active == null) {
            active = true;
        }
        this.salterMode = active;
        return (ref = this.layerDict) != null ? (ref1 = ref['cursors']) != null ? ref1.classList.toggle("salterMode", active) : void 0 : void 0;
    },
    insertSalterCharacter: function(ch) {
        var char, s, salted;
        if (ch === ' ') {
            char = ['    ', '    ', '    ', '    ', '    '];
        } else {
            char = salt(ch).split('\n');
        }
        if (char.length === 5) {
            salted = ((function() {
                var j, len, results;
                results = [];
                for (j = 0, len = char.length; j < len; j++) {
                    s = char[j];
                    results.push(s + "  ");
                }
                return results;
            })()).join('\n');
            this.pasteText(salted);
        } else {
            this.setSalterMode(false);
        }
        return true;
    },
    deleteSalterCharacter: function() {
        var ci, cols, cp, j, len, length, r, rgs, slt;
        if (!this.salterMode) {
            return;
        }
        this["do"].start();
        cp = this["do"].mainCursor();
        if (rgs = this.salterRangesAtPos(cp)) {
            slt = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    results.push(this["do"].textInRange(r));
                }
                return results;
            }).call(this);
            cols = this.columnsInSalt(slt);
            ci = cols.length - 1;
            while (ci > 0 && cols[ci - 1] >= cp[0]) {
                ci -= 1;
            }
            if (ci > 0) {
                length = cols[ci] - cols[ci - 1];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    this["do"].change(r[0], this["do"].line(r[0]).splice(cols[ci - 1], length));
                }
                this["do"].setCursors((function() {
                    var k, len1, results;
                    results = [];
                    for (k = 0, len1 = rgs.length; k < len1; k++) {
                        r = rgs[k];
                        results.push([cols[ci - 1], r[0]]);
                    }
                    return results;
                })());
            }
        }
        return this["do"].end();
    },
    checkSalterMode: function() {
        var cols, cs, r, rgs;
        if (this.salterMode) {
            this.setSalterMode(false);
            if (this["do"].numCursors() === 5 && positionsInContinuousLine(this["do"].cursors())) {
                cs = this["do"].cursors();
                rgs = this.salterRangesAtPos(this["do"].mainCursor());
                if ((rgs == null) || rgs[0][0] !== cs[0][1]) {
                    return;
                }
                cols = this.columnsInSalt((function() {
                    var j, len, results;
                    results = [];
                    for (j = 0, len = rgs.length; j < len; j++) {
                        r = rgs[j];
                        results.push(this["do"].textInRange(r));
                    }
                    return results;
                }).call(this));
                if (cs[0][0] < cols[0]) {
                    return;
                }
                return this.setSalterMode(true);
            }
        }
    },
    salterRangesAtPos: function(p) {
        var li, rgs, salterRegExp, state;
        salterRegExp = this.syntax.balancer.headerRegExp;
        rgs = [];
        li = p[1];
        state = this["do"].isDoing() && this["do"].state || this.state;
        while (rgs.length < 5 && li < state.numLines() && salterRegExp.test(state.line(li))) {
            rgs.push([li, [0, state.line(li).length]]);
            li += 1;
        }
        if (!rgs.length) {
            return;
        }
        li = p[1] - 1;
        while (rgs.length < 5 && li >= 0 && salterRegExp.test(state.line(li))) {
            rgs.unshift([li, [0, state.line(li).length]]);
            li -= 1;
        }
        if (rgs.length === 5) {
            return rgs;
        }
    },
    columnsInSalt: function(slt) {
        var col, cols, i, j, k, max, min, ref, ref1, ref2, s;
        min = _.min((function() {
            var j, len, results;
            results = [];
            for (j = 0, len = slt.length; j < len; j++) {
                s = slt[j];
                results.push(s.search(/0/));
            }
            return results;
        })());
        if (min < 0) {
            min = _.min((function() {
                var j, len, results;
                results = [];
                for (j = 0, len = slt.length; j < len; j++) {
                    s = slt[j];
                    results.push(s.search(/#/) + 1);
                }
                return results;
            })());
            return [min];
        }
        max = _.max((function() {
            var j, len, results;
            results = [];
            for (j = 0, len = slt.length; j < len; j++) {
                s = slt[j];
                results.push(s.length);
            }
            return results;
        })());
        cols = [min, max];
        for (col = j = ref = min, ref1 = max; ref <= ref1 ? j <= ref1 : j >= ref1; col = ref <= ref1 ? ++j : --j) {
            s = 0;
            for (i = k = 0; k < 5; i = ++k) {
                if ((ref2 = slt[i].substr(col - 2, 2)) === '  ' || ref2 === '# ') {
                    s += 1;
                }
            }
            if (s === 5) {
                cols.push(col);
            }
        }
        return _.sortBy(_.uniq(cols));
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FsdGVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxJQUFNLE9BQUEsQ0FBUSxLQUFSOztBQUVSLElBQUEsR0FBTyxPQUFBLENBQVEsa0JBQVI7O0FBRVAsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFFSTtRQUFBLFdBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxtQkFBTjtZQUNBLElBQUEsRUFBTSwySUFETjtZQUtBLEtBQUEsRUFBTyxXQUxQO1lBTUEsS0FBQSxFQUFPLFFBTlA7U0FESjtLQUZKO0lBaUJBLFdBQUEsRUFBYSxTQUFDLEdBQUQ7QUFFVCxZQUFBO1FBQUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxTQUFELENBQUE7UUFFTCxJQUFHLGdCQUFJLEdBQUcsQ0FBRSxjQUFULElBQWtCLENBQUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixFQUFuQixDQUFOLENBQXJCO1lBRUksSUFBQSxHQUFPLElBQUMsQ0FBQSxhQUFEOztBQUFnQjtxQkFBQSxxQ0FBQTs7aUNBQUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiO0FBQUE7O3lCQUFoQjtZQUNQLEVBQUEsR0FBSztBQUNMLG1CQUFNLEVBQUEsR0FBSyxJQUFJLENBQUMsTUFBVixJQUFxQixFQUFHLENBQUEsQ0FBQSxDQUFILEdBQVEsSUFBSyxDQUFBLEVBQUEsQ0FBeEM7Z0JBQ0ksRUFBQSxJQUFNO1lBRFY7WUFFQSxHQUFBLEdBQU0sSUFBSyxDQUFBLEVBQUE7WUFDWCxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1lBQ0EsVUFBQTs7QUFBYztxQkFBQSxxQ0FBQTs7aUNBQUEsQ0FBQyxHQUFELEVBQU0sQ0FBRSxDQUFBLENBQUEsQ0FBUjtBQUFBOzs7WUFDZCxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWYsRUFBMkI7Z0JBQUEs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QUZWO1FBR0EsSUFBYyxHQUFHLENBQUMsTUFBSixLQUFjLENBQTVCO0FBQUEsbUJBQU8sSUFBUDs7SUFmZSxDQXhJbkI7SUErSkEsYUFBQSxFQUFlLFNBQUMsR0FBRDtBQUVYLFlBQUE7UUFBQSxHQUFBLEdBQU0sQ0FBQyxDQUFDLEdBQUY7O0FBQU87aUJBQUEscUNBQUE7OzZCQUFBLENBQUMsQ0FBQyxNQUFGLENBQVMsR0FBVDtBQUFBOztZQUFQO1FBQ04sSUFBRyxHQUFBLEdBQU0sQ0FBVDtZQUNJLEdBQUEsR0FBTSxDQUFDLENBQUMsR0FBRjs7QUFBTztxQkFBQSxxQ0FBQTs7aUNBQUEsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxHQUFULENBQUEsR0FBYztBQUFkOztnQkFBUDtBQUNOLG1CQUFPLENBQUMsR0FBRCxFQUZYOztRQUdBLEdBQUEsR0FBTSxDQUFDLENBQUMsR0FBRjs7QUFBTztpQkFBQSxxQ0FBQTs7NkJBQUEsQ0FBQyxDQUFDO0FBQUY7O1lBQVA7UUFDTixJQUFBLEdBQU8sQ0FBQyxHQUFELEVBQU0sR0FBTjtBQUNQLGFBQVcsbUdBQVg7WUFDSSxDQUFBLEdBQUk7QUFDSixpQkFBUyx5QkFBVDtnQkFDSSxZQUFVLEdBQUksQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUFQLENBQWMsR0FBQSxHQUFJLENBQWxCLEVBQXFCLENBQXJCLEVBQUEsS0FBNEIsSUFBNUIsSUFBQSxJQUFBLEtBQWtDLElBQTVDO29CQUFBLENBQUEsSUFBSyxFQUFMOztBQURKO1lBRUEsSUFBa0IsQ0FBQSxLQUFLLENBQXZCO2dCQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsR0FBVixFQUFBOztBQUpKO2VBS0EsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxDQUFDLENBQUMsSUFBRixDQUFPLElBQVAsQ0FBVDtJQWJXLENBL0pmIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuc2FsdCA9IHJlcXVpcmUgJy4uLy4uL3Rvb2xzL3NhbHQnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICBcbiAgICBhY3Rpb25zOlxuICAgICAgICBcbiAgICAgICAgc3RhcnRTYWx0ZXI6XG4gICAgICAgICAgICBuYW1lOiAnQVNDSUkgSGVhZGVyIE1vZGUnXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJpZiBjdXJzb3IgaXMgbm90IGluIGFzY2lpLWhlYWRlcjogXG4gICAgICAgICAgICAgICAgaW5zZXJ0IGFzY2lpLWhlYWRlciBvZiB0ZXh0IGluIHNlbGVjdGlvbiBvciB3b3JkIGF0IGN1cnNvci5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggdG8gYXNjaWktaGVhZGVyIG1vZGUgaW4gYW55IGNhc2UuXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrMydcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCszJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHN0YXJ0U2FsdGVyOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgY3AgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBvcHQ/LndvcmQgYW5kIHJncyA9IEBzYWx0ZXJSYW5nZXNBdFBvcyBjcCAjIGVkaXQgZXhpc3RpbmcgaGVhZGVyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbHMgPSBAY29sdW1uc0luU2FsdCAoQHRleHRJblJhbmdlIHIgZm9yIHIgaW4gcmdzKVxuICAgICAgICAgICAgY2kgPSAwXG4gICAgICAgICAgICB3aGlsZSBjaSA8IGNvbHMubGVuZ3RoIGFuZCBjcFswXSA+IGNvbHNbY2ldXG4gICAgICAgICAgICAgICAgY2kgKz0gMVxuICAgICAgICAgICAgY29sID0gY29sc1tjaV1cbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gKFtjb2wsIHJbMF1dIGZvciByIGluIHJncylcbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46ICdsYXN0J1xuICAgICAgICAgICAgQGRvLnNlbGVjdCBbXVxuICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSAjIGNyZWF0ZSBuZXcgaGVhZGVyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdvcmQgPSBvcHQ/LndvcmQgPyBAc2VsZWN0aW9uVGV4dE9yV29yZEF0Q3Vyc29yKCkudHJpbSgpXG4gICAgICAgICAgICBpZiBAdGV4dEluUmFuZ2UoQHJhbmdlRm9yTGluZUF0SW5kZXggY3BbMV0pLnRyaW0oKS5sZW5ndGhcbiAgICAgICAgICAgICAgICBpbmR0ID0gXy5wYWRTdGFydCAnJywgQGluZGVudGF0aW9uQXRMaW5lSW5kZXggY3BbMV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpbmR0ID0gQGluZGVudFN0cmluZ0ZvckxpbmVBdEluZGV4IGNwWzFdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBzdHh0ID0gd29yZC5sZW5ndGggYW5kIHNhbHQod29yZCkuc3BsaXQoJ1xcbicpIG9yIFsnJywgJycsICcnLCAnJywgJyddXG4gICAgICAgICAgICBzdHh0ID0gKFwiI3tpbmR0fSN7QGxpbmVDb21tZW50fSAje3N9ICBcIiBmb3IgcyBpbiBzdHh0KVxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIG5ld0N1cnNvcnMgPSBbXVxuICAgICAgICAgICAgbGkgPSBjcFsxXVxuICAgICAgICAgICAgZm9yIHMgaW4gc3R4dFxuICAgICAgICAgICAgICAgIEBkby5pbnNlcnQgbGksIHNcbiAgICAgICAgICAgICAgICBpZiBzLmVuZHNXaXRoIFwiI3tAbGluZUNvbW1lbnR9ICAgXCJcbiAgICAgICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIFtzLmxlbmd0aC0yLCBsaV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMucHVzaCBbcy5sZW5ndGgsIGxpXVxuICAgICAgICAgICAgICAgIGxpICs9IDFcbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46ICdsYXN0J1xuICAgICAgICAgICAgQGRvLnNlbGVjdCBbXVxuICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIEBzZXRTYWx0ZXJNb2RlIHRydWVcblxuICAgIGVuZFNhbHRlcjogLT4gQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICBzZXRTYWx0ZXJNb2RlOiAoYWN0aXZlPXRydWUpIC0+XG4gICAgICAgIEBzYWx0ZXJNb2RlID0gYWN0aXZlXG4gICAgICAgIEBsYXllckRpY3Q/WydjdXJzb3JzJ10/LmNsYXNzTGlzdC50b2dnbGUgXCJzYWx0ZXJNb2RlXCIsIGFjdGl2ZVxuICAgICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGluc2VydFNhbHRlckNoYXJhY3RlcjogKGNoKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY2ggPT0gJyAnXG4gICAgICAgICAgICBjaGFyID0gWycgICAgJywgJyAgICAnLCAnICAgICcsICcgICAgJywgJyAgICAnXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjaGFyID0gc2FsdChjaCkuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBjaGFyLmxlbmd0aCA9PSA1XG4gICAgICAgICAgICBzYWx0ZWQgPSAoXCIje3N9ICBcIiBmb3IgcyBpbiBjaGFyKS5qb2luICdcXG4nXG4gICAgICAgICAgICBAcGFzdGVUZXh0IHNhbHRlZFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICAgICAgXG4gICAgICAgIHRydWVcbiAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBkZWxldGVTYWx0ZXJDaGFyYWN0ZXI6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBzYWx0ZXJNb2RlXG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBjcCA9IEBkby5tYWluQ3Vyc29yKClcbiAgICAgICAgaWYgcmdzID0gQHNhbHRlclJhbmdlc0F0UG9zIGNwXG4gICAgICAgICAgICBzbHQgPSAoQGRvLnRleHRJblJhbmdlIHIgZm9yIHIgaW4gcmdzKVxuICAgICAgICAgICAgY29scyA9IEBjb2x1bW5zSW5TYWx0IHNsdFxuICAgICAgICAgICAgY2kgPSBjb2xzLmxlbmd0aC0xXG4gICAgICAgICAgICB3aGlsZSBjaSA+IDAgYW5kIGNvbHNbY2ktMV0gPj0gY3BbMF1cbiAgICAgICAgICAgICAgICBjaSAtPSAxXG4gICAgICAgICAgICBpZiBjaSA+IDBcbiAgICAgICAgICAgICAgICBsZW5ndGggPSBjb2xzW2NpXS1jb2xzW2NpLTFdXG4gICAgICAgICAgICAgICAgZm9yIHIgaW4gcmdzXG4gICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgclswXSwgQGRvLmxpbmUoclswXSkuc3BsaWNlIGNvbHNbY2ktMV0sIGxlbmd0aFxuICAgICAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIChbY29sc1tjaS0xXSwgclswXV0gZm9yIHIgaW4gcmdzKVxuICAgICAgICBAZG8uZW5kKClcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjaGVja1NhbHRlck1vZGU6IC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgQHNhbHRlck1vZGVcbiAgICAgICAgXG4gICAgICAgICAgICBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgICAgIGlmIEBkby5udW1DdXJzb3JzKCkgPT0gNSBhbmQgcG9zaXRpb25zSW5Db250aW51b3VzTGluZSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICAgICAgY3MgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICAgICAgcmdzID0gQHNhbHRlclJhbmdlc0F0UG9zIEBkby5tYWluQ3Vyc29yKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IHJncz8gb3IgcmdzWzBdWzBdICE9IGNzWzBdWzFdXG4gICAgICAgICAgICAgICAgY29scyA9IEBjb2x1bW5zSW5TYWx0IChAZG8udGV4dEluUmFuZ2UocikgZm9yIHIgaW4gcmdzKVxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBjc1swXVswXSA8IGNvbHNbMF1cbiAgICAgICAgICAgICAgICBAc2V0U2FsdGVyTW9kZSB0cnVlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHNhbHRlclJhbmdlc0F0UG9zOiAocCkgLT5cbiAgICAgICAgXG4gICAgICAgICMgc2FsdGVyUmVnRXhwID0gbmV3IFJlZ0V4cCBcIl4oXFxcXHMqI3tfLmVzY2FwZVJlZ0V4cCBAbGluZUNvbW1lbnR9KT9cXFxccyowWzBcXFxcc10rJFwiXG4gICAgICAgIHNhbHRlclJlZ0V4cCA9IEBzeW50YXguYmFsYW5jZXIuaGVhZGVyUmVnRXhwXG4gICAgICAgIHJncyA9IFtdXG4gICAgICAgIGxpID0gcFsxXVxuICAgICAgICBzdGF0ZSA9IEBkby5pc0RvaW5nKCkgYW5kIEBkby5zdGF0ZSBvciBAc3RhdGVcbiAgICAgICAgd2hpbGUgcmdzLmxlbmd0aCA8IDUgYW5kIGxpIDwgc3RhdGUubnVtTGluZXMoKSBhbmQgc2FsdGVyUmVnRXhwLnRlc3Qgc3RhdGUubGluZShsaSlcbiAgICAgICAgICAgIHJncy5wdXNoIFtsaSwgWzAsIHN0YXRlLmxpbmUobGkpLmxlbmd0aF1dIFxuICAgICAgICAgICAgbGkgKz0gMVxuICAgICAgICByZXR1cm4gaWYgbm90IHJncy5sZW5ndGhcbiAgICAgICAgbGkgPSBwWzFdLTFcbiAgICAgICAgd2hpbGUgcmdzLmxlbmd0aCA8IDUgYW5kIGxpID49IDAgYW5kIHNhbHRlclJlZ0V4cC50ZXN0IHN0YXRlLmxpbmUobGkpXG4gICAgICAgICAgICByZ3MudW5zaGlmdCBbbGksIFswLCBzdGF0ZS5saW5lKGxpKS5sZW5ndGhdXVxuICAgICAgICAgICAgbGkgLT0gMVxuICAgICAgICByZXR1cm4gcmdzIGlmIHJncy5sZW5ndGggPT0gNVxuICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY29sdW1uc0luU2FsdDogKHNsdCkgLT5cbiAgICAgICAgXG4gICAgICAgIG1pbiA9IF8ubWluIChzLnNlYXJjaCAvMC8gZm9yIHMgaW4gc2x0KVxuICAgICAgICBpZiBtaW4gPCAwXG4gICAgICAgICAgICBtaW4gPSBfLm1pbiAocy5zZWFyY2goLyMvKSsxIGZvciBzIGluIHNsdClcbiAgICAgICAgICAgIHJldHVybiBbbWluXVxuICAgICAgICBtYXggPSBfLm1heCAocy5sZW5ndGggZm9yIHMgaW4gc2x0KVxuICAgICAgICBjb2xzID0gW21pbiwgbWF4XVxuICAgICAgICBmb3IgY29sIGluIFttaW4uLm1heF1cbiAgICAgICAgICAgIHMgPSAwXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLjVdXG4gICAgICAgICAgICAgICAgcyArPSAxIGlmIHNsdFtpXS5zdWJzdHIoY29sLTIsIDIpIGluIFsnICAnLCAnIyAnXVxuICAgICAgICAgICAgY29scy5wdXNoKGNvbCkgaWYgcyA9PSA1XG4gICAgICAgIF8uc29ydEJ5IF8udW5pcSBjb2xzXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/salter.coffee