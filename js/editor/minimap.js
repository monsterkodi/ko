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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0RBQUE7SUFBQTs7QUFRQSxNQUFrQyxPQUFBLENBQVEsS0FBUixDQUFsQyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsZUFBbkIsRUFBeUI7O0FBRXpCLFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7QUFFTjtJQUVDLGlCQUFDLE1BQUQ7QUFJQyxZQUFBO1FBSkEsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUlBLFlBQUEsR0FBZSxRQUFBLENBQVMsUUFBQSxDQUFTLFVBQVQsRUFBcUIsT0FBckIsQ0FBVDtRQUVmLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUExQixHQUFxQyxZQUFELEdBQWM7UUFFbEQsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFBLEdBQUU7UUFDWCxJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUVkLElBQUMsQ0FBQSxJQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsTUFBRCxHQUFXLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtTQUFMO1FBQ1gsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFlO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQkFBUDtZQUE0QixLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQXBDO1lBQTJDLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFBcEQ7U0FBZjtRQUNYLElBQUMsQ0FBQSxLQUFELEdBQVcsSUFBQSxDQUFLLFFBQUwsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtZQUE0QixLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQXBDO1lB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QSxNQUFNLENBQUMsVUFBakQsRUFBNkQsQ0FBQSxHQUFFLElBQUMsQ0FBQSxLQUFoRSxFQUF1RSxDQUFDLEdBQUEsR0FBSSxHQUFMLENBQUEsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQXpGO0lBSFE7O3NCQUtaLFFBQUEsR0FBVSxTQUFBO1FBRU4sSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUM7UUFDMUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUM7UUFDMUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUM7UUFDMUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLEdBQWlCLElBQUMsQ0FBQSxNQUFNLENBQUM7UUFDekIsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLEdBQWlCLElBQUMsQ0FBQSxLQUFLLENBQUM7ZUFDeEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBZCxHQUF1QjtJQVBqQjs7Ozs7O0FBU2QsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuIyMjXG5cbnsgZ2V0U3R5bGUsIGNsYW1wLCBlbGVtLCBkcmFnIH0gPSByZXF1aXJlICdreGsnXG5cbk1hcFNjcm9sbCA9IHJlcXVpcmUgJy4vbWFwc2Nyb2xsJ1xuXG5jbGFzcyBNaW5pbWFwXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgICMgYWRkIGhpZ2hsaWdodHMgYW5kIGN1cnNvcnMgYXQgcmlnaHQgYm9yZGVyXG5cbiAgICAgICAgbWluaW1hcFdpZHRoID0gcGFyc2VJbnQgZ2V0U3R5bGUgJy5taW5pbWFwJywgJ3dpZHRoJ1xuXG4gICAgICAgIEBlZGl0b3IubGF5ZXJTY3JvbGwuc3R5bGUucmlnaHQgPSBcIiN7bWluaW1hcFdpZHRofXB4XCJcblxuICAgICAgICBAd2lkdGggPSAyKm1pbmltYXBXaWR0aFxuICAgICAgICBAaGVpZ2h0ID0gODE5MlxuICAgICAgICBAb2Zmc2V0TGVmdCA9IDZcblxuICAgICAgICBAZWxlbSAgICA9IGVsZW0gY2xhc3M6ICdtaW5pbWFwJ1xuICAgICAgICBAdG9wYm90ICA9IGVsZW0gY2xhc3M6ICd0b3Bib3QnXG4gICAgICAgIEBzZWxlY3RpID0gZWxlbSAnY2FudmFzJywgY2xhc3M6ICdtaW5pbWFwU2VsZWN0aW9ucycsIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAbGluZXMgICA9IGVsZW0gJ2NhbnZhcycsIGNsYXNzOiAnbWluaW1hcExpbmVzJywgICAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcgPSBlbGVtICdjYW52YXMnLCBjbGFzczogJ21pbmltYXBIaWdobGlnaHRzJywgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzID0gZWxlbSAnY2FudmFzJywgY2xhc3M6ICdtaW5pbWFwQ3Vyc29ycycsICAgIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEB0b3Bib3RcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHNlbGVjdGlcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGxpbmVzXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBoaWdobGlnXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBjdXJzb3JzXG5cbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnLCBAZWRpdG9yLnNjcm9sbGJhcj8ub25XaGVlbFxuXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCAgICBAZWxlbVxuICAgICAgICBAZWRpdG9yLm9uICd2aWV3SGVpZ2h0JyAgICBAb25FZGl0b3JWaWV3SGVpZ2h0XG4gICAgICAgIEBlZGl0b3Iub24gJ251bUxpbmVzJyAgICAgIEBvbkVkaXRvck51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgQGRyYXdIaWdobGlnaHRzXG4gICAgICAgIEBlZGl0b3Iuc2Nyb2xsLm9uICdzY3JvbGwnIEBvbkVkaXRvclNjcm9sbFxuXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgTWFwU2Nyb2xsXG4gICAgICAgICAgICBleHBvc2VNYXg6ICBAaGVpZ2h0LzRcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDRcbiAgICAgICAgICAgIHZpZXdIZWlnaHQ6IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcblxuICAgICAgICBAc2Nyb2xsLm5hbWUgPSBcIiN7QGVkaXRvci5uYW1lfS5taW5pbWFwXCJcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZWxlbVxuICAgICAgICAgICAgb25TdGFydDogQG9uU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdcbiAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInXG5cbiAgICAgICAgQHNjcm9sbC5vbiAnY2xlYXJMaW5lcycgIEBjbGVhckFsbFxuICAgICAgICBAc2Nyb2xsLm9uICdzY3JvbGwnICAgICAgQG9uU2Nyb2xsXG4gICAgICAgIEBzY3JvbGwub24gJ2V4cG9zZUxpbmVzJyBAb25FeHBvc2VMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICd2YW5pc2hMaW5lcycgQG9uVmFuaXNoTGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZScgIEBleHBvc2VMaW5lXG5cbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQGRyYXdMaW5lcygpXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDBcblxuICAgIGRyYXdTZWxlY3Rpb25zOiA9PlxuXG4gICAgICAgIEBzZWxlY3RpLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAc2VsZWN0aS5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyAnc2VsZWN0aW9uJ1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIEBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gclsxXVswXSBhbmQgQG9mZnNldExlZnQgb3IgMFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBvZmZzZXQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgMjYwLTYsIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0xpbmVzOiAodG9wPUBzY3JvbGwuZXhwb3NlVG9wLCBib3Q9QHNjcm9sbC5leHBvc2VCb3QpID0+XG5cbiAgICAgICAgY3R4ID0gQGxpbmVzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICB5ID0gcGFyc2VJbnQoKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0KVxuICAgICAgICBjdHguY2xlYXJSZWN0IDAsIHksIEB3aWR0aCwgKChib3QtQHNjcm9sbC5leHBvc2VUb3ApLSh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKzEpKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGJvdCA9IE1hdGgubWluIGJvdCwgQGVkaXRvci5udW1MaW5lcygpLTFcbiAgICAgICAgcmV0dXJuIGlmIGJvdCA8IHRvcFxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgZGlzcyA9IEBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgIHkgPSBwYXJzZUludCgobGktQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodClcbiAgICAgICAgICAgIGZvciByIGluIGRpc3MgPyBbXVxuICAgICAgICAgICAgICAgIGJyZWFrIGlmIDIqci5zdGFydCA+PSBAd2lkdGhcbiAgICAgICAgICAgICAgICBpZiByLmNsc3M/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgci5jbHNzICsgXCIgbWluaW1hcFwiXG4gICAgICAgICAgICAgICAgZWxzZSBpZiByLnN0eWw/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvclN0eWxlIHIuc3R5bFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnIuc3RhcnQsIHksIDIqci5tYXRjaC5sZW5ndGgsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0hpZ2hsaWdodHM6ID0+XG5cbiAgICAgICAgQGhpZ2hsaWcuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAaGlnaGxpZy53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBoaWdobGlnLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzICdoaWdobGlnaHQnXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgQGVkaXRvci5oaWdobGlnaHRzKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCAyNjAtNCwgeSwgNCwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3Q3Vyc29yczogPT5cblxuICAgICAgICBAY3Vyc29ycy5oZWlnaHQgPSBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzLndpZHRoID0gQHdpZHRoXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgY3R4ID0gQGN1cnNvcnMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgcmFuZ2VzRnJvbVBvc2l0aW9ucyBAZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICAgICAgeSA9IChyWzBdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIDIqclsxXVswXSA8IEB3aWR0aFxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAnI2Y4MCdcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyWzFdWzBdLCB5LCAyLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgyNTUsMTI4LDAsMC41KSdcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCAyNjAtOCwgeSwgNCwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIEBkcmF3TWFpbkN1cnNvcigpXG5cbiAgICBkcmF3TWFpbkN1cnNvcjogKGJsaW5rKSA9PlxuXG4gICAgICAgIGN0eCA9IEBjdXJzb3JzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gYmxpbmsgYW5kICcjMDAwJyBvciAnI2ZmMCdcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICB5ID0gKG1jWzFdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgaWYgMiptY1swXSA8IEB3aWR0aFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqbWNbMF0sIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBjdHguZmlsbFJlY3QgMjYwLTgsIHksIDgsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd1RvcEJvdDogPT5cblxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG5cbiAgICAgICAgbGggPSBAc2Nyb2xsLmxpbmVIZWlnaHQvMlxuICAgICAgICB0aCA9IChAZWRpdG9yLnNjcm9sbC5ib3QtQGVkaXRvci5zY3JvbGwudG9wKzEpKmxoXG4gICAgICAgIHR5ID0gMFxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIHR5ID0gKE1hdGgubWluKDAuNSpAc2Nyb2xsLnZpZXdIZWlnaHQsIEBzY3JvbGwubnVtTGluZXMqMiktdGgpICogQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gXCIje3RofXB4XCJcbiAgICAgICAgQHRvcGJvdC5zdHlsZS50b3AgICAgPSBcIiN7dHl9cHhcIlxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgZXhwb3NlTGluZTogICAobGkpID0+IEBkcmF3TGluZXMgbGksIGxpXG4gICAgb25FeHBvc2VMaW5lczogKGUpID0+IEBkcmF3TGluZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90XG5cbiAgICBvblZhbmlzaExpbmVzOiAoZSkgPT5cbiAgICAgICAgaWYgZS50b3A/XG4gICAgICAgICAgICBAZHJhd0xpbmVzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY2xlYXJSYW5nZSBAc2Nyb2xsLmV4cG9zZUJvdCwgQHNjcm9sbC5leHBvc2VCb3QrQHNjcm9sbC5udW1MaW5lc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBvbkNoYW5nZWQ6IChjaGFuZ2VJbmZvKSA9PlxuXG4gICAgICAgIEBkcmF3U2VsZWN0aW9ucygpIGlmIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICBAZHJhd0N1cnNvcnMoKSAgICBpZiBjaGFuZ2VJbmZvLmN1cnNvcnNcblxuICAgICAgICByZXR1cm4gaWYgbm90IGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBlZGl0b3IubnVtTGluZXMoKVxuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBsaSA9IGNoYW5nZS5vbGRJbmRleFxuICAgICAgICAgICAgYnJlYWsgaWYgbm90IGNoYW5nZS5jaGFuZ2UgaW4gWydkZWxldGVkJywgJ2luc2VydGVkJ11cbiAgICAgICAgICAgIEBkcmF3TGluZXMgbGksIGxpXG5cbiAgICAgICAgaWYgbGkgPD0gQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgICAgIEBkcmF3TGluZXMgbGksIEBzY3JvbGwuZXhwb3NlQm90XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25EcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICByeSA9IGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgICAgIHBjID0gMipyeSAvIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgbGkgPSBwYXJzZUludCBwYyAqIEBlZGl0b3Iuc2Nyb2xsLm51bUxpbmVzXG4gICAgICAgICAgICBAanVtcFRvTGluZSBsaSwgZXZlbnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIG9uU3RhcnQ6IChkcmFnLGV2ZW50KSA9PiBAanVtcFRvTGluZSBAbGluZUluZGV4Rm9yRXZlbnQoZXZlbnQpLCBldmVudFxuXG4gICAganVtcFRvTGluZTogKGxpLCBldmVudCkgLT5cblxuICAgICAgICBAZWRpdG9yLnNjcm9sbC50byAobGktNSkgKiBAZWRpdG9yLnNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICAgICAgaWYgbm90IGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsIGxpKzVdLCBleHRlbmQ6ZXZlbnQuc2hpZnRLZXlcblxuICAgICAgICBAZWRpdG9yLmZvY3VzKClcbiAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgIGxpbmVJbmRleEZvckV2ZW50OiAoZXZlbnQpIC0+XG5cbiAgICAgICAgc3QgPSBAZWxlbS5zY3JvbGxUb3BcbiAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBseSA9IGNsYW1wIDAsIEBlbGVtLm9mZnNldEhlaWdodCwgZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoMipseS9Ac2Nyb2xsLmxpbmVIZWlnaHQpKSArIEBzY3JvbGwudG9wXG4gICAgICAgIGxpID0gcGFyc2VJbnQgTWF0aC5taW4oQHNjcm9sbC5udW1MaW5lcy0xLCBweSlcbiAgICAgICAgbGlcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgb25FZGl0b3JOdW1MaW5lczogKG4pID0+XG5cbiAgICAgICAgQG9uRWRpdG9yVmlld0hlaWdodCBAZWRpdG9yLnZpZXdIZWlnaHQoKSBpZiBuIGFuZCBAbGluZXMuaGVpZ2h0IDw9IEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIG5cblxuICAgIG9uRWRpdG9yVmlld0hlaWdodDogKGgpID0+XG5cbiAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkVkaXRvclNjcm9sbDogPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLmZ1bGxIZWlnaHQgPiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIHBjID0gQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICB0cCA9IHBhcnNlSW50IHBjICogQHNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIEBzY3JvbGwudG8gdHBcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgb25TY3JvbGw6ID0+XG5cbiAgICAgICAgeSA9IHBhcnNlSW50IC1AaGVpZ2h0LzQtQHNjcm9sbC5vZmZzZXRUb3AvMlxuICAgICAgICB4ID0gcGFyc2VJbnQgQHdpZHRoLzRcbiAgICAgICAgdCA9IFwidHJhbnNsYXRlM2QoI3t4fXB4LCAje3l9cHgsIDBweCkgc2NhbGUzZCgwLjUsIDAuNSwgMSlcIlxuICAgICAgICBAc2VsZWN0aS5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBoaWdobGlnLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGN1cnNvcnMuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAbGluZXMuc3R5bGUudHJhbnNmb3JtICAgPSB0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyUmFuZ2U6ICh0b3AsIGJvdCkgLT5cblxuICAgICAgICBjdHggPSBAbGluZXMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5jbGVhclJlY3QgMCwgKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0LCAyKkB3aWR0aCwgKGJvdC10b3ApKkBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgY2xlYXJBbGw6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAc2VsZWN0aS53aWR0aFxuICAgICAgICBAaGlnaGxpZy53aWR0aCA9IEBoaWdobGlnLndpZHRoXG4gICAgICAgIEBjdXJzb3JzLndpZHRoID0gQGN1cnNvcnMud2lkdGhcbiAgICAgICAgQHRvcGJvdC53aWR0aCAgPSBAdG9wYm90LndpZHRoXG4gICAgICAgIEBsaW5lcy53aWR0aCAgID0gQGxpbmVzLndpZHRoXG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gJzAnXG5cbm1vZHVsZS5leHBvcnRzID0gTWluaW1hcFxuIl19
//# sourceURL=../../coffee/editor/minimap.coffee