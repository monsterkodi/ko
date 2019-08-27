// koffee 1.4.0
var empty, matchr, post, ref, slash;

ref = require('kxk'), slash = ref.slash, post = ref.post, empty = ref.empty;

matchr = require('../../tools/matchr');

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVtcHRvd29yZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUEsTUFBeUIsT0FBQSxDQUFRLEtBQVIsQ0FBekIsRUFBRSxpQkFBRixFQUFTLGVBQVQsRUFBZTs7QUFFZixNQUFBLEdBQVMsT0FBQSxDQUFRLG9CQUFSOztBQUVULE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBRUk7UUFBQSxVQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sY0FBUDtZQUNBLElBQUEsRUFBTyx3QkFEUDtZQUVBLEtBQUEsRUFBTyxXQUZQO1NBREo7S0FGSjtJQU9BLGVBQUEsRUFBaUIsU0FBQyxDQUFEO0FBRWIsWUFBQTs7WUFGYyxJQUFFLElBQUMsQ0FBQSxTQUFELENBQUE7O1FBRWhCLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUUsQ0FBQSxDQUFBLENBQVI7UUFDUCxHQUFBLEdBQU07UUFFTixJQUFHLEdBQUcsQ0FBQyxJQUFKLENBQVMsSUFBVCxDQUFIO1lBRUksTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFQLENBQWMsR0FBZCxFQUFtQixJQUFuQjtZQUNULElBQUEsR0FBUyxNQUFNLENBQUMsT0FBUCxDQUFlLE1BQWYsRUFBdUI7Z0JBQUEsSUFBQSxFQUFLLEtBQUw7YUFBdkI7QUFFVCxpQkFBQSxzQ0FBQTs7Z0JBRUksSUFBRyxDQUFBLENBQUMsQ0FBQyxLQUFGLFlBQVcsQ0FBRSxDQUFBLENBQUEsRUFBYixRQUFBLElBQW1CLENBQUMsQ0FBQyxLQUFGLEdBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFuQyxDQUFIO29CQUNJLE9BQW9CLEtBQUssQ0FBQyxhQUFOLENBQW9CLENBQUMsQ0FBQyxLQUF0QixDQUFwQixFQUFDLGNBQUQsRUFBTyxjQUFQLEVBQWE7b0JBQ2IsSUFBRyxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFqQixDQUFIO3dCQUNJLElBQUksQ0FBQyxJ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LFFBQVYsRUFBb0IsSUFBcEIsRUFBMEIsR0FBMUI7SUFqQ2EsQ0FyRGpCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jICAgICAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgICAgIFxueyBzbGFzaCwgcG9zdCwgZW1wdHkgfSA9IHJlcXVpcmUgJ2t4aydcblxubWF0Y2hyID0gcmVxdWlyZSAnLi4vLi4vdG9vbHMvbWF0Y2hyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFxuICAgIFxuICAgIGFjdGlvbnM6XG4gICAgICAgIFxuICAgICAgICBqdW1wVG9Xb3JkOlxuICAgICAgICAgICAgbmFtZTogICdKdW1wIHRvIFdvcmQnXG4gICAgICAgICAgICB0ZXh0OiAgJ2p1bXAgdG8gd29yZCBhdCBjdXJzb3InXG4gICAgICAgICAgICBjb21ibzogJ2FsdCtlbnRlcidcbiAgICBcbiAgICBqdW1wVG9GaWxlQXRQb3M6IChwPUBjdXJzb3JQb3MoKSkgLT5cbiAgICAgICAgXG4gICAgICAgIHRleHQgPSBAbGluZSBwWzFdXG4gICAgICAgIHJneCA9IC8oW1xcflxcL1xcd1xcLl0rXFwvW1xcd1xcLl0rXFx3WzpcXGRdKikvICMgbG9vayBmb3IgZmlsZXMgaW4gbGluZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHJneC50ZXN0IHRleHRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmFuZ2VzID0gbWF0Y2hyLnJhbmdlcyByZ3gsIHRleHRcbiAgICAgICAgICAgIGRpc3MgICA9IG1hdGNoci5kaXNzZWN0IHJhbmdlcywgam9pbjpmYWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgZCBpbiBkaXNzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgZC5zdGFydCA8PSBwWzBdIDw9IGQuc3RhcnQrZC5tYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgW2ZpbGUsIGxpbmUsIGNvbF0gPSBzbGFzaC5zcGxpdEZpbGVMaW5lIGQubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycsIGZpbGU6ZmlsZSwgbGluZTpsaW5lLCBjb2w6Y29sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLmlzQWJzb2x1dGUgZC5tYXRjaFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY3dkID0gd2luZG93LmN3ZC5jd2RcbiAgICAgICAgICAgICAgICAgICAgW2ZpbGUsIGxpbmUsIGNvbF0gPSBzbGFzaC5zcGxpdEZpbGVMaW5lIHNsYXNoLmpvaW4gY3dkLCBkLm1hdGNoXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzRmlsZSBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycsIGZpbGU6ZmlsZSwgbGluZTpsaW5lLCBjb2w6Y29sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG5vdCBlbXB0eSBAY3VycmVudEZpbGUgYW5kIHNsYXNoLmlzRmlsZSBzbGFzaC5zd2FwRXh0IGZpbGUsIHNsYXNoLmV4dCBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5zd2FwRXh0IGZpbGUsIHNsYXNoLmV4dCBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvJywgZmlsZTpmaWxlLCBsaW5lOmxpbmUsIGNvbDpjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmd4ID0gLyhbXFx+XFxcXFxcd1xcLl0rXFxcXFtcXHdcXC5dK1xcd1s6XFxkXSopLyAjIGxvb2sgZm9yIGZpbGVzIGluIGxpbmVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmFuZ2VzID0gbWF0Y2hyLnJhbmdlcyByZ3gsIHRleHRcbiAgICAgICAgICAgIGRpc3MgICA9IG1hdGNoci5kaXNzZWN0IHJhbmdlcywgam9pbjpmYWxzZVxuICAgICAgICAgICAgZm9yIGQgaW4gZGlzc1xuICAgICAgICAgICAgICAgIGlmIGQuc3RhcnQgPD0gcFswXSA8PSBkLnN0YXJ0K2QubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIFtmaWxlLCBsaW5lLCBjb2xdID0gc2xhc2guc3BsaXRGaWxlTGluZSBkLm1hdGNoXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nLCBmaWxlOmZpbGUsIGxpbmU6bGluZSwgY29sOmNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcbiAgICBcbiAgICBqdW1wVG9Xb3JkOiAtPiBAanVtcFRvV29yZEF0UG9zIEBjdXJzb3JQb3MoKVxuICAgICAgICBcbiAgICBqdW1wVG9Xb3JkQXRQb3M6IChwPUBjdXJzb3JQb3MoKSkgLT5cbiAgICAgICAgXG4gICAgICAgIHNlbGVjdGlvblRleHQgPSBAdGV4dE9mU2VsZWN0aW9uKCkudHJpbSgpXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgZW1wdHkgc2VsZWN0aW9uVGV4dFxuICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nLCBzZWxlY3Rpb25UZXh0LCB7fVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGp1bXBUb0ZpbGVBdFBvcyBwXG4gICAgICAgIFxuICAgICAgICB0ZXh0ICA9IEBsaW5lIHBbMV1cbiAgICAgICAgd29yZCAgPSBAd29yZEF0UG9zIHBcbiAgICAgICAgcmFuZ2UgPSBAcmFuZ2VGb3JSZWFsV29yZEF0UG9zIHBcbiAgICAgICAgXG4gICAgICAgIG9wdCAgID0ge31cbiAgICAgICAgbGluZSAgPSBAbGluZSByYW5nZVswXSBcblxuICAgICAgICBpZiByYW5nZVsxXVswXSA+IDAgXG4gICAgICAgICAgICBpZiBsaW5lW3JhbmdlWzFdWzBdLTFdID09ICcuJ1xuICAgICAgICAgICAgICAgIG9wdC50eXBlID0gJ2Z1bmMnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBvcHQudHlwZSBhbmQgcmFuZ2VbMV1bMV0gPCBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgcmVzdCA9IGxpbmUuc2xpY2UgcmFuZ2VbMV1bMV1cbiAgICAgICAgICAgIGluZGV4ID0gcmVzdC5zZWFyY2ggL1xcUy8gXG4gICAgICAgICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgbmV4dENoYXIgPSByZXN0W2luZGV4XVxuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHN3aXRjaCBuZXh0Q2hhciBcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnLicgICAgICB0aGVuICdjbGFzcycgXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJygnICAgICAgdGhlbiAnZnVuYydcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnOicsICc9JyB0aGVuICd3b3JkJ1xuICAgICAgICAgICAgICAgIG9wdC50eXBlID0gdHlwZSBpZiB0eXBlP1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycsIHdvcmQsIG9wdFxuIl19
//# sourceURL=../../../coffee/editor/actions/jumptoword.coffee