// koffee 1.11.0
var empty, matchr, post, ref, slash;

ref = require('kxk'), post = ref.post, matchr = ref.matchr, slash = ref.slash, empty = ref.empty;

module.exports = {
    actions: {
        jumpToWord: {
            name: 'Jump to Word',
            text: 'jump to word at cursor',
            combo: 'alt+enter'
        }
    },
    jumpToFileAtPos: function(p) {
        var col, cwd, d, diss, file, i, j, len, len1, line, ranges, ref1, ref2, ref3, ref4, ref5, rgx, text;
        if (p == null) {
            p = this.cursorPos();
        }
        text = this.line(p[1]);
        rgx = /([\~\/\w\.]+\/[\w\.]+\w[:\d]*)/;
        if (rgx.test(text)) {
            ranges = matchr.ranges(rgx, text);
            diss = matchr.dissect(ranges, {
                join: false
            });
            for (i = 0, len = diss.length; i < len; i++) {
                d = diss[i];
                if ((d.start <= (ref1 = p[0]) && ref1 <= d.start + d.match.length)) {
                    ref2 = slash.splitFileLine(d.match), file = ref2[0], line = ref2[1], col = ref2[2];
                    if (slash.fileExists(file)) {
                        post.emit('jumpTo', {
                            file: file,
                            line: line,
                            col: col
                        });
                        return true;
                    }
                }
                if (!slash.isAbsolute(d.match)) {
                    cwd = window.cwd.cwd;
                    ref3 = slash.splitFileLine(slash.join(cwd, d.match)), file = ref3[0], line = ref3[1], col = ref3[2];
                    if (slash.isFile(file)) {
                        post.emit('jumpTo', {
                            file: file,
                            line: line,
                            col: col
                        });
                        return true;
                    } else if (!empty(this.currentFile && slash.isFile(slash.swapExt(file, slash.ext(this.currentFile))))) {
                        file = slash.swapExt(file, slash.ext(this.currentFile));
                        post.emit('jumpTo', {
                            file: file,
                            line: line,
                            col: col
                        });
                        return true;
                    }
                }
            }
        }
        if (slash.win()) {
            rgx = /([\~\\\w\.]+\\[\w\.]+\w[:\d]*)/;
            ranges = matchr.ranges(rgx, text);
            diss = matchr.dissect(ranges, {
                join: false
            });
            for (j = 0, len1 = diss.length; j < len1; j++) {
                d = diss[j];
                if ((d.start <= (ref4 = p[0]) && ref4 <= d.start + d.match.length)) {
                    ref5 = slash.splitFileLine(d.match), file = ref5[0], line = ref5[1], col = ref5[2];
                    if (slash.fileExists(file)) {
                        post.emit('jumpTo', {
                            file: file,
                            line: line,
                            col: col
                        });
                        return true;
                    }
                }
            }
        }
        return false;
    },
    jumpToWord: function() {
        return this.jumpToWordAtPos(this.cursorPos());
    },
    jumpToWordAtPos: function(p) {
        var index, line, nextChar, opt, range, rest, selectionText, text, type, word;
        if (p == null) {
            p = this.cursorPos();
        }
        selectionText = this.textOfSelection().trim();
        if (!empty(selectionText)) {
            post.emit('jumpTo', selectionText, {});
            return;
        }
        if (this.jumpToFileAtPos(p)) {
            return;
        }
        text = this.line(p[1]);
        word = this.wordAtPos(p);
        range = this.rangeForRealWordAtPos(p);
        opt = {};
        line = this.line(range[0]);
        if (range[1][0] > 0) {
            if (line[range[1][0] - 1] === '.') {
                opt.type = 'func';
            }
        }
        if (!opt.type && range[1][1] < line.length) {
            rest = line.slice(range[1][1]);
            index = rest.search(/\S/);
            if (index >= 0) {
                nextChar = rest[index];
                type = (function() {
                    switch (nextChar) {
                        case '.':
                            return 'class';
                        case '(':
                            return 'func';
                        case ':':
                        case '=':
                            return 'word';
                    }
                })();
                if (type != null) {
                    opt.type = type;
                }
            }
        }
        return post.emit('jumpTo', word, opt);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVtcHRvd29yZC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9jb2ZmZWUvZWRpdG9yL2FjdGlvbnMiLCJzb3VyY2VzIjpbImp1bXB0b3dvcmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxJQUFBOztBQUFBLE1BQWlDLE9BQUEsQ0FBUSxLQUFSLENBQWpDLEVBQUUsZUFBRixFQUFRLG1CQUFSLEVBQWdCLGlCQUFoQixFQUF1Qjs7QUFFdkIsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFFSTtRQUFBLFVBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxjQUFQO1lBQ0EsSUFBQSxFQUFPLHdCQURQO1lBRUEsS0FBQSxFQUFPLFdBRlA7U0FESjtLQUZKO0lBT0EsZUFBQSxFQUFpQixTQUFDLENBQUQ7QUFFYixZQUFBOztZQUZjLElBQUUsSUFBQyxDQUFBLFNBQUQsQ0FBQTs7UUFFaEIsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBRSxDQUFBLENBQUEsQ0FBUjtRQUNQLEdBQUEsR0FBTTtRQUVOLElBQUcsR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFULENBQUg7WUFFSSxNQUFBLEdBQVMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxHQUFkLEVBQW1CLElBQW5CO1lBQ1QsSUFBQSxHQUFTLE1BQU0sQ0FBQyxPQUFQLENBQWUsTUFBZixFQUF1QjtnQkFBQSxJQUFBLEVBQUssS0FBTDthQUF2QjtBQUVULGlCQUFBLHNDQUFBOztnQkFFSSxJQUFHLENBQUEsQ0FBQyxDQUFDLEtBQUYsWUFBVyxDQUFFLENBQUEsQ0FBQSxFQUFiLFFBQUEsSUFBbUIsQ0FBQyxDQUFDLEtBQUYsR0FBUSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQW5DLENBQUg7b0JBQ0ksT0FBb0IsS0FBSyxDQUFDLGFBQU4sQ0FBb0IsQ0FBQyxDQUFDLEtBQXRCLENBQXBCLEVBQUMsY0FBRCxFQUFPLGNBQVAsRUFBYTtvQkFDYixJQUFHLEtBQUssQ0FBQyxVQUFOLENBQWlC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QUhKOztlQVlBLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixFQUFvQixJQUFwQixFQUEwQixHQUExQjtJQWpDYSxDQXJEakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAgICAgXG57IHBvc3QsIG1hdGNociwgc2xhc2gsIGVtcHR5IH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID0gXG4gICAgXG4gICAgYWN0aW9uczpcbiAgICAgICAgXG4gICAgICAgIGp1bXBUb1dvcmQ6XG4gICAgICAgICAgICBuYW1lOiAgJ0p1bXAgdG8gV29yZCdcbiAgICAgICAgICAgIHRleHQ6ICAnanVtcCB0byB3b3JkIGF0IGN1cnNvcidcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K2VudGVyJ1xuICAgIFxuICAgIGp1bXBUb0ZpbGVBdFBvczogKHA9QGN1cnNvclBvcygpKSAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IEBsaW5lIHBbMV1cbiAgICAgICAgcmd4ID0gLyhbXFx+XFwvXFx3XFwuXStcXC9bXFx3XFwuXStcXHdbOlxcZF0qKS8gIyBsb29rIGZvciBmaWxlcyBpbiBsaW5lXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgcmd4LnRlc3QgdGV4dFxuICAgICAgICAgICAgXG4gICAgICAgICAgICByYW5nZXMgPSBtYXRjaHIucmFuZ2VzIHJneCwgdGV4dFxuICAgICAgICAgICAgZGlzcyAgID0gbWF0Y2hyLmRpc3NlY3QgcmFuZ2VzLCBqb2luOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBkIGluIGRpc3NcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBkLnN0YXJ0IDw9IHBbMF0gPD0gZC5zdGFydCtkLm1hdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBbZmlsZSwgbGluZSwgY29sXSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUgZC5tYXRjaFxuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvJywgZmlsZTpmaWxlLCBsaW5lOmxpbmUsIGNvbDpjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2guaXNBYnNvbHV0ZSBkLm1hdGNoXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjd2QgPSB3aW5kb3cuY3dkLmN3ZFxuICAgICAgICAgICAgICAgICAgICBbZmlsZSwgbGluZSwgY29sXSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUgc2xhc2guam9pbiBjd2QsIGQubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guaXNGaWxlIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvJywgZmlsZTpmaWxlLCBsaW5lOmxpbmUsIGNvbDpjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgbm90IGVtcHR5IEBjdXJyZW50RmlsZSBhbmQgc2xhc2guaXNGaWxlIHNsYXNoLnN3YXBFeHQgZmlsZSwgc2xhc2guZXh0IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHNsYXNoLnN3YXBFeHQgZmlsZSwgc2xhc2guZXh0IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nLCBmaWxlOmZpbGUsIGxpbmU6bGluZSwgY29sOmNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZ3ggPSAvKFtcXH5cXFxcXFx3XFwuXStcXFxcW1xcd1xcLl0rXFx3WzpcXGRdKikvICMgbG9vayBmb3IgZmlsZXMgaW4gbGluZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByYW5nZXMgPSBtYXRjaHIucmFuZ2VzIHJneCwgdGV4dFxuICAgICAgICAgICAgZGlzcyAgID0gbWF0Y2hyLmRpc3NlY3QgcmFuZ2VzLCBqb2luOmZhbHNlXG4gICAgICAgICAgICBmb3IgZCBpbiBkaXNzXG4gICAgICAgICAgICAgICAgaWYgZC5zdGFydCA8PSBwWzBdIDw9IGQuc3RhcnQrZC5tYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgW2ZpbGUsIGxpbmUsIGNvbF0gPSBzbGFzaC5zcGxpdEZpbGVMaW5lIGQubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycsIGZpbGU6ZmlsZSwgbGluZTpsaW5lLCBjb2w6Y29sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBmYWxzZVxuICAgIFxuICAgIGp1bXBUb1dvcmQ6IC0+IEBqdW1wVG9Xb3JkQXRQb3MgQGN1cnNvclBvcygpXG4gICAgICAgIFxuICAgIGp1bXBUb1dvcmRBdFBvczogKHA9QGN1cnNvclBvcygpKSAtPlxuICAgICAgICBcbiAgICAgICAgc2VsZWN0aW9uVGV4dCA9IEB0ZXh0T2ZTZWxlY3Rpb24oKS50cmltKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBlbXB0eSBzZWxlY3Rpb25UZXh0XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycsIHNlbGVjdGlvblRleHQsIHt9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAanVtcFRvRmlsZUF0UG9zIHBcbiAgICAgICAgXG4gICAgICAgIHRleHQgID0gQGxpbmUgcFsxXVxuICAgICAgICB3b3JkICA9IEB3b3JkQXRQb3MgcFxuICAgICAgICByYW5nZSA9IEByYW5nZUZvclJlYWxXb3JkQXRQb3MgcFxuICAgICAgICBcbiAgICAgICAgb3B0ICAgPSB7fVxuICAgICAgICBsaW5lICA9IEBsaW5lIHJhbmdlWzBdIFxuXG4gICAgICAgIGlmIHJhbmdlWzFdWzBdID4gMCBcbiAgICAgICAgICAgIGlmIGxpbmVbcmFuZ2VbMV1bMF0tMV0gPT0gJy4nXG4gICAgICAgICAgICAgICAgb3B0LnR5cGUgPSAnZnVuYydcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IG9wdC50eXBlIGFuZCByYW5nZVsxXVsxXSA8IGxpbmUubGVuZ3RoXG4gICAgICAgICAgICByZXN0ID0gbGluZS5zbGljZSByYW5nZVsxXVsxXVxuICAgICAgICAgICAgaW5kZXggPSByZXN0LnNlYXJjaCAvXFxTLyBcbiAgICAgICAgICAgIGlmIGluZGV4ID49IDBcbiAgICAgICAgICAgICAgICBuZXh0Q2hhciA9IHJlc3RbaW5kZXhdXG5cbiAgICAgICAgICAgICAgICB0eXBlID0gc3dpdGNoIG5leHRDaGFyIFxuICAgICAgICAgICAgICAgICAgICB3aGVuICcuJyAgICAgIHRoZW4gJ2NsYXNzJyBcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnKCcgICAgICB0aGVuICdmdW5jJ1xuICAgICAgICAgICAgICAgICAgICB3aGVuICc6JywgJz0nIHRoZW4gJ3dvcmQnXG4gICAgICAgICAgICAgICAgb3B0LnR5cGUgPSB0eXBlIGlmIHR5cGU/XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHBvc3QuZW1pdCAnanVtcFRvJywgd29yZCwgb3B0XG4iXX0=
//# sourceURL=../../../coffee/editor/actions/jumptoword.coffee