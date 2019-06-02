// koffee 0.56.0

/*
 0000000   000   000   0000000  000  0000000    000   0000000   0000000
000   000  0000  000  000       000  000   000  000  000       000     
000000000  000 0 000  0000000   000  000   000  000  0000000   0000000 
000   000  000  0000       000  000  000   000  000       000       000
000   000  000   000  0000000   000  0000000    000  0000000   0000000
 */
var AnsiDiss, STYLES, _, j, results, toHexString,
    indexOf = [].indexOf;

_ = require('kxk')._;

STYLES = {
    f0: 'color:#000',
    f1: 'color:#E00',
    f2: 'color:#0A0',
    f3: 'color:#A50',
    f4: 'color:#00E',
    f5: 'color:#A0A',
    f6: 'color:#0AA',
    f7: 'color:#AAA',
    f8: 'color:#555',
    f9: 'color:#F55',
    f10: 'color:#5F5',
    f11: 'color:#FF5',
    f12: 'color:#55F',
    f13: 'color:#F5F',
    f14: 'color:#5FF',
    f15: 'color:#FFF',
    b0: 'background-color:#000',
    b1: 'background-color:#A00',
    b2: 'background-color:#0A0',
    b3: 'background-color:#A50',
    b4: 'background-color:#00A',
    b5: 'background-color:#A0A',
    b6: 'background-color:#0AA',
    b7: 'background-color:#AAA',
    b8: 'background-color:#555',
    b9: 'background-color:#F55',
    b10: 'background-color:#5F5',
    b11: 'background-color:#FF5',
    b12: 'background-color:#55F',
    b13: 'background-color:#F5F',
    b14: 'background-color:#5FF',
    b15: 'background-color:#FFF'
};

toHexString = function(num) {
    num = num.toString(16);
    while (num.length < 2) {
        num = "0" + num;
    }
    return num;
};

[0, 1, 2, 3, 4, 5].forEach(function(red) {
    return [0, 1, 2, 3, 4, 5].forEach(function(green) {
        return [0, 1, 2, 3, 4, 5].forEach(function(blue) {
            var b, c, g, n, r, rgb;
            c = 16 + (red * 36) + (green * 6) + blue;
            r = red > 0 ? red * 40 + 55 : 0;
            g = green > 0 ? green * 40 + 55 : 0;
            b = blue > 0 ? blue * 40 + 55 : 0;
            rgb = ((function() {
                var j, len, ref, results;
                ref = [r, g, b];
                results = [];
                for (j = 0, len = ref.length; j < len; j++) {
                    n = ref[j];
                    results.push(toHexString(n));
                }
                return results;
            })()).join('');
            STYLES["f" + c] = "color:#" + rgb;
            return STYLES["b" + c] = "background-color:#" + rgb;
        });
    });
});

(function() {
    results = [];
    for (j = 0; j <= 23; j++){ results.push(j); }
    return results;
}).apply(this).forEach(function(gray) {
    var c, l;
    c = gray + 232;
    l = toHexString(gray * 10 + 8);
    STYLES["f" + c] = "color:#" + l + l + l;
    return STYLES["b" + c] = "background-color:#" + l + l + l;
});

AnsiDiss = (function() {
    function AnsiDiss() {}

    AnsiDiss.prototype.dissect = function(input) {
        this.input = input;
        this.diss = [];
        this.text = "";
        this.tokenize();
        return [this.text, this.diss];
    };

    AnsiDiss.prototype.tokenize = function() {
        var addStyle, addText, ansiCode, ansiHandler, ansiMatch, bg, delStyle, fg, handler, i, k, len, length, process, resetStyle, results1, st, start, toHighIntensity, tokens;
        start = 0;
        ansiHandler = 2;
        ansiMatch = false;
        fg = bg = '';
        st = [];
        resetStyle = function() {
            fg = '';
            bg = '';
            return st = [];
        };
        addStyle = function(style) {
            if (indexOf.call(st, style) < 0) {
                return st.push(style);
            }
        };
        delStyle = function(style) {
            return _.pull(st, style);
        };
        addText = (function(_this) {
            return function(t) {
                var match, style, txt;
                _this.text += t;
                txt = _this.text.slice(start);
                match = txt.trim();
                if (match.length) {
                    style = '';
                    if (fg.length) {
                        style += fg + ';';
                    }
                    if (bg.length) {
                        style += bg + ';';
                    }
                    if (st.length) {
                        style += st.join(';');
                    }
                    _this.diss.push({
                        match: match,
                        start: start + txt.search(/[^\s]/),
                        styl: style
                    });
                }
                start = _this.text.length;
                return '';
            };
        })(this);
        toHighIntensity = function(c) {
            var i, k;
            for (i = k = 0; k <= 7; i = ++k) {
                if (c === STYLES["f" + i]) {
                    return STYLES["f" + (8 + i)];
                }
            }
            return c;
        };
        ansiCode = function(m, c) {
            var code, cs, k, len;
            ansiMatch = true;
            if (c.trim().length === 0) {
                c = '0';
            }
            cs = c.trimRight(';').split(';');
            for (k = 0, len = cs.length; k < len; k++) {
                code = cs[k];
                code = parseInt(code, 10);
                switch (false) {
                    case code !== 0:
                        resetStyle();
                        break;
                    case code !== 1:
                        addStyle('font-weight:bold');
                        fg = toHighIntensity(fg);
                        break;
                    case code !== 2:
                        addStyle('opacity:0.5');
                        break;
                    case code !== 4:
                        addStyle('text-decoration:underline');
                        break;
                    case code !== 8:
                        addStyle('display:none');
                        break;
                    case code !== 9:
                        addStyle('text-decoration:line-through');
                        break;
                    case code !== 39:
                        fg = STYLES["f15"];
                        break;
                    case code !== 49:
                        bg = STYLES["b0"];
                        break;
                    case code !== 38:
                        fg = STYLES["f" + cs[2]];
                        break;
                    case code !== 48:
                        bg = STYLES["b" + cs[2]];
                        break;
                    case !((30 <= code && code <= 37)):
                        fg = STYLES["f" + (code - 30)];
                        break;
                    case !((40 <= code && code <= 47)):
                        bg = STYLES["b" + (code - 40)];
                        break;
                    case !((90 <= code && code <= 97)):
                        fg = STYLES["f" + (8 + code - 90)];
                        break;
                    case !((100 <= code && code <= 107)):
                        bg = STYLES["b" + (8 + code - 100)];
                        break;
                    case code !== 28:
                        delStyle('display:none');
                        break;
                    case code !== 22:
                        delStyle('font-weight:bold');
                        delStyle('opacity:0.5');
                }
                if (code === 38 || code === 48) {
                    break;
                }
            }
            return '';
        };
        tokens = [
            {
                pattern: /^\x08+/,
                sub: ''
            }, {
                pattern: /^\x1b\[[012]?K/,
                sub: ''
            }, {
                pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
                sub: ansiCode
            }, {
                pattern: /^\x1b\[?[\d;]{0,3}/,
                sub: ''
            }, {
                pattern: /^([^\x1b\x08\n]+)/,
                sub: addText
            }
        ];
        process = (function(_this) {
            return function(handler, i) {
                if (i > ansiHandler && ansiMatch) {
                    return;
                }
                ansiMatch = false;
                return _this.input = _this.input.replace(handler.pattern, handler.sub);
            };
        })(this);
        results1 = [];
        while ((length = this.input.length) > 0) {
            for (i = k = 0, len = tokens.length; k < len; i = ++k) {
                handler = tokens[i];
                process(handler, i);
            }
            if (this.input.length === length) {
                break;
            } else {
                results1.push(void 0);
            }
        }
        return results1;
    };

    return AnsiDiss;

})();

module.exports = AnsiDiss;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5zaWRpc3MuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRDQUFBO0lBQUE7O0FBVUUsSUFBTSxPQUFBLENBQVEsS0FBUjs7QUFFUixNQUFBLEdBQ0k7SUFBQSxFQUFBLEVBQUssWUFBTDtJQUNBLEVBQUEsRUFBSyxZQURMO0lBRUEsRUFBQSxFQUFLLFlBRkw7SUFHQSxFQUFBLEVBQUssWUFITDtJQUlBLEVBQUEsRUFBSyxZQUpMO0lBS0EsRUFBQSxFQUFLLFlBTEw7SUFNQSxFQUFBLEVBQUssWUFOTDtJQU9BLEVBQUEsRUFBSyxZQVBMO0lBUUEsRUFBQSxFQUFLLFlBUkw7SUFTQSxFQUFBLEVBQUssWUFUTDtJQVVBLEdBQUEsRUFBSyxZQVZMO0lBV0EsR0FBQSxFQUFLLFlBWEw7SUFZQSxHQUFBLEVBQUssWUFaTDtJQWFBLEdBQUEsRUFBSyxZQWJMO0lBY0EsR0FBQSxFQUFLLFlBZEw7SUFlQSxHQUFBLEVBQUssWUFmTDtJQWdCQSxFQUFBLEVBQUssdUJBaEJMO0lBaUJBLEVBQUEsRUFBSyx1QkFqQkw7SUFrQkEsRUFBQSxFQUFLLHVCQWxCTDtJQW1CQSxFQUFBLEVBQUssdUJBbkJMO0lBb0JBLEVBQUEsRUFBSyx1QkFwQkw7SUFxQkEsRUFBQSxFQUFLLHVCQXJCTDtJQXNCQSxFQUFBLEVBQUssdUJBdEJMO0lBdUJBLEVBQUEsRUFBSyx1QkF2Qkw7SUF3QkEsRUFBQSxFQUFLLHVCQXhCTDtJQXlCQSxFQUFBLEVBQUssdUJBekJMO0lBMEJBLEdBQUEsRUFBSyx1QkExQkw7SUEyQkEsR0FBQSxFQUFLLHVCQTNCTDtJQTRCQSxHQUFBLEVBQUssdUJBNUJMO0lBNkJBLEdBQUEsRUFBSyx1QkE3Qkw7SUE4QkEsR0FBQSxFQUFLLHVCQTlCTDtJQStCQSxHQUFBLEVBQUssdUJBL0JMOzs7QUFpQ0osV0FBQSxHQUFjLFNBQUMsR0FBRDtJQUNWLEdBQUEsR0FBTSxHQUFH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WixLQUFDLENBQUEsS0FBRCxHQUFTLEtBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLE9BQU8sQ0FBQyxPQUF2QixFQUFnQyxPQUFPLENBQUMsR0FBeEM7WUFISDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7QUFLVjtlQUFNLENBQUMsTUFBQSxHQUFTLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBakIsQ0FBQSxHQUEyQixDQUFqQztBQUNJLGlCQUFBLGdEQUFBOztnQkFBQSxPQUFBLENBQVEsT0FBUixFQUFpQixDQUFqQjtBQUFBO1lBQ0EsSUFBUyxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsS0FBaUIsTUFBMUI7QUFBQSxzQkFBQTthQUFBLE1BQUE7c0NBQUE7O1FBRkosQ0FBQTs7SUFsRk07Ozs7OztBQXNGZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4jIyNcblxuIyBiYXNlZCBvbiBjb2RlIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3JidXJucy9hbnNpLXRvLWh0bWxcblxueyBfIH0gPSByZXF1aXJlICdreGsnXG5cblNUWUxFUyA9XG4gICAgZjA6ICAnY29sb3I6IzAwMCcgIyBub3JtYWwgaW50ZW5zaXR5XG4gICAgZjE6ICAnY29sb3I6I0UwMCdcbiAgICBmMjogICdjb2xvcjojMEEwJ1xuICAgIGYzOiAgJ2NvbG9yOiNBNTAnXG4gICAgZjQ6ICAnY29sb3I6IzAwRSdcbiAgICBmNTogICdjb2xvcjojQTBBJ1xuICAgIGY2OiAgJ2NvbG9yOiMwQUEnXG4gICAgZjc6ICAnY29sb3I6I0FBQSdcbiAgICBmODogICdjb2xvcjojNTU1JyAjIGhpZ2ggaW50ZW5zaXR5XG4gICAgZjk6ICAnY29sb3I6I0Y1NSdcbiAgICBmMTA6ICdjb2xvcjojNUY1J1xuICAgIGYxMTogJ2NvbG9yOiNGRjUnXG4gICAgZjEyOiAnY29sb3I6IzU1RidcbiAgICBmMTM6ICdjb2xvcjojRjVGJ1xuICAgIGYxNDogJ2NvbG9yOiM1RkYnXG4gICAgZjE1OiAnY29sb3I6I0ZGRidcbiAgICBiMDogICdiYWNrZ3JvdW5kLWNvbG9yOiMwMDAnICMgbm9ybWFsIGludGVuc2l0eVxuICAgIGIxOiAgJ2JhY2tncm91bmQtY29sb3I6I0EwMCdcbiAgICBiMjogICdiYWNrZ3JvdW5kLWNvbG9yOiMwQTAnXG4gICAgYjM6ICAnYmFja2dyb3VuZC1jb2xvcjojQTUwJ1xuICAgIGI0OiAgJ2JhY2tncm91bmQtY29sb3I6IzAwQSdcbiAgICBiNTogICdiYWNrZ3JvdW5kLWNvbG9yOiNBMEEnXG4gICAgYjY6ICAnYmFja2dyb3VuZC1jb2xvcjojMEFBJ1xuICAgIGI3OiAgJ2JhY2tncm91bmQtY29sb3I6I0FBQSdcbiAgICBiODogICdiYWNrZ3JvdW5kLWNvbG9yOiM1NTUnICMgaGlnaCBpbnRlbnNpdHlcbiAgICBiOTogICdiYWNrZ3JvdW5kLWNvbG9yOiNGNTUnXG4gICAgYjEwOiAnYmFja2dyb3VuZC1jb2xvcjojNUY1J1xuICAgIGIxMTogJ2JhY2tncm91bmQtY29sb3I6I0ZGNSdcbiAgICBiMTI6ICdiYWNrZ3JvdW5kLWNvbG9yOiM1NUYnXG4gICAgYjEzOiAnYmFja2dyb3VuZC1jb2xvcjojRjVGJ1xuICAgIGIxNDogJ2JhY2tncm91bmQtY29sb3I6IzVGRidcbiAgICBiMTU6ICdiYWNrZ3JvdW5kLWNvbG9yOiNGRkYnXG5cbnRvSGV4U3RyaW5nID0gKG51bSkgLT5cbiAgICBudW0gPSBudW0udG9TdHJpbmcoMTYpXG4gICAgd2hpbGUgbnVtLmxlbmd0aCA8IDIgdGhlbiBudW0gPSBcIjAje251bX1cIlxuICAgIG51bVxuXG5bMC4uNV0uZm9yRWFjaCAocmVkKSAtPlxuICAgIFswLi41XS5mb3JFYWNoIChncmVlbikgLT5cbiAgICAgICAgWzAuLjVdLmZvckVhY2ggKGJsdWUpIC0+XG4gICAgICAgICAgICBjID0gMTYgKyAocmVkICogMzYpICsgKGdyZWVuICogNikgKyBibHVlXG4gICAgICAgICAgICByID0gaWYgcmVkICAgPiAwIHRoZW4gcmVkICAgKiA0MCArIDU1IGVsc2UgMFxuICAgICAgICAgICAgZyA9IGlmIGdyZWVuID4gMCB0aGVuIGdyZWVuICogNDAgKyA1NSBlbHNlIDBcbiAgICAgICAgICAgIGIgPSBpZiBibHVlICA+IDAgdGhlbiBibHVlICAqIDQwICsgNTUgZWxzZSAwICAgICAgICAgICAgXG4gICAgICAgICAgICByZ2IgPSAodG9IZXhTdHJpbmcobikgZm9yIG4gaW4gW3IsIGcsIGJdKS5qb2luKCcnKVxuICAgICAgICAgICAgU1RZTEVTW1wiZiN7Y31cIl0gPSBcImNvbG9yOiMje3JnYn1cIlxuICAgICAgICAgICAgU1RZTEVTW1wiYiN7Y31cIl0gPSBcImJhY2tncm91bmQtY29sb3I6IyN7cmdifVwiXG5cblswLi4yM10uZm9yRWFjaCAoZ3JheSkgLT5cbiAgICBjID0gZ3JheSsyMzJcbiAgICBsID0gdG9IZXhTdHJpbmcoZ3JheSoxMCArIDgpXG4gICAgU1RZTEVTW1wiZiN7Y31cIl0gPSBcImNvbG9yOiMje2x9I3tsfSN7bH1cIlxuICAgIFNUWUxFU1tcImIje2N9XCJdID0gXCJiYWNrZ3JvdW5kLWNvbG9yOiMje2x9I3tsfSN7bH1cIlxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG5cbmNsYXNzIEFuc2lEaXNzXG4gICAgXG4gICAgY29uc3RydWN0b3I6ICgpIC0+XG5cbiAgICBkaXNzZWN0OiAoQGlucHV0KSAtPlxuICAgICAgICBAZGlzcyAgPSBbXVxuICAgICAgICBAdGV4dCAgPSBcIlwiXG4gICAgICAgIEB0b2tlbml6ZSgpXG4gICAgICAgIFtAdGV4dCwgQGRpc3NdXG5cbiAgICB0b2tlbml6ZTogKCkgLT5cbiAgICAgICAgXG4gICAgICAgIHN0YXJ0ICAgICAgID0gMFxuICAgICAgICBhbnNpSGFuZGxlciA9IDJcbiAgICAgICAgYW5zaU1hdGNoICAgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgZmcgPSBiZyA9ICcnXG4gICAgICAgIHN0ID0gW11cblxuICAgICAgICByZXNldFN0eWxlID0gKCkgLT5cbiAgICAgICAgICAgIGZnID0gJydcbiAgICAgICAgICAgIGJnID0gJydcbiAgICAgICAgICAgIHN0ID0gW11cbiAgICAgICAgICAgIFxuICAgICAgICBhZGRTdHlsZSA9IChzdHlsZSkgLT4gc3QucHVzaCBzdHlsZSBpZiBzdHlsZSBub3QgaW4gc3RcbiAgICAgICAgZGVsU3R5bGUgPSAoc3R5bGUpIC0+IF8ucHVsbCBzdCwgc3R5bGVcbiAgICAgICAgXG4gICAgICAgIGFkZFRleHQgPSAodCkgPT5cbiAgICAgICAgICAgIEB0ZXh0ICs9IHRcbiAgICAgICAgICAgIHR4dCA9IEB0ZXh0LnNsaWNlIHN0YXJ0XG4gICAgICAgICAgICBtYXRjaCA9IHR4dC50cmltKClcbiAgICAgICAgICAgIGlmIG1hdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgIHN0eWxlID0gJydcbiAgICAgICAgICAgICAgICBzdHlsZSArPSBmZyArICc7JyAgICBpZiBmZy5sZW5ndGhcbiAgICAgICAgICAgICAgICBzdHlsZSArPSBiZyArICc7JyAgICBpZiBiZy5sZW5ndGhcbiAgICAgICAgICAgICAgICBzdHlsZSArPSBzdC5qb2luICc7JyBpZiBzdC5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZGlzcy5wdXNoXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoOiBtYXRjaFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQgKyB0eHQuc2VhcmNoIC9bXlxcc10vXG4gICAgICAgICAgICAgICAgICAgIHN0eWw6ICBzdHlsZVxuICAgICAgICAgICAgc3RhcnQgPSBAdGV4dC5sZW5ndGhcbiAgICAgICAgICAgICcnXG4gICAgICAgIFxuICAgICAgICB0b0hpZ2hJbnRlbnNpdHkgPSAoYykgLT5cbiAgICAgICAgICAgIGZvciBpIGluIFswLi43XVxuICAgICAgICAgICAgICAgIGlmIGMgPT0gU1RZTEVTW1wiZiN7aX1cIl1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUWUxFU1tcImYjezgraX1cIl1cbiAgICAgICAgICAgIGNcbiAgICAgICAgXG4gICAgICAgIGFuc2lDb2RlID0gKG0sIGMpIC0+XG4gICAgICAgICAgICBhbnNpTWF0Y2ggPSB0cnVlXG4gICAgICAgICAgICBjID0gJzAnIGlmIGMudHJpbSgpLmxlbmd0aCBpcyAwICAgICAgICAgICAgXG4gICAgICAgICAgICBjcyA9IGMudHJpbVJpZ2h0KCc7Jykuc3BsaXQoJzsnKSAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGNvZGUgaW4gY3NcbiAgICAgICAgICAgICAgICBjb2RlID0gcGFyc2VJbnQgY29kZSwgMTBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyAwICAgICAgICAgIHRoZW4gcmVzZXRTdHlsZSgpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyAxICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkU3R5bGUgJ2ZvbnQtd2VpZ2h0OmJvbGQnXG4gICAgICAgICAgICAgICAgICAgICAgICBmZyA9IHRvSGlnaEludGVuc2l0eSBmZ1xuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgMiAgICAgICAgICB0aGVuIGFkZFN0eWxlICdvcGFjaXR5OjAuNSdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDQgICAgICAgICAgdGhlbiBhZGRTdHlsZSAndGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZSdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDggICAgICAgICAgdGhlbiBhZGRTdHlsZSAnZGlzcGxheTpub25lJ1xuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgOSAgICAgICAgICB0aGVuIGFkZFN0eWxlICd0ZXh0LWRlY29yYXRpb246bGluZS10aHJvdWdoJ1xuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgMzkgICAgICAgICB0aGVuIGZnID0gU1RZTEVTW1wiZjE1XCJdICMgZGVmYXVsdCBmb3JlZ3JvdW5kXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyA0OSAgICAgICAgIHRoZW4gYmcgPSBTVFlMRVNbXCJiMFwiXSAgIyBkZWZhdWx0IGJhY2tncm91bmRcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDM4ICAgICAgICAgdGhlbiBmZyA9IFNUWUxFU1tcImYje2NzWzJdfVwiXSAjIGV4dGVuZGVkIGZnIDM4OzU7WzAtMjU1XVxuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgNDggICAgICAgICB0aGVuIGJnID0gU1RZTEVTW1wiYiN7Y3NbMl19XCJdICMgZXh0ZW5kZWQgYmcgNDg7NTtbMC0yNTVdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gIDMwIDw9IGNvZGUgPD0gMzcgIHRoZW4gZmcgPSBTVFlMRVNbXCJmI3tjb2RlIC0gMzB9XCJdICMgbm9ybWFsIGludGVuc2l0eVxuICAgICAgICAgICAgICAgICAgICB3aGVuICA0MCA8PSBjb2RlIDw9IDQ3ICB0aGVuIGJnID0gU1RZTEVTW1wiYiN7Y29kZSAtIDQwfVwiXVxuICAgICAgICAgICAgICAgICAgICB3aGVuICA5MCA8PSBjb2RlIDw9IDk3ICB0aGVuIGZnID0gU1RZTEVTW1wiZiN7OCtjb2RlIC0gOTB9XCJdICAjIGhpZ2ggaW50ZW5zaXR5XG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMTAwIDw9IGNvZGUgPD0gMTA3IHRoZW4gYmcgPSBTVFlMRVNbXCJiI3s4K2NvZGUgLSAxMDB9XCJdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyAyOCAgICAgICAgIHRoZW4gZGVsU3R5bGUgJ2Rpc3BsYXk6bm9uZSdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDIyICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxTdHlsZSAnZm9udC13ZWlnaHQ6Ym9sZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbFN0eWxlICdvcGFjaXR5OjAuNSdcbiAgICAgICAgICAgICAgICBicmVhayBpZiBjb2RlIGluIFszOCwgNDhdXG4gICAgICAgICAgICAnJ1xuICAgICAgICAgICAgXG4gICAgICAgIHRva2VucyA9IFtcbiAgICAgICAgICAgIHtwYXR0ZXJuOiAvXlxceDA4Ky8sICAgICAgICAgICAgICAgICAgICAgc3ViOiAnJ31cbiAgICAgICAgICAgIHtwYXR0ZXJuOiAvXlxceDFiXFxbWzAxMl0/Sy8sICAgICAgICAgICAgIHN1YjogJyd9XG4gICAgICAgICAgICB7cGF0dGVybjogL15cXHgxYlxcWygoPzpcXGR7MSwzfTs/KSt8KW0vLCAgc3ViOiBhbnNpQ29kZX0gXG4gICAgICAgICAgICB7cGF0dGVybjogL15cXHgxYlxcWz9bXFxkO117MCwzfS8sICAgICAgICAgc3ViOiAnJ31cbiAgICAgICAgICAgIHtwYXR0ZXJuOiAvXihbXlxceDFiXFx4MDhcXG5dKykvLCAgICAgICAgICBzdWI6IGFkZFRleHR9XG4gICAgICAgICBdXG5cbiAgICAgICAgcHJvY2VzcyA9IChoYW5kbGVyLCBpKSA9PlxuICAgICAgICAgICAgcmV0dXJuIGlmIGkgPiBhbnNpSGFuZGxlciBhbmQgYW5zaU1hdGNoICMgZ2l2ZSBhbnNpSGFuZGxlciBhbm90aGVyIGNoYW5jZSBpZiBpdCBtYXRjaGVzXG4gICAgICAgICAgICBhbnNpTWF0Y2ggPSBmYWxzZVxuICAgICAgICAgICAgQGlucHV0ID0gQGlucHV0LnJlcGxhY2UgaGFuZGxlci5wYXR0ZXJuLCBoYW5kbGVyLnN1YlxuXG4gICAgICAgIHdoaWxlIChsZW5ndGggPSBAaW5wdXQubGVuZ3RoKSA+IDBcbiAgICAgICAgICAgIHByb2Nlc3MoaGFuZGxlciwgaSkgZm9yIGhhbmRsZXIsIGkgaW4gdG9rZW5zXG4gICAgICAgICAgICBicmVhayBpZiBAaW5wdXQubGVuZ3RoID09IGxlbmd0aFxuICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEFuc2lEaXNzXG4iXX0=
//# sourceURL=../../coffee/tools/ansidiss.coffee