// koffee 1.4.0

/*
00     00  000  000   000  000  00     00   0000000   00000000
000   000  000  0000  000  000  000   000  000   000  000   000
000000000  000  000 0 000  000  000000000  000000000  00000000
000 0 000  000  000  0000  000  000 0 000  000   000  000
000   000  000  000   000  000  000   000  000   000  000
 */
var MapScroll, Minimap, clamp, drag, elem, getStyle, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), getStyle = ref.getStyle, clamp = ref.clamp, elem = ref.elem, drag = ref.drag;

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
                results.push(ctx.fillRect(offset + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight));
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
                    if (r.value != null) {
                        ctx.fillStyle = this.editor.syntax.colorForClassnames(r.value + " minimap");
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
            results.push(ctx.fillRect(0, y, this.offsetLeft, this.scroll.lineHeight));
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
            ctx.fillRect(this.offsetLeft - 4, y, this.offsetLeft - 2, this.scroll.lineHeight);
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
        return ctx.fillRect(this.offsetLeft - 4, y, this.offsetLeft - 2, this.scroll.lineHeight);
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
        var change, i, len, li, ref1, ref2;
        if (changeInfo.selects) {
            this.drawSelections();
        }
        if (changeInfo.cursors) {
            this.drawCursors();
        }
        if (!changeInfo.changes.length) {
            return;
        }
        this.scroll.setNumLines(this.editor.numLines());
        ref1 = changeInfo.changes;
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            li = change.oldIndex;
            if ((ref2 = !change.change) === 'deleted' || ref2 === 'inserted') {
                break;
            }
            this.drawLines(li, li);
        }
        if (li <= this.scroll.exposeBot) {
            return this.drawLines(li, this.scroll.exposeBot);
        }
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
        this.editor.scroll.to((li - 5) * this.editor.scroll.lineHeight);
        if (!event.metaKey) {
            this.editor.singleCursorAtPos([0, li + 5], {
                extend: event.shiftKey
            });
        }
        this.editor.focus();
        return this.onEditorScroll();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0RBQUE7SUFBQTs7QUFRQSxNQUFrQyxPQUFBLENBQVEsS0FBUixDQUFsQyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsZUFBbkIsRUFBeUI7O0FBRXpCLFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7QUFFTjtJQUVDLGlCQUFDLE1BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUVBLFlBQUEsR0FBZSxRQUFBLENBQVMsUUFBQSxDQUFTLFVBQVQsRUFBcUIsT0FBckIsQ0FBVDtRQUVmLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUExQixHQUFxQyxZQUFELEdBQWM7UUFFbEQsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFBLEdBQUU7UUFDWCxJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUVkLElBQUMsQ0FBQSxJQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsTUFBRCxHQUFXLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtTQUFMO1FBQ1gsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFlO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQkFBUDtZQUE0QixLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQXBDO1lBQTJDLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFBcEQ7U0FBZjtRQUNYLElBQUMsQ0FBQSxLQUFELEdBQVcsSUFBQSxDQUFLLFFBQUwsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtZQUE0QixLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQXBDO1lB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Q0FBQSxLQUFoRSxFQUF1RSxDQUFDLEdBQUEsR0FBSSxHQUFMLENBQUEsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQXpGO0lBSFE7O3NCQUtaLFFBQUEsR0FBVSxTQUFBO1FBRU4sSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUM7UUFDMUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUM7UUFDMUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUM7UUFDMUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLEdBQWlCLElBQUMsQ0FBQSxNQUFNLENBQUM7UUFDekIsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLEdBQWlCLElBQUMsQ0FBQSxLQUFLLENBQUM7ZUFDeEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBZCxHQUF1QjtJQVBqQjs7Ozs7O0FBU2QsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuIyMjXG5cbnsgZ2V0U3R5bGUsIGNsYW1wLCBlbGVtLCBkcmFnIH0gPSByZXF1aXJlICdreGsnIFxuXG5NYXBTY3JvbGwgPSByZXF1aXJlICcuL21hcHNjcm9sbCdcblxuY2xhc3MgTWluaW1hcFxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgbWluaW1hcFdpZHRoID0gcGFyc2VJbnQgZ2V0U3R5bGUgJy5taW5pbWFwJywgJ3dpZHRoJ1xuXG4gICAgICAgIEBlZGl0b3IubGF5ZXJTY3JvbGwuc3R5bGUucmlnaHQgPSBcIiN7bWluaW1hcFdpZHRofXB4XCJcblxuICAgICAgICBAd2lkdGggPSAyKm1pbmltYXBXaWR0aFxuICAgICAgICBAaGVpZ2h0ID0gODE5MlxuICAgICAgICBAb2Zmc2V0TGVmdCA9IDZcblxuICAgICAgICBAZWxlbSAgICA9IGVsZW0gY2xhc3M6ICdtaW5pbWFwJ1xuICAgICAgICBAdG9wYm90ICA9IGVsZW0gY2xhc3M6ICd0b3Bib3QnXG4gICAgICAgIEBzZWxlY3RpID0gZWxlbSAnY2FudmFzJywgY2xhc3M6ICdtaW5pbWFwU2VsZWN0aW9ucycsIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAbGluZXMgICA9IGVsZW0gJ2NhbnZhcycsIGNsYXNzOiAnbWluaW1hcExpbmVzJywgICAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcgPSBlbGVtICdjYW52YXMnLCBjbGFzczogJ21pbmltYXBIaWdobGlnaHRzJywgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzID0gZWxlbSAnY2FudmFzJywgY2xhc3M6ICdtaW5pbWFwQ3Vyc29ycycsICAgIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEB0b3Bib3RcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHNlbGVjdGlcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGxpbmVzXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBoaWdobGlnXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBjdXJzb3JzXG5cbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnLCBAZWRpdG9yLnNjcm9sbGJhcj8ub25XaGVlbFxuXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCAgICBAZWxlbVxuICAgICAgICBAZWRpdG9yLm9uICd2aWV3SGVpZ2h0JyAgICBAb25FZGl0b3JWaWV3SGVpZ2h0XG4gICAgICAgIEBlZGl0b3Iub24gJ251bUxpbmVzJyAgICAgIEBvbkVkaXRvck51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgQGRyYXdIaWdobGlnaHRzXG4gICAgICAgIEBlZGl0b3Iuc2Nyb2xsLm9uICdzY3JvbGwnIEBvbkVkaXRvclNjcm9sbFxuXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgTWFwU2Nyb2xsXG4gICAgICAgICAgICBleHBvc2VNYXg6ICBAaGVpZ2h0LzRcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDRcbiAgICAgICAgICAgIHZpZXdIZWlnaHQ6IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcblxuICAgICAgICBAc2Nyb2xsLm5hbWUgPSBcIiN7QGVkaXRvci5uYW1lfS5taW5pbWFwXCJcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZWxlbVxuICAgICAgICAgICAgb25TdGFydDogQG9uU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdcbiAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInXG5cbiAgICAgICAgQHNjcm9sbC5vbiAnY2xlYXJMaW5lcycgIEBjbGVhckFsbFxuICAgICAgICBAc2Nyb2xsLm9uICdzY3JvbGwnICAgICAgQG9uU2Nyb2xsXG4gICAgICAgIEBzY3JvbGwub24gJ2V4cG9zZUxpbmVzJyBAb25FeHBvc2VMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICd2YW5pc2hMaW5lcycgQG9uVmFuaXNoTGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZScgIEBleHBvc2VMaW5lXG5cbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQGRyYXdMaW5lcygpXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDBcblxuICAgIGRyYXdTZWxlY3Rpb25zOiA9PlxuXG4gICAgICAgIEBzZWxlY3RpLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAc2VsZWN0aS5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyAnc2VsZWN0aW9uJ1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIEBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gclsxXVswXSBhbmQgQG9mZnNldExlZnQgb3IgMFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBvZmZzZXQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdMaW5lczogKHRvcD1Ac2Nyb2xsLmV4cG9zZVRvcCwgYm90PUBzY3JvbGwuZXhwb3NlQm90KSA9PlxuXG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgeSA9IHBhcnNlSW50KCh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodClcbiAgICAgICAgY3R4LmNsZWFyUmVjdCAwLCB5LCBAd2lkdGgsICgoYm90LUBzY3JvbGwuZXhwb3NlVG9wKS0odG9wLUBzY3JvbGwuZXhwb3NlVG9wKSsxKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBib3QgPSBNYXRoLm1pbiBib3QsIEBlZGl0b3IubnVtTGluZXMoKS0xXG4gICAgICAgIHJldHVybiBpZiBib3QgPCB0b3BcbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIGRpc3MgPSBAZWRpdG9yLnN5bnRheC5nZXREaXNzIGxpXG4gICAgICAgICAgICB5ID0gcGFyc2VJbnQoKGxpLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQpXG4gICAgICAgICAgICBmb3IgciBpbiBkaXNzID8gW11cbiAgICAgICAgICAgICAgICBicmVhayBpZiAyKnIuc3RhcnQgPj0gQHdpZHRoXG4gICAgICAgICAgICAgICAgaWYgci52YWx1ZT9cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyByLnZhbHVlICsgXCIgbWluaW1hcFwiXG4gICAgICAgICAgICAgICAgZWxzZSBpZiByLnN0eWw/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvclN0eWxlIHIuc3R5bFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnIuc3RhcnQsIHksIDIqci5tYXRjaC5sZW5ndGgsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0hpZ2hsaWdodHM6ID0+XG5cbiAgICAgICAgQGhpZ2hsaWcuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAaGlnaGxpZy53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBoaWdobGlnLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzICdoaWdobGlnaHQnXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgQGVkaXRvci5oaWdobGlnaHRzKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCAwLCB5LCBAb2Zmc2V0TGVmdCwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3Q3Vyc29yczogPT5cblxuICAgICAgICBAY3Vyc29ycy5oZWlnaHQgPSBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzLndpZHRoID0gQHdpZHRoXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgY3R4ID0gQGN1cnNvcnMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgcmFuZ2VzRnJvbVBvc2l0aW9ucyBAZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICAgICAgeSA9IChyWzBdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIDIqclsxXVswXSA8IEB3aWR0aFxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAnI2Y4MCdcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyWzFdWzBdLCB5LCAyLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgyNTUsMTI4LDAsMC41KSdcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdC00LCB5LCBAb2Zmc2V0TGVmdC0yLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgQGRyYXdNYWluQ3Vyc29yKClcblxuICAgIGRyYXdNYWluQ3Vyc29yOiAoYmxpbmspID0+XG5cbiAgICAgICAgY3R4ID0gQGN1cnNvcnMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBibGluayBhbmQgJyMwMDAnIG9yICcjZmYwJ1xuICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHkgPSAobWNbMV0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBpZiAyKm1jWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMiptY1swXSwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdC00LCB5LCBAb2Zmc2V0TGVmdC0yLCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdUb3BCb3Q6ID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuXG4gICAgICAgIGxoID0gQHNjcm9sbC5saW5lSGVpZ2h0LzJcbiAgICAgICAgdGggPSAoQGVkaXRvci5zY3JvbGwuYm90LUBlZGl0b3Iuc2Nyb2xsLnRvcCsxKSpsaFxuICAgICAgICB0eSA9IDBcbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICB0eSA9IChNYXRoLm1pbigwLjUqQHNjcm9sbC52aWV3SGVpZ2h0LCBAc2Nyb2xsLm51bUxpbmVzKjIpLXRoKSAqIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCAvIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICBAdG9wYm90LnN0eWxlLmhlaWdodCA9IFwiI3t0aH1weFwiXG4gICAgICAgIEB0b3Bib3Quc3R5bGUudG9wICAgID0gXCIje3R5fXB4XCJcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGV4cG9zZUxpbmU6ICAgKGxpKSA9PiBAZHJhd0xpbmVzIGxpLCBsaVxuICAgIG9uRXhwb3NlTGluZXM6IChlKSA9PiBAZHJhd0xpbmVzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuXG4gICAgb25WYW5pc2hMaW5lczogKGUpID0+XG4gICAgICAgIGlmIGUudG9wP1xuICAgICAgICAgICAgQGRyYXdMaW5lcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNsZWFyUmFuZ2UgQHNjcm9sbC5leHBvc2VCb3QsIEBzY3JvbGwuZXhwb3NlQm90K0BzY3JvbGwubnVtTGluZXNcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25DaGFuZ2VkOiAoY2hhbmdlSW5mbykgPT5cblxuICAgICAgICBAZHJhd1NlbGVjdGlvbnMoKSBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgQGRyYXdDdXJzb3JzKCkgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG5cbiAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAZWRpdG9yLm51bUxpbmVzKClcblxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgbGkgPSBjaGFuZ2Uub2xkSW5kZXhcbiAgICAgICAgICAgIGJyZWFrIGlmIG5vdCBjaGFuZ2UuY2hhbmdlIGluIFsnZGVsZXRlZCcsICdpbnNlcnRlZCddXG4gICAgICAgICAgICBAZHJhd0xpbmVzIGxpLCBsaVxuXG4gICAgICAgIGlmIGxpIDw9IEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgICAgICBAZHJhd0xpbmVzIGxpLCBAc2Nyb2xsLmV4cG9zZUJvdFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG9uRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIEBzY3JvbGwuZnVsbEhlaWdodCA+IEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgcnkgPSBldmVudC5jbGllbnRZIC0gYnIudG9wXG4gICAgICAgICAgICBwYyA9IDIqcnkgLyBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIGxpID0gcGFyc2VJbnQgcGMgKiBAZWRpdG9yLnNjcm9sbC5udW1MaW5lc1xuICAgICAgICAgICAgQGp1bXBUb0xpbmUgbGksIGV2ZW50XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBqdW1wVG9MaW5lIEBsaW5lSW5kZXhGb3JFdmVudChldmVudCksIGV2ZW50XG5cbiAgICBvblN0YXJ0OiAoZHJhZyxldmVudCkgPT4gQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIGp1bXBUb0xpbmU6IChsaSwgZXZlbnQpIC0+XG5cbiAgICAgICAgQGVkaXRvci5zY3JvbGwudG8gKGxpLTUpICogQGVkaXRvci5zY3JvbGwubGluZUhlaWdodFxuXG4gICAgICAgIGlmIG5vdCBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLCBsaSs1XSwgZXh0ZW5kOmV2ZW50LnNoaWZ0S2V5XG5cbiAgICAgICAgQGVkaXRvci5mb2N1cygpXG4gICAgICAgIEBvbkVkaXRvclNjcm9sbCgpXG5cbiAgICBsaW5lSW5kZXhGb3JFdmVudDogKGV2ZW50KSAtPlxuXG4gICAgICAgIHN0ID0gQGVsZW0uc2Nyb2xsVG9wXG4gICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAZWxlbS5vZmZzZXRIZWlnaHQsIGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgcHkgPSBwYXJzZUludChNYXRoLmZsb29yKDIqbHkvQHNjcm9sbC5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBsaSA9IHBhcnNlSW50IE1hdGgubWluKEBzY3JvbGwubnVtTGluZXMtMSwgcHkpXG4gICAgICAgIGxpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIG9uRWRpdG9yTnVtTGluZXM6IChuKSA9PlxuXG4gICAgICAgIEBvbkVkaXRvclZpZXdIZWlnaHQgQGVkaXRvci52aWV3SGVpZ2h0KCkgaWYgbiBhbmQgQGxpbmVzLmhlaWdodCA8PSBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBuXG5cbiAgICBvbkVkaXRvclZpZXdIZWlnaHQ6IChoKSA9PlxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCAyKkBlZGl0b3Iudmlld0hlaWdodCgpXG4gICAgICAgIEBvblNjcm9sbCgpXG4gICAgICAgIEBvbkVkaXRvclNjcm9sbCgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25FZGl0b3JTY3JvbGw6ID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBwYyA9IEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCAvIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgdHAgPSBwYXJzZUludCBwYyAqIEBzY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICBAc2Nyb2xsLnRvIHRwXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgIG9uU2Nyb2xsOiA9PlxuXG4gICAgICAgIHkgPSBwYXJzZUludCAtQGhlaWdodC80LUBzY3JvbGwub2Zmc2V0VG9wLzJcbiAgICAgICAgeCA9IHBhcnNlSW50IEB3aWR0aC80XG4gICAgICAgIHQgPSBcInRyYW5zbGF0ZTNkKCN7eH1weCwgI3t5fXB4LCAwcHgpIHNjYWxlM2QoMC41LCAwLjUsIDEpXCJcbiAgICAgICAgQHNlbGVjdGkuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAaGlnaGxpZy5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBjdXJzb3JzLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGxpbmVzLnN0eWxlLnRyYW5zZm9ybSAgID0gdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGVhclJhbmdlOiAodG9wLCBib3QpIC0+XG5cbiAgICAgICAgY3R4ID0gQGxpbmVzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguY2xlYXJSZWN0IDAsICh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodCwgMipAd2lkdGgsIChib3QtdG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGNsZWFyQWxsOiA9PlxuXG4gICAgICAgIEBzZWxlY3RpLndpZHRoID0gQHNlbGVjdGkud2lkdGhcbiAgICAgICAgQGhpZ2hsaWcud2lkdGggPSBAaGlnaGxpZy53aWR0aFxuICAgICAgICBAY3Vyc29ycy53aWR0aCA9IEBjdXJzb3JzLndpZHRoXG4gICAgICAgIEB0b3Bib3Qud2lkdGggID0gQHRvcGJvdC53aWR0aFxuICAgICAgICBAbGluZXMud2lkdGggICA9IEBsaW5lcy53aWR0aFxuICAgICAgICBAdG9wYm90LnN0eWxlLmhlaWdodCA9ICcwJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1pbmltYXBcbiJdfQ==
//# sourceURL=../../coffee/editor/minimap.coffee