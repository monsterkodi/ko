// koffee 1.14.0

/*
000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000
 */
var $, Editor, EditorScroll, TextEditor, _, clamp, drag, elem, empty, kerror, keyinfo, klog, os, post, prefs, ref, render, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, drag = ref.drag, elem = ref.elem, empty = ref.empty, kerror = ref.kerror, keyinfo = ref.keyinfo, klog = ref.klog, os = ref.os, post = ref.post, prefs = ref.prefs, stopEvent = ref.stopEvent;

render = require('./render');

EditorScroll = require('./editorscroll');

Editor = require('./editor');

TextEditor = (function(superClass) {
    extend(TextEditor, superClass);

    function TextEditor(viewElem, config) {
        this.onKeyDown = bind(this.onKeyDown, this);
        this.onClickTimeout = bind(this.onClickTimeout, this);
        this.startClickTimer = bind(this.startClickTimer, this);
        this.clear = bind(this.clear, this);
        this.clearLines = bind(this.clearLines, this);
        this.doBlink = bind(this.doBlink, this);
        this.releaseBlink = bind(this.releaseBlink, this);
        this.shiftLines = bind(this.shiftLines, this);
        this.showLines = bind(this.showLines, this);
        this.setFontSize = bind(this.setFontSize, this);
        this.onSchemeChanged = bind(this.onSchemeChanged, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
        var base, feature, featureClss, featureName, i, layer, len, name, ref1, ref2;
        name = viewElem;
        if (name[0] === '.') {
            name = name.slice(1);
        }
        TextEditor.__super__.constructor.call(this, name, config);
        this.view = $(viewElem);
        this.layers = elem({
            "class": 'layers'
        });
        this.layerScroll = elem({
            "class": 'layerScroll',
            child: this.layers,
            parent: this.view
        });
        layer = [];
        layer.push('selections');
        layer.push('highlights');
        if (indexOf.call(this.config.features, 'Meta') >= 0) {
            layer.push('meta');
        }
        layer.push('lines');
        layer.push('cursors');
        if (indexOf.call(this.config.features, 'Numbers') >= 0) {
            layer.push('numbers');
        }
        this.initLayers(layer);
        this.size = {};
        this.elem = this.layerDict.lines;
        this.spanCache = [];
        this.lineDivs = {};
        if ((base = this.config).lineHeight != null) {
            base.lineHeight;
        } else {
            base.lineHeight = 1.2;
        }
        this.setFontSize(prefs.get(this.name + "FontSize", (ref1 = this.config.fontSize) != null ? ref1 : 19));
        this.scroll = new EditorScroll(this);
        this.scroll.on('shiftLines', this.shiftLines);
        this.scroll.on('showLines', this.showLines);
        this.view.addEventListener('blur', this.onBlur);
        this.view.addEventListener('focus', this.onFocus);
        this.view.addEventListener('keydown', this.onKeyDown);
        this.initDrag();
        ref2 = this.config.features;
        for (i = 0, len = ref2.length; i < len; i++) {
            feature = ref2[i];
            if (feature === 'CursorLine') {
                this.cursorLine = elem('div', {
                    "class": 'cursor-line'
                });
            } else {
                featureName = feature.toLowerCase();
                featureClss = require("./" + featureName);
                this[featureName] = new featureClss(this);
            }
        }
        post.on('schemeChanged', this.onSchemeChanged);
    }

    TextEditor.prototype.del = function() {
        var ref1;
        post.removeListener('schemeChanged', this.onSchemeChanged);
        if ((ref1 = this.scrollbar) != null) {
            ref1.del();
        }
        this.view.removeEventListener('keydown', this.onKeyDown);
        this.view.removeEventListener('blur', this.onBlur);
        this.view.removeEventListener('focus', this.onFocus);
        this.view.innerHTML = '';
        return TextEditor.__super__.del.call(this);
    };

    TextEditor.prototype.onFocus = function() {
        this.startBlink();
        this.emit('focus', this);
        return post.emit('editorFocus', this);
    };

    TextEditor.prototype.onBlur = function() {
        this.stopBlink();
        return this.emit('blur', this);
    };

    TextEditor.prototype.onSchemeChanged = function() {
        var ref1, updateMinimap;
        if ((ref1 = this.syntax) != null) {
            ref1.schemeChanged();
        }
        if (this.minimap) {
            updateMinimap = (function(_this) {
                return function() {
                    var ref2;
                    return (ref2 = _this.minimap) != null ? ref2.drawLines() : void 0;
                };
            })(this);
            return setTimeout(updateMinimap, 10);
        }
    };

    TextEditor.prototype.initLayers = function(layerClasses) {
        var cls, i, len, results;
        this.layerDict = {};
        results = [];
        for (i = 0, len = layerClasses.length; i < len; i++) {
            cls = layerClasses[i];
            results.push(this.layerDict[cls] = this.addLayer(cls));
        }
        return results;
    };

    TextEditor.prototype.addLayer = function(cls) {
        var div;
        div = elem({
            "class": cls
        });
        this.layers.appendChild(div);
        return div;
    };

    TextEditor.prototype.updateLayers = function() {
        this.renderHighlights();
        this.renderSelection();
        return this.renderCursors();
    };

    TextEditor.prototype.setLines = function(lines) {
        var viewHeight;
        this.clearLines();
        if (lines != null) {
            lines;
        } else {
            lines = [];
        }
        this.spanCache = [];
        this.lineDivs = {};
        TextEditor.__super__.setLines.call(this, lines);
        this.scroll.reset();
        viewHeight = this.viewHeight();
        this.scroll.start(viewHeight, this.numLines());
        this.layerScroll.scrollLeft = 0;
        this.layersWidth = this.layerScroll.offsetWidth;
        this.layersHeight = this.layerScroll.offsetHeight;
        return this.updateLayers();
    };

    TextEditor.prototype.appendText = function(text) {
        var appended, i, j, l, len, len1, li, ls, showLines;
        if (text == null) {
            console.log(this.name + ".appendText - no text?");
            return;
        }
        appended = [];
        ls = text != null ? text.split(/\n/) : void 0;
        for (i = 0, len = ls.length; i < len; i++) {
            l = ls[i];
            this.state = this.state.appendLine(l);
            appended.push(this.numLines() - 1);
        }
        if (this.scroll.viewHeight !== this.viewHeight()) {
            this.scroll.setViewHeight(this.viewHeight());
        }
        showLines = (this.scroll.bot < this.scroll.top) || (this.scroll.bot < this.scroll.viewLines);
        this.scroll.setNumLines(this.numLines(), {
            showLines: showLines
        });
        for (j = 0, len1 = appended.length; j < len1; j++) {
            li = appended[j];
            this.emit('lineAppended', {
                lineIndex: li,
                text: this.line(li)
            });
        }
        this.emit('linesAppended', ls);
        return this.emit('numLines', this.numLines());
    };

    TextEditor.prototype.setFontSize = function(fontSize) {
        var ref1;
        this.layers.style.fontSize = fontSize + "px";
        this.size.numbersWidth = indexOf.call(this.config.features, 'Numbers') >= 0 && 50 || 0;
        this.size.fontSize = fontSize;
        this.size.lineHeight = Math.floor(fontSize * this.config.lineHeight);
        this.size.charWidth = fontSize * 0.6;
        this.size.offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth);
        if (this.size.centerText) {
            this.centerText(false, 0);
            this.centerText(true, 0);
        }
        if ((ref1 = this.scroll) != null) {
            ref1.setLineHeight(this.size.lineHeight);
        }
        return this.emit('fontSizeChanged');
    };

    TextEditor.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, num, ref1, ref2;
        this.syntax.changed(changeInfo);
        ref1 = changeInfo.changes;
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            ref2 = [change.doIndex, change.newIndex, change.change], di = ref2[0], li = ref2[1], ch = ref2[2];
            switch (ch) {
                case 'changed':
                    this.updateLine(li, di);
                    this.emit('lineChanged', li);
                    break;
                case 'deleted':
                    this.spanCache = this.spanCache.slice(0, di);
                    this.emit('lineDeleted', di);
                    break;
                case 'inserted':
                    this.spanCache = this.spanCache.slice(0, di);
                    this.emit('lineInserted', li, di);
            }
        }
        if (changeInfo.inserts || changeInfo.deletes) {
            this.layersWidth = this.layerScroll.offsetWidth;
            if (this.numLines() !== this.scroll.numLines) {
                this.scroll.setNumLines(this.numLines());
            } else {
                num = this.scroll.bot - this.scroll.top + 1;
                this.showLines(this.scroll.top, this.scroll.bot, num);
            }
            this.updateLinePositions();
        }
        if (changeInfo.changes.length) {
            this.clearHighlights();
        }
        if (changeInfo.cursors) {
            this.renderCursors();
            this.scroll.cursorIntoView();
            this.emit('cursor');
            this.suspendBlink();
        }
        if (changeInfo.selects) {
            this.renderSelection();
            this.emit('selection');
        }
        return this.emit('changed', changeInfo);
    };

    TextEditor.prototype.updateLine = function(li, oi) {
        var div;
        if (oi == null) {
            oi = li;
        }
        if (li < this.scroll.top || li > this.scroll.bot) {
            if (this.lineDivs[li] != null) {
                kerror("dangling line div? " + li, this.lineDivs[li]);
            }
            delete this.spanCache[li];
            return;
        }
        if (!this.lineDivs[oi]) {
            return kerror("updateLine - out of bounds? li " + li + " oi " + oi);
        }
        this.spanCache[li] = render.lineSpan(this.syntax.getDiss(li), this.size);
        div = this.lineDivs[oi];
        return div.replaceChild(this.spanCache[li], div.firstChild);
    };

    TextEditor.prototype.refreshLines = function(top, bot) {
        var i, li, ref1, ref2, results;
        results = [];
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            this.syntax.getDiss(li, true);
            results.push(this.updateLine(li));
        }
        return results;
    };

    TextEditor.prototype.showLines = function(top, bot, num) {
        var i, li, ref1, ref2;
        this.lineDivs = {};
        this.elem.innerHTML = '';
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            this.appendLine(li);
        }
        this.updateLinePositions();
        this.updateLayers();
        return this.emit('linesShown', top, bot, num);
    };

    TextEditor.prototype.appendLine = function(li) {
        this.lineDivs[li] = elem({
            "class": 'line'
        });
        this.lineDivs[li].appendChild(this.cachedSpan(li));
        return this.elem.appendChild(this.lineDivs[li]);
    };

    TextEditor.prototype.shiftLines = function(top, bot, num) {
        var divInto, oldBot, oldTop;
        oldTop = top - num;
        oldBot = bot - num;
        divInto = (function(_this) {
            return function(li, lo) {
                var span, tx;
                if (!_this.lineDivs[lo]) {
                    console.log(_this.name + ".shiftLines.divInto - no div? " + top + " " + bot + " " + num + " old " + oldTop + " " + oldBot + " lo " + lo + " li " + li);
                    return;
                }
                if (!_.isElement(_this.lineDivs[lo])) {
                    console.log(_this.name + ".shiftLines.divInto - no element? " + top + " " + bot + " " + num + " old " + oldTop + " " + oldBot + " lo " + lo + " li " + li);
                    return;
                }
                _this.lineDivs[li] = _this.lineDivs[lo];
                delete _this.lineDivs[lo];
                _this.lineDivs[li].replaceChild(_this.cachedSpan(li), _this.lineDivs[li].firstChild);
                if (_this.showInvisibles) {
                    tx = _this.line(li).length * _this.size.charWidth + 1;
                    span = elem('span', {
                        "class": "invisible newline",
                        html: '&#9687'
                    });
                    span.style.transform = "translate(" + tx + "px, -1.5px)";
                    return _this.lineDivs[li].appendChild(span);
                }
            };
        })(this);
        if (num > 0) {
            while (oldBot < bot) {
                oldBot += 1;
                divInto(oldBot, oldTop);
                oldTop += 1;
            }
        } else {
            while (oldTop > top) {
                oldTop -= 1;
                divInto(oldTop, oldBot);
                oldBot -= 1;
            }
        }
        this.emit('linesShifted', top, bot, num);
        this.updateLinePositions();
        return this.updateLayers();
    };

    TextEditor.prototype.updateLinePositions = function(animate) {
        var div, li, ref1, resetTrans, y;
        if (animate == null) {
            animate = 0;
        }
        ref1 = this.lineDivs;
        for (li in ref1) {
            div = ref1[li];
            if ((div != null ? div.style : void 0) != null) {
                y = this.size.lineHeight * (li - this.scroll.top);
                div.style.transform = "translate3d(" + this.size.offsetX + "px," + y + "px, 0)";
                if (animate) {
                    div.style.transition = "all " + (animate / 1000) + "s";
                }
                div.style.zIndex = li;
            }
        }
        if (animate) {
            resetTrans = (function(_this) {
                return function() {
                    var c, i, len, ref2, results;
                    ref2 = _this.elem.children;
                    results = [];
                    for (i = 0, len = ref2.length; i < len; i++) {
                        c = ref2[i];
                        results.push(c.style.transition = 'initial');
                    }
                    return results;
                };
            })(this);
            return setTimeout(resetTrans, animate);
        }
    };

    TextEditor.prototype.updateLines = function() {
        var i, li, ref1, ref2, results;
        results = [];
        for (li = i = ref1 = this.scroll.top, ref2 = this.scroll.bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            results.push(this.updateLine(li));
        }
        return results;
    };

    TextEditor.prototype.clearHighlights = function() {
        if (this.numHighlights()) {
            $('.highlights', this.layers).innerHTML = '';
            return TextEditor.__super__.clearHighlights.call(this);
        }
    };

    TextEditor.prototype.cachedSpan = function(li) {
        if (!this.spanCache[li]) {
            this.spanCache[li] = render.lineSpan(this.syntax.getDiss(li), this.size);
        }
        return this.spanCache[li];
    };

    TextEditor.prototype.renderCursors = function() {
        var c, cs, cursorLine, html, i, j, len, len1, line, mc, ref1, ri, ty, vc;
        cs = [];
        ref1 = this.cursors();
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            if (c[1] >= this.scroll.top && c[1] <= this.scroll.bot) {
                cs.push([c[0], c[1] - this.scroll.top]);
            }
        }
        mc = this.mainCursor();
        if (this.numCursors() === 1) {
            if (cs.length === 1) {
                if (mc[1] < 0) {
                    return;
                }
                if (mc[1] > this.numLines() - 1) {
                    return kerror(this.name + ".renderCursors mainCursor DAFUK?", this.numLines(), str(this.mainCursor()));
                }
                ri = mc[1] - this.scroll.top;
                cursorLine = this.state.line(mc[1]);
                if (cursorLine == null) {
                    return kerror('no main cursor line?');
                }
                if (mc[0] > cursorLine.length) {
                    cs[0][2] = 'virtual';
                    cs.push([cursorLine.length, ri, 'main off']);
                } else {
                    cs[0][2] = 'main off';
                }
            }
        } else if (this.numCursors() > 1) {
            vc = [];
            for (j = 0, len1 = cs.length; j < len1; j++) {
                c = cs[j];
                if (isSamePos(this.mainCursor(), [c[0], c[1] + this.scroll.top])) {
                    c[2] = 'main';
                }
                line = this.line(this.scroll.top + c[1]);
                if (c[0] > line.length) {
                    vc.push([line.length, c[1], 'virtual']);
                }
            }
            cs = cs.concat(vc);
        }
        html = render.cursors(cs, this.size);
        this.layerDict.cursors.innerHTML = html;
        ty = (mc[1] - this.scroll.top) * this.size.lineHeight;
        if (this.cursorLine) {
            this.cursorLine.style = "z-index:0;transform:translate3d(0," + ty + "px,0); height:" + this.size.lineHeight + "px;";
            return this.layers.insertBefore(this.cursorLine, this.layers.firstChild);
        }
    };

    TextEditor.prototype.renderSelection = function() {
        var h, s;
        h = "";
        s = this.selectionsInLineIndexRangeRelativeToLineIndex([this.scroll.top, this.scroll.bot], this.scroll.top);
        if (s) {
            h += render.selection(s, this.size);
        }
        return this.layerDict.selections.innerHTML = h;
    };

    TextEditor.prototype.renderHighlights = function() {
        var h, s;
        h = "";
        s = this.highlightsInLineIndexRangeRelativeToLineIndex([this.scroll.top, this.scroll.bot], this.scroll.top);
        if (s) {
            h += render.selection(s, this.size, "highlight");
        }
        return this.layerDict.highlights.innerHTML = h;
    };

    TextEditor.prototype.cursorDiv = function() {
        return $('.cursor.main', this.layerDict['cursors']);
    };

    TextEditor.prototype.suspendBlink = function() {
        var blinkDelay, ref1;
        if (!this.blinkTimer) {
            return;
        }
        this.stopBlink();
        if ((ref1 = this.cursorDiv()) != null) {
            ref1.classList.toggle('blink', false);
        }
        clearTimeout(this.suspendTimer);
        blinkDelay = prefs.get('cursorBlinkDelay', [800, 200]);
        return this.suspendTimer = setTimeout(this.releaseBlink, blinkDelay[0]);
    };

    TextEditor.prototype.releaseBlink = function() {
        clearTimeout(this.suspendTimer);
        delete this.suspendTimer;
        return this.startBlink();
    };

    TextEditor.prototype.toggleBlink = function() {
        var blink;
        blink = !prefs.get('blink', false);
        prefs.set('blink', blink);
        if (blink) {
            return this.startBlink();
        } else {
            return this.stopBlink();
        }
    };

    TextEditor.prototype.doBlink = function() {
        var blinkDelay, ref1, ref2;
        this.blink = !this.blink;
        if ((ref1 = this.cursorDiv()) != null) {
            ref1.classList.toggle('blink', this.blink);
        }
        if ((ref2 = this.minimap) != null) {
            ref2.drawMainCursor(this.blink);
        }
        clearTimeout(this.blinkTimer);
        blinkDelay = prefs.get('cursorBlinkDelay', [800, 200]);
        return this.blinkTimer = setTimeout(this.doBlink, this.blink && blinkDelay[1] || blinkDelay[0]);
    };

    TextEditor.prototype.startBlink = function() {
        if (!this.blinkTimer && prefs.get('blink')) {
            return this.doBlink();
        }
    };

    TextEditor.prototype.stopBlink = function() {
        var ref1;
        if ((ref1 = this.cursorDiv()) != null) {
            ref1.classList.toggle('blink', false);
        }
        clearTimeout(this.blinkTimer);
        return delete this.blinkTimer;
    };

    TextEditor.prototype.resized = function() {
        var ref1, vh;
        vh = this.view.clientHeight;
        if (vh === this.scroll.viewHeight) {
            return;
        }
        if ((ref1 = this.numbers) != null) {
            ref1.elem.style.height = (this.scroll.exposeNum * this.scroll.lineHeight) + "px";
        }
        this.layersWidth = this.layerScroll.offsetWidth;
        this.scroll.setViewHeight(vh);
        return this.emit('viewHeight', vh);
    };

    TextEditor.prototype.posAtXY = function(x, y) {
        var br, lx, ly, p, px, py, sl, st;
        sl = this.layerScroll.scrollLeft;
        st = this.scroll.offsetTop;
        br = this.view.getBoundingClientRect();
        lx = clamp(0, this.layers.offsetWidth, x - br.left - this.size.offsetX + this.size.charWidth / 3);
        ly = clamp(0, this.layers.offsetHeight, y - br.top);
        px = parseInt(Math.floor((Math.max(0, sl + lx)) / this.size.charWidth));
        py = parseInt(Math.floor((Math.max(0, st + ly)) / this.size.lineHeight)) + this.scroll.top;
        p = [px, Math.min(this.numLines() - 1, py)];
        return p;
    };

    TextEditor.prototype.posForEvent = function(event) {
        return this.posAtXY(event.clientX, event.clientY);
    };

    TextEditor.prototype.lineElemAtXY = function(x, y) {
        var p;
        p = this.posAtXY(x, y);
        return this.lineDivs[p[1]];
    };

    TextEditor.prototype.lineSpanAtXY = function(x, y) {
        var br, e, i, len, lineElem, lr, offset, ref1;
        if (lineElem = this.lineElemAtXY(x, y)) {
            lr = lineElem.getBoundingClientRect();
            ref1 = lineElem.firstChild.children;
            for (i = 0, len = ref1.length; i < len; i++) {
                e = ref1[i];
                br = e.getBoundingClientRect();
                if ((br.left <= x && x <= br.left + br.width)) {
                    offset = x - br.left;
                    return {
                        span: e,
                        offsetLeft: offset,
                        offsetChar: parseInt(offset / this.size.charWidth)
                    };
                }
            }
        }
        return null;
    };

    TextEditor.prototype.numFullLines = function() {
        return this.scroll.fullLines;
    };

    TextEditor.prototype.viewHeight = function() {
        var ref1, ref2;
        if (((ref1 = this.scroll) != null ? ref1.viewHeight : void 0) >= 0) {
            return this.scroll.viewHeight;
        }
        return (ref2 = this.view) != null ? ref2.clientHeight : void 0;
    };

    TextEditor.prototype.clearLines = function() {
        this.elem.innerHTML = '';
        return this.emit('clearLines');
    };

    TextEditor.prototype.clear = function() {
        return this.setLines([]);
    };

    TextEditor.prototype.focus = function() {
        return this.view.focus();
    };

    TextEditor.prototype.initDrag = function() {
        return this.drag = new drag({
            target: this.layerScroll,
            onStart: (function(_this) {
                return function(drag, event) {
                    var eventPos, p, r, range;
                    _this.view.focus();
                    eventPos = _this.posForEvent(event);
                    if (event.button === 2) {
                        return 'skip';
                    } else if (event.button === 1) {
                        if (!_this.jumpToFileAtPos(eventPos)) {
                            _this.jumpToWordAtPos(eventPos);
                        }
                        stopEvent(event);
                        return 'skip';
                    }
                    if (_this.clickCount) {
                        if (isSamePos(eventPos, _this.clickPos)) {
                            _this.startClickTimer();
                            _this.clickCount += 1;
                            if (_this.clickCount === 2) {
                                range = _this.rangeForWordAtPos(eventPos);
                                if (event.metaKey || _this.stickySelection) {
                                    _this.addRangeToSelection(range);
                                } else {
                                    _this.highlightWordAndAddToSelection();
                                }
                            }
                            if (_this.clickCount === 3) {
                                _this.clearHighlights();
                                r = _this.rangeForLineAtIndex(_this.clickPos[1]);
                                if (event.metaKey) {
                                    _this.addRangeToSelection(r);
                                } else {
                                    _this.selectSingleRange(r);
                                }
                            }
                            return;
                        } else {
                            _this.onClickTimeout();
                        }
                    }
                    _this.clickCount = 1;
                    _this.clickPos = eventPos;
                    _this.startClickTimer();
                    p = _this.posForEvent(event);
                    return _this.clickAtPos(p, event);
                };
            })(this),
            onMove: (function(_this) {
                return function(drag, event) {
                    var p;
                    p = _this.posForEvent(event);
                    if (event.metaKey) {
                        return _this.addCursorAtPos([_this.mainCursor()[0], p[1]]);
                    } else {
                        return _this.singleCursorAtPos(p, {
                            extend: true
                        });
                    }
                };
            })(this),
            onStop: (function(_this) {
                return function() {
                    if (_this.numSelections() && empty(_this.textOfSelection())) {
                        return _this.selectNone();
                    }
                };
            })(this)
        });
    };

    TextEditor.prototype.startClickTimer = function() {
        clearTimeout(this.clickTimer);
        return this.clickTimer = setTimeout(this.onClickTimeout, this.stickySelection && 300 || 1000);
    };

    TextEditor.prototype.onClickTimeout = function() {
        clearTimeout(this.clickTimer);
        this.clickCount = 0;
        this.clickTimer = null;
        return this.clickPos = null;
    };

    TextEditor.prototype.funcInfoAtLineIndex = function(li) {
        var fileInfo, files, func, i, len, ref1;
        files = post.get('indexer', 'files', this.currentFile);
        fileInfo = files[this.currentFile];
        ref1 = fileInfo.funcs;
        for (i = 0, len = ref1.length; i < len; i++) {
            func = ref1[i];
            if ((func.line <= li && li <= func.last)) {
                return func["class"] + '.' + func.name + ' ';
            }
        }
        return '';
    };

    TextEditor.prototype.clickAtPos = function(p, event) {
        if (event.altKey) {
            return this.toggleCursorAtPos(p);
        } else if (event.metaKey || event.ctrlKey) {
            return this.jumpToWordAtPos(p);
        } else {
            return this.singleCursorAtPos(p, {
                extend: event.shiftKey
            });
        }
    };

    TextEditor.prototype.handleModKeyComboCharEvent = function(mod, key, combo, char, event) {
        var action, actionCombo, i, j, k, len, len1, len2, ref1, ref2, ref3;
        if (this.autocomplete != null) {
            if ('unhandled' !== this.autocomplete.handleModKeyComboEvent(mod, key, combo, event)) {
                return;
            }
        }
        switch (combo) {
            case 'backspace':
                return 'unhandled';
            case 'esc':
                this.setSalterMode(false);
                this.clearHighlights();
                this.clearCursors();
                this.endStickySelection();
                this.selectNone();
                return;
            case 'command+enter':
            case 'ctrl+enter':
            case 'f12':
                this.jumpToWord();
        }
        ref1 = Editor.actions;
        for (i = 0, len = ref1.length; i < len; i++) {
            action = ref1[i];
            if (action.combo === combo || action.accel === combo) {
                switch (combo) {
                    case 'ctrl+a':
                    case 'command+a':
                        return this.selectAll();
                }
                return 'unhandled';
            }
            if ((action.accels != null) && os.platform() !== 'darwin') {
                ref2 = action.accels;
                for (j = 0, len1 = ref2.length; j < len1; j++) {
                    actionCombo = ref2[j];
                    if (combo === actionCombo) {
                        if ((action.key != null) && _.isFunction(this[action.key])) {
                            this[action.key](key, {
                                combo: combo,
                                mod: mod,
                                event: event
                            });
                            return;
                        }
                    }
                }
            }
            if (action.combos == null) {
                continue;
            }
            ref3 = action.combos;
            for (k = 0, len2 = ref3.length; k < len2; k++) {
                actionCombo = ref3[k];
                if (combo === actionCombo) {
                    if ((action.key != null) && _.isFunction(this[action.key])) {
                        this[action.key](key, {
                            combo: combo,
                            mod: mod,
                            event: event
                        });
                        return;
                    }
                }
            }
        }
        if (char && (mod === "shift" || mod === "")) {
            return this.insertCharacter(char);
        }
        return 'unhandled';
    };

    TextEditor.prototype.onKeyDown = function(event) {
        var char, combo, key, mod, ref1, result;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        if (!combo) {
            return;
        }
        if (key === 'right click') {
            return;
        }
        result = this.handleModKeyComboCharEvent(mod, key, combo, char, event);
        if ('unhandled' !== result) {
            return stopEvent(event);
        }
    };

    TextEditor.prototype.log = function() {
        if (this.name !== 'editor') {
            return;
        }
        klog.slog.depth = 3;
        klog.apply(klog, [].splice.call(arguments, 0));
        return klog.slog.depth = 2;
    };

    return TextEditor;

})(Editor);

module.exports = TextEditor;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJ0ZXh0ZWRpdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnSUFBQTtJQUFBOzs7OztBQVFBLE1BQXdGLE9BQUEsQ0FBUSxLQUFSLENBQXhGLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsZUFBckIsRUFBMkIsaUJBQTNCLEVBQWtDLG1CQUFsQyxFQUEwQyxxQkFBMUMsRUFBbUQsZUFBbkQsRUFBeUQsV0FBekQsRUFBNkQsZUFBN0QsRUFBbUUsaUJBQW5FLEVBQTBFOztBQUUxRSxNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBRVQ7OztJQUVDLG9CQUFDLFFBQUQsRUFBVyxNQUFYOzs7Ozs7Ozs7Ozs7OztBQUVDLFlBQUE7UUFBQSxJQUFBLEdBQU87UUFDUCxJQUF1QixJQUFLLENBQUEsQ0FBQSxDQUFMLEtBQVcsR0FBbEM7WUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLEVBQVA7O1FBRUEsNENBQU0sSUFBTixFQUFZLE1BQVo7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxRQUFGO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBZSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFFBQU47U0FBTDtRQUNmLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxhQUFOO1lBQW9CLEtBQUEsRUFBTSxJQUFDLENBQUEsTUFBM0I7WUFBbUMsTUFBQSxFQUFPLElBQUMsQ0FBQSxJQUEzQztTQUFMO1FBRWYsS0FBQSxHQUFRO1FBQ1IsS0FBSyxDQUFDLElB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RUFBaUIsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFWLENBQWUsU0FBZixFQUEwQixDQUExQixDQUFqQjtlQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBVixHQUFrQjtJQUpqQjs7OztHQXR2QmdCOztBQTR2QnpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyAkLCBfLCBjbGFtcCwgZHJhZywgZWxlbSwgZW1wdHksIGtlcnJvciwga2V5aW5mbywga2xvZywgb3MsIHBvc3QsIHByZWZzLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcbiAgXG5yZW5kZXIgICAgICAgPSByZXF1aXJlICcuL3JlbmRlcidcbkVkaXRvclNjcm9sbCA9IHJlcXVpcmUgJy4vZWRpdG9yc2Nyb2xsJ1xuRWRpdG9yICAgICAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5cbmNsYXNzIFRleHRFZGl0b3IgZXh0ZW5kcyBFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSwgY29uZmlnKSAtPlxuXG4gICAgICAgIG5hbWUgPSB2aWV3RWxlbVxuICAgICAgICBuYW1lID0gbmFtZS5zbGljZSAxIGlmIG5hbWVbMF0gPT0gJy4nXG5cbiAgICAgICAgc3VwZXIgbmFtZSwgY29uZmlnXG5cbiAgICAgICAgQHZpZXcgPSQgdmlld0VsZW1cblxuICAgICAgICBAbGF5ZXJzICAgICAgPSBlbGVtIGNsYXNzOidsYXllcnMnXG4gICAgICAgIEBsYXllclNjcm9sbCA9IGVsZW0gY2xhc3M6J2xheWVyU2Nyb2xsJyBjaGlsZDpAbGF5ZXJzLCBwYXJlbnQ6QHZpZXdcblxuICAgICAgICBsYXllciA9IFtdXG4gICAgICAgIGxheWVyLnB1c2ggJ3NlbGVjdGlvbnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2hpZ2hsaWdodHMnXG4gICAgICAgIGxheWVyLnB1c2ggJ21ldGEnICAgIGlmICdNZXRhJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIGxheWVyLnB1c2ggJ2xpbmVzJ1xuICAgICAgICBsYXllci5wdXNoICdjdXJzb3JzJ1xuICAgICAgICBsYXllci5wdXNoICdudW1iZXJzJyBpZiAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBAaW5pdExheWVycyBsYXllclxuXG4gICAgICAgIEBzaXplID0ge31cbiAgICAgICAgQGVsZW0gPSBAbGF5ZXJEaWN0LmxpbmVzXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdICMgY2FjaGUgZm9yIHJlbmRlcmVkIGxpbmUgc3BhbnNcbiAgICAgICAgQGxpbmVEaXZzICA9IHt9ICMgbWFwcyBsaW5lIG51bWJlcnMgdG8gZGlzcGxheWVkIGRpdnNcblxuICAgICAgICBAY29uZmlnLmxpbmVIZWlnaHQgPz0gMS4yXG5cbiAgICAgICAgQHNldEZvbnRTaXplIHByZWZzLmdldCBcIiN7QG5hbWV9Rm9udFNpemVcIiwgQGNvbmZpZy5mb250U2l6ZSA/IDE5XG4gICAgICAgIEBzY3JvbGwgPSBuZXcgRWRpdG9yU2Nyb2xsIEBcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hpZnRMaW5lcycgQHNoaWZ0TGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hvd0xpbmVzJyAgQHNob3dMaW5lc1xuXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInICAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uS2V5RG93blxuXG4gICAgICAgIEBpbml0RHJhZygpICAgICAgICBcblxuICAgICAgICBmb3IgZmVhdHVyZSBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgICAgICBpZiBmZWF0dXJlID09ICdDdXJzb3JMaW5lJ1xuICAgICAgICAgICAgICAgIEBjdXJzb3JMaW5lID0gZWxlbSAnZGl2JyBjbGFzczonY3Vyc29yLWxpbmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmVhdHVyZU5hbWUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBmZWF0dXJlQ2xzcyA9IHJlcXVpcmUgXCIuLyN7ZmVhdHVyZU5hbWV9XCJcbiAgICAgICAgICAgICAgICBAW2ZlYXR1cmVOYW1lXSA9IG5ldyBmZWF0dXJlQ2xzcyBAXG5cbiAgICAgICAgcG9zdC5vbiAnc2NoZW1lQ2hhbmdlZCcgQG9uU2NoZW1lQ2hhbmdlZFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGRlbDogLT5cblxuICAgICAgICBwb3N0LnJlbW92ZUxpc3RlbmVyICdzY2hlbWVDaGFuZ2VkJyBAb25TY2hlbWVDaGFuZ2VkXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsYmFyPy5kZWwoKVxuXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2tleWRvd24nIEBvbktleURvd25cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdmb2N1cycgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIG9uRm9jdXM6ID0+XG5cbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBAZW1pdCAnZm9jdXMnIEBcbiAgICAgICAgcG9zdC5lbWl0ICdlZGl0b3JGb2N1cycgQFxuXG4gICAgb25CbHVyOiA9PlxuXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAZW1pdCAnYmx1cicgQFxuXG4gICAgb25TY2hlbWVDaGFuZ2VkOiA9PlxuXG4gICAgICAgIEBzeW50YXg/LnNjaGVtZUNoYW5nZWQoKVxuICAgICAgICBpZiBAbWluaW1hcFxuICAgICAgICAgICAgdXBkYXRlTWluaW1hcCA9ID0+IEBtaW5pbWFwPy5kcmF3TGluZXMoKVxuICAgICAgICAgICAgc2V0VGltZW91dCB1cGRhdGVNaW5pbWFwLCAxMFxuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMDAwMDAwMCAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0TGF5ZXJzOiAobGF5ZXJDbGFzc2VzKSAtPlxuXG4gICAgICAgIEBsYXllckRpY3QgPSB7fVxuICAgICAgICBmb3IgY2xzIGluIGxheWVyQ2xhc3Nlc1xuICAgICAgICAgICAgQGxheWVyRGljdFtjbHNdID0gQGFkZExheWVyIGNsc1xuXG4gICAgYWRkTGF5ZXI6IChjbHMpIC0+XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogY2xzXG4gICAgICAgIEBsYXllcnMuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgIGRpdlxuXG4gICAgdXBkYXRlTGF5ZXJzOiAoKSAtPlxuXG4gICAgICAgIEByZW5kZXJIaWdobGlnaHRzKClcbiAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgIEByZW5kZXJDdXJzb3JzKClcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBjbGVhckxpbmVzKClcblxuICAgICAgICBsaW5lcyA/PSBbXVxuXG4gICAgICAgIEBzcGFuQ2FjaGUgPSBbXVxuICAgICAgICBAbGluZURpdnMgID0ge31cblxuICAgICAgICBzdXBlciBsaW5lc1xuXG4gICAgICAgIEBzY3JvbGwucmVzZXQoKVxuXG4gICAgICAgIHZpZXdIZWlnaHQgPSBAdmlld0hlaWdodCgpXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnN0YXJ0IHZpZXdIZWlnaHQsIEBudW1MaW5lcygpXG5cbiAgICAgICAgQGxheWVyU2Nyb2xsLnNjcm9sbExlZnQgPSAwXG4gICAgICAgIEBsYXllcnNXaWR0aCAgPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcbiAgICAgICAgQGxheWVyc0hlaWdodCA9IEBsYXllclNjcm9sbC5vZmZzZXRIZWlnaHRcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYXBwZW5kVGV4dDogKHRleHQpIC0+XG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5hcHBlbmRUZXh0IC0gbm8gdGV4dD9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgYXBwZW5kZWQgPSBbXVxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5hcHBlbmRMaW5lIGxcbiAgICAgICAgICAgIGFwcGVuZGVkLnB1c2ggQG51bUxpbmVzKCktMVxuXG4gICAgICAgIGlmIEBzY3JvbGwudmlld0hlaWdodCAhPSBAdmlld0hlaWdodCgpXG4gICAgICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgQHZpZXdIZWlnaHQoKVxuXG4gICAgICAgIHNob3dMaW5lcyA9IChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudG9wKSBvciAoQHNjcm9sbC5ib3QgPCBAc2Nyb2xsLnZpZXdMaW5lcylcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpLCBzaG93TGluZXM6c2hvd0xpbmVzXG5cbiAgICAgICAgZm9yIGxpIGluIGFwcGVuZGVkXG4gICAgICAgICAgICBAZW1pdCAnbGluZUFwcGVuZGVkJyxcbiAgICAgICAgICAgICAgICBsaW5lSW5kZXg6IGxpXG4gICAgICAgICAgICAgICAgdGV4dDogQGxpbmUgbGlcblxuICAgICAgICBAZW1pdCAnbGluZXNBcHBlbmRlZCcgbHNcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyBAbnVtTGluZXMoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHNldEZvbnRTaXplOiAoZm9udFNpemUpID0+XG4gICAgICAgIFxuICAgICAgICBAbGF5ZXJzLnN0eWxlLmZvbnRTaXplID0gXCIje2ZvbnRTaXplfXB4XCJcbiAgICAgICAgQHNpemUubnVtYmVyc1dpZHRoID0gJ051bWJlcnMnIGluIEBjb25maWcuZmVhdHVyZXMgYW5kIDUwIG9yIDBcbiAgICAgICAgQHNpemUuZm9udFNpemUgICAgID0gZm9udFNpemVcbiAgICAgICAgQHNpemUubGluZUhlaWdodCAgID0gTWF0aC5mbG9vciBmb250U2l6ZSAqIEBjb25maWcubGluZUhlaWdodFxuICAgICAgICBAc2l6ZS5jaGFyV2lkdGggICAgPSBmb250U2l6ZSAqIDAuNlxuICAgICAgICBAc2l6ZS5vZmZzZXRYICAgICAgPSBNYXRoLmZsb29yIEBzaXplLmNoYXJXaWR0aC8yICsgQHNpemUubnVtYmVyc1dpZHRoXG4gICAgICAgIGlmIEBzaXplLmNlbnRlclRleHRcbiAgICAgICAgICAgIEBjZW50ZXJUZXh0IGZhbHNlIDBcbiAgICAgICAgICAgIEBjZW50ZXJUZXh0IHRydWUgMFxuXG4gICAgICAgIEBzY3JvbGw/LnNldExpbmVIZWlnaHQgQHNpemUubGluZUhlaWdodFxuXG4gICAgICAgIEBlbWl0ICdmb250U2l6ZUNoYW5nZWQnICMgbnVtYmVyc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIEBzeW50YXguY2hhbmdlZCBjaGFuZ2VJbmZvXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIFtkaSxsaSxjaF0gPSBbY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5uZXdJbmRleCwgY2hhbmdlLmNoYW5nZV1cbiAgICAgICAgICAgIHN3aXRjaCBjaFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZUNoYW5nZWQnIGxpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lRGVsZXRlZCcgZGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lSW5zZXJ0ZWQnIGxpLCBkaVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uaW5zZXJ0cyBvciBjaGFuZ2VJbmZvLmRlbGV0ZXNcbiAgICAgICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICAgICAgaWYgQG51bUxpbmVzKCkgIT0gQHNjcm9sbC5udW1MaW5lc1xuICAgICAgICAgICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBudW0gPSBAc2Nyb2xsLmJvdCAtIEBzY3JvbGwudG9wICsgMVxuICAgICAgICAgICAgICAgIEBzaG93TGluZXMgQHNjcm9sbC50b3AsIEBzY3JvbGwuYm90LCBudW1cbiAgICAgICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmN1cnNvcnNcbiAgICAgICAgICAgIEByZW5kZXJDdXJzb3JzKClcbiAgICAgICAgICAgIEBzY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuICAgICAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgICAgIEBzdXNwZW5kQmxpbmsoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgICAgIEBlbWl0ICdjaGFuZ2VkJyBjaGFuZ2VJbmZvXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZTogKGxpLCBvaSkgLT5cblxuICAgICAgICBvaSA9IGxpIGlmIG5vdCBvaT9cblxuICAgICAgICBpZiBsaSA8IEBzY3JvbGwudG9wIG9yIGxpID4gQHNjcm9sbC5ib3RcbiAgICAgICAgICAgIGtlcnJvciBcImRhbmdsaW5nIGxpbmUgZGl2PyAje2xpfVwiLCBAbGluZURpdnNbbGldIGlmIEBsaW5lRGl2c1tsaV0/XG4gICAgICAgICAgICBkZWxldGUgQHNwYW5DYWNoZVtsaV1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJ1cGRhdGVMaW5lIC0gb3V0IG9mIGJvdW5kcz8gbGkgI3tsaX0gb2kgI3tvaX1cIiBpZiBub3QgQGxpbmVEaXZzW29pXVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldID0gcmVuZGVyLmxpbmVTcGFuIEBzeW50YXguZ2V0RGlzcyhsaSksIEBzaXplXG5cbiAgICAgICAgZGl2ID0gQGxpbmVEaXZzW29pXVxuICAgICAgICBkaXYucmVwbGFjZUNoaWxkIEBzcGFuQ2FjaGVbbGldLCBkaXYuZmlyc3RDaGlsZFxuICAgICAgICBcbiAgICByZWZyZXNoTGluZXM6ICh0b3AsIGJvdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAc3ludGF4LmdldERpc3MgbGksIHRydWVcbiAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNob3dMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgQGxpbmVEaXZzID0ge31cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcblxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQGFwcGVuZExpbmUgbGlcblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgICBAZW1pdCAnbGluZXNTaG93bicgdG9wLCBib3QsIG51bVxuICAgIFxuICAgIGFwcGVuZExpbmU6IChsaSkgLT5cblxuICAgICAgICBAbGluZURpdnNbbGldID0gZWxlbSBjbGFzczogJ2xpbmUnXG4gICAgICAgIEBsaW5lRGl2c1tsaV0uYXBwZW5kQ2hpbGQgQGNhY2hlZFNwYW4gbGlcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGxpbmVEaXZzW2xpXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzaGlmdExpbmVzOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5zaGlmdExpbmVzLmRpdkludG8gLSBubyBkaXY/ICN7dG9wfSAje2JvdH0gI3tudW19IG9sZCAje29sZFRvcH0gI3tvbGRCb3R9IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCBfLmlzRWxlbWVudCBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICAgICAgbG9nIFwiI3tAbmFtZX0uc2hpZnRMaW5lcy5kaXZJbnRvIC0gbm8gZWxlbWVudD8gI3t0b3B9ICN7Ym90fSAje251bX0gb2xkICN7b2xkVG9wfSAje29sZEJvdH0gbG8gI3tsb30gbGkgI3tsaX1cIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBAbGluZURpdnNbbGldID0gQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgZGVsZXRlIEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0ucmVwbGFjZUNoaWxkIEBjYWNoZWRTcGFuKGxpKSwgQGxpbmVEaXZzW2xpXS5maXJzdENoaWxkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBzaG93SW52aXNpYmxlc1xuICAgICAgICAgICAgICAgIHR4ID0gQGxpbmUobGkpLmxlbmd0aCAqIEBzaXplLmNoYXJXaWR0aCArIDFcbiAgICAgICAgICAgICAgICBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6IFwiaW52aXNpYmxlIG5ld2xpbmVcIiwgaHRtbDogJyYjOTY4NydcbiAgICAgICAgICAgICAgICBzcGFuLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKCN7dHh9cHgsIC0xLjVweClcIlxuICAgICAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0uYXBwZW5kQ2hpbGQgc3BhblxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIHdoaWxlIG9sZEJvdCA8IGJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCArPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRCb3QsIG9sZFRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCArPSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIG9sZFRvcCA+IHRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCAtPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRUb3AsIG9sZEJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCAtPSAxXG5cbiAgICAgICAgQGVtaXQgJ2xpbmVzU2hpZnRlZCcgdG9wLCBib3QsIG51bVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZVBvc2l0aW9uczogKGFuaW1hdGU9MCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBsaSxkaXYgb2YgQGxpbmVEaXZzXG4gICAgICAgICAgICBpZiBkaXY/LnN0eWxlP1xuICAgICAgICAgICAgICAgIHkgPSBAc2l6ZS5saW5lSGVpZ2h0ICogKGxpIC0gQHNjcm9sbC50b3ApXG4gICAgICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoI3tAc2l6ZS5vZmZzZXRYfXB4LCN7eX1weCwgMClcIlxuICAgICAgICAgICAgICAgIGRpdi5zdHlsZS50cmFuc2l0aW9uID0gXCJhbGwgI3thbmltYXRlLzEwMDB9c1wiIGlmIGFuaW1hdGVcbiAgICAgICAgICAgICAgICBkaXYuc3R5bGUuekluZGV4ID0gbGlcblxuICAgICAgICBpZiBhbmltYXRlXG4gICAgICAgICAgICByZXNldFRyYW5zID0gPT5cbiAgICAgICAgICAgICAgICBmb3IgYyBpbiBAZWxlbS5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBjLnN0eWxlLnRyYW5zaXRpb24gPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIHNldFRpbWVvdXQgcmVzZXRUcmFucywgYW5pbWF0ZVxuXG4gICAgdXBkYXRlTGluZXM6ICgpIC0+XG5cbiAgICAgICAgZm9yIGxpIGluIFtAc2Nyb2xsLnRvcC4uQHNjcm9sbC5ib3RdXG4gICAgICAgICAgICBAdXBkYXRlTGluZSBsaVxuXG4gICAgY2xlYXJIaWdobGlnaHRzOiAoKSAtPlxuXG4gICAgICAgIGlmIEBudW1IaWdobGlnaHRzKClcbiAgICAgICAgICAgICQoJy5oaWdobGlnaHRzJyBAbGF5ZXJzKS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNhY2hlZFNwYW46IChsaSkgLT5cblxuICAgICAgICBpZiBub3QgQHNwYW5DYWNoZVtsaV1cblxuICAgICAgICAgICAgQHNwYW5DYWNoZVtsaV0gPSByZW5kZXIubGluZVNwYW4gQHN5bnRheC5nZXREaXNzKGxpKSwgQHNpemVcblxuICAgICAgICBAc3BhbkNhY2hlW2xpXVxuXG4gICAgcmVuZGVyQ3Vyc29yczogLT5cblxuICAgICAgICBjcyA9IFtdXG4gICAgICAgIGZvciBjIGluIEBjdXJzb3JzKClcbiAgICAgICAgICAgIGlmIGNbMV0gPj0gQHNjcm9sbC50b3AgYW5kIGNbMV0gPD0gQHNjcm9sbC5ib3RcbiAgICAgICAgICAgICAgICBjcy5wdXNoIFtjWzBdLCBjWzFdIC0gQHNjcm9sbC50b3BdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuXG4gICAgICAgIGlmIEBudW1DdXJzb3JzKCkgPT0gMVxuXG4gICAgICAgICAgICBpZiBjcy5sZW5ndGggPT0gMVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG1jWzFdIDwgMFxuXG4gICAgICAgICAgICAgICAgaWYgbWNbMV0gPiBAbnVtTGluZXMoKS0xXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCIje0BuYW1lfS5yZW5kZXJDdXJzb3JzIG1haW5DdXJzb3IgREFGVUs/XCIsIEBudW1MaW5lcygpLCBzdHIgQG1haW5DdXJzb3IoKVxuXG4gICAgICAgICAgICAgICAgcmkgPSBtY1sxXS1Ac2Nyb2xsLnRvcFxuICAgICAgICAgICAgICAgIGN1cnNvckxpbmUgPSBAc3RhdGUubGluZShtY1sxXSlcbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBtYWluIGN1cnNvciBsaW5lPycgaWYgbm90IGN1cnNvckxpbmU/XG4gICAgICAgICAgICAgICAgaWYgbWNbMF0gPiBjdXJzb3JMaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBjc1swXVsyXSA9ICd2aXJ0dWFsJ1xuICAgICAgICAgICAgICAgICAgICBjcy5wdXNoIFtjdXJzb3JMaW5lLmxlbmd0aCwgcmksICdtYWluIG9mZiddXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjc1swXVsyXSA9ICdtYWluIG9mZidcblxuICAgICAgICBlbHNlIGlmIEBudW1DdXJzb3JzKCkgPiAxXG5cbiAgICAgICAgICAgIHZjID0gW10gIyB2aXJ0dWFsIGN1cnNvcnNcbiAgICAgICAgICAgIGZvciBjIGluIGNzXG4gICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIEBtYWluQ3Vyc29yKCksIFtjWzBdLCBjWzFdICsgQHNjcm9sbC50b3BdXG4gICAgICAgICAgICAgICAgICAgIGNbMl0gPSAnbWFpbidcbiAgICAgICAgICAgICAgICBsaW5lID0gQGxpbmUoQHNjcm9sbC50b3ArY1sxXSlcbiAgICAgICAgICAgICAgICBpZiBjWzBdID4gbGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgdmMucHVzaCBbbGluZS5sZW5ndGgsIGNbMV0sICd2aXJ0dWFsJ11cbiAgICAgICAgICAgIGNzID0gY3MuY29uY2F0IHZjXG5cbiAgICAgICAgaHRtbCA9IHJlbmRlci5jdXJzb3JzIGNzLCBAc2l6ZVxuICAgICAgICBAbGF5ZXJEaWN0LmN1cnNvcnMuaW5uZXJIVE1MID0gaHRtbFxuICAgICAgICBcbiAgICAgICAgdHkgPSAobWNbMV0gLSBAc2Nyb2xsLnRvcCkgKiBAc2l6ZS5saW5lSGVpZ2h0XG4gICAgICAgIFxuICAgICAgICBpZiBAY3Vyc29yTGluZVxuICAgICAgICAgICAgQGN1cnNvckxpbmUuc3R5bGUgPSBcInotaW5kZXg6MDt0cmFuc2Zvcm06dHJhbnNsYXRlM2QoMCwje3R5fXB4LDApOyBoZWlnaHQ6I3tAc2l6ZS5saW5lSGVpZ2h0fXB4O1wiXG4gICAgICAgICAgICBAbGF5ZXJzLmluc2VydEJlZm9yZSBAY3Vyc29yTGluZSwgQGxheWVycy5maXJzdENoaWxkXG5cbiAgICByZW5kZXJTZWxlY3Rpb246IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgcyA9IEBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgIGlmIHNcbiAgICAgICAgICAgIGggKz0gcmVuZGVyLnNlbGVjdGlvbiBzLCBAc2l6ZVxuICAgICAgICBAbGF5ZXJEaWN0LnNlbGVjdGlvbnMuaW5uZXJIVE1MID0gaFxuXG4gICAgcmVuZGVySGlnaGxpZ2h0czogLT5cblxuICAgICAgICBoID0gXCJcIlxuICAgICAgICBzID0gQGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleCBbQHNjcm9sbC50b3AsIEBzY3JvbGwuYm90XSwgQHNjcm9sbC50b3BcbiAgICAgICAgaWYgc1xuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplLCBcImhpZ2hsaWdodFwiXG4gICAgICAgIEBsYXllckRpY3QuaGlnaGxpZ2h0cy5pbm5lckhUTUwgPSBoXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGN1cnNvckRpdjogLT4gJCAnLmN1cnNvci5tYWluJyBAbGF5ZXJEaWN0WydjdXJzb3JzJ11cblxuICAgIHN1c3BlbmRCbGluazogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBibGlua1RpbWVyXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JyBbODAwLDIwMF1cbiAgICAgICAgQHN1c3BlbmRUaW1lciA9IHNldFRpbWVvdXQgQHJlbGVhc2VCbGluaywgYmxpbmtEZWxheVswXVxuXG4gICAgcmVsZWFzZUJsaW5rOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGRlbGV0ZSBAc3VzcGVuZFRpbWVyXG4gICAgICAgIEBzdGFydEJsaW5rKClcblxuICAgIHRvZ2dsZUJsaW5rOiAtPlxuXG4gICAgICAgIGJsaW5rID0gbm90IHByZWZzLmdldCAnYmxpbmsnIGZhbHNlXG4gICAgICAgIHByZWZzLnNldCAnYmxpbmsnIGJsaW5rXG4gICAgICAgIGlmIGJsaW5rXG4gICAgICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdG9wQmxpbmsoKVxuXG4gICAgZG9CbGluazogPT5cblxuICAgICAgICBAYmxpbmsgPSBub3QgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBAYmxpbmtcbiAgICAgICAgQG1pbmltYXA/LmRyYXdNYWluQ3Vyc29yIEBibGlua1xuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAYmxpbmtUaW1lciA9IHNldFRpbWVvdXQgQGRvQmxpbmssIEBibGluayBhbmQgYmxpbmtEZWxheVsxXSBvciBibGlua0RlbGF5WzBdXG5cbiAgICBzdGFydEJsaW5rOiAtPiBcbiAgICBcbiAgICAgICAgaWYgbm90IEBibGlua1RpbWVyIGFuZCBwcmVmcy5nZXQgJ2JsaW5rJ1xuICAgICAgICAgICAgQGRvQmxpbmsoKSBcblxuICAgIHN0b3BCbGluazogLT5cblxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGRlbGV0ZSBAYmxpbmtUaW1lclxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXNpemVkOiAtPlxuXG4gICAgICAgIHZoID0gQHZpZXcuY2xpZW50SGVpZ2h0XG5cbiAgICAgICAgcmV0dXJuIGlmIHZoID09IEBzY3JvbGwudmlld0hlaWdodFxuXG4gICAgICAgIEBudW1iZXJzPy5lbGVtLnN0eWxlLmhlaWdodCA9IFwiI3tAc2Nyb2xsLmV4cG9zZU51bSAqIEBzY3JvbGwubGluZUhlaWdodH1weFwiXG4gICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCB2aFxuXG4gICAgICAgIEBlbWl0ICd2aWV3SGVpZ2h0JyB2aFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBwb3NBdFhZOih4LHkpIC0+XG5cbiAgICAgICAgc2wgPSBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdFxuICAgICAgICBzdCA9IEBzY3JvbGwub2Zmc2V0VG9wXG4gICAgICAgIGJyID0gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHggPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldFdpZHRoLCAgeCAtIGJyLmxlZnQgLSBAc2l6ZS5vZmZzZXRYICsgQHNpemUuY2hhcldpZHRoLzNcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldEhlaWdodCwgeSAtIGJyLnRvcFxuICAgICAgICBweCA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHNsICsgbHgpKS9Ac2l6ZS5jaGFyV2lkdGgpKVxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHN0ICsgbHkpKS9Ac2l6ZS5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBwICA9IFtweCwgTWF0aC5taW4oQG51bUxpbmVzKCktMSwgcHkpXVxuICAgICAgICBwXG5cbiAgICBwb3NGb3JFdmVudDogKGV2ZW50KSAtPiBAcG9zQXRYWSBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZXG5cbiAgICBsaW5lRWxlbUF0WFk6KHgseSkgLT5cblxuICAgICAgICBwID0gQHBvc0F0WFkgeCx5XG4gICAgICAgIEBsaW5lRGl2c1twWzFdXVxuXG4gICAgbGluZVNwYW5BdFhZOih4LHkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lRWxlbSA9IEBsaW5lRWxlbUF0WFkgeCx5XG4gICAgICAgICAgICBsciA9IGxpbmVFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICBmb3IgZSBpbiBsaW5lRWxlbS5maXJzdENoaWxkLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgYnIgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICAgICAgaWYgYnIubGVmdCA8PSB4IDw9IGJyLmxlZnQrYnIud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0geC1ici5sZWZ0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzcGFuOmUsIG9mZnNldExlZnQ6b2Zmc2V0LCBvZmZzZXRDaGFyOnBhcnNlSW50IG9mZnNldC9Ac2l6ZS5jaGFyV2lkdGhcbiAgICAgICAgbnVsbFxuXG4gICAgbnVtRnVsbExpbmVzOiAtPiBAc2Nyb2xsLmZ1bGxMaW5lc1xuICAgIFxuICAgIHZpZXdIZWlnaHQ6IC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgQHNjcm9sbD8udmlld0hlaWdodCA+PSAwIHRoZW4gcmV0dXJuIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICBAdmlldz8uY2xpZW50SGVpZ2h0XG5cbiAgICBjbGVhckxpbmVzOiA9PlxuXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBlbWl0ICdjbGVhckxpbmVzJ1xuXG4gICAgY2xlYXI6ID0+IFxuICAgICAgICBAc2V0TGluZXMgW11cblxuICAgIGZvY3VzOiAtPiBAdmlldy5mb2N1cygpXG5cbiAgICAjICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIGluaXREcmFnOiAtPlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBsYXllclNjcm9sbFxuXG4gICAgICAgICAgICBvblN0YXJ0OiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHZpZXcuZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBldmVudFBvcyA9IEBwb3NGb3JFdmVudCBldmVudFxuXG4gICAgICAgICAgICAgICAgaWYgZXZlbnQuYnV0dG9uID09IDJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgZXZlbnQuYnV0dG9uID09IDFcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IEBqdW1wVG9GaWxlQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIEBqdW1wVG9Xb3JkQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudFxuICAgICAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgZXZlbnRQb3MsIEBjbGlja1Bvc1xuICAgICAgICAgICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudCA9PSAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5IG9yIEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZFJhbmdlVG9TZWxlY3Rpb24gcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBoaWdobGlnaHRXb3JkQW5kQWRkVG9TZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBjbGVhckhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JMaW5lQXRJbmRleCBAY2xpY2tQb3NbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQG9uQ2xpY2tUaW1lb3V0KClcblxuICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ID0gMVxuICAgICAgICAgICAgICAgIEBjbGlja1BvcyA9IGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG5cbiAgICAgICAgICAgICAgICBwID0gQHBvc0ZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgQGNsaWNrQXRQb3MgcCwgZXZlbnRcblxuICAgICAgICAgICAgb25Nb3ZlOiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgICAgICAgICAgQGFkZEN1cnNvckF0UG9zIFtAbWFpbkN1cnNvcigpWzBdLCBwWzFdXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDp0cnVlXG5cbiAgICAgICAgICAgIG9uU3RvcDogPT5cbiAgICAgICAgICAgICAgICBAc2VsZWN0Tm9uZSgpIGlmIEBudW1TZWxlY3Rpb25zKCkgYW5kIGVtcHR5IEB0ZXh0T2ZTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBzdGFydENsaWNrVGltZXI6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja1RpbWVyID0gc2V0VGltZW91dCBAb25DbGlja1RpbWVvdXQsIEBzdGlja3lTZWxlY3Rpb24gYW5kIDMwMCBvciAxMDAwXG5cbiAgICBvbkNsaWNrVGltZW91dDogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQGNsaWNrVGltZXJcbiAgICAgICAgQGNsaWNrQ291bnQgID0gMFxuICAgICAgICBAY2xpY2tUaW1lciAgPSBudWxsXG4gICAgICAgIEBjbGlja1BvcyAgICA9IG51bGxcblxuICAgIGZ1bmNJbmZvQXRMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnIEBjdXJyZW50RmlsZVxuICAgICAgICBmaWxlSW5mbyA9IGZpbGVzW0BjdXJyZW50RmlsZV1cbiAgICAgICAgZm9yIGZ1bmMgaW4gZmlsZUluZm8uZnVuY3NcbiAgICAgICAgICAgIGlmIGZ1bmMubGluZSA8PSBsaSA8PSBmdW5jLmxhc3RcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jbGFzcyArICcuJyArIGZ1bmMubmFtZSArICcgJ1xuICAgICAgICAnJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNsaWNrQXRQb3M6IChwLCBldmVudCkgLT5cblxuICAgICAgICBpZiBldmVudC5hbHRLZXlcbiAgICAgICAgICAgIEB0b2dnbGVDdXJzb3JBdFBvcyBwXG4gICAgICAgIGVsc2UgaWYgZXZlbnQubWV0YUtleSBvciBldmVudC5jdHJsS2V5XG4gICAgICAgICAgICBAanVtcFRvV29yZEF0UG9zIHBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDpldmVudC5zaGlmdEtleVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGF1dG9jb21wbGV0ZT9cbiAgICAgICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAYXV0b2NvbXBsZXRlLmhhbmRsZU1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnIHRoZW4gcmV0dXJuICd1bmhhbmRsZWQnICMgaGFzIGNoYXIgc2V0IG9uIHdpbmRvd3M/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICAgICAgICAgIEBjbGVhckhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgICAgIEBjbGVhckN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgIEBzZWxlY3ROb25lKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAjIGlmIEBzYWx0ZXJNb2RlICAgICAgICAgIHRoZW4gcmV0dXJuIEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgICAgICAgICAgICAgIyBpZiBAbnVtSGlnaGxpZ2h0cygpICAgICB0aGVuIHJldHVybiBAY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICAjIGlmIEBudW1DdXJzb3JzKCkgPiAxICAgIHRoZW4gcmV0dXJuIEBjbGVhckN1cnNvcnMoKVxuICAgICAgICAgICAgICAgICMgaWYgQHN0aWNreVNlbGVjdGlvbiAgICAgdGhlbiByZXR1cm4gQGVuZFN0aWNreVNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgIyBpZiBAbnVtU2VsZWN0aW9ucygpICAgICB0aGVuIHJldHVybiBAc2VsZWN0Tm9uZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZW50ZXInICdjdHJsK2VudGVyJyAnZjEyJyB0aGVuIEBqdW1wVG9Xb3JkKClcblxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbi5jb21ibyA9PSBjb21ibyBvciBhY3Rpb24uYWNjZWwgPT0gY29tYm9cbiAgICAgICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnY3RybCthJyAnY29tbWFuZCthJyB0aGVuIHJldHVybiBAc2VsZWN0QWxsKClcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbi5hY2NlbHM/IGFuZCBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nXG4gICAgICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5hY2NlbHNcbiAgICAgICAgICAgICAgICAgICAgaWYgY29tYm8gPT0gYWN0aW9uQ29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBhY3Rpb24uY29tYm9zP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgYWN0aW9uQ29tYm8gaW4gYWN0aW9uLmNvbWJvc1xuICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgY2hhciBhbmQgbW9kIGluIFtcInNoaWZ0XCIsIFwiXCJdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBAaW5zZXJ0Q2hhcmFjdGVyIGNoYXJcblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgb25LZXlEb3duOiAoZXZlbnQpID0+XG5cbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICByZXR1cm4gaWYgbm90IGNvbWJvXG4gICAgICAgIHJldHVybiBpZiBrZXkgPT0gJ3JpZ2h0IGNsaWNrJyAjIHdlaXJkIHJpZ2h0IGNvbW1hbmQga2V5XG5cbiAgICAgICAgcmVzdWx0ID0gQGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcblxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSByZXN1bHRcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgbG9nOiAtPlxuICAgICAgICByZXR1cm4gaWYgQG5hbWUgIT0gJ2VkaXRvcidcbiAgICAgICAga2xvZy5zbG9nLmRlcHRoID0gM1xuICAgICAgICBrbG9nLmFwcGx5IGtsb2csIFtdLnNwbGljZS5jYWxsIGFyZ3VtZW50cywgMFxuICAgICAgICBrbG9nLnNsb2cuZGVwdGggPSAyXG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dEVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/texteditor.coffee