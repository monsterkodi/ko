// koffee 1.4.0
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVtcHRvd29yZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUEsTUFBaUMsT0FBQSxDQUFRLEtBQVIsQ0FBakMsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCOztBQUV2QixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUVJO1FBQUEsVUFBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLGNBQVA7WUFDQSxJQUFBLEVBQU8sd0JBRFA7WUFFQSxLQUFBLEVBQU8sV0FGUDtTQURKO0tBRko7SUFPQSxlQUFBLEVBQWlCLFNBQUMsQ0FBRDtBQUViLFlBQUE7O1lBRmMsSUFBRSxJQUFDLENBQUEsU0FBRCxDQUFBOztRQUVoQixJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFFLENBQUEsQ0FBQSxDQUFSO1FBQ1AsR0FBQSxHQUFNO1FBRU4sSUFBRyxHQUFHLENBQUMsSUFBSixDQUFTLElBQVQsQ0FBSDtZQUVJLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLEdBQWQsRUFBbUIsSUFBbkI7WUFDVCxJQUFBLEdBQVMsTUFBTSxDQUFDLE9BQVAsQ0FBZSxNQUFmLEVBQXVCO2dCQUFBLElBQUEsRUFBSyxLQUFMO2FBQXZCO0FBRVQsaUJBQUEsc0NBQUE7O2dCQUVJLElBQUcsQ0FBQSxDQUFDLENBQUMsS0FBRixZQUFXLENBQUUsQ0FBQSxDQUFBLEVBQWIsUUFBQSxJQUFtQixDQUFDLENBQUMsS0FBRixHQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBbkMsQ0FBSDtvQkFDSSxPQUFvQixLQUFLLENBQUMsYUFBTixDQUFvQixDQUFDLENBQUMsS0FBdEIsQ0FBcEIsRUFBQyxjQUFELEVBQU8sY0FBUCxFQUFhO29CQUNiLElBQUcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsQ0FBSDt3QkFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLFFBQVYsRUFB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LEVBQTBCLEdBQTFCO0lBakNhLENBckRqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICAgICBcbnsgcG9zdCwgbWF0Y2hyLCBzbGFzaCwgZW1wdHkgfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBcbiAgICBhY3Rpb25zOlxuICAgICAgICBcbiAgICAgICAganVtcFRvV29yZDpcbiAgICAgICAgICAgIG5hbWU6ICAnSnVtcCB0byBXb3JkJ1xuICAgICAgICAgICAgdGV4dDogICdqdW1wIHRvIHdvcmQgYXQgY3Vyc29yJ1xuICAgICAgICAgICAgY29tYm86ICdhbHQrZW50ZXInXG4gICAgXG4gICAganVtcFRvRmlsZUF0UG9zOiAocD1AY3Vyc29yUG9zKCkpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gQGxpbmUgcFsxXVxuICAgICAgICByZ3ggPSAvKFtcXH5cXC9cXHdcXC5dK1xcL1tcXHdcXC5dK1xcd1s6XFxkXSopLyAjIGxvb2sgZm9yIGZpbGVzIGluIGxpbmVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiByZ3gudGVzdCB0ZXh0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJhbmdlcyA9IG1hdGNoci5yYW5nZXMgcmd4LCB0ZXh0XG4gICAgICAgICAgICBkaXNzICAgPSBtYXRjaHIuZGlzc2VjdCByYW5nZXMsIGpvaW46ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGQgaW4gZGlzc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGQuc3RhcnQgPD0gcFswXSA8PSBkLnN0YXJ0K2QubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIFtmaWxlLCBsaW5lLCBjb2xdID0gc2xhc2guc3BsaXRGaWxlTGluZSBkLm1hdGNoXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nLCBmaWxlOmZpbGUsIGxpbmU6bGluZSwgY29sOmNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc0Fic29sdXRlIGQubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGN3ZCA9IHdpbmRvdy5jd2QuY3dkXG4gICAgICAgICAgICAgICAgICAgIFtmaWxlLCBsaW5lLCBjb2xdID0gc2xhc2guc3BsaXRGaWxlTGluZSBzbGFzaC5qb2luIGN3ZCwgZC5tYXRjaFxuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nLCBmaWxlOmZpbGUsIGxpbmU6bGluZSwgY29sOmNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBub3QgZW1wdHkgQGN1cnJlbnRGaWxlIGFuZCBzbGFzaC5pc0ZpbGUgc2xhc2guc3dhcEV4dCBmaWxlLCBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guc3dhcEV4dCBmaWxlLCBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycsIGZpbGU6ZmlsZSwgbGluZTpsaW5lLCBjb2w6Y29sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJneCA9IC8oW1xcflxcXFxcXHdcXC5dK1xcXFxbXFx3XFwuXStcXHdbOlxcZF0qKS8gIyBsb29rIGZvciBmaWxlcyBpbiBsaW5lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJhbmdlcyA9IG1hdGNoci5yYW5nZXMgcmd4LCB0ZXh0XG4gICAgICAgICAgICBkaXNzICAgPSBtYXRjaHIuZGlzc2VjdCByYW5nZXMsIGpvaW46ZmFsc2VcbiAgICAgICAgICAgIGZvciBkIGluIGRpc3NcbiAgICAgICAgICAgICAgICBpZiBkLnN0YXJ0IDw9IHBbMF0gPD0gZC5zdGFydCtkLm1hdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBbZmlsZSwgbGluZSwgY29sXSA9IHNsYXNoLnNwbGl0RmlsZUxpbmUgZC5tYXRjaFxuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvJywgZmlsZTpmaWxlLCBsaW5lOmxpbmUsIGNvbDpjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGZhbHNlXG4gICAgXG4gICAganVtcFRvV29yZDogLT4gQGp1bXBUb1dvcmRBdFBvcyBAY3Vyc29yUG9zKClcbiAgICAgICAgXG4gICAganVtcFRvV29yZEF0UG9zOiAocD1AY3Vyc29yUG9zKCkpIC0+XG4gICAgICAgIFxuICAgICAgICBzZWxlY3Rpb25UZXh0ID0gQHRleHRPZlNlbGVjdGlvbigpLnRyaW0oKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGVtcHR5IHNlbGVjdGlvblRleHRcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvJywgc2VsZWN0aW9uVGV4dCwge31cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBqdW1wVG9GaWxlQXRQb3MgcFxuICAgICAgICBcbiAgICAgICAgdGV4dCAgPSBAbGluZSBwWzFdXG4gICAgICAgIHdvcmQgID0gQHdvcmRBdFBvcyBwXG4gICAgICAgIHJhbmdlID0gQHJhbmdlRm9yUmVhbFdvcmRBdFBvcyBwXG4gICAgICAgIFxuICAgICAgICBvcHQgICA9IHt9XG4gICAgICAgIGxpbmUgID0gQGxpbmUgcmFuZ2VbMF0gXG5cbiAgICAgICAgaWYgcmFuZ2VbMV1bMF0gPiAwIFxuICAgICAgICAgICAgaWYgbGluZVtyYW5nZVsxXVswXS0xXSA9PSAnLidcbiAgICAgICAgICAgICAgICBvcHQudHlwZSA9ICdmdW5jJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBub3Qgb3B0LnR5cGUgYW5kIHJhbmdlWzFdWzFdIDwgbGluZS5sZW5ndGhcbiAgICAgICAgICAgIHJlc3QgPSBsaW5lLnNsaWNlIHJhbmdlWzFdWzFdXG4gICAgICAgICAgICBpbmRleCA9IHJlc3Quc2VhcmNoIC9cXFMvIFxuICAgICAgICAgICAgaWYgaW5kZXggPj0gMFxuICAgICAgICAgICAgICAgIG5leHRDaGFyID0gcmVzdFtpbmRleF1cblxuICAgICAgICAgICAgICAgIHR5cGUgPSBzd2l0Y2ggbmV4dENoYXIgXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJy4nICAgICAgdGhlbiAnY2xhc3MnIFxuICAgICAgICAgICAgICAgICAgICB3aGVuICcoJyAgICAgIHRoZW4gJ2Z1bmMnXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJzonLCAnPScgdGhlbiAnd29yZCdcbiAgICAgICAgICAgICAgICBvcHQudHlwZSA9IHR5cGUgaWYgdHlwZT9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nLCB3b3JkLCBvcHRcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/jumptoword.coffee