// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5zaWRpc3MuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRDQUFBO0lBQUE7O0FBVUUsSUFBTSxPQUFBLENBQVEsS0FBUjs7QUFFUixNQUFBLEdBQ0k7SUFBQSxFQUFBLEVBQUssWUFBTDtJQUNBLEVBQUEsRUFBSyxZQURMO0lBRUEsRUFBQSxFQUFLLFlBRkw7SUFHQSxFQUFBLEVBQUssWUFITDtJQUlBLEVBQUEsRUFBSyxZQUpMO0lBS0EsRUFBQSxFQUFLLFlBTEw7SUFNQSxFQUFBLEVBQUssWUFOTDtJQU9BLEVBQUEsRUFBSyxZQVBMO0lBUUEsRUFBQSxFQUFLLFlBUkw7SUFTQSxFQUFBLEVBQUssWUFUTDtJQVVBLEdBQUEsRUFBSyxZQVZMO0lBV0EsR0FBQSxFQUFLLFlBWEw7SUFZQSxHQUFBLEVBQUssWUFaTDtJQWFBLEdBQUEsRUFBSyxZQWJMO0lBY0EsR0FBQSxFQUFLLFlBZEw7SUFlQSxHQUFBLEVBQUssWUFmTDtJQWdCQSxFQUFBLEVBQUssdUJBaEJMO0lBaUJBLEVBQUEsRUFBSyx1QkFqQkw7SUFrQkEsRUFBQSxFQUFLLHVCQWxCTDtJQW1CQSxFQUFBLEVBQUssdUJBbkJMO0lBb0JBLEVBQUEsRUFBSyx1QkFwQkw7SUFxQkEsRUFBQSxFQUFLLHVCQXJCTDtJQXNCQSxFQUFBLEVBQUssdUJBdEJMO0lBdUJBLEVBQUEsRUFBSyx1QkF2Qkw7SUF3QkEsRUFBQSxFQUFLLHVCQXhCTDtJQXlCQSxFQUFBLEVBQUssdUJBekJMO0lBMEJBLEdBQUEsRUFBSyx1QkExQkw7SUEyQkEsR0FBQSxFQUFLLHVCQTNCTDtJQTRCQSxHQUFBLEVBQUssdUJBNUJMO0lBNkJBLEdBQUEsRUFBSyx1QkE3Qkw7SUE4QkEsR0FBQSxFQUFLLHVCQTlCTDtJQStCQSxHQUFBLEVBQUssdUJBL0JMOzs7QUFpQ0osV0FBQSxHQUFjLFNBQUMsR0FBRDtJQUNWLEdBQUEsR0FBTSxHQUFH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WixLQUFDLENBQUEsS0FBRCxHQUFTLEtBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLE9BQU8sQ0FBQyxPQUF2QixFQUFnQyxPQUFPLENBQUMsR0FBeEM7WUFISDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7QUFLVjtlQUFNLENBQUMsTUFBQSxHQUFTLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBakIsQ0FBQSxHQUEyQixDQUFqQztBQUNJLGlCQUFBLGdEQUFBOztnQkFBQSxPQUFBLENBQVEsT0FBUixFQUFpQixDQUFqQjtBQUFBO1lBQ0EsSUFBUyxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsS0FBaUIsTUFBMUI7QUFBQSxzQkFBQTthQUFBLE1BQUE7c0NBQUE7O1FBRkosQ0FBQTs7SUFsRk07Ozs7OztBQXNGZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4jIyNcblxuIyBiYXNlZCBvbiBjb2RlIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3JidXJucy9hbnNpLXRvLWh0bWxcblxueyBfIH0gPSByZXF1aXJlICdreGsnXG5cblNUWUxFUyA9XG4gICAgZjA6ICAnY29sb3I6IzAwMCcgIyBub3JtYWwgaW50ZW5zaXR5XG4gICAgZjE6ICAnY29sb3I6I0UwMCdcbiAgICBmMjogICdjb2xvcjojMEEwJ1xuICAgIGYzOiAgJ2NvbG9yOiNBNTAnXG4gICAgZjQ6ICAnY29sb3I6IzAwRSdcbiAgICBmNTogICdjb2xvcjojQTBBJ1xuICAgIGY2OiAgJ2NvbG9yOiMwQUEnXG4gICAgZjc6ICAnY29sb3I6I0FBQSdcbiAgICBmODogICdjb2xvcjojNTU1JyAjIGhpZ2ggaW50ZW5zaXR5XG4gICAgZjk6ICAnY29sb3I6I0Y1NSdcbiAgICBmMTA6ICdjb2xvcjojNUY1J1xuICAgIGYxMTogJ2NvbG9yOiNGRjUnXG4gICAgZjEyOiAnY29sb3I6IzU1RidcbiAgICBmMTM6ICdjb2xvcjojRjVGJ1xuICAgIGYxNDogJ2NvbG9yOiM1RkYnXG4gICAgZjE1OiAnY29sb3I6I0ZGRidcbiAgICBiMDogICdiYWNrZ3JvdW5kLWNvbG9yOiMwMDAnICMgbm9ybWFsIGludGVuc2l0eVxuICAgIGIxOiAgJ2JhY2tncm91bmQtY29sb3I6I0EwMCdcbiAgICBiMjogICdiYWNrZ3JvdW5kLWNvbG9yOiMwQTAnXG4gICAgYjM6ICAnYmFja2dyb3VuZC1jb2xvcjojQTUwJ1xuICAgIGI0OiAgJ2JhY2tncm91bmQtY29sb3I6IzAwQSdcbiAgICBiNTogICdiYWNrZ3JvdW5kLWNvbG9yOiNBMEEnXG4gICAgYjY6ICAnYmFja2dyb3VuZC1jb2xvcjojMEFBJ1xuICAgIGI3OiAgJ2JhY2tncm91bmQtY29sb3I6I0FBQSdcbiAgICBiODogICdiYWNrZ3JvdW5kLWNvbG9yOiM1NTUnICMgaGlnaCBpbnRlbnNpdHlcbiAgICBiOTogICdiYWNrZ3JvdW5kLWNvbG9yOiNGNTUnXG4gICAgYjEwOiAnYmFja2dyb3VuZC1jb2xvcjojNUY1J1xuICAgIGIxMTogJ2JhY2tncm91bmQtY29sb3I6I0ZGNSdcbiAgICBiMTI6ICdiYWNrZ3JvdW5kLWNvbG9yOiM1NUYnXG4gICAgYjEzOiAnYmFja2dyb3VuZC1jb2xvcjojRjVGJ1xuICAgIGIxNDogJ2JhY2tncm91bmQtY29sb3I6IzVGRidcbiAgICBiMTU6ICdiYWNrZ3JvdW5kLWNvbG9yOiNGRkYnXG5cbnRvSGV4U3RyaW5nID0gKG51bSkgLT5cbiAgICBudW0gPSBudW0udG9TdHJpbmcoMTYpXG4gICAgd2hpbGUgbnVtLmxlbmd0aCA8IDIgdGhlbiBudW0gPSBcIjAje251bX1cIlxuICAgIG51bVxuXG5bMC4uNV0uZm9yRWFjaCAocmVkKSAtPlxuICAgIFswLi41XS5mb3JFYWNoIChncmVlbikgLT5cbiAgICAgICAgWzAuLjVdLmZvckVhY2ggKGJsdWUpIC0+XG4gICAgICAgICAgICBjID0gMTYgKyAocmVkICogMzYpICsgKGdyZWVuICogNikgKyBibHVlXG4gICAgICAgICAgICByID0gaWYgcmVkICAgPiAwIHRoZW4gcmVkICAgKiA0MCArIDU1IGVsc2UgMFxuICAgICAgICAgICAgZyA9IGlmIGdyZWVuID4gMCB0aGVuIGdyZWVuICogNDAgKyA1NSBlbHNlIDBcbiAgICAgICAgICAgIGIgPSBpZiBibHVlICA+IDAgdGhlbiBibHVlICAqIDQwICsgNTUgZWxzZSAwICAgICAgICAgICAgXG4gICAgICAgICAgICByZ2IgPSAodG9IZXhTdHJpbmcobikgZm9yIG4gaW4gW3IsIGcsIGJdKS5qb2luKCcnKVxuICAgICAgICAgICAgU1RZTEVTW1wiZiN7Y31cIl0gPSBcImNvbG9yOiMje3JnYn1cIlxuICAgICAgICAgICAgU1RZTEVTW1wiYiN7Y31cIl0gPSBcImJhY2tncm91bmQtY29sb3I6IyN7cmdifVwiXG5cblswLi4yM10uZm9yRWFjaCAoZ3JheSkgLT5cbiAgICBjID0gZ3JheSsyMzJcbiAgICBsID0gdG9IZXhTdHJpbmcoZ3JheSoxMCArIDgpXG4gICAgU1RZTEVTW1wiZiN7Y31cIl0gPSBcImNvbG9yOiMje2x9I3tsfSN7bH1cIlxuICAgIFNUWUxFU1tcImIje2N9XCJdID0gXCJiYWNrZ3JvdW5kLWNvbG9yOiMje2x9I3tsfSN7bH1cIlxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG5cbmNsYXNzIEFuc2lEaXNzXG4gICAgXG4gICAgQDogKCkgLT5cblxuICAgIGRpc3NlY3Q6IChAaW5wdXQpIC0+XG4gICAgICAgIEBkaXNzICA9IFtdXG4gICAgICAgIEB0ZXh0ICA9IFwiXCJcbiAgICAgICAgQHRva2VuaXplKClcbiAgICAgICAgW0B0ZXh0LCBAZGlzc11cblxuICAgIHRva2VuaXplOiAoKSAtPlxuICAgICAgICBcbiAgICAgICAgc3RhcnQgICAgICAgPSAwXG4gICAgICAgIGFuc2lIYW5kbGVyID0gMlxuICAgICAgICBhbnNpTWF0Y2ggICA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICBmZyA9IGJnID0gJydcbiAgICAgICAgc3QgPSBbXVxuXG4gICAgICAgIHJlc2V0U3R5bGUgPSAoKSAtPlxuICAgICAgICAgICAgZmcgPSAnJ1xuICAgICAgICAgICAgYmcgPSAnJ1xuICAgICAgICAgICAgc3QgPSBbXVxuICAgICAgICAgICAgXG4gICAgICAgIGFkZFN0eWxlID0gKHN0eWxlKSAtPiBzdC5wdXNoIHN0eWxlIGlmIHN0eWxlIG5vdCBpbiBzdFxuICAgICAgICBkZWxTdHlsZSA9IChzdHlsZSkgLT4gXy5wdWxsIHN0LCBzdHlsZVxuICAgICAgICBcbiAgICAgICAgYWRkVGV4dCA9ICh0KSA9PlxuICAgICAgICAgICAgQHRleHQgKz0gdFxuICAgICAgICAgICAgdHh0ID0gQHRleHQuc2xpY2Ugc3RhcnRcbiAgICAgICAgICAgIG1hdGNoID0gdHh0LnRyaW0oKVxuICAgICAgICAgICAgaWYgbWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgc3R5bGUgPSAnJ1xuICAgICAgICAgICAgICAgIHN0eWxlICs9IGZnICsgJzsnICAgIGlmIGZnLmxlbmd0aFxuICAgICAgICAgICAgICAgIHN0eWxlICs9IGJnICsgJzsnICAgIGlmIGJnLmxlbmd0aFxuICAgICAgICAgICAgICAgIHN0eWxlICs9IHN0LmpvaW4gJzsnIGlmIHN0Lmxlbmd0aFxuICAgICAgICAgICAgICAgIEBkaXNzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IG1hdGNoXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCArIHR4dC5zZWFyY2ggL1teXFxzXS9cbiAgICAgICAgICAgICAgICAgICAgc3R5bDogIHN0eWxlXG4gICAgICAgICAgICBzdGFydCA9IEB0ZXh0Lmxlbmd0aFxuICAgICAgICAgICAgJydcbiAgICAgICAgXG4gICAgICAgIHRvSGlnaEludGVuc2l0eSA9IChjKSAtPlxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLjddXG4gICAgICAgICAgICAgICAgaWYgYyA9PSBTVFlMRVNbXCJmI3tpfVwiXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU1RZTEVTW1wiZiN7OCtpfVwiXVxuICAgICAgICAgICAgY1xuICAgICAgICBcbiAgICAgICAgYW5zaUNvZGUgPSAobSwgYykgLT5cbiAgICAgICAgICAgIGFuc2lNYXRjaCA9IHRydWVcbiAgICAgICAgICAgIGMgPSAnMCcgaWYgYy50cmltKCkubGVuZ3RoIGlzIDAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNzID0gYy50cmltUmlnaHQoJzsnKS5zcGxpdCgnOycpICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY29kZSBpbiBjc1xuICAgICAgICAgICAgICAgIGNvZGUgPSBwYXJzZUludCBjb2RlLCAxMFxuICAgICAgICAgICAgICAgIHN3aXRjaCBcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDAgICAgICAgICAgdGhlbiByZXNldFN0eWxlKClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDEgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRTdHlsZSAnZm9udC13ZWlnaHQ6Ym9sZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGZnID0gdG9IaWdoSW50ZW5zaXR5IGZnXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyAyICAgICAgICAgIHRoZW4gYWRkU3R5bGUgJ29wYWNpdHk6MC41J1xuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgNCAgICAgICAgICB0aGVuIGFkZFN0eWxlICd0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lJ1xuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgOCAgICAgICAgICB0aGVuIGFkZFN0eWxlICdkaXNwbGF5Om5vbmUnXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyA5ICAgICAgICAgIHRoZW4gYWRkU3R5bGUgJ3RleHQtZGVjb3JhdGlvbjpsaW5lLXRocm91Z2gnXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyAzOSAgICAgICAgIHRoZW4gZmcgPSBTVFlMRVNbXCJmMTVcIl0gIyBkZWZhdWx0IGZvcmVncm91bmRcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDQ5ICAgICAgICAgdGhlbiBiZyA9IFNUWUxFU1tcImIwXCJdICAjIGRlZmF1bHQgYmFja2dyb3VuZFxuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgMzggICAgICAgICB0aGVuIGZnID0gU1RZTEVTW1wiZiN7Y3NbMl19XCJdICMgZXh0ZW5kZWQgZmcgMzg7NTtbMC0yNTVdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gY29kZSBpcyA0OCAgICAgICAgIHRoZW4gYmcgPSBTVFlMRVNbXCJiI3tjc1syXX1cIl0gIyBleHRlbmRlZCBiZyA0ODs1O1swLTI1NV1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAgMzAgPD0gY29kZSA8PSAzNyAgdGhlbiBmZyA9IFNUWUxFU1tcImYje2NvZGUgLSAzMH1cIl0gIyBub3JtYWwgaW50ZW5zaXR5XG4gICAgICAgICAgICAgICAgICAgIHdoZW4gIDQwIDw9IGNvZGUgPD0gNDcgIHRoZW4gYmcgPSBTVFlMRVNbXCJiI3tjb2RlIC0gNDB9XCJdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gIDkwIDw9IGNvZGUgPD0gOTcgIHRoZW4gZmcgPSBTVFlMRVNbXCJmI3s4K2NvZGUgLSA5MH1cIl0gICMgaGlnaCBpbnRlbnNpdHlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxMDAgPD0gY29kZSA8PSAxMDcgdGhlbiBiZyA9IFNUWUxFU1tcImIjezgrY29kZSAtIDEwMH1cIl1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiBjb2RlIGlzIDI4ICAgICAgICAgdGhlbiBkZWxTdHlsZSAnZGlzcGxheTpub25lJ1xuICAgICAgICAgICAgICAgICAgICB3aGVuIGNvZGUgaXMgMjIgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbFN0eWxlICdmb250LXdlaWdodDpib2xkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsU3R5bGUgJ29wYWNpdHk6MC41J1xuICAgICAgICAgICAgICAgIGJyZWFrIGlmIGNvZGUgaW4gWzM4LCA0OF1cbiAgICAgICAgICAgICcnXG4gICAgICAgICAgICBcbiAgICAgICAgdG9rZW5zID0gW1xuICAgICAgICAgICAge3BhdHRlcm46IC9eXFx4MDgrLywgICAgICAgICAgICAgICAgICAgICBzdWI6ICcnfVxuICAgICAgICAgICAge3BhdHRlcm46IC9eXFx4MWJcXFtbMDEyXT9LLywgICAgICAgICAgICAgc3ViOiAnJ31cbiAgICAgICAgICAgIHtwYXR0ZXJuOiAvXlxceDFiXFxbKCg/OlxcZHsxLDN9Oz8pK3wpbS8sICBzdWI6IGFuc2lDb2RlfSBcbiAgICAgICAgICAgIHtwYXR0ZXJuOiAvXlxceDFiXFxbP1tcXGQ7XXswLDN9LywgICAgICAgICBzdWI6ICcnfVxuICAgICAgICAgICAge3BhdHRlcm46IC9eKFteXFx4MWJcXHgwOFxcbl0rKS8sICAgICAgICAgIHN1YjogYWRkVGV4dH1cbiAgICAgICAgIF1cblxuICAgICAgICBwcm9jZXNzID0gKGhhbmRsZXIsIGkpID0+XG4gICAgICAgICAgICByZXR1cm4gaWYgaSA+IGFuc2lIYW5kbGVyIGFuZCBhbnNpTWF0Y2ggIyBnaXZlIGFuc2lIYW5kbGVyIGFub3RoZXIgY2hhbmNlIGlmIGl0IG1hdGNoZXNcbiAgICAgICAgICAgIGFuc2lNYXRjaCA9IGZhbHNlXG4gICAgICAgICAgICBAaW5wdXQgPSBAaW5wdXQucmVwbGFjZSBoYW5kbGVyLnBhdHRlcm4sIGhhbmRsZXIuc3ViXG5cbiAgICAgICAgd2hpbGUgKGxlbmd0aCA9IEBpbnB1dC5sZW5ndGgpID4gMFxuICAgICAgICAgICAgcHJvY2VzcyhoYW5kbGVyLCBpKSBmb3IgaGFuZGxlciwgaSBpbiB0b2tlbnNcbiAgICAgICAgICAgIGJyZWFrIGlmIEBpbnB1dC5sZW5ndGggPT0gbGVuZ3RoXG4gICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQW5zaURpc3NcbiJdfQ==
//# sourceURL=../../coffee/tools/ansidiss.coffee