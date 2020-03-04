// koffee 1.11.0

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
        var li, rgs, state;
        rgs = [];
        li = p[1];
        state = this["do"].isDoing() && this["do"].state || this.state;
        while (rgs.length < 5 && li < state.numLines() && this.headerRegExp.test(state.line(li))) {
            rgs.push([li, [0, state.line(li).length]]);
            li += 1;
        }
        if (!rgs.length) {
            return;
        }
        li = p[1] - 1;
        while (rgs.length < 5 && li >= 0 && this.headerRegExp.test(state.line(li))) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FsdGVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsic2FsdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxJQUFNLE9BQUEsQ0FBUSxLQUFSOztBQUVSLElBQUEsR0FBTyxPQUFBLENBQVEsa0JBQVI7O0FBRVAsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFFSTtRQUFBLFdBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxtQkFBTjtZQUNBLElBQUEsRUFBTSwySUFETjtZQUtBLEtBQUEsRUFBTyxXQUxQO1lBTUEsS0FBQSxFQUFPLFFBTlA7U0FESjtLQUZKO0lBaUJBLFdBQUEsRUFBYSxTQUFDLEdBQUQ7QUFFVCxZQUFBO1FBQUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxTQUFELENBQUE7UUFFTCxJQUFHLGdCQUFJLEdBQUcsQ0FBRSxjQUFULElBQWtCLENBQUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixFQUFuQixDQUFOLENBQXJCO1lBRUksSUFBQSxHQUFPLElBQUMsQ0FBQSxhQUFEOztBQUFnQjtxQkFBQSxxQ0FBQTs7aUNBQUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiO0FBQUE7O3lCQUFoQjtZQUNQLEVBQUEsR0FBSztBQUNMLG1CQUFNLEVBQUEsR0FBSyxJQUFJLENBQUMsTUFBVixJQUFxQixFQUFHLENBQUEsQ0FBQSxDQUFILEdBQVEsSUFBSyxDQUFBLEVBQUEsQ0FBeEM7Z0JBQ0ksRUFBQSxJQUFNO1lBRFY7WUFFQSxHQUFBLEdBQU0sSUFBSyxDQUFBLEVBQUE7WUFDWCxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1lBQ0EsVUFBQTs7QUFBYztxQkFBQSxxQ0FBQTs7aUNBQUEsQ0FBQyxHQUFELEVBQU0sQ0FBRSxDQUFBLENBQUEsQ0FBUjtBQUFBOzs7WUFDZCxJQUFDLEVBQUEs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WUFDQSxFQUFBLElBQU07UUFGVjtRQUdBLElBQWMsR0FBRyxDQUFDLE1BQUosS0FBYyxDQUE1QjtBQUFBLG1CQUFPLElBQVA7O0lBYmUsQ0F4SW5CO0lBNkpBLGFBQUEsRUFBZSxTQUFDLEdBQUQ7QUFFWCxZQUFBO1FBQUEsR0FBQSxHQUFNLENBQUMsQ0FBQyxHQUFGOztBQUFPO2lCQUFBLHFDQUFBOzs2QkFBQSxDQUFDLENBQUMsTUFBRixDQUFTLEdBQVQ7QUFBQTs7WUFBUDtRQUNOLElBQUcsR0FBQSxHQUFNLENBQVQ7WUFDSSxHQUFBLEdBQU0sQ0FBQyxDQUFDLEdBQUY7O0FBQU87cUJBQUEscUNBQUE7O2lDQUFBLENBQUMsQ0FBQyxNQUFGLENBQVMsR0FBVCxDQUFBLEdBQWM7QUFBZDs7Z0JBQVA7QUFDTixtQkFBTyxDQUFDLEdBQUQsRUFGWDs7UUFHQSxHQUFBLEdBQU0sQ0FBQyxDQUFDLEdBQUY7O0FBQU87aUJBQUEscUNBQUE7OzZCQUFBLENBQUMsQ0FBQztBQUFGOztZQUFQO1FBQ04sSUFBQSxHQUFPLENBQUMsR0FBRCxFQUFNLEdBQU47QUFDUCxhQUFXLG1HQUFYO1lBQ0ksQ0FBQSxHQUFJO0FBQ0osaUJBQVMseUJBQVQ7Z0JBQ0ksWUFBVSxHQUFJLENBQUEsQ0FBQSxDQUFFLENBQUMsTUFBUCxDQUFjLEdBQUEsR0FBSSxDQUFsQixFQUFxQixDQUFyQixFQUFBLEtBQTRCLElBQTVCLElBQUEsSUFBQSxLQUFrQyxJQUE1QztvQkFBQSxDQUFBLElBQUssRUFBTDs7QUFESjtZQUVBLElBQWtCLENBQUEsS0FBSyxDQUF2QjtnQkFBQSxJQUFJLENBQUMsSUFBTCxDQUFVLEdBQVYsRUFBQTs7QUFKSjtlQUtBLENBQUMsQ0FBQyxNQUFGLENBQVMsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFQLENBQVQ7SUFiVyxDQTdKZiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBfIH0gPSByZXF1aXJlICdreGsnXG5cbnNhbHQgPSByZXF1aXJlICcuLi8uLi90b29scy9zYWx0J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgXG4gICAgYWN0aW9uczpcbiAgICAgICAgXG4gICAgICAgIHN0YXJ0U2FsdGVyOlxuICAgICAgICAgICAgbmFtZTogJ0FTQ0lJIEhlYWRlciBNb2RlJ1xuICAgICAgICAgICAgdGV4dDogXCJcIlwiaWYgY3Vyc29yIGlzIG5vdCBpbiBhc2NpaS1oZWFkZXI6IFxuICAgICAgICAgICAgICAgIGluc2VydCBhc2NpaS1oZWFkZXIgb2YgdGV4dCBpbiBzZWxlY3Rpb24gb3Igd29yZCBhdCBjdXJzb3IuXG4gICAgICAgICAgICAgICAgc3dpdGNoIHRvIGFzY2lpLWhlYWRlciBtb2RlIGluIGFueSBjYXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kKzMnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrMydcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzdGFydFNhbHRlcjogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgb3B0Py53b3JkIGFuZCByZ3MgPSBAc2FsdGVyUmFuZ2VzQXRQb3MgY3AgIyBlZGl0IGV4aXN0aW5nIGhlYWRlclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb2xzID0gQGNvbHVtbnNJblNhbHQgKEB0ZXh0SW5SYW5nZSByIGZvciByIGluIHJncylcbiAgICAgICAgICAgIGNpID0gMFxuICAgICAgICAgICAgd2hpbGUgY2kgPCBjb2xzLmxlbmd0aCBhbmQgY3BbMF0gPiBjb2xzW2NpXVxuICAgICAgICAgICAgICAgIGNpICs9IDFcbiAgICAgICAgICAgIGNvbCA9IGNvbHNbY2ldXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IChbY29sLCByWzBdXSBmb3IgciBpbiByZ3MpXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOiAnbGFzdCdcbiAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgIyBjcmVhdGUgbmV3IGhlYWRlclxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3b3JkID0gb3B0Py53b3JkID8gQHNlbGVjdGlvblRleHRPcldvcmRBdEN1cnNvcigpLnRyaW0oKVxuICAgICAgICAgICAgaWYgQHRleHRJblJhbmdlKEByYW5nZUZvckxpbmVBdEluZGV4IGNwWzFdKS50cmltKCkubGVuZ3RoXG4gICAgICAgICAgICAgICAgaW5kdCA9IF8ucGFkU3RhcnQgJycsIEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGNwWzFdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW5kdCA9IEBpbmRlbnRTdHJpbmdGb3JMaW5lQXRJbmRleCBjcFsxXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgc3R4dCA9IHdvcmQubGVuZ3RoIGFuZCBzYWx0KHdvcmQpLnNwbGl0KCdcXG4nKSBvciBbJycsICcnLCAnJywgJycsICcnXVxuICAgICAgICAgICAgc3R4dCA9IChcIiN7aW5kdH0je0BsaW5lQ29tbWVudH0gI3tzfSAgXCIgZm9yIHMgaW4gc3R4dClcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgICAgIGxpID0gY3BbMV1cbiAgICAgICAgICAgIGZvciBzIGluIHN0eHRcbiAgICAgICAgICAgICAgICBAZG8uaW5zZXJ0IGxpLCBzXG4gICAgICAgICAgICAgICAgaWYgcy5lbmRzV2l0aCBcIiN7QGxpbmVDb21tZW50fSAgIFwiXG4gICAgICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMucHVzaCBbcy5sZW5ndGgtMiwgbGldXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggW3MubGVuZ3RoLCBsaV1cbiAgICAgICAgICAgICAgICBsaSArPSAxXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOiAnbGFzdCdcbiAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICBAc2V0U2FsdGVyTW9kZSB0cnVlXG5cbiAgICBlbmRTYWx0ZXI6IC0+IEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgc2V0U2FsdGVyTW9kZTogKGFjdGl2ZT10cnVlKSAtPlxuICAgICAgICBAc2FsdGVyTW9kZSA9IGFjdGl2ZVxuICAgICAgICBAbGF5ZXJEaWN0P1snY3Vyc29ycyddPy5jbGFzc0xpc3QudG9nZ2xlIFwic2FsdGVyTW9kZVwiLCBhY3RpdmVcbiAgICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBpbnNlcnRTYWx0ZXJDaGFyYWN0ZXI6IChjaCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNoID09ICcgJ1xuICAgICAgICAgICAgY2hhciA9IFsnICAgICcsICcgICAgJywgJyAgICAnLCAnICAgICcsICcgICAgJ11cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY2hhciA9IHNhbHQoY2gpLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgY2hhci5sZW5ndGggPT0gNVxuICAgICAgICAgICAgc2FsdGVkID0gKFwiI3tzfSAgXCIgZm9yIHMgaW4gY2hhcikuam9pbiAnXFxuJ1xuICAgICAgICAgICAgQHBhc3RlVGV4dCBzYWx0ZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICB0cnVlXG4gICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgZGVsZXRlU2FsdGVyQ2hhcmFjdGVyOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAc2FsdGVyTW9kZVxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgY3AgPSBAZG8ubWFpbkN1cnNvcigpXG4gICAgICAgIGlmIHJncyA9IEBzYWx0ZXJSYW5nZXNBdFBvcyBjcFxuICAgICAgICAgICAgc2x0ID0gKEBkby50ZXh0SW5SYW5nZSByIGZvciByIGluIHJncylcbiAgICAgICAgICAgIGNvbHMgPSBAY29sdW1uc0luU2FsdCBzbHRcbiAgICAgICAgICAgIGNpID0gY29scy5sZW5ndGgtMVxuICAgICAgICAgICAgd2hpbGUgY2kgPiAwIGFuZCBjb2xzW2NpLTFdID49IGNwWzBdXG4gICAgICAgICAgICAgICAgY2kgLT0gMVxuICAgICAgICAgICAgaWYgY2kgPiAwXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gY29sc1tjaV0tY29sc1tjaS0xXVxuICAgICAgICAgICAgICAgIGZvciByIGluIHJnc1xuICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIHJbMF0sIEBkby5saW5lKHJbMF0pLnNwbGljZSBjb2xzW2NpLTFdLCBsZW5ndGhcbiAgICAgICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyAoW2NvbHNbY2ktMV0sIHJbMF1dIGZvciByIGluIHJncylcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2hlY2tTYWx0ZXJNb2RlOiAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIEBzYWx0ZXJNb2RlXG4gICAgICAgIFxuICAgICAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgXG4gICAgICAgICAgICBpZiBAZG8ubnVtQ3Vyc29ycygpID09IDUgYW5kIHBvc2l0aW9uc0luQ29udGludW91c0xpbmUgQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIGNzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIHJncyA9IEBzYWx0ZXJSYW5nZXNBdFBvcyBAZG8ubWFpbkN1cnNvcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCByZ3M/IG9yIHJnc1swXVswXSAhPSBjc1swXVsxXVxuICAgICAgICAgICAgICAgIGNvbHMgPSBAY29sdW1uc0luU2FsdCAoQGRvLnRleHRJblJhbmdlKHIpIGZvciByIGluIHJncylcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgY3NbMF1bMF0gPCBjb2xzWzBdXG4gICAgICAgICAgICAgICAgQHNldFNhbHRlck1vZGUgdHJ1ZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzYWx0ZXJSYW5nZXNBdFBvczogKHApIC0+XG4gICAgICAgIFxuICAgICAgICByZ3MgPSBbXVxuICAgICAgICBsaSA9IHBbMV1cbiAgICAgICAgc3RhdGUgPSBAZG8uaXNEb2luZygpIGFuZCBAZG8uc3RhdGUgb3IgQHN0YXRlXG4gICAgICAgIHdoaWxlIHJncy5sZW5ndGggPCA1IGFuZCBsaSA8IHN0YXRlLm51bUxpbmVzKCkgYW5kIEBoZWFkZXJSZWdFeHAudGVzdCBzdGF0ZS5saW5lKGxpKVxuICAgICAgICAgICAgcmdzLnB1c2ggW2xpLCBbMCwgc3RhdGUubGluZShsaSkubGVuZ3RoXV0gXG4gICAgICAgICAgICBsaSArPSAxXG4gICAgICAgIHJldHVybiBpZiBub3QgcmdzLmxlbmd0aFxuICAgICAgICBsaSA9IHBbMV0tMVxuICAgICAgICB3aGlsZSByZ3MubGVuZ3RoIDwgNSBhbmQgbGkgPj0gMCBhbmQgQGhlYWRlclJlZ0V4cC50ZXN0IHN0YXRlLmxpbmUobGkpXG4gICAgICAgICAgICByZ3MudW5zaGlmdCBbbGksIFswLCBzdGF0ZS5saW5lKGxpKS5sZW5ndGhdXVxuICAgICAgICAgICAgbGkgLT0gMVxuICAgICAgICByZXR1cm4gcmdzIGlmIHJncy5sZW5ndGggPT0gNVxuICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY29sdW1uc0luU2FsdDogKHNsdCkgLT5cbiAgICAgICAgXG4gICAgICAgIG1pbiA9IF8ubWluIChzLnNlYXJjaCAvMC8gZm9yIHMgaW4gc2x0KVxuICAgICAgICBpZiBtaW4gPCAwXG4gICAgICAgICAgICBtaW4gPSBfLm1pbiAocy5zZWFyY2goLyMvKSsxIGZvciBzIGluIHNsdClcbiAgICAgICAgICAgIHJldHVybiBbbWluXVxuICAgICAgICBtYXggPSBfLm1heCAocy5sZW5ndGggZm9yIHMgaW4gc2x0KVxuICAgICAgICBjb2xzID0gW21pbiwgbWF4XVxuICAgICAgICBmb3IgY29sIGluIFttaW4uLm1heF1cbiAgICAgICAgICAgIHMgPSAwXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLjVdXG4gICAgICAgICAgICAgICAgcyArPSAxIGlmIHNsdFtpXS5zdWJzdHIoY29sLTIsIDIpIGluIFsnICAnLCAnIyAnXVxuICAgICAgICAgICAgY29scy5wdXNoKGNvbCkgaWYgcyA9PSA1XG4gICAgICAgIF8uc29ydEJ5IF8udW5pcSBjb2xzXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/salter.coffee