// koffee 1.19.0

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
        this.elem.addEventListener('wheel', (ref1 = this.editor.scrollbar) != null ? ref1.onWheel : void 0, {
            passive: true
        });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJtaW5pbWFwLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvREFBQTtJQUFBOztBQVFBLE1BQWtDLE9BQUEsQ0FBUSxLQUFSLENBQWxDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQjs7QUFFckIsU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUVOO0lBRUMsaUJBQUMsTUFBRDtBQUlDLFlBQUE7UUFKQSxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBSUEsWUFBQSxHQUFlLFFBQUEsQ0FBUyxRQUFBLENBQVMsVUFBVCxFQUFxQixPQUFyQixDQUFUO1FBRWYsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQTFCLEdBQXFDLFlBQUQsR0FBYztRQUVsRCxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsR0FBRTtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsVUFBRCxHQUFjO1FBRWQsSUFBQyxDQUFBLElBQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxRQUFMLEVBQWM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1lBQTJCLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBbkM7WUFBMEMsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFuRDtTQUFkO1FBQ1gsSUFBQyxDQUFBLEtBQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFjO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO1lBQTJC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QUFDLENBQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFiLEdBQTJCO0lBUnJCOztzQkFnQlYsVUFBQSxHQUFZLFNBQUMsR0FBRCxFQUFNLEdBQU47QUFFUixZQUFBO1FBQUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBUCxDQUFrQixJQUFsQjtlQUNOLEdBQUcsQ0FBQyxTQUFKLENBQWMsQ0FBZCxFQUFpQixDQUFDLEdBQUEsR0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQWIsQ0FBQSxHQUF3QixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQWpELEVBQTZELENBQUEsR0FBRSxJQUFDLENBQUEsS0FBaEUsRUFBdUUsQ0FBQyxHQUFBLEdBQUksR0FBTCxDQUFBLEdBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUF6RjtJQUhROztzQkFLWixRQUFBLEdBQVUsU0FBQTtRQUVOLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxHQUFpQixJQUFDLENBQUEsT0FBTyxDQUFDO1FBQzFCLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxHQUFpQixJQUFDLENBQUEsT0FBTyxDQUFDO1FBQzFCLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxHQUFpQixJQUFDLENBQUEsT0FBTyxDQUFDO1FBQzFCLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixHQUFpQixJQUFDLENBQUEsTUFBTSxDQUFDO1FBQ3pCLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxHQUFpQixJQUFDLENBQUEsS0FBSyxDQUFDO2VBQ3hCLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQWQsR0FBdUI7SUFQakI7Ozs7OztBQVNkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiMjI1xuXG57IGNsYW1wLCBkcmFnLCBlbGVtLCBnZXRTdHlsZSB9ID0gcmVxdWlyZSAna3hrJ1xuXG5NYXBTY3JvbGwgPSByZXF1aXJlICcuL21hcHNjcm9sbCdcblxuY2xhc3MgTWluaW1hcFxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICAjIGFkZCBoaWdobGlnaHRzIGFuZCBjdXJzb3JzIGF0IHJpZ2h0IGJvcmRlclxuXG4gICAgICAgIG1pbmltYXBXaWR0aCA9IHBhcnNlSW50IGdldFN0eWxlICcubWluaW1hcCcsICd3aWR0aCdcblxuICAgICAgICBAZWRpdG9yLmxheWVyU2Nyb2xsLnN0eWxlLnJpZ2h0ID0gXCIje21pbmltYXBXaWR0aH1weFwiXG5cbiAgICAgICAgQHdpZHRoID0gMiptaW5pbWFwV2lkdGhcbiAgICAgICAgQGhlaWdodCA9IDgxOTJcbiAgICAgICAgQG9mZnNldExlZnQgPSA2XG5cbiAgICAgICAgQGVsZW0gICAgPSBlbGVtIGNsYXNzOiAnbWluaW1hcCdcbiAgICAgICAgQHRvcGJvdCAgPSBlbGVtIGNsYXNzOiAndG9wYm90J1xuICAgICAgICBAc2VsZWN0aSA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwU2VsZWN0aW9ucycgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBsaW5lcyAgID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBMaW5lcycgICAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcgPSBlbGVtICdjYW52YXMnIGNsYXNzOiAnbWluaW1hcEhpZ2hsaWdodHMnIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAY3Vyc29ycyA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwQ3Vyc29ycycgICAgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG5cbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHRvcGJvdFxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAc2VsZWN0aVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZXNcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGhpZ2hsaWdcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGN1cnNvcnNcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgQGVkaXRvci5zY3JvbGxiYXI/Lm9uV2hlZWwsIHBhc3NpdmU6dHJ1ZVxuXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCAgICBAZWxlbVxuICAgICAgICBAZWRpdG9yLm9uICd2aWV3SGVpZ2h0JyAgICBAb25FZGl0b3JWaWV3SGVpZ2h0XG4gICAgICAgIEBlZGl0b3Iub24gJ251bUxpbmVzJyAgICAgIEBvbkVkaXRvck51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgQGRyYXdIaWdobGlnaHRzXG4gICAgICAgIEBlZGl0b3Iuc2Nyb2xsLm9uICdzY3JvbGwnIEBvbkVkaXRvclNjcm9sbFxuXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgTWFwU2Nyb2xsXG4gICAgICAgICAgICBleHBvc2VNYXg6ICBAaGVpZ2h0LzRcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDRcbiAgICAgICAgICAgIHZpZXdIZWlnaHQ6IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcblxuICAgICAgICBAc2Nyb2xsLm5hbWUgPSBcIiN7QGVkaXRvci5uYW1lfS5taW5pbWFwXCJcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZWxlbVxuICAgICAgICAgICAgb25TdGFydDogQG9uU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdcbiAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInXG5cbiAgICAgICAgQHNjcm9sbC5vbiAnY2xlYXJMaW5lcycgIEBjbGVhckFsbFxuICAgICAgICBAc2Nyb2xsLm9uICdzY3JvbGwnICAgICAgQG9uU2Nyb2xsXG4gICAgICAgIEBzY3JvbGwub24gJ2V4cG9zZUxpbmVzJyBAb25FeHBvc2VMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICd2YW5pc2hMaW5lcycgQG9uVmFuaXNoTGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZScgIEBleHBvc2VMaW5lXG5cbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQGRyYXdMaW5lcygpXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDBcblxuICAgIGRyYXdTZWxlY3Rpb25zOiA9PlxuXG4gICAgICAgIEBzZWxlY3RpLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAc2VsZWN0aS5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyAnc2VsZWN0aW9uJ1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIEBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gclsxXVswXSBhbmQgQG9mZnNldExlZnQgb3IgMFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBvZmZzZXQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgMjYwLTYsIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0xpbmVzOiAodG9wPUBzY3JvbGwuZXhwb3NlVG9wLCBib3Q9QHNjcm9sbC5leHBvc2VCb3QpID0+XG5cbiAgICAgICAgY3R4ID0gQGxpbmVzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICB5ID0gcGFyc2VJbnQoKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0KVxuICAgICAgICBjdHguY2xlYXJSZWN0IDAsIHksIEB3aWR0aCwgKChib3QtQHNjcm9sbC5leHBvc2VUb3ApLSh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKzEpKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGJvdCA9IE1hdGgubWluIGJvdCwgQGVkaXRvci5udW1MaW5lcygpLTFcbiAgICAgICAgcmV0dXJuIGlmIGJvdCA8IHRvcFxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgZGlzcyA9IEBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgIHkgPSBwYXJzZUludCgobGktQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodClcbiAgICAgICAgICAgIGZvciByIGluIGRpc3MgPyBbXVxuICAgICAgICAgICAgICAgIGJyZWFrIGlmIDIqci5zdGFydCA+PSBAd2lkdGhcbiAgICAgICAgICAgICAgICBpZiByLmNsc3M/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgci5jbHNzICsgXCIgbWluaW1hcFwiXG4gICAgICAgICAgICAgICAgZWxzZSBpZiByLnN0eWw/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvclN0eWxlIHIuc3R5bFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnIuc3RhcnQsIHksIDIqci5tYXRjaC5sZW5ndGgsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0hpZ2hsaWdodHM6ID0+XG5cbiAgICAgICAgQGhpZ2hsaWcuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAaGlnaGxpZy53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBoaWdobGlnLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzICdoaWdobGlnaHQnXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgQGVkaXRvci5oaWdobGlnaHRzKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCAyNjAtNCwgeSwgNCwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3Q3Vyc29yczogPT5cblxuICAgICAgICBAY3Vyc29ycy5oZWlnaHQgPSBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzLndpZHRoID0gQHdpZHRoXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgY3R4ID0gQGN1cnNvcnMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgcmFuZ2VzRnJvbVBvc2l0aW9ucyBAZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICAgICAgeSA9IChyWzBdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIDIqclsxXVswXSA8IEB3aWR0aFxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAnI2Y4MCdcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyWzFdWzBdLCB5LCAyLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgyNTUsMTI4LDAsMC41KSdcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCAyNjAtOCwgeSwgNCwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIEBkcmF3TWFpbkN1cnNvcigpXG5cbiAgICBkcmF3TWFpbkN1cnNvcjogKGJsaW5rKSA9PlxuXG4gICAgICAgIGN0eCA9IEBjdXJzb3JzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gYmxpbmsgYW5kICcjMDAwJyBvciAnI2ZmMCdcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICB5ID0gKG1jWzFdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgaWYgMiptY1swXSA8IEB3aWR0aFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqbWNbMF0sIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBjdHguZmlsbFJlY3QgMjYwLTgsIHksIDgsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd1RvcEJvdDogPT5cblxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG5cbiAgICAgICAgbGggPSBAc2Nyb2xsLmxpbmVIZWlnaHQvMlxuICAgICAgICB0aCA9IChAZWRpdG9yLnNjcm9sbC5ib3QtQGVkaXRvci5zY3JvbGwudG9wKzEpKmxoXG4gICAgICAgIHR5ID0gMFxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIHR5ID0gKE1hdGgubWluKDAuNSpAc2Nyb2xsLnZpZXdIZWlnaHQsIEBzY3JvbGwubnVtTGluZXMqMiktdGgpICogQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gXCIje3RofXB4XCJcbiAgICAgICAgQHRvcGJvdC5zdHlsZS50b3AgICAgPSBcIiN7dHl9cHhcIlxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgZXhwb3NlTGluZTogICAobGkpID0+XG4gICAgICAgIEBkcmF3TGluZXMgbGksIGxpXG4gICAgICAgIFxuICAgIG9uRXhwb3NlTGluZXM6IChlKSA9PiBcbiAgICAgICAgQGRyYXdMaW5lcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcblxuICAgIG9uVmFuaXNoTGluZXM6IChlKSA9PlxuICAgICAgICBpZiBlLnRvcD9cbiAgICAgICAgICAgIEBkcmF3TGluZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjbGVhclJhbmdlIEBzY3JvbGwuZXhwb3NlQm90LCBAc2Nyb2xsLmV4cG9zZUJvdCtAc2Nyb2xsLm51bUxpbmVzXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG9uQ2hhbmdlZDogKGNoYW5nZUluZm8pID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5udW1MaW5lcyAhPSBAZWRpdG9yLm51bUxpbmVzKCkgb3IgKGNoYW5nZUluZm8uaW5zZXJ0cyBvciBjaGFuZ2VJbmZvLmRlbGV0ZXMpXG4gICAgICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIDBcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQGVkaXRvci5udW1MaW5lcygpXG4gICAgICAgICAgICBAb25FZGl0b3JTY3JvbGwoKVxuICAgICAgICAgICAgQGRyYXdTZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEBkcmF3Q3Vyc29ycygpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAZHJhd1NlbGVjdGlvbnMoKSBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgQGRyYXdDdXJzb3JzKCkgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIGxpID0gY2hhbmdlLm9sZEluZGV4ID8gY2hhbmdlLmRvSW5kZXhcbiAgICAgICAgICAgIEBkcmF3TGluZXMgbGksIGxpXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25EcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICByeSA9IGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgICAgIHBjID0gMipyeSAvIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgbGkgPSBwYXJzZUludCBwYyAqIEBlZGl0b3Iuc2Nyb2xsLm51bUxpbmVzXG4gICAgICAgICAgICBAanVtcFRvTGluZSBsaSwgZXZlbnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIG9uU3RhcnQ6IChkcmFnLGV2ZW50KSA9PiBAanVtcFRvTGluZSBAbGluZUluZGV4Rm9yRXZlbnQoZXZlbnQpLCBldmVudFxuXG4gICAganVtcFRvTGluZTogKGxpLCBldmVudCkgLT5cblxuICAgICAgICBqdW1wVG8gPSA9PlxuICAgICAgICAgICAgQGVkaXRvci5zY3JvbGwudG8gKGxpLTUpICogQGVkaXRvci5zY3JvbGwubGluZUhlaWdodFxuXG4gICAgICAgICAgICBpZiBub3QgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsIGxpKzVdLCBleHRlbmQ6ZXZlbnQuc2hpZnRLZXlcbiAgICBcbiAgICAgICAgICAgIEBlZGl0b3IuZm9jdXMoKVxuICAgICAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgICAgICBjbGVhckltbWVkaWF0ZSBAanVtcFRvVGltZXJcbiAgICAgICAgQGp1bXBUb1RpbWVyID0gc2V0SW1tZWRpYXRlIGp1bXBUb1xuICAgICAgICAgICAgXG4gICAgbGluZUluZGV4Rm9yRXZlbnQ6IChldmVudCkgLT5cbiAgICAgICAgc3QgPSBAZWxlbS5zY3JvbGxUb3BcbiAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBseSA9IGNsYW1wIDAsIEBlbGVtLm9mZnNldEhlaWdodCwgZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoMipseS9Ac2Nyb2xsLmxpbmVIZWlnaHQpKSArIEBzY3JvbGwudG9wXG4gICAgICAgIGxpID0gcGFyc2VJbnQgTWF0aC5taW4oQHNjcm9sbC5udW1MaW5lcy0xLCBweSlcbiAgICAgICAgbGlcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgb25FZGl0b3JOdW1MaW5lczogKG4pID0+XG5cbiAgICAgICAgQG9uRWRpdG9yVmlld0hlaWdodCBAZWRpdG9yLnZpZXdIZWlnaHQoKSBpZiBuIGFuZCBAbGluZXMuaGVpZ2h0IDw9IEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIG5cblxuICAgIG9uRWRpdG9yVmlld0hlaWdodDogKGgpID0+XG5cbiAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkVkaXRvclNjcm9sbDogPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLmZ1bGxIZWlnaHQgPiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIHBjID0gQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICB0cCA9IHBhcnNlSW50IHBjICogQHNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIEBzY3JvbGwudG8gdHBcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgb25TY3JvbGw6ID0+XG5cbiAgICAgICAgeSA9IHBhcnNlSW50IC1AaGVpZ2h0LzQtQHNjcm9sbC5vZmZzZXRUb3AvMlxuICAgICAgICB4ID0gcGFyc2VJbnQgQHdpZHRoLzRcbiAgICAgICAgdCA9IFwidHJhbnNsYXRlM2QoI3t4fXB4LCAje3l9cHgsIDBweCkgc2NhbGUzZCgwLjUsIDAuNSwgMSlcIlxuICAgICAgICBAc2VsZWN0aS5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBoaWdobGlnLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGN1cnNvcnMuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAbGluZXMuc3R5bGUudHJhbnNmb3JtICAgPSB0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyUmFuZ2U6ICh0b3AsIGJvdCkgLT5cblxuICAgICAgICBjdHggPSBAbGluZXMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5jbGVhclJlY3QgMCwgKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0LCAyKkB3aWR0aCwgKGJvdC10b3ApKkBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgY2xlYXJBbGw6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAc2VsZWN0aS53aWR0aFxuICAgICAgICBAaGlnaGxpZy53aWR0aCA9IEBoaWdobGlnLndpZHRoXG4gICAgICAgIEBjdXJzb3JzLndpZHRoID0gQGN1cnNvcnMud2lkdGhcbiAgICAgICAgQHRvcGJvdC53aWR0aCAgPSBAdG9wYm90LndpZHRoXG4gICAgICAgIEBsaW5lcy53aWR0aCAgID0gQGxpbmVzLndpZHRoXG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gJzAnXG5cbm1vZHVsZS5leHBvcnRzID0gTWluaW1hcFxuIl19
//# sourceURL=../../coffee/editor/minimap.coffee