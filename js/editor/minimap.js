// koffee 1.14.0

/*
00     00  000  000   000  000  00     00   0000000   00000000
000   000  000  0000  000  000  000   000  000   000  000   000
000000000  000  000 0 000  000  000000000  000000000  00000000
000 0 000  000  000  0000  000  000 0 000  000   000  000
000   000  000  000   000  000  000   000  000   000  000
 */
var MapScroll, Minimap, clamp, drag, elem, getStyle, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), clamp = ref.clamp, drag = ref.drag, elem = ref.elem, getStyle = ref.getStyle;

MapScroll = require('./mapscroll');

Minimap = (function() {
    function Minimap(editor) {
        var minimapWidth, ref1;
        this.editor = editor;
        this.clearAll = bind(this.clearAll, this);
        this.onScroll = bind(this.onScroll, this);
        this.onEditorScroll = bind(this.onEditorScroll, this);
        this.onEditorViewHeight = bind(this.onEditorViewHeight, this);
        this.onEditorNumLines = bind(this.onEditorNumLines, this);
        this.onStart = bind(this.onStart, this);
        this.onDrag = bind(this.onDrag, this);
        this.onChanged = bind(this.onChanged, this);
        this.onVanishLines = bind(this.onVanishLines, this);
        this.onExposeLines = bind(this.onExposeLines, this);
        this.exposeLine = bind(this.exposeLine, this);
        this.drawTopBot = bind(this.drawTopBot, this);
        this.drawMainCursor = bind(this.drawMainCursor, this);
        this.drawCursors = bind(this.drawCursors, this);
        this.drawHighlights = bind(this.drawHighlights, this);
        this.drawLines = bind(this.drawLines, this);
        this.drawSelections = bind(this.drawSelections, this);
        minimapWidth = parseInt(getStyle('.minimap', 'width'));
        this.editor.layerScroll.style.right = minimapWidth + "px";
        this.width = 2 * minimapWidth;
        this.height = 8192;
        this.offsetLeft = 6;
        this.elem = elem({
            "class": 'minimap'
        });
        this.topbot = elem({
            "class": 'topbot'
        });
        this.selecti = elem('canvas', {
            "class": 'minimapSelections',
            width: this.width,
            height: this.height
        });
        this.lines = elem('canvas', {
            "class": 'minimapLines',
            width: this.width,
            height: this.height
        });
        this.highlig = elem('canvas', {
            "class": 'minimapHighlights',
            width: this.width,
            height: this.height
        });
        this.cursors = elem('canvas', {
            "class": 'minimapCursors',
            width: this.width,
            height: this.height
        });
        this.elem.appendChild(this.topbot);
        this.elem.appendChild(this.selecti);
        this.elem.appendChild(this.lines);
        this.elem.appendChild(this.highlig);
        this.elem.appendChild(this.cursors);
        this.elem.addEventListener('wheel', (ref1 = this.editor.scrollbar) != null ? ref1.onWheel : void 0);
        this.editor.view.appendChild(this.elem);
        this.editor.on('viewHeight', this.onEditorViewHeight);
        this.editor.on('numLines', this.onEditorNumLines);
        this.editor.on('changed', this.onChanged);
        this.editor.on('highlight', this.drawHighlights);
        this.editor.scroll.on('scroll', this.onEditorScroll);
        this.scroll = new MapScroll({
            exposeMax: this.height / 4,
            lineHeight: 4,
            viewHeight: 2 * this.editor.viewHeight()
        });
        this.scroll.name = this.editor.name + ".minimap";
        this.drag = new drag({
            target: this.elem,
            onStart: this.onStart,
            onMove: this.onDrag,
            cursor: 'pointer'
        });
        this.scroll.on('clearLines', this.clearAll);
        this.scroll.on('scroll', this.onScroll);
        this.scroll.on('exposeLines', this.onExposeLines);
        this.scroll.on('vanishLines', this.onVanishLines);
        this.scroll.on('exposeLine', this.exposeLine);
        this.onScroll();
        this.drawLines();
        this.drawTopBot();
    }

    Minimap.prototype.drawSelections = function() {
        var ctx, i, len, offset, r, ref1, results, y;
        this.selecti.height = this.height;
        this.selecti.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.selecti.getContext('2d');
        ctx.fillStyle = this.editor.syntax.colorForClassnames('selection');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, this.editor.selections());
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                offset = r[1][0] && this.offsetLeft || 0;
                ctx.fillRect(offset + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight);
                results.push(ctx.fillRect(260 - 6, y, 2, this.scroll.lineHeight));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Minimap.prototype.drawLines = function(top, bot) {
        var ctx, diss, i, li, r, ref1, ref2, results, y;
        if (top == null) {
            top = this.scroll.exposeTop;
        }
        if (bot == null) {
            bot = this.scroll.exposeBot;
        }
        ctx = this.lines.getContext('2d');
        y = parseInt((top - this.scroll.exposeTop) * this.scroll.lineHeight);
        ctx.clearRect(0, y, this.width, ((bot - this.scroll.exposeTop) - (top - this.scroll.exposeTop) + 1) * this.scroll.lineHeight);
        if (this.scroll.exposeBot < 0) {
            return;
        }
        bot = Math.min(bot, this.editor.numLines() - 1);
        if (bot < top) {
            return;
        }
        results = [];
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            diss = this.editor.syntax.getDiss(li);
            y = parseInt((li - this.scroll.exposeTop) * this.scroll.lineHeight);
            results.push((function() {
                var j, len, ref3, results1;
                ref3 = diss != null ? diss : [];
                results1 = [];
                for (j = 0, len = ref3.length; j < len; j++) {
                    r = ref3[j];
                    if (2 * r.start >= this.width) {
                        break;
                    }
                    if (r.clss != null) {
                        ctx.fillStyle = this.editor.syntax.colorForClassnames(r.clss + " minimap");
                    } else if (r.styl != null) {
                        ctx.fillStyle = this.editor.syntax.colorForStyle(r.styl);
                    }
                    results1.push(ctx.fillRect(this.offsetLeft + 2 * r.start, y, 2 * r.match.length, this.scroll.lineHeight));
                }
                return results1;
            }).call(this));
        }
        return results;
    };

    Minimap.prototype.drawHighlights = function() {
        var ctx, i, len, r, ref1, results, y;
        this.highlig.height = this.height;
        this.highlig.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.highlig.getContext('2d');
        ctx.fillStyle = this.editor.syntax.colorForClassnames('highlight');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, this.editor.highlights());
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                ctx.fillRect(this.offsetLeft + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight);
            }
            results.push(ctx.fillRect(260 - 4, y, 4, this.scroll.lineHeight));
        }
        return results;
    };

    Minimap.prototype.drawCursors = function() {
        var ctx, i, len, r, ref1, y;
        this.cursors.height = this.height;
        this.cursors.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.cursors.getContext('2d');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, rangesFromPositions(this.editor.cursors()));
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                ctx.fillStyle = '#f80';
                ctx.fillRect(this.offsetLeft + 2 * r[1][0], y, 2, this.scroll.lineHeight);
            }
            ctx.fillStyle = 'rgba(255,128,0,0.5)';
            ctx.fillRect(260 - 8, y, 4, this.scroll.lineHeight);
        }
        return this.drawMainCursor();
    };

    Minimap.prototype.drawMainCursor = function(blink) {
        var ctx, mc, y;
        ctx = this.cursors.getContext('2d');
        ctx.fillStyle = blink && '#000' || '#ff0';
        mc = this.editor.mainCursor();
        y = (mc[1] - this.scroll.exposeTop) * this.scroll.lineHeight;
        if (2 * mc[0] < this.width) {
            ctx.fillRect(this.offsetLeft + 2 * mc[0], y, 2, this.scroll.lineHeight);
        }
        return ctx.fillRect(260 - 8, y, 8, this.scroll.lineHeight);
    };

    Minimap.prototype.drawTopBot = function() {
        var lh, th, ty;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        lh = this.scroll.lineHeight / 2;
        th = (this.editor.scroll.bot - this.editor.scroll.top + 1) * lh;
        ty = 0;
        if (this.editor.scroll.scrollMax) {
            ty = (Math.min(0.5 * this.scroll.viewHeight, this.scroll.numLines * 2) - th) * this.editor.scroll.scroll / this.editor.scroll.scrollMax;
        }
        this.topbot.style.height = th + "px";
        return this.topbot.style.top = ty + "px";
    };

    Minimap.prototype.exposeLine = function(li) {
        return this.drawLines(li, li);
    };

    Minimap.prototype.onExposeLines = function(e) {
        return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
    };

    Minimap.prototype.onVanishLines = function(e) {
        if (e.top != null) {
            return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
        } else {
            return this.clearRange(this.scroll.exposeBot, this.scroll.exposeBot + this.scroll.numLines);
        }
    };

    Minimap.prototype.onChanged = function(changeInfo) {
        var change, i, len, li, ref1, ref2, results;
        if (this.scroll.numLines !== this.editor.numLines() || (changeInfo.inserts || changeInfo.deletes)) {
            this.scroll.setNumLines(0);
            this.scroll.setNumLines(this.editor.numLines());
            this.onEditorScroll();
            this.drawSelections();
            this.drawCursors();
            return;
        }
        if (changeInfo.selects) {
            this.drawSelections();
        }
        if (changeInfo.cursors) {
            this.drawCursors();
        }
        ref1 = changeInfo.changes;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            li = (ref2 = change.oldIndex) != null ? ref2 : change.doIndex;
            results.push(this.drawLines(li, li));
        }
        return results;
    };

    Minimap.prototype.onDrag = function(drag, event) {
        var br, li, pc, ry;
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            br = this.elem.getBoundingClientRect();
            ry = event.clientY - br.top;
            pc = 2 * ry / this.scroll.viewHeight;
            li = parseInt(pc * this.editor.scroll.numLines);
            return this.jumpToLine(li, event);
        } else {
            return this.jumpToLine(this.lineIndexForEvent(event), event);
        }
    };

    Minimap.prototype.onStart = function(drag, event) {
        return this.jumpToLine(this.lineIndexForEvent(event), event);
    };

    Minimap.prototype.jumpToLine = function(li, event) {
        var jumpTo;
        jumpTo = (function(_this) {
            return function() {
                _this.editor.scroll.to((li - 5) * _this.editor.scroll.lineHeight);
                if (!event.metaKey) {
                    _this.editor.singleCursorAtPos([0, li + 5], {
                        extend: event.shiftKey
                    });
                }
                _this.editor.focus();
                return _this.onEditorScroll();
            };
        })(this);
        clearImmediate(this.jumpToTimer);
        return this.jumpToTimer = setImmediate(jumpTo);
    };

    Minimap.prototype.lineIndexForEvent = function(event) {
        var br, li, ly, py, st;
        st = this.elem.scrollTop;
        br = this.elem.getBoundingClientRect();
        ly = clamp(0, this.elem.offsetHeight, event.clientY - br.top);
        py = parseInt(Math.floor(2 * ly / this.scroll.lineHeight)) + this.scroll.top;
        li = parseInt(Math.min(this.scroll.numLines - 1, py));
        return li;
    };

    Minimap.prototype.onEditorNumLines = function(n) {
        if (n && this.lines.height <= this.scroll.lineHeight) {
            this.onEditorViewHeight(this.editor.viewHeight());
        }
        return this.scroll.setNumLines(n);
    };

    Minimap.prototype.onEditorViewHeight = function(h) {
        this.scroll.setViewHeight(2 * this.editor.viewHeight());
        this.onScroll();
        return this.onEditorScroll();
    };

    Minimap.prototype.onEditorScroll = function() {
        var pc, tp;
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            pc = this.editor.scroll.scroll / this.editor.scroll.scrollMax;
            tp = parseInt(pc * this.scroll.scrollMax);
            this.scroll.to(tp);
        }
        return this.drawTopBot();
    };

    Minimap.prototype.onScroll = function() {
        var t, x, y;
        y = parseInt(-this.height / 4 - this.scroll.offsetTop / 2);
        x = parseInt(this.width / 4);
        t = "translate3d(" + x + "px, " + y + "px, 0px) scale3d(0.5, 0.5, 1)";
        this.selecti.style.transform = t;
        this.highlig.style.transform = t;
        this.cursors.style.transform = t;
        return this.lines.style.transform = t;
    };

    Minimap.prototype.clearRange = function(top, bot) {
        var ctx;
        ctx = this.lines.getContext('2d');
        return ctx.clearRect(0, (top - this.scroll.exposeTop) * this.scroll.lineHeight, 2 * this.width, (bot - top) * this.scroll.lineHeight);
    };

    Minimap.prototype.clearAll = function() {
        this.selecti.width = this.selecti.width;
        this.highlig.width = this.highlig.width;
        this.cursors.width = this.cursors.width;
        this.topbot.width = this.topbot.width;
        this.lines.width = this.lines.width;
        return this.topbot.style.height = '0';
    };

    return Minimap;

})();

module.exports = Minimap;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJtaW5pbWFwLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvREFBQTtJQUFBOztBQVFBLE1BQWtDLE9BQUEsQ0FBUSxLQUFSLENBQWxDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQjs7QUFFckIsU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUVOO0lBRUMsaUJBQUMsTUFBRDtBQUlDLFlBQUE7UUFKQSxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBSUEsWUFBQSxHQUFlLFFBQUEsQ0FBUyxRQUFBLENBQVMsVUFBVCxFQUFxQixPQUFyQixDQUFUO1FBRWYsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQTFCLEdBQXFDLFlBQUQsR0FBYztRQUVsRCxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsR0FBRTtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsVUFBRCxHQUFjO1FBRWQsSUFBQyxDQUFBLElBQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxRQUFMLEVBQWM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1lBQTJCLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBbkM7WUFBMEMsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFuRDtTQUFkO1FBQ1gsSUFBQyxDQUFBLEtBQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFjO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO1lBQTJC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YixHQUEyQjtJQVJyQjs7c0JBZ0JWLFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7ZUFDTixHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsRUFBaUIsQ0FBQyxHQUFBLEdBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFiLENBQUEsR0FBd0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFqRCxFQUE2RCxDQUFBLEdBQUUsSUFBQyxDQUFBLEtBQWhFLEVBQXVFLENBQUMsR0FBQSxHQUFJLEdBQUwsQ0FBQSxHQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBekY7SUFIUTs7c0JBS1osUUFBQSxHQUFVLFNBQUE7UUFFTixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsR0FBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQztRQUMxQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsR0FBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQztRQUMxQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsR0FBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQztRQUMxQixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsR0FBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUN6QixJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsR0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQztlQUN4QixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFkLEdBQXVCO0lBUGpCOzs7Ozs7QUFTZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4jIyNcblxueyBjbGFtcCwgZHJhZywgZWxlbSwgZ2V0U3R5bGUgfSA9IHJlcXVpcmUgJ2t4aydcblxuTWFwU2Nyb2xsID0gcmVxdWlyZSAnLi9tYXBzY3JvbGwnXG5cbmNsYXNzIE1pbmltYXBcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgIyBhZGQgaGlnaGxpZ2h0cyBhbmQgY3Vyc29ycyBhdCByaWdodCBib3JkZXJcblxuICAgICAgICBtaW5pbWFwV2lkdGggPSBwYXJzZUludCBnZXRTdHlsZSAnLm1pbmltYXAnLCAnd2lkdGgnXG5cbiAgICAgICAgQGVkaXRvci5sYXllclNjcm9sbC5zdHlsZS5yaWdodCA9IFwiI3ttaW5pbWFwV2lkdGh9cHhcIlxuXG4gICAgICAgIEB3aWR0aCA9IDIqbWluaW1hcFdpZHRoXG4gICAgICAgIEBoZWlnaHQgPSA4MTkyXG4gICAgICAgIEBvZmZzZXRMZWZ0ID0gNlxuXG4gICAgICAgIEBlbGVtICAgID0gZWxlbSBjbGFzczogJ21pbmltYXAnXG4gICAgICAgIEB0b3Bib3QgID0gZWxlbSBjbGFzczogJ3RvcGJvdCdcbiAgICAgICAgQHNlbGVjdGkgPSBlbGVtICdjYW52YXMnIGNsYXNzOiAnbWluaW1hcFNlbGVjdGlvbnMnIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAbGluZXMgICA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwTGluZXMnICAgICAgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBoaWdobGlnID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBIaWdobGlnaHRzJyB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGN1cnNvcnMgPSBlbGVtICdjYW52YXMnIGNsYXNzOiAnbWluaW1hcEN1cnNvcnMnICAgIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEB0b3Bib3RcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHNlbGVjdGlcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGxpbmVzXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBoaWdobGlnXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBjdXJzb3JzXG5cbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnIEBlZGl0b3Iuc2Nyb2xsYmFyPy5vbldoZWVsXG5cbiAgICAgICAgQGVkaXRvci52aWV3LmFwcGVuZENoaWxkICAgIEBlbGVtXG4gICAgICAgIEBlZGl0b3Iub24gJ3ZpZXdIZWlnaHQnICAgIEBvbkVkaXRvclZpZXdIZWlnaHRcbiAgICAgICAgQGVkaXRvci5vbiAnbnVtTGluZXMnICAgICAgQG9uRWRpdG9yTnVtTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnY2hhbmdlZCcgICAgICAgQG9uQ2hhbmdlZFxuICAgICAgICBAZWRpdG9yLm9uICdoaWdobGlnaHQnICAgICBAZHJhd0hpZ2hsaWdodHNcbiAgICAgICAgQGVkaXRvci5zY3JvbGwub24gJ3Njcm9sbCcgQG9uRWRpdG9yU2Nyb2xsXG5cbiAgICAgICAgQHNjcm9sbCA9IG5ldyBNYXBTY3JvbGxcbiAgICAgICAgICAgIGV4cG9zZU1heDogIEBoZWlnaHQvNFxuICAgICAgICAgICAgbGluZUhlaWdodDogNFxuICAgICAgICAgICAgdmlld0hlaWdodDogMipAZWRpdG9yLnZpZXdIZWlnaHQoKVxuXG4gICAgICAgIEBzY3JvbGwubmFtZSA9IFwiI3tAZWRpdG9yLm5hbWV9Lm1pbmltYXBcIlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBlbGVtXG4gICAgICAgICAgICBvblN0YXJ0OiBAb25TdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ1xuICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcidcblxuICAgICAgICBAc2Nyb2xsLm9uICdjbGVhckxpbmVzJyAgQGNsZWFyQWxsXG4gICAgICAgIEBzY3JvbGwub24gJ3Njcm9sbCcgICAgICBAb25TY3JvbGxcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZXMnIEBvbkV4cG9zZUxpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3ZhbmlzaExpbmVzJyBAb25WYW5pc2hMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdleHBvc2VMaW5lJyAgQGV4cG9zZUxpbmVcblxuICAgICAgICBAb25TY3JvbGwoKVxuICAgICAgICBAZHJhd0xpbmVzKClcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMFxuXG4gICAgZHJhd1NlbGVjdGlvbnM6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAc2VsZWN0aS53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBzZWxlY3RpLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzICdzZWxlY3Rpb24nXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgQGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSByWzFdWzBdIGFuZCBAb2Zmc2V0TGVmdCBvciAwXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IG9mZnNldCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCAyNjAtNiwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3TGluZXM6ICh0b3A9QHNjcm9sbC5leHBvc2VUb3AsIGJvdD1Ac2Nyb2xsLmV4cG9zZUJvdCkgPT5cblxuICAgICAgICBjdHggPSBAbGluZXMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIHkgPSBwYXJzZUludCgodG9wLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQpXG4gICAgICAgIGN0eC5jbGVhclJlY3QgMCwgeSwgQHdpZHRoLCAoKGJvdC1Ac2Nyb2xsLmV4cG9zZVRvcCktKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkrMSkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgYm90ID0gTWF0aC5taW4gYm90LCBAZWRpdG9yLm51bUxpbmVzKCktMVxuICAgICAgICByZXR1cm4gaWYgYm90IDwgdG9wXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBkaXNzID0gQGVkaXRvci5zeW50YXguZ2V0RGlzcyBsaVxuICAgICAgICAgICAgeSA9IHBhcnNlSW50KChsaS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0KVxuICAgICAgICAgICAgZm9yIHIgaW4gZGlzcyA/IFtdXG4gICAgICAgICAgICAgICAgYnJlYWsgaWYgMipyLnN0YXJ0ID49IEB3aWR0aFxuICAgICAgICAgICAgICAgIGlmIHIuY2xzcz9cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyByLmNsc3MgKyBcIiBtaW5pbWFwXCJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHIuc3R5bD9cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yU3R5bGUgci5zdHlsXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqci5zdGFydCwgeSwgMipyLm1hdGNoLmxlbmd0aCwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3SGlnaGxpZ2h0czogPT5cblxuICAgICAgICBAaGlnaGxpZy5oZWlnaHQgPSBAaGVpZ2h0XG4gICAgICAgIEBoaWdobGlnLndpZHRoID0gQHdpZHRoXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgY3R4ID0gQGhpZ2hsaWcuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgJ2hpZ2hsaWdodCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCBAZWRpdG9yLmhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgeSA9IChyWzBdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIDIqclsxXVswXSA8IEB3aWR0aFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDI2MC00LCB5LCA0LCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdDdXJzb3JzOiA9PlxuXG4gICAgICAgIEBjdXJzb3JzLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQGN1cnNvcnMud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAY3Vyc29ycy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCByYW5nZXNGcm9tUG9zaXRpb25zIEBlZGl0b3IuY3Vyc29ycygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICcjZjgwJ1xuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDI1NSwxMjgsMCwwLjUpJ1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDI2MC04LCB5LCA0LCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgQGRyYXdNYWluQ3Vyc29yKClcblxuICAgIGRyYXdNYWluQ3Vyc29yOiAoYmxpbmspID0+XG5cbiAgICAgICAgY3R4ID0gQGN1cnNvcnMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBibGluayBhbmQgJyMwMDAnIG9yICcjZmYwJ1xuICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHkgPSAobWNbMV0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBpZiAyKm1jWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMiptY1swXSwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIGN0eC5maWxsUmVjdCAyNjAtOCwgeSwgOCwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3VG9wQm90OiA9PlxuXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcblxuICAgICAgICBsaCA9IEBzY3JvbGwubGluZUhlaWdodC8yXG4gICAgICAgIHRoID0gKEBlZGl0b3Iuc2Nyb2xsLmJvdC1AZWRpdG9yLnNjcm9sbC50b3ArMSkqbGhcbiAgICAgICAgdHkgPSAwXG4gICAgICAgIGlmIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgdHkgPSAoTWF0aC5taW4oMC41KkBzY3JvbGwudmlld0hlaWdodCwgQHNjcm9sbC5udW1MaW5lcyoyKS10aCkgKiBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgLyBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgQHRvcGJvdC5zdHlsZS5oZWlnaHQgPSBcIiN7dGh9cHhcIlxuICAgICAgICBAdG9wYm90LnN0eWxlLnRvcCAgICA9IFwiI3t0eX1weFwiXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBleHBvc2VMaW5lOiAgIChsaSkgPT5cbiAgICAgICAgQGRyYXdMaW5lcyBsaSwgbGlcbiAgICAgICAgXG4gICAgb25FeHBvc2VMaW5lczogKGUpID0+IFxuICAgICAgICBAZHJhd0xpbmVzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuXG4gICAgb25WYW5pc2hMaW5lczogKGUpID0+XG4gICAgICAgIGlmIGUudG9wP1xuICAgICAgICAgICAgQGRyYXdMaW5lcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNsZWFyUmFuZ2UgQHNjcm9sbC5leHBvc2VCb3QsIEBzY3JvbGwuZXhwb3NlQm90K0BzY3JvbGwubnVtTGluZXNcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25DaGFuZ2VkOiAoY2hhbmdlSW5mbykgPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLm51bUxpbmVzICE9IEBlZGl0b3IubnVtTGluZXMoKSBvciAoY2hhbmdlSW5mby5pbnNlcnRzIG9yIGNoYW5nZUluZm8uZGVsZXRlcylcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgMFxuICAgICAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAZWRpdG9yLm51bUxpbmVzKClcbiAgICAgICAgICAgIEBvbkVkaXRvclNjcm9sbCgpXG4gICAgICAgICAgICBAZHJhd1NlbGVjdGlvbnMoKVxuICAgICAgICAgICAgQGRyYXdDdXJzb3JzKClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBkcmF3U2VsZWN0aW9ucygpIGlmIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICBAZHJhd0N1cnNvcnMoKSAgICBpZiBjaGFuZ2VJbmZvLmN1cnNvcnNcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgbGkgPSBjaGFuZ2Uub2xkSW5kZXggPyBjaGFuZ2UuZG9JbmRleFxuICAgICAgICAgICAgQGRyYXdMaW5lcyBsaSwgbGlcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBvbkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLmZ1bGxIZWlnaHQgPiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIHJ5ID0gZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICAgICAgcGMgPSAyKnJ5IC8gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBsaSA9IHBhcnNlSW50IHBjICogQGVkaXRvci5zY3JvbGwubnVtTGluZXNcbiAgICAgICAgICAgIEBqdW1wVG9MaW5lIGxpLCBldmVudFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAanVtcFRvTGluZSBAbGluZUluZGV4Rm9yRXZlbnQoZXZlbnQpLCBldmVudFxuXG4gICAgb25TdGFydDogKGRyYWcsZXZlbnQpID0+IEBqdW1wVG9MaW5lIEBsaW5lSW5kZXhGb3JFdmVudChldmVudCksIGV2ZW50XG5cbiAgICBqdW1wVG9MaW5lOiAobGksIGV2ZW50KSAtPlxuXG4gICAgICAgIGp1bXBUbyA9ID0+XG4gICAgICAgICAgICBAZWRpdG9yLnNjcm9sbC50byAobGktNSkgKiBAZWRpdG9yLnNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICAgICAgICAgIGlmIG5vdCBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbMCwgbGkrNV0sIGV4dGVuZDpldmVudC5zaGlmdEtleVxuICAgIFxuICAgICAgICAgICAgQGVkaXRvci5mb2N1cygpXG4gICAgICAgICAgICBAb25FZGl0b3JTY3JvbGwoKVxuXG4gICAgICAgIGNsZWFySW1tZWRpYXRlIEBqdW1wVG9UaW1lclxuICAgICAgICBAanVtcFRvVGltZXIgPSBzZXRJbW1lZGlhdGUganVtcFRvXG4gICAgICAgICAgICBcbiAgICBsaW5lSW5kZXhGb3JFdmVudDogKGV2ZW50KSAtPlxuICAgICAgICBzdCA9IEBlbGVtLnNjcm9sbFRvcFxuICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIGx5ID0gY2xhbXAgMCwgQGVsZW0ub2Zmc2V0SGVpZ2h0LCBldmVudC5jbGllbnRZIC0gYnIudG9wXG4gICAgICAgIHB5ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigyKmx5L0BzY3JvbGwubGluZUhlaWdodCkpICsgQHNjcm9sbC50b3BcbiAgICAgICAgbGkgPSBwYXJzZUludCBNYXRoLm1pbihAc2Nyb2xsLm51bUxpbmVzLTEsIHB5KVxuICAgICAgICBsaVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBvbkVkaXRvck51bUxpbmVzOiAobikgPT5cblxuICAgICAgICBAb25FZGl0b3JWaWV3SGVpZ2h0IEBlZGl0b3Iudmlld0hlaWdodCgpIGlmIG4gYW5kIEBsaW5lcy5oZWlnaHQgPD0gQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgblxuXG4gICAgb25FZGl0b3JWaWV3SGVpZ2h0OiAoaCkgPT5cblxuICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgMipAZWRpdG9yLnZpZXdIZWlnaHQoKVxuICAgICAgICBAb25TY3JvbGwoKVxuICAgICAgICBAb25FZGl0b3JTY3JvbGwoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uRWRpdG9yU2Nyb2xsOiA9PlxuXG4gICAgICAgIGlmIEBzY3JvbGwuZnVsbEhlaWdodCA+IEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgcGMgPSBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgLyBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIHRwID0gcGFyc2VJbnQgcGMgKiBAc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgQHNjcm9sbC50byB0cFxuICAgICAgICBAZHJhd1RvcEJvdCgpXG5cbiAgICBvblNjcm9sbDogPT5cblxuICAgICAgICB5ID0gcGFyc2VJbnQgLUBoZWlnaHQvNC1Ac2Nyb2xsLm9mZnNldFRvcC8yXG4gICAgICAgIHggPSBwYXJzZUludCBAd2lkdGgvNFxuICAgICAgICB0ID0gXCJ0cmFuc2xhdGUzZCgje3h9cHgsICN7eX1weCwgMHB4KSBzY2FsZTNkKDAuNSwgMC41LCAxKVwiXG4gICAgICAgIEBzZWxlY3RpLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGhpZ2hsaWcuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAY3Vyc29ycy5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBsaW5lcy5zdHlsZS50cmFuc2Zvcm0gICA9IHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYXJSYW5nZTogKHRvcCwgYm90KSAtPlxuXG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmNsZWFyUmVjdCAwLCAodG9wLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQsIDIqQHdpZHRoLCAoYm90LXRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBjbGVhckFsbDogPT5cblxuICAgICAgICBAc2VsZWN0aS53aWR0aCA9IEBzZWxlY3RpLndpZHRoXG4gICAgICAgIEBoaWdobGlnLndpZHRoID0gQGhpZ2hsaWcud2lkdGhcbiAgICAgICAgQGN1cnNvcnMud2lkdGggPSBAY3Vyc29ycy53aWR0aFxuICAgICAgICBAdG9wYm90LndpZHRoICA9IEB0b3Bib3Qud2lkdGhcbiAgICAgICAgQGxpbmVzLndpZHRoICAgPSBAbGluZXMud2lkdGhcbiAgICAgICAgQHRvcGJvdC5zdHlsZS5oZWlnaHQgPSAnMCdcblxubW9kdWxlLmV4cG9ydHMgPSBNaW5pbWFwXG4iXX0=
//# sourceURL=../../coffee/editor/minimap.coffee