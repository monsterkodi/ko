// koffee 1.4.0

/*
000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000
 */
var $, Editor, EditorScroll, TextEditor, _, clamp, drag, electron, elem, empty, jsbeauty, kerror, keyinfo, klog, os, post, prefs, ref, render, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, prefs = ref.prefs, clamp = ref.clamp, empty = ref.empty, elem = ref.elem, drag = ref.drag, os = ref.os, kerror = ref.kerror, klog = ref.klog, $ = ref.$, _ = ref._;

render = require('./render');

EditorScroll = require('./editorscroll');

Editor = require('./editor');

jsbeauty = require('js-beautify');

electron = require('electron');

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
        this.clickCount = 0;
        this.view = $(viewElem);
        this.layers = elem({
            "class": "layers"
        });
        this.layerScroll = elem({
            "class": "layerScroll",
            child: this.layers
        });
        this.view.appendChild(this.layerScroll);
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
            this.size.offsetX = Math.max(this.size.offsetX, (this.screenSize().width - this.screenSize().height) / 2);
        }
        if ((ref1 = this.scroll) != null) {
            ref1.setLineHeight(this.size.lineHeight);
        }
        return this.emit('fontSizeChanged');
    };

    TextEditor.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, ref1, ref2;
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
            this.scroll.setNumLines(this.numLines());
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
        this.emit('linesExposed', {
            top: top,
            bot: bot,
            num: num
        });
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
            if (div == null) {
                return kerror('no div?', li);
            }
            if (div.style == null) {
                return kerror('no div.style?', li, _.isElement(div), typeof div);
            }
            y = this.size.lineHeight * (li - this.scroll.top);
            div.style.transform = "translate3d(" + this.size.offsetX + "px," + y + "px, 0)";
            if (animate) {
                div.style.transition = "all " + (animate / 1000) + "s";
            }
            div.style.zIndex = li;
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

    TextEditor.prototype.screenSize = function() {
        return electron.remote.screen.getPrimaryDisplay().workAreaSize;
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
                if (this.salterMode) {
                    return this.setSalterMode(false);
                }
                if (this.numHighlights()) {
                    return this.clearHighlights();
                }
                if (this.numCursors() > 1) {
                    return this.clearCursors();
                }
                if (this.stickySelection) {
                    return this.endStickySelection();
                }
                if (this.numSelections()) {
                    return this.selectNone();
                }
                break;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3RixPQUFBLENBQVEsS0FBUixDQUF4RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsaUJBQTVCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsZUFBdkQsRUFBNkQsV0FBN0QsRUFBaUUsbUJBQWpFLEVBQXlFLGVBQXpFLEVBQStFLFNBQS9FLEVBQWtGOztBQUVsRixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxhQUFSOztBQUNmLFFBQUEsR0FBZSxPQUFBLENBQVEsVUFBUjs7QUFFVDs7O0lBRUMsb0JBQUMsUUFBRCxFQUFXLE1BQVg7Ozs7Ozs7Ozs7Ozs7O0FBRUMsWUFBQTtRQUFBLElBQUEsR0FBTztRQUNQLElBQXVCLElBQUssQ0FBQSxDQUFBLENBQUwsS0FBVyxHQUFsQztZQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsRUFBUDs7UUFFQSw0Q0FBTSxJQUFOLEVBQVksTUFBWjtRQUVBLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFFZCxJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxRQUFGO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBZSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFFBQVA7U0FBTDtRQUNmLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO1lBQXNCLEtBQUEsRUFBTyxJQUFDLENBQUEsTUFBOUI7U0FBTDtRQUNmLElB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RVQsSUFBRyxXQUFBLEtBQWUsTUFBbEI7bUJBQ0ksU0FBQSxDQUFVLEtBQVYsRUFESjs7SUFUTzs7eUJBWVgsR0FBQSxHQUFLLFNBQUE7UUFDRCxJQUFVLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBbkI7QUFBQSxtQkFBQTs7UUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQVYsR0FBa0I7UUFDbEIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBVixDQUFlLFNBQWYsRUFBMEIsQ0FBMUIsQ0FBakI7ZUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQVYsR0FBa0I7SUFKakI7Ozs7R0FudkJnQjs7QUF5dkJ6QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBrZXlpbmZvLCBwcmVmcywgY2xhbXAsIGVtcHR5LCBlbGVtLCBkcmFnLCBvcywga2Vycm9yLCBrbG9nLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG4gIFxucmVuZGVyICAgICAgID0gcmVxdWlyZSAnLi9yZW5kZXInXG5FZGl0b3JTY3JvbGwgPSByZXF1aXJlICcuL2VkaXRvcnNjcm9sbCdcbkVkaXRvciAgICAgICA9IHJlcXVpcmUgJy4vZWRpdG9yJ1xuanNiZWF1dHkgICAgID0gcmVxdWlyZSAnanMtYmVhdXRpZnknXG5lbGVjdHJvbiAgICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgVGV4dEVkaXRvciBleHRlbmRzIEVkaXRvclxuXG4gICAgQDogKHZpZXdFbGVtLCBjb25maWcpIC0+XG5cbiAgICAgICAgbmFtZSA9IHZpZXdFbGVtXG4gICAgICAgIG5hbWUgPSBuYW1lLnNsaWNlIDEgaWYgbmFtZVswXSA9PSAnLidcblxuICAgICAgICBzdXBlciBuYW1lLCBjb25maWdcblxuICAgICAgICBAY2xpY2tDb3VudCA9IDBcblxuICAgICAgICBAdmlldyA9JCB2aWV3RWxlbVxuXG4gICAgICAgIEBsYXllcnMgICAgICA9IGVsZW0gY2xhc3M6IFwibGF5ZXJzXCJcbiAgICAgICAgQGxheWVyU2Nyb2xsID0gZWxlbSBjbGFzczogXCJsYXllclNjcm9sbFwiLCBjaGlsZDogQGxheWVyc1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAbGF5ZXJTY3JvbGxcblxuICAgICAgICBsYXllciA9IFtdXG4gICAgICAgIGxheWVyLnB1c2ggJ3NlbGVjdGlvbnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2hpZ2hsaWdodHMnXG4gICAgICAgIGxheWVyLnB1c2ggJ21ldGEnICAgIGlmICdNZXRhJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIGxheWVyLnB1c2ggJ2xpbmVzJ1xuICAgICAgICBsYXllci5wdXNoICdjdXJzb3JzJ1xuICAgICAgICBsYXllci5wdXNoICdudW1iZXJzJyBpZiAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBAaW5pdExheWVycyBsYXllclxuXG4gICAgICAgIEBzaXplID0ge31cbiAgICAgICAgQGVsZW0gPSBAbGF5ZXJEaWN0LmxpbmVzXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdICMgY2FjaGUgZm9yIHJlbmRlcmVkIGxpbmUgc3BhbnNcbiAgICAgICAgQGxpbmVEaXZzICA9IHt9ICMgbWFwcyBsaW5lIG51bWJlcnMgdG8gZGlzcGxheWVkIGRpdnNcblxuICAgICAgICBAY29uZmlnLmxpbmVIZWlnaHQgPz0gMS4yXG5cbiAgICAgICAgQHNldEZvbnRTaXplIHByZWZzLmdldCBcIiN7QG5hbWV9Rm9udFNpemVcIiwgQGNvbmZpZy5mb250U2l6ZSA/IDE5XG4gICAgICAgIEBzY3JvbGwgPSBuZXcgRWRpdG9yU2Nyb2xsIEBcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hpZnRMaW5lcycgQHNoaWZ0TGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hvd0xpbmVzJyAgQHNob3dMaW5lc1xuXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInICAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uS2V5RG93blxuXG4gICAgICAgIEBpbml0RHJhZygpICAgICAgICBcblxuICAgICAgICBmb3IgZmVhdHVyZSBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgICAgICBpZiBmZWF0dXJlID09ICdDdXJzb3JMaW5lJ1xuICAgICAgICAgICAgICAgIEBjdXJzb3JMaW5lID0gZWxlbSAnZGl2JyBjbGFzczonY3Vyc29yLWxpbmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmVhdHVyZU5hbWUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBmZWF0dXJlQ2xzcyA9IHJlcXVpcmUgXCIuLyN7ZmVhdHVyZU5hbWV9XCJcbiAgICAgICAgICAgICAgICBAW2ZlYXR1cmVOYW1lXSA9IG5ldyBmZWF0dXJlQ2xzcyBAXG5cbiAgICAgICAgcG9zdC5vbiAnc2NoZW1lQ2hhbmdlZCcgQG9uU2NoZW1lQ2hhbmdlZFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGRlbDogLT5cblxuICAgICAgICBwb3N0LnJlbW92ZUxpc3RlbmVyICdzY2hlbWVDaGFuZ2VkJyBAb25TY2hlbWVDaGFuZ2VkXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsYmFyPy5kZWwoKVxuXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2tleWRvd24nIEBvbktleURvd25cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdmb2N1cycgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIG9uRm9jdXM6ID0+XG5cbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBAZW1pdCAnZm9jdXMnIEBcbiAgICAgICAgcG9zdC5lbWl0ICdlZGl0b3JGb2N1cycgQFxuXG4gICAgb25CbHVyOiA9PlxuXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAZW1pdCAnYmx1cicgQFxuXG4gICAgb25TY2hlbWVDaGFuZ2VkOiA9PlxuXG4gICAgICAgIEBzeW50YXg/LnNjaGVtZUNoYW5nZWQoKVxuICAgICAgICBpZiBAbWluaW1hcFxuICAgICAgICAgICAgdXBkYXRlTWluaW1hcCA9ID0+IEBtaW5pbWFwPy5kcmF3TGluZXMoKVxuICAgICAgICAgICAgc2V0VGltZW91dCB1cGRhdGVNaW5pbWFwLCAxMFxuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMDAwMDAwMCAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0TGF5ZXJzOiAobGF5ZXJDbGFzc2VzKSAtPlxuXG4gICAgICAgIEBsYXllckRpY3QgPSB7fVxuICAgICAgICBmb3IgY2xzIGluIGxheWVyQ2xhc3Nlc1xuICAgICAgICAgICAgQGxheWVyRGljdFtjbHNdID0gQGFkZExheWVyIGNsc1xuXG4gICAgYWRkTGF5ZXI6IChjbHMpIC0+XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogY2xzXG4gICAgICAgIEBsYXllcnMuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgIGRpdlxuXG4gICAgdXBkYXRlTGF5ZXJzOiAoKSAtPlxuXG4gICAgICAgIEByZW5kZXJIaWdobGlnaHRzKClcbiAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgIEByZW5kZXJDdXJzb3JzKClcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBjbGVhckxpbmVzKClcblxuICAgICAgICBsaW5lcyA/PSBbXVxuXG4gICAgICAgIEBzcGFuQ2FjaGUgPSBbXVxuICAgICAgICBAbGluZURpdnMgID0ge31cblxuICAgICAgICBzdXBlciBsaW5lc1xuXG4gICAgICAgIEBzY3JvbGwucmVzZXQoKVxuXG4gICAgICAgIHZpZXdIZWlnaHQgPSBAdmlld0hlaWdodCgpXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnN0YXJ0IHZpZXdIZWlnaHQsIEBudW1MaW5lcygpXG5cbiAgICAgICAgQGxheWVyU2Nyb2xsLnNjcm9sbExlZnQgPSAwXG4gICAgICAgIEBsYXllcnNXaWR0aCAgPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcbiAgICAgICAgQGxheWVyc0hlaWdodCA9IEBsYXllclNjcm9sbC5vZmZzZXRIZWlnaHRcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYXBwZW5kVGV4dDogKHRleHQpIC0+XG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5hcHBlbmRUZXh0IC0gbm8gdGV4dD9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgYXBwZW5kZWQgPSBbXVxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5hcHBlbmRMaW5lIGxcbiAgICAgICAgICAgIGFwcGVuZGVkLnB1c2ggQG51bUxpbmVzKCktMVxuXG4gICAgICAgIGlmIEBzY3JvbGwudmlld0hlaWdodCAhPSBAdmlld0hlaWdodCgpXG4gICAgICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgQHZpZXdIZWlnaHQoKVxuXG4gICAgICAgIHNob3dMaW5lcyA9IChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudG9wKSBvciAoQHNjcm9sbC5ib3QgPCBAc2Nyb2xsLnZpZXdMaW5lcylcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpLCBzaG93TGluZXM6c2hvd0xpbmVzXG5cbiAgICAgICAgZm9yIGxpIGluIGFwcGVuZGVkXG4gICAgICAgICAgICBAZW1pdCAnbGluZUFwcGVuZGVkJyxcbiAgICAgICAgICAgICAgICBsaW5lSW5kZXg6IGxpXG4gICAgICAgICAgICAgICAgdGV4dDogQGxpbmUgbGlcblxuICAgICAgICBAZW1pdCAnbGluZXNBcHBlbmRlZCcgbHNcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyBAbnVtTGluZXMoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHNldEZvbnRTaXplOiAoZm9udFNpemUpID0+XG4gICAgICAgIFxuICAgICAgICBAbGF5ZXJzLnN0eWxlLmZvbnRTaXplID0gXCIje2ZvbnRTaXplfXB4XCJcbiAgICAgICAgQHNpemUubnVtYmVyc1dpZHRoID0gJ051bWJlcnMnIGluIEBjb25maWcuZmVhdHVyZXMgYW5kIDUwIG9yIDBcbiAgICAgICAgQHNpemUuZm9udFNpemUgICAgID0gZm9udFNpemVcbiAgICAgICAgQHNpemUubGluZUhlaWdodCAgID0gTWF0aC5mbG9vciBmb250U2l6ZSAqIEBjb25maWcubGluZUhlaWdodFxuICAgICAgICBAc2l6ZS5jaGFyV2lkdGggICAgPSBmb250U2l6ZSAqIDAuNlxuICAgICAgICBAc2l6ZS5vZmZzZXRYICAgICAgPSBNYXRoLmZsb29yIEBzaXplLmNoYXJXaWR0aC8yICsgQHNpemUubnVtYmVyc1dpZHRoXG4gICAgICAgIEBzaXplLm9mZnNldFggICAgICA9IE1hdGgubWF4IEBzaXplLm9mZnNldFgsIChAc2NyZWVuU2l6ZSgpLndpZHRoIC0gQHNjcmVlblNpemUoKS5oZWlnaHQpIC8gMiBpZiBAc2l6ZS5jZW50ZXJUZXh0XG5cbiAgICAgICAgQHNjcm9sbD8uc2V0TGluZUhlaWdodCBAc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgQGVtaXQgJ2ZvbnRTaXplQ2hhbmdlZCcgIyBudW1iZXJzXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgQHN5bnRheC5jaGFuZ2VkIGNoYW5nZUluZm9cblxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgW2RpLGxpLGNoXSA9IFtjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLm5ld0luZGV4LCBjaGFuZ2UuY2hhbmdlXVxuICAgICAgICAgICAgc3dpdGNoIGNoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCdcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGksIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lQ2hhbmdlZCcgbGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVEZWxldGVkJyBkaVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdpbnNlcnRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVJbnNlcnRlZCcgbGksIGRpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5pbnNlcnRzIG9yIGNoYW5nZUluZm8uZGVsZXRlc1xuICAgICAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpXG4gICAgICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG4gICAgICAgICAgICBAcmVuZGVyQ3Vyc29ycygpXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcbiAgICAgICAgICAgIEBlbWl0ICdjdXJzb3InXG4gICAgICAgICAgICBAc3VzcGVuZEJsaW5rKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgICAgIEByZW5kZXJTZWxlY3Rpb24oKVxuICAgICAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICAgICBAZW1pdCAnY2hhbmdlZCcgY2hhbmdlSW5mb1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmU6IChsaSwgb2kpIC0+XG5cbiAgICAgICAgb2kgPSBsaSBpZiBub3Qgb2k/XG5cbiAgICAgICAgaWYgbGkgPCBAc2Nyb2xsLnRvcCBvciBsaSA+IEBzY3JvbGwuYm90XG4gICAgICAgICAgICBrZXJyb3IgXCJkYW5nbGluZyBsaW5lIGRpdj8gI3tsaX1cIiwgQGxpbmVEaXZzW2xpXSBpZiBAbGluZURpdnNbbGldP1xuICAgICAgICAgICAgZGVsZXRlIEBzcGFuQ2FjaGVbbGldXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwidXBkYXRlTGluZSAtIG91dCBvZiBib3VuZHM/IGxpICN7bGl9IG9pICN7b2l9XCIgaWYgbm90IEBsaW5lRGl2c1tvaV1cblxuICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuXG4gICAgICAgIGRpdiA9IEBsaW5lRGl2c1tvaV1cbiAgICAgICAgZGl2LnJlcGxhY2VDaGlsZCBAc3BhbkNhY2hlW2xpXSwgZGl2LmZpcnN0Q2hpbGRcbiAgICAgICAgXG4gICAgcmVmcmVzaExpbmVzOiAodG9wLCBib3QpIC0+XG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAc3ludGF4LmdldERpc3MgbGksIHRydWVcbiAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNob3dMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgQGxpbmVEaXZzID0ge31cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcblxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQGFwcGVuZExpbmUgbGlcblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgICBAZW1pdCAnbGluZXNFeHBvc2VkJyB0b3A6dG9wLCBib3Q6Ym90LCBudW06bnVtXG4gICAgICAgIEBlbWl0ICdsaW5lc1Nob3duJyB0b3AsIGJvdCwgbnVtXG5cbiAgICBhcHBlbmRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgQGxpbmVEaXZzW2xpXSA9IGVsZW0gY2xhc3M6ICdsaW5lJ1xuICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIEBjYWNoZWRTcGFuIGxpXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lRGl2c1tsaV1cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hpZnRMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5zaGlmdExpbmVzLmRpdkludG8gLSBubyBkaXY/ICN7dG9wfSAje2JvdH0gI3tudW19IG9sZCAje29sZFRvcH0gI3tvbGRCb3R9IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBAbGluZURpdnNbbGldLnJlcGxhY2VDaGlsZCBAY2FjaGVkU3BhbihsaSksIEBsaW5lRGl2c1tsaV0uZmlyc3RDaGlsZFxuXG4gICAgICAgICAgICBpZiBAc2hvd0ludmlzaWJsZXNcbiAgICAgICAgICAgICAgICB0eCA9IEBsaW5lKGxpKS5sZW5ndGggKiBAc2l6ZS5jaGFyV2lkdGggKyAxXG4gICAgICAgICAgICAgICAgc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOiBcImludmlzaWJsZSBuZXdsaW5lXCIsIGh0bWw6ICcmIzk2ODcnXG4gICAgICAgICAgICAgICAgc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgje3R4fXB4LCAtMS41cHgpXCJcbiAgICAgICAgICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIHNwYW5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICB3aGlsZSBvbGRCb3QgPCBib3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgKz0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkQm90LCBvbGRUb3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgKz0gMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBvbGRUb3AgPiB0b3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgLT0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkVG9wLCBvbGRCb3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgLT0gMVxuXG4gICAgICAgIEBlbWl0ICdsaW5lc1NoaWZ0ZWQnIHRvcCwgYm90LCBudW1cblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmVQb3NpdGlvbnM6IChhbmltYXRlPTApIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbGksIGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGlmIG5vdCBkaXY/IFxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIGRpdj8nIGxpXG4gICAgICAgICAgICBpZiBub3QgZGl2LnN0eWxlP1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIGRpdi5zdHlsZT8nIGxpLCBfLmlzRWxlbWVudChkaXYpLCB0eXBlb2YgZGl2XG4gICAgICAgICAgICB5ID0gQHNpemUubGluZUhlaWdodCAqIChsaSAtIEBzY3JvbGwudG9wKVxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoI3tAc2l6ZS5vZmZzZXRYfXB4LCN7eX1weCwgMClcIlxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zaXRpb24gPSBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgZGl2LnN0eWxlLnpJbmRleCA9IGxpXG5cbiAgICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGVsZW0uY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2l0aW9uID0gJ2luaXRpYWwnXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcblxuICAgIHVwZGF0ZUxpbmVzOiAoKSAtPlxuXG4gICAgICAgIGZvciBsaSBpbiBbQHNjcm9sbC50b3AuLkBzY3JvbGwuYm90XVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcblxuICAgIGNsZWFySGlnaGxpZ2h0czogKCkgLT5cblxuICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAkKCcuaGlnaGxpZ2h0cycgQGxheWVycykuaW5uZXJIVE1MID0gJydcbiAgICAgICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjYWNoZWRTcGFuOiAobGkpIC0+XG5cbiAgICAgICAgaWYgbm90IEBzcGFuQ2FjaGVbbGldXG5cbiAgICAgICAgICAgIEBzcGFuQ2FjaGVbbGldID0gcmVuZGVyLmxpbmVTcGFuIEBzeW50YXguZ2V0RGlzcyhsaSksIEBzaXplXG5cbiAgICAgICAgQHNwYW5DYWNoZVtsaV1cblxuICAgIHJlbmRlckN1cnNvcnM6IC0+XG5cbiAgICAgICAgY3MgPSBbXVxuICAgICAgICBmb3IgYyBpbiBAY3Vyc29ycygpXG4gICAgICAgICAgICBpZiBjWzFdID49IEBzY3JvbGwudG9wIGFuZCBjWzFdIDw9IEBzY3JvbGwuYm90XG4gICAgICAgICAgICAgICAgY3MucHVzaCBbY1swXSwgY1sxXSAtIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcblxuICAgICAgICBpZiBAbnVtQ3Vyc29ycygpID09IDFcblxuICAgICAgICAgICAgaWYgY3MubGVuZ3RoID09IDFcblxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBtY1sxXSA8IDBcblxuICAgICAgICAgICAgICAgIGlmIG1jWzFdID4gQG51bUxpbmVzKCktMVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiI3tAbmFtZX0ucmVuZGVyQ3Vyc29ycyBtYWluQ3Vyc29yIERBRlVLP1wiLCBAbnVtTGluZXMoKSwgc3RyIEBtYWluQ3Vyc29yKClcblxuICAgICAgICAgICAgICAgIHJpID0gbWNbMV0tQHNjcm9sbC50b3BcbiAgICAgICAgICAgICAgICBjdXJzb3JMaW5lID0gQHN0YXRlLmxpbmUobWNbMV0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbWFpbiBjdXJzb3IgbGluZT8nIGlmIG5vdCBjdXJzb3JMaW5lP1xuICAgICAgICAgICAgICAgIGlmIG1jWzBdID4gY3Vyc29yTGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAndmlydHVhbCdcbiAgICAgICAgICAgICAgICAgICAgY3MucHVzaCBbY3Vyc29yTGluZS5sZW5ndGgsIHJpLCAnbWFpbiBvZmYnXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAnbWFpbiBvZmYnXG5cbiAgICAgICAgZWxzZSBpZiBAbnVtQ3Vyc29ycygpID4gMVxuXG4gICAgICAgICAgICB2YyA9IFtdICMgdmlydHVhbCBjdXJzb3JzXG4gICAgICAgICAgICBmb3IgYyBpbiBjc1xuICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBAbWFpbkN1cnNvcigpLCBbY1swXSwgY1sxXSArIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgICAgICBjWzJdID0gJ21haW4nXG4gICAgICAgICAgICAgICAgbGluZSA9IEBsaW5lKEBzY3JvbGwudG9wK2NbMV0pXG4gICAgICAgICAgICAgICAgaWYgY1swXSA+IGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHZjLnB1c2ggW2xpbmUubGVuZ3RoLCBjWzFdLCAndmlydHVhbCddXG4gICAgICAgICAgICBjcyA9IGNzLmNvbmNhdCB2Y1xuXG4gICAgICAgIGh0bWwgPSByZW5kZXIuY3Vyc29ycyBjcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5jdXJzb3JzLmlubmVySFRNTCA9IGh0bWxcbiAgICAgICAgXG4gICAgICAgIHR5ID0gKG1jWzFdIC0gQHNjcm9sbC50b3ApICogQHNpemUubGluZUhlaWdodFxuICAgICAgICBcbiAgICAgICAgaWYgQGN1cnNvckxpbmVcbiAgICAgICAgICAgIEBjdXJzb3JMaW5lLnN0eWxlID0gXCJ6LWluZGV4OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZTNkKDAsI3t0eX1weCwwKTsgaGVpZ2h0OiN7QHNpemUubGluZUhlaWdodH1weDtcIlxuICAgICAgICAgICAgQGxheWVycy5pbnNlcnRCZWZvcmUgQGN1cnNvckxpbmUsIEBsYXllcnMuZmlyc3RDaGlsZFxuXG4gICAgcmVuZGVyU2VsZWN0aW9uOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIHMgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICBpZiBzXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5zZWxlY3Rpb25zLmlubmVySFRNTCA9IGhcblxuICAgIHJlbmRlckhpZ2hsaWdodHM6IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgcyA9IEBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgIGlmIHNcbiAgICAgICAgICAgIGggKz0gcmVuZGVyLnNlbGVjdGlvbiBzLCBAc2l6ZSwgXCJoaWdobGlnaHRcIlxuICAgICAgICBAbGF5ZXJEaWN0LmhpZ2hsaWdodHMuaW5uZXJIVE1MID0gaFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjdXJzb3JEaXY6IC0+ICQgJy5jdXJzb3IubWFpbicgQGxheWVyRGljdFsnY3Vyc29ycyddXG5cbiAgICBzdXNwZW5kQmxpbms6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYmxpbmtUaW1lclxuICAgICAgICBAc3RvcEJsaW5rKClcbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgZmFsc2VcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzdXNwZW5kVGltZXJcbiAgICAgICAgYmxpbmtEZWxheSA9IHByZWZzLmdldCAnY3Vyc29yQmxpbmtEZWxheScgWzgwMCwyMDBdXG4gICAgICAgIEBzdXNwZW5kVGltZXIgPSBzZXRUaW1lb3V0IEByZWxlYXNlQmxpbmssIGJsaW5rRGVsYXlbMF1cblxuICAgIHJlbGVhc2VCbGluazogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBkZWxldGUgQHN1c3BlbmRUaW1lclxuICAgICAgICBAc3RhcnRCbGluaygpXG5cbiAgICB0b2dnbGVCbGluazogLT5cblxuICAgICAgICBibGluayA9IG5vdCBwcmVmcy5nZXQgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBwcmVmcy5zZXQgJ2JsaW5rJyBibGlua1xuICAgICAgICBpZiBibGlua1xuICAgICAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc3RvcEJsaW5rKClcblxuICAgIGRvQmxpbms6ID0+XG5cbiAgICAgICAgQGJsaW5rID0gbm90IEBibGlua1xuICAgICAgICBcbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgQGJsaW5rXG4gICAgICAgIEBtaW5pbWFwPy5kcmF3TWFpbkN1cnNvciBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYmxpbmtUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JyBbODAwLDIwMF1cbiAgICAgICAgQGJsaW5rVGltZXIgPSBzZXRUaW1lb3V0IEBkb0JsaW5rLCBAYmxpbmsgYW5kIGJsaW5rRGVsYXlbMV0gb3IgYmxpbmtEZWxheVswXVxuXG4gICAgc3RhcnRCbGluazogLT4gXG4gICAgXG4gICAgICAgIGlmIG5vdCBAYmxpbmtUaW1lciBhbmQgcHJlZnMuZ2V0ICdibGluaydcbiAgICAgICAgICAgIEBkb0JsaW5rKCkgXG5cbiAgICBzdG9wQmxpbms6IC0+XG5cbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYmxpbmtUaW1lclxuICAgICAgICBkZWxldGUgQGJsaW5rVGltZXJcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgcmVzaXplZDogLT5cblxuICAgICAgICB2aCA9IEB2aWV3LmNsaWVudEhlaWdodFxuXG4gICAgICAgIHJldHVybiBpZiB2aCA9PSBAc2Nyb2xsLnZpZXdIZWlnaHRcblxuICAgICAgICBAbnVtYmVycz8uZWxlbS5zdHlsZS5oZWlnaHQgPSBcIiN7QHNjcm9sbC5leHBvc2VOdW0gKiBAc2Nyb2xsLmxpbmVIZWlnaHR9cHhcIlxuICAgICAgICBAbGF5ZXJzV2lkdGggPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcblxuICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgdmhcblxuICAgICAgICBAZW1pdCAndmlld0hlaWdodCcgdmhcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnJlbW90ZS5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS53b3JrQXJlYVNpemVcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgcG9zQXRYWTooeCx5KSAtPlxuXG4gICAgICAgIHNsID0gQGxheWVyU2Nyb2xsLnNjcm9sbExlZnRcbiAgICAgICAgc3QgPSBAc2Nyb2xsLm9mZnNldFRvcFxuICAgICAgICBiciA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIGx4ID0gY2xhbXAgMCwgQGxheWVycy5vZmZzZXRXaWR0aCwgIHggLSBici5sZWZ0IC0gQHNpemUub2Zmc2V0WCArIEBzaXplLmNoYXJXaWR0aC8zXG4gICAgICAgIGx5ID0gY2xhbXAgMCwgQGxheWVycy5vZmZzZXRIZWlnaHQsIHkgLSBici50b3BcbiAgICAgICAgcHggPSBwYXJzZUludChNYXRoLmZsb29yKChNYXRoLm1heCgwLCBzbCArIGx4KSkvQHNpemUuY2hhcldpZHRoKSlcbiAgICAgICAgcHkgPSBwYXJzZUludChNYXRoLmZsb29yKChNYXRoLm1heCgwLCBzdCArIGx5KSkvQHNpemUubGluZUhlaWdodCkpICsgQHNjcm9sbC50b3BcbiAgICAgICAgcCAgPSBbcHgsIE1hdGgubWluKEBudW1MaW5lcygpLTEsIHB5KV1cbiAgICAgICAgcFxuXG4gICAgcG9zRm9yRXZlbnQ6IChldmVudCkgLT4gQHBvc0F0WFkgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WVxuXG4gICAgbGluZUVsZW1BdFhZOih4LHkpIC0+XG5cbiAgICAgICAgcCA9IEBwb3NBdFhZIHgseVxuICAgICAgICBAbGluZURpdnNbcFsxXV1cblxuICAgIGxpbmVTcGFuQXRYWTooeCx5KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZUVsZW0gPSBAbGluZUVsZW1BdFhZIHgseVxuICAgICAgICAgICAgbHIgPSBsaW5lRWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgZm9yIGUgaW4gbGluZUVsZW0uZmlyc3RDaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGJyID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgICAgIGlmIGJyLmxlZnQgPD0geCA8PSBici5sZWZ0K2JyLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHgtYnIubGVmdFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3BhbjplLCBvZmZzZXRMZWZ0Om9mZnNldCwgb2Zmc2V0Q2hhcjpwYXJzZUludCBvZmZzZXQvQHNpemUuY2hhcldpZHRoXG4gICAgICAgIG51bGxcblxuICAgICMgbnVtRnVsbExpbmVzOiAtPiBNYXRoLmZsb29yKEB2aWV3SGVpZ2h0KCkgLyBAc2l6ZS5saW5lSGVpZ2h0KVxuICAgIG51bUZ1bGxMaW5lczogLT4gQHNjcm9sbC5mdWxsTGluZXNcbiAgICBcbiAgICB2aWV3SGVpZ2h0OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIEBzY3JvbGw/LnZpZXdIZWlnaHQgPj0gMCB0aGVuIHJldHVybiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgQHZpZXc/LmNsaWVudEhlaWdodFxuXG4gICAgY2xlYXJMaW5lczogPT5cblxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAZW1pdCAnY2xlYXJMaW5lcydcblxuICAgIGNsZWFyOiA9PiBcbiAgICAgICAgQHNldExpbmVzIFtdXG5cbiAgICBmb2N1czogLT4gQHZpZXcuZm9jdXMoKVxuXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBpbml0RHJhZzogLT5cblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAbGF5ZXJTY3JvbGxcblxuICAgICAgICAgICAgb25TdGFydDogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEB2aWV3LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZXZlbnRQb3MgPSBAcG9zRm9yRXZlbnQgZXZlbnRcblxuICAgICAgICAgICAgICAgIGlmIGV2ZW50LmJ1dHRvbiA9PSAyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGV2ZW50LmJ1dHRvbiA9PSAxXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBAanVtcFRvRmlsZUF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgICAgICBAanVtcFRvV29yZEF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnRcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIGV2ZW50UG9zLCBAY2xpY2tQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNsaWNrQ291bnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlID0gQHJhbmdlRm9yV29yZEF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleSBvciBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAaGlnaGxpZ2h0V29yZEFuZEFkZFRvU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gQHJhbmdlRm9yTGluZUF0SW5kZXggQGNsaWNrUG9zWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBvbkNsaWNrVGltZW91dCgpXG5cbiAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCA9IDFcbiAgICAgICAgICAgICAgICBAY2xpY2tQb3MgPSBldmVudFBvc1xuICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuXG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIEBjbGlja0F0UG9zIHAsIGV2ZW50XG5cbiAgICAgICAgICAgIG9uTW92ZTogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBbQG1haW5DdXJzb3IoKVswXSwgcFsxXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6dHJ1ZVxuXG4gICAgICAgICAgICBvblN0b3A6ID0+XG4gICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKSBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBlbXB0eSBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgc3RhcnRDbGlja1RpbWVyOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tUaW1lciA9IHNldFRpbWVvdXQgQG9uQ2xpY2tUaW1lb3V0LCBAc3RpY2t5U2VsZWN0aW9uIGFuZCAzMDAgb3IgMTAwMFxuXG4gICAgb25DbGlja1RpbWVvdXQ6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja0NvdW50ICA9IDBcbiAgICAgICAgQGNsaWNrVGltZXIgID0gbnVsbFxuICAgICAgICBAY2xpY2tQb3MgICAgPSBudWxsXG5cbiAgICBmdW5jSW5mb0F0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJyBAY3VycmVudEZpbGVcbiAgICAgICAgZmlsZUluZm8gPSBmaWxlc1tAY3VycmVudEZpbGVdXG4gICAgICAgIGZvciBmdW5jIGluIGZpbGVJbmZvLmZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLmxpbmUgPD0gbGkgPD0gZnVuYy5sYXN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2xhc3MgKyAnLicgKyBmdW5jLm5hbWUgKyAnICdcbiAgICAgICAgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQuYWx0S2V5XG4gICAgICAgICAgICBAdG9nZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICBlbHNlIGlmIGV2ZW50Lm1ldGFLZXkgb3IgZXZlbnQuY3RybEtleVxuICAgICAgICAgICAgQGp1bXBUb1dvcmRBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgaWYgZXZlbnQuY3RybEtleVxuICAgICAgICAgICAgICAgICMgQGxvZyBqc2JlYXV0eS5odG1sX2JlYXV0aWZ5IEBsaW5lRGl2c1twWzFdXS5maXJzdENoaWxkLmlubmVySFRNTCwgaW5kZW50X3NpemU6MiAsIHByZXNlcnZlX25ld2xpbmVzOmZhbHNlLCB3cmFwX2xpbmVfbGVuZ3RoOjIwMCwgdW5mb3JtYXR0ZWQ6IFtdXG4gICAgICAgICAgICAgICAgIyBAbG9nIEBsaW5lIHBbMV1cbiAgICAgICAgICAgICAgICAjIEBzeW50YXgubmV3RGlzcyBwWzFdXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcCwgZXh0ZW5kOmV2ZW50LnNoaWZ0S2V5XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYXV0b2NvbXBsZXRlP1xuICAgICAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEBhdXRvY29tcGxldGUuaGFuZGxlTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgdGhlbiByZXR1cm4gJ3VuaGFuZGxlZCcgIyBoYXMgY2hhciBzZXQgb24gd2luZG93cz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBzYWx0ZXJNb2RlICAgICAgICAgIHRoZW4gcmV0dXJuIEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgICAgICAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKSAgICAgdGhlbiByZXR1cm4gQGNsZWFySGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA+IDEgICAgdGhlbiByZXR1cm4gQGNsZWFyQ3Vyc29ycygpXG4gICAgICAgICAgICAgICAgaWYgQHN0aWNreVNlbGVjdGlvbiAgICAgdGhlbiByZXR1cm4gQGVuZFN0aWNreVNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSAgICAgdGhlbiByZXR1cm4gQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJyAnY3RybCtlbnRlcicgJ2YxMicgdGhlbiBAanVtcFRvV29yZCgpXG5cbiAgICAgICAgZm9yIGFjdGlvbiBpbiBFZGl0b3IuYWN0aW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uY29tYm8gPT0gY29tYm8gb3IgYWN0aW9uLmFjY2VsID09IGNvbWJvXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgJ2NvbW1hbmQrYScgdGhlbiByZXR1cm4gQHNlbGVjdEFsbCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uYWNjZWxzPyBhbmQgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJ1xuICAgICAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uYWNjZWxzXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgYWN0aW9uLmNvbWJvcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5jb21ib3NcbiAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGNoYXIgYW5kIG1vZCBpbiBbXCJzaGlmdFwiLCBcIlwiXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gQGluc2VydENoYXJhY3RlciBjaGFyXG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uS2V5RG93bjogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuICAgICAgICByZXR1cm4gaWYga2V5ID09ICdyaWdodCBjbGljaycgIyB3ZWlyZCByaWdodCBjb21tYW5kIGtleVxuXG4gICAgICAgIHJlc3VsdCA9IEBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudCBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gcmVzdWx0XG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGxvZzogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBuYW1lICE9ICdlZGl0b3InXG4gICAgICAgIGtsb2cuc2xvZy5kZXB0aCA9IDNcbiAgICAgICAga2xvZy5hcHBseSBrbG9nLCBbXS5zcGxpY2UuY2FsbCBhcmd1bWVudHMsIDBcbiAgICAgICAga2xvZy5zbG9nLmRlcHRoID0gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/texteditor.coffee