// koffee 1.3.0

/*
000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000
 */
var $, Editor, EditorScroll, TextEditor, _, clamp, drag, electron, elem, empty, jsbeauty, kerror, keyinfo, klog, kpos, os, post, prefs, ref, render, setStyle, slash, stopEvent, str, sw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), keyinfo = ref.keyinfo, stopEvent = ref.stopEvent, setStyle = ref.setStyle, slash = ref.slash, prefs = ref.prefs, drag = ref.drag, empty = ref.empty, elem = ref.elem, post = ref.post, clamp = ref.clamp, kpos = ref.kpos, str = ref.str, sw = ref.sw, os = ref.os, kerror = ref.kerror, klog = ref.klog, $ = ref.$, _ = ref._;

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
            if ((div == null) || (div.style == null)) {
                return kerror('no div? style?', div != null, (div != null ? div.style : void 0) != null);
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
            this.cursorLine.style = "z-index:0;transform:translate3d(0," + ty + "px,0); height:" + this.size.lineHeight + "px;width:100%;";
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
        return electron.screen.getPrimaryDisplay().workAreaSize;
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
                                    _this.selectSingleRange(range);
                                }
                            }
                            if (_this.clickCount === 3) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0xBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3SCxPQUFBLENBQVEsS0FBUixDQUF4SCxFQUFFLHFCQUFGLEVBQVcseUJBQVgsRUFBc0IsdUJBQXRCLEVBQWdDLGlCQUFoQyxFQUF1QyxpQkFBdkMsRUFBOEMsZUFBOUMsRUFBb0QsaUJBQXBELEVBQTJELGVBQTNELEVBQWlFLGVBQWpFLEVBQXVFLGlCQUF2RSxFQUE4RSxlQUE5RSxFQUFvRixhQUFwRixFQUF5RixXQUF6RixFQUE2RixXQUE3RixFQUFpRyxtQkFBakcsRUFBeUcsZUFBekcsRUFBK0csU0FBL0csRUFBa0g7O0FBRWxILE1BQUEsR0FBZSxPQUFBLENBQVEsVUFBUjs7QUFDZixZQUFBLEdBQWUsT0FBQSxDQUFRLGdCQUFSOztBQUNmLE1BQUEsR0FBZSxPQUFBLENBQVEsVUFBUjs7QUFDZixRQUFBLEdBQWUsT0FBQSxDQUFRLGFBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFVyxvQkFBQyxRQUFELEVBQVcsTUFBWDs7Ozs7Ozs7Ozs7Ozs7QUFFVCxZQUFBO1FBQUEsSUFBQSxHQUFPO1FBQ1AsSUFBdUIsSUFBSyxDQUFBLENBQUEsQ0FBTCxLQUFXLEdBQWxDO1lBQUEsSUFBQSxHQUFPLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxFQUFQOztRQUVBLDRDQUFNLElBQU4sRUFBWSxNQUFaO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUVkLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLFFBQUY7UUFFUCxJQUFDLENBQUEsTUFBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtTQUFMO1FBQ2YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLENBQUs7WUFBQSxDQUFBLEtB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Ozt5QkFZWCxHQUFBLEdBQUssU0FBQTtRQUNELElBQVUsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFuQjtBQUFBLG1CQUFBOztRQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBVixHQUFrQjtRQUNsQixJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFWLENBQWUsU0FBZixFQUEwQixDQUExQixDQUFqQjtlQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBVixHQUFrQjtJQUpqQjs7OztHQWh2QmdCOztBQXN2QnpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBrZXlpbmZvLCBzdG9wRXZlbnQsIHNldFN0eWxlLCBzbGFzaCwgcHJlZnMsIGRyYWcsIGVtcHR5LCBlbGVtLCBwb3N0LCBjbGFtcCwga3Bvcywgc3RyLCBzdywgb3MsIGtlcnJvciwga2xvZywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJyBcbiAgXG5yZW5kZXIgICAgICAgPSByZXF1aXJlICcuL3JlbmRlcidcbkVkaXRvclNjcm9sbCA9IHJlcXVpcmUgJy4vZWRpdG9yc2Nyb2xsJ1xuRWRpdG9yICAgICAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5qc2JlYXV0eSAgICAgPSByZXF1aXJlICdqcy1iZWF1dGlmeSdcbmVsZWN0cm9uICAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5jbGFzcyBUZXh0RWRpdG9yIGV4dGVuZHMgRWRpdG9yXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZpZXdFbGVtLCBjb25maWcpIC0+XG5cbiAgICAgICAgbmFtZSA9IHZpZXdFbGVtXG4gICAgICAgIG5hbWUgPSBuYW1lLnNsaWNlIDEgaWYgbmFtZVswXSA9PSAnLidcblxuICAgICAgICBzdXBlciBuYW1lLCBjb25maWdcblxuICAgICAgICBAY2xpY2tDb3VudCA9IDBcblxuICAgICAgICBAdmlldyA9JCB2aWV3RWxlbVxuXG4gICAgICAgIEBsYXllcnMgICAgICA9IGVsZW0gY2xhc3M6IFwibGF5ZXJzXCJcbiAgICAgICAgQGxheWVyU2Nyb2xsID0gZWxlbSBjbGFzczogXCJsYXllclNjcm9sbFwiLCBjaGlsZDogQGxheWVyc1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAbGF5ZXJTY3JvbGxcblxuICAgICAgICBsYXllciA9IFtdXG4gICAgICAgIGxheWVyLnB1c2ggJ3NlbGVjdGlvbnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2hpZ2hsaWdodHMnXG4gICAgICAgIGxheWVyLnB1c2ggJ21ldGEnICAgIGlmICdNZXRhJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIGxheWVyLnB1c2ggJ2xpbmVzJ1xuICAgICAgICBsYXllci5wdXNoICdjdXJzb3JzJ1xuICAgICAgICBsYXllci5wdXNoICdudW1iZXJzJyBpZiAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBAaW5pdExheWVycyBsYXllclxuXG4gICAgICAgIEBzaXplID0ge31cbiAgICAgICAgQGVsZW0gPSBAbGF5ZXJEaWN0LmxpbmVzXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdICMgY2FjaGUgZm9yIHJlbmRlcmVkIGxpbmUgc3BhbnNcbiAgICAgICAgQGxpbmVEaXZzICA9IHt9ICMgbWFwcyBsaW5lIG51bWJlcnMgdG8gZGlzcGxheWVkIGRpdnNcblxuICAgICAgICBAY29uZmlnLmxpbmVIZWlnaHQgPz0gMS4yXG5cbiAgICAgICAgQHNldEZvbnRTaXplIHByZWZzLmdldCBcIiN7QG5hbWV9Rm9udFNpemVcIiwgQGNvbmZpZy5mb250U2l6ZSA/IDE5XG4gICAgICAgIEBzY3JvbGwgPSBuZXcgRWRpdG9yU2Nyb2xsIEBcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hpZnRMaW5lcycsIEBzaGlmdExpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3Nob3dMaW5lcycsICBAc2hvd0xpbmVzXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicsICAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJywgICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicsICBAb25LZXlEb3duXG5cbiAgICAgICAgQGluaXREcmFnKCkgICAgICAgIFxuXG4gICAgICAgIGZvciBmZWF0dXJlIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgICAgIGlmIGZlYXR1cmUgPT0gJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICAgICAgQGN1cnNvckxpbmUgPSBlbGVtICdkaXYnLCBjbGFzczonY3Vyc29yLWxpbmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmVhdHVyZU5hbWUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBmZWF0dXJlQ2xzcyA9IHJlcXVpcmUgXCIuLyN7ZmVhdHVyZU5hbWV9XCJcbiAgICAgICAgICAgICAgICBAW2ZlYXR1cmVOYW1lXSA9IG5ldyBmZWF0dXJlQ2xzcyBAXG5cbiAgICAgICAgcG9zdC5vbiAnc2NoZW1lQ2hhbmdlZCcsIEBvblNjaGVtZUNoYW5nZWRcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBkZWw6IC0+XG5cbiAgICAgICAgcG9zdC5yZW1vdmVMaXN0ZW5lciAnc2NoZW1lQ2hhbmdlZCcsIEBvblNjaGVtZUNoYW5nZWRcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGxiYXI/LmRlbCgpXG5cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicsIEBvbktleURvd25cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnYmx1cicsICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnZm9jdXMnLCAgIEBvbkZvY3VzXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgb25Gb2N1czogPT5cblxuICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIEBlbWl0ICdmb2N1cycsIEBcbiAgICAgICAgcG9zdC5lbWl0ICdlZGl0b3JGb2N1cycsIEBcblxuICAgIG9uQmx1cjogPT5cblxuICAgICAgICBAc3RvcEJsaW5rKClcbiAgICAgICAgQGVtaXQgJ2JsdXInLCBAXG5cbiAgICBvblNjaGVtZUNoYW5nZWQ6ID0+XG5cbiAgICAgICAgQHN5bnRheD8uc2NoZW1lQ2hhbmdlZCgpXG4gICAgICAgIGlmIEBtaW5pbWFwXG4gICAgICAgICAgICB1cGRhdGVNaW5pbWFwID0gPT4gQG1pbmltYXA/LmRyYXdMaW5lcygpXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHVwZGF0ZU1pbmltYXAsIDEwXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRMYXllcnM6IChsYXllckNsYXNzZXMpIC0+XG5cbiAgICAgICAgQGxheWVyRGljdCA9IHt9XG4gICAgICAgIGZvciBjbHMgaW4gbGF5ZXJDbGFzc2VzXG4gICAgICAgICAgICBAbGF5ZXJEaWN0W2Nsc10gPSBAYWRkTGF5ZXIgY2xzXG5cbiAgICBhZGRMYXllcjogKGNscykgLT5cblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNcbiAgICAgICAgQGxheWVycy5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgZGl2XG5cbiAgICB1cGRhdGVMYXllcnM6ICgpIC0+XG5cbiAgICAgICAgQHJlbmRlckhpZ2hsaWdodHMoKVxuICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgQGNsZWFyTGluZXMoKVxuXG4gICAgICAgIGxpbmVzID89IFtdXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdXG4gICAgICAgIEBsaW5lRGl2cyAgPSB7fVxuXG4gICAgICAgIHN1cGVyIGxpbmVzXG5cbiAgICAgICAgQHNjcm9sbC5yZXNldCgpXG5cbiAgICAgICAgdmlld0hlaWdodCA9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwuc3RhcnQgdmlld0hlaWdodCwgQG51bUxpbmVzKClcblxuICAgICAgICBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdCA9IDBcbiAgICAgICAgQGxheWVyc1dpZHRoICA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICBAbGF5ZXJzSGVpZ2h0ID0gQGxheWVyU2Nyb2xsLm9mZnNldEhlaWdodFxuXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhcHBlbmRUZXh0OiAodGV4dCkgLT5cblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIGxvZyBcIiN7QG5hbWV9LmFwcGVuZFRleHQgLSBubyB0ZXh0P1wiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBhcHBlbmRlZCA9IFtdXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLmFwcGVuZExpbmUgbFxuICAgICAgICAgICAgYXBwZW5kZWQucHVzaCBAbnVtTGluZXMoKS0xXG5cbiAgICAgICAgaWYgQHNjcm9sbC52aWV3SGVpZ2h0ICE9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCBAdmlld0hlaWdodCgpXG5cbiAgICAgICAgc2hvd0xpbmVzID0gKEBzY3JvbGwuYm90IDwgQHNjcm9sbC50b3ApIG9yIChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudmlld0xpbmVzKVxuXG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKCksIHNob3dMaW5lczpzaG93TGluZXNcblxuICAgICAgICBmb3IgbGkgaW4gYXBwZW5kZWRcbiAgICAgICAgICAgIEBlbWl0ICdsaW5lQXBwZW5kZWQnLFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleDogbGlcbiAgICAgICAgICAgICAgICB0ZXh0OiBAbGluZSBsaVxuXG4gICAgICAgIEBlbWl0ICdsaW5lc0FwcGVuZGVkJywgbHNcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJywgQG51bUxpbmVzKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzZXRGb250U2l6ZTogKGZvbnRTaXplKSA9PlxuICAgICAgICBcbiAgICAgICAgQGxheWVycy5zdHlsZS5mb250U2l6ZSA9IFwiI3tmb250U2l6ZX1weFwiXG4gICAgICAgIEBzaXplLm51bWJlcnNXaWR0aCA9ICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzIGFuZCA1MCBvciAwXG4gICAgICAgIEBzaXplLmZvbnRTaXplICAgICA9IGZvbnRTaXplXG4gICAgICAgIEBzaXplLmxpbmVIZWlnaHQgICA9IE1hdGguZmxvb3IgZm9udFNpemUgKiBAY29uZmlnLmxpbmVIZWlnaHRcbiAgICAgICAgQHNpemUuY2hhcldpZHRoICAgID0gZm9udFNpemUgKiAwLjZcbiAgICAgICAgQHNpemUub2Zmc2V0WCAgICAgID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICBAc2l6ZS5vZmZzZXRYICAgICAgPSBNYXRoLm1heCBAc2l6ZS5vZmZzZXRYLCAoQHNjcmVlblNpemUoKS53aWR0aCAtIEBzY3JlZW5TaXplKCkuaGVpZ2h0KSAvIDIgaWYgQHNpemUuY2VudGVyVGV4dFxuXG4gICAgICAgIEBzY3JvbGw/LnNldExpbmVIZWlnaHQgQHNpemUubGluZUhlaWdodFxuXG4gICAgICAgIEBlbWl0ICdmb250U2l6ZUNoYW5nZWQnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgQHN5bnRheC5jaGFuZ2VkIGNoYW5nZUluZm9cblxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgW2RpLGxpLGNoXSA9IFtjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLm5ld0luZGV4LCBjaGFuZ2UuY2hhbmdlXVxuICAgICAgICAgICAgc3dpdGNoIGNoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCdcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGksIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lQ2hhbmdlZCcsIGxpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lRGVsZXRlZCcsIGRpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2luc2VydGVkJ1xuICAgICAgICAgICAgICAgICAgICBAc3BhbkNhY2hlID0gQHNwYW5DYWNoZS5zbGljZSAwLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZUluc2VydGVkJywgbGksIGRpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5pbnNlcnRzIG9yIGNoYW5nZUluZm8uZGVsZXRlc1xuICAgICAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpXG4gICAgICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG4gICAgICAgICAgICBAcmVuZGVyQ3Vyc29ycygpXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcbiAgICAgICAgICAgIEBlbWl0ICdjdXJzb3InXG4gICAgICAgICAgICBAc3VzcGVuZEJsaW5rKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgICAgIEByZW5kZXJTZWxlY3Rpb24oKVxuICAgICAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICAgICBAZW1pdCAnY2hhbmdlZCcsIGNoYW5nZUluZm9cblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGVMaW5lOiAobGksIG9pKSAtPlxuXG4gICAgICAgIG9pID0gbGkgaWYgbm90IG9pP1xuXG4gICAgICAgIGlmIGxpIDwgQHNjcm9sbC50b3Agb3IgbGkgPiBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAga2Vycm9yIFwiZGFuZ2xpbmcgbGluZSBkaXY/ICN7bGl9XCIsIEBsaW5lRGl2c1tsaV0gaWYgQGxpbmVEaXZzW2xpXT9cbiAgICAgICAgICAgIGRlbGV0ZSBAc3BhbkNhY2hlW2xpXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcInVwZGF0ZUxpbmUgLSBvdXQgb2YgYm91bmRzPyBsaSAje2xpfSBvaSAje29pfVwiIGlmIG5vdCBAbGluZURpdnNbb2ldXG5cbiAgICAgICAgQHNwYW5DYWNoZVtsaV0gPSByZW5kZXIubGluZVNwYW4gQHN5bnRheC5nZXREaXNzKGxpKSwgQHNpemVcblxuICAgICAgICBkaXYgPSBAbGluZURpdnNbb2ldXG4gICAgICAgIGRpdi5yZXBsYWNlQ2hpbGQgQHNwYW5DYWNoZVtsaV0sIGRpdi5maXJzdENoaWxkXG4gICAgICAgIFxuICAgIHJlZnJlc2hMaW5lczogKHRvcCwgYm90KSAtPlxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQHN5bnRheC5nZXREaXNzIGxpLCB0cnVlXG4gICAgICAgICAgICBAdXBkYXRlTGluZSBsaVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzaG93TGluZXM6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBhcHBlbmRMaW5lIGxpXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQGVtaXQgJ2xpbmVzRXhwb3NlZCcsIHRvcDp0b3AsIGJvdDpib3QsIG51bTpudW1cbiAgICAgICAgQGVtaXQgJ2xpbmVzU2hvd24nLCB0b3AsIGJvdCwgbnVtXG5cbiAgICBhcHBlbmRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgQGxpbmVEaXZzW2xpXSA9IGVsZW0gY2xhc3M6ICdsaW5lJ1xuICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIEBjYWNoZWRTcGFuIGxpXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lRGl2c1tsaV1cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hpZnRMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5zaGlmdExpbmVzLmRpdkludG8gLSBubyBkaXY/ICN7dG9wfSAje2JvdH0gI3tudW19IG9sZCAje29sZFRvcH0gI3tvbGRCb3R9IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBAbGluZURpdnNbbGldLnJlcGxhY2VDaGlsZCBAY2FjaGVkU3BhbihsaSksIEBsaW5lRGl2c1tsaV0uZmlyc3RDaGlsZFxuXG4gICAgICAgICAgICBpZiBAc2hvd0ludmlzaWJsZXNcbiAgICAgICAgICAgICAgICB0eCA9IEBsaW5lKGxpKS5sZW5ndGggKiBAc2l6ZS5jaGFyV2lkdGggKyAxXG4gICAgICAgICAgICAgICAgc3BhbiA9IGVsZW0gJ3NwYW4nLCBjbGFzczogXCJpbnZpc2libGUgbmV3bGluZVwiLCBodG1sOiAnJiM5Njg3J1xuICAgICAgICAgICAgICAgIHNwYW4uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoI3t0eH1weCwgLTEuNXB4KVwiXG4gICAgICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBzcGFuXG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgd2hpbGUgb2xkQm90IDwgYm90XG4gICAgICAgICAgICAgICAgb2xkQm90ICs9IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZEJvdCwgb2xkVG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wICs9IDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgb2xkVG9wID4gdG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wIC09IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZFRvcCwgb2xkQm90XG4gICAgICAgICAgICAgICAgb2xkQm90IC09IDFcblxuICAgICAgICBAZW1pdCAnbGluZXNTaGlmdGVkJywgdG9wLCBib3QsIG51bVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZVBvc2l0aW9uczogKGFuaW1hdGU9MCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBsaSwgZGl2IG9mIEBsaW5lRGl2c1xuICAgICAgICAgICAgaWYgbm90IGRpdj8gb3Igbm90IGRpdi5zdHlsZT9cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBkaXY/IHN0eWxlPycsIGRpdj8sIGRpdj8uc3R5bGU/XG4gICAgICAgICAgICB5ID0gQHNpemUubGluZUhlaWdodCAqIChsaSAtIEBzY3JvbGwudG9wKVxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoI3tAc2l6ZS5vZmZzZXRYfXB4LCN7eX1weCwgMClcIlxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zaXRpb24gPSBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgZGl2LnN0eWxlLnpJbmRleCA9IGxpXG5cbiAgICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGVsZW0uY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2l0aW9uID0gJ2luaXRpYWwnXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcblxuICAgIHVwZGF0ZUxpbmVzOiAoKSAtPlxuXG4gICAgICAgIGZvciBsaSBpbiBbQHNjcm9sbC50b3AuLkBzY3JvbGwuYm90XVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcblxuICAgIGNsZWFySGlnaGxpZ2h0czogKCkgLT5cblxuICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAkKCcuaGlnaGxpZ2h0cycsIEBsYXllcnMpLmlubmVySFRNTCA9ICcnXG4gICAgICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2FjaGVkU3BhbjogKGxpKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAc3BhbkNhY2hlW2xpXVxuXG4gICAgICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldXG5cbiAgICByZW5kZXJDdXJzb3JzOiAtPlxuXG4gICAgICAgIGNzID0gW11cbiAgICAgICAgZm9yIGMgaW4gQGN1cnNvcnMoKVxuICAgICAgICAgICAgaWYgY1sxXSA+PSBAc2Nyb2xsLnRvcCBhbmQgY1sxXSA8PSBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAgICAgIGNzLnB1c2ggW2NbMF0sIGNbMV0gLSBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA9PSAxXG5cbiAgICAgICAgICAgIGlmIGNzLmxlbmd0aCA9PSAxXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbWNbMV0gPCAwXG5cbiAgICAgICAgICAgICAgICBpZiBtY1sxXSA+IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIiN7QG5hbWV9LnJlbmRlckN1cnNvcnMgbWFpbkN1cnNvciBEQUZVSz9cIiwgQG51bUxpbmVzKCksIHN0ciBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgICAgICAgICByaSA9IG1jWzFdLUBzY3JvbGwudG9wXG4gICAgICAgICAgICAgICAgY3Vyc29yTGluZSA9IEBzdGF0ZS5saW5lKG1jWzFdKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIG1haW4gY3Vyc29yIGxpbmU/JyBpZiBub3QgY3Vyc29yTGluZT9cbiAgICAgICAgICAgICAgICBpZiBtY1swXSA+IGN1cnNvckxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ3ZpcnR1YWwnXG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2ggW2N1cnNvckxpbmUubGVuZ3RoLCByaSwgJ21haW4gb2ZmJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ21haW4gb2ZmJ1xuXG4gICAgICAgIGVsc2UgaWYgQG51bUN1cnNvcnMoKSA+IDFcblxuICAgICAgICAgICAgdmMgPSBbXSAjIHZpcnR1YWwgY3Vyc29yc1xuICAgICAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgQG1haW5DdXJzb3IoKSwgW2NbMF0sIGNbMV0gKyBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICAgICAgY1syXSA9ICdtYWluJ1xuICAgICAgICAgICAgICAgIGxpbmUgPSBAbGluZShAc2Nyb2xsLnRvcCtjWzFdKVxuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB2Yy5wdXNoIFtsaW5lLmxlbmd0aCwgY1sxXSwgJ3ZpcnR1YWwnXVxuICAgICAgICAgICAgY3MgPSBjcy5jb25jYXQgdmNcblxuICAgICAgICBodG1sID0gcmVuZGVyLmN1cnNvcnMgY3MsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3QuY3Vyc29ycy5pbm5lckhUTUwgPSBodG1sXG4gICAgICAgIFxuICAgICAgICB0eSA9IChtY1sxXSAtIEBzY3JvbGwudG9wKSAqIEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJzb3JMaW5lXG4gICAgICAgICAgICBAY3Vyc29yTGluZS5zdHlsZSA9IFwiei1pbmRleDowO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgwLCN7dHl9cHgsMCk7IGhlaWdodDoje0BzaXplLmxpbmVIZWlnaHR9cHg7d2lkdGg6MTAwJTtcIlxuICAgICAgICAgICAgQGxheWVycy5pbnNlcnRCZWZvcmUgQGN1cnNvckxpbmUsIEBsYXllcnMuZmlyc3RDaGlsZFxuXG4gICAgcmVuZGVyU2VsZWN0aW9uOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIHMgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICBpZiBzXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5zZWxlY3Rpb25zLmlubmVySFRNTCA9IGhcblxuICAgIHJlbmRlckhpZ2hsaWdodHM6IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgcyA9IEBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgIGlmIHNcbiAgICAgICAgICAgIGggKz0gcmVuZGVyLnNlbGVjdGlvbiBzLCBAc2l6ZSwgXCJoaWdobGlnaHRcIlxuICAgICAgICBAbGF5ZXJEaWN0LmhpZ2hsaWdodHMuaW5uZXJIVE1MID0gaFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjdXJzb3JEaXY6IC0+ICQgJy5jdXJzb3IubWFpbicsIEBsYXllckRpY3RbJ2N1cnNvcnMnXVxuXG4gICAgc3VzcGVuZEJsaW5rOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGJsaW5rVGltZXJcbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnLCBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JywgWzgwMCwyMDBdXG4gICAgICAgIEBzdXNwZW5kVGltZXIgPSBzZXRUaW1lb3V0IEByZWxlYXNlQmxpbmssIGJsaW5rRGVsYXlbMF1cblxuICAgIHJlbGVhc2VCbGluazogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBkZWxldGUgQHN1c3BlbmRUaW1lclxuICAgICAgICBAc3RhcnRCbGluaygpXG5cbiAgICB0b2dnbGVCbGluazogLT5cblxuICAgICAgICBibGluayA9IG5vdCBwcmVmcy5nZXQgJ2JsaW5rJywgZmFsc2VcbiAgICAgICAgcHJlZnMuc2V0ICdibGluaycsIGJsaW5rXG4gICAgICAgIGlmIGJsaW5rXG4gICAgICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdG9wQmxpbmsoKVxuXG4gICAgZG9CbGluazogPT5cblxuICAgICAgICBAYmxpbmsgPSBub3QgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJywgQGJsaW5rXG4gICAgICAgIEBtaW5pbWFwPy5kcmF3TWFpbkN1cnNvciBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYmxpbmtUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JywgWzgwMCwyMDBdXG4gICAgICAgIEBibGlua1RpbWVyID0gc2V0VGltZW91dCBAZG9CbGluaywgQGJsaW5rIGFuZCBibGlua0RlbGF5WzFdIG9yIGJsaW5rRGVsYXlbMF1cblxuICAgIHN0YXJ0Qmxpbms6IC0+IFxuICAgIFxuICAgICAgICBpZiBub3QgQGJsaW5rVGltZXIgYW5kIHByZWZzLmdldCAnYmxpbmsnXG4gICAgICAgICAgICBAZG9CbGluaygpIFxuXG4gICAgc3RvcEJsaW5rOiAtPlxuXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnLCBmYWxzZVxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGRlbGV0ZSBAYmxpbmtUaW1lclxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXNpemVkOiAtPlxuXG4gICAgICAgIHZoID0gQHZpZXcuY2xpZW50SGVpZ2h0XG5cbiAgICAgICAgcmV0dXJuIGlmIHZoID09IEBzY3JvbGwudmlld0hlaWdodFxuXG4gICAgICAgIEBudW1iZXJzPy5lbGVtLnN0eWxlLmhlaWdodCA9IFwiI3tAc2Nyb2xsLmV4cG9zZU51bSAqIEBzY3JvbGwubGluZUhlaWdodH1weFwiXG4gICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCB2aFxuXG4gICAgICAgIEBlbWl0ICd2aWV3SGVpZ2h0JywgdmhcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBwb3NBdFhZOih4LHkpIC0+XG5cbiAgICAgICAgc2wgPSBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdFxuICAgICAgICBzdCA9IEBzY3JvbGwub2Zmc2V0VG9wXG4gICAgICAgIGJyID0gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHggPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldFdpZHRoLCAgeCAtIGJyLmxlZnQgLSBAc2l6ZS5vZmZzZXRYICsgQHNpemUuY2hhcldpZHRoLzNcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldEhlaWdodCwgeSAtIGJyLnRvcFxuICAgICAgICBweCA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHNsICsgbHgpKS9Ac2l6ZS5jaGFyV2lkdGgpKVxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHN0ICsgbHkpKS9Ac2l6ZS5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBwICA9IFtweCwgTWF0aC5taW4oQG51bUxpbmVzKCktMSwgcHkpXVxuICAgICAgICBwXG5cbiAgICBwb3NGb3JFdmVudDogKGV2ZW50KSAtPiBAcG9zQXRYWSBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZXG5cbiAgICBsaW5lRWxlbUF0WFk6KHgseSkgLT5cblxuICAgICAgICBwID0gQHBvc0F0WFkgeCx5XG4gICAgICAgIEBsaW5lRGl2c1twWzFdXVxuXG4gICAgbGluZVNwYW5BdFhZOih4LHkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lRWxlbSA9IEBsaW5lRWxlbUF0WFkgeCx5XG4gICAgICAgICAgICBsciA9IGxpbmVFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICBmb3IgZSBpbiBsaW5lRWxlbS5maXJzdENoaWxkLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgYnIgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICAgICAgaWYgYnIubGVmdCA8PSB4IDw9IGJyLmxlZnQrYnIud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0geC1ici5sZWZ0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzcGFuOiBlLCBvZmZzZXRMZWZ0OiBvZmZzZXQsIG9mZnNldENoYXI6IHBhcnNlSW50IG9mZnNldC9Ac2l6ZS5jaGFyV2lkdGhcbiAgICAgICAgbnVsbFxuXG4gICAgIyBudW1GdWxsTGluZXM6IC0+IE1hdGguZmxvb3IoQHZpZXdIZWlnaHQoKSAvIEBzaXplLmxpbmVIZWlnaHQpXG4gICAgbnVtRnVsbExpbmVzOiAtPiBAc2Nyb2xsLmZ1bGxMaW5lc1xuICAgIFxuICAgIHZpZXdIZWlnaHQ6IC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgQHNjcm9sbD8udmlld0hlaWdodCA+PSAwIHRoZW4gcmV0dXJuIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICBAdmlldz8uY2xpZW50SGVpZ2h0XG5cbiAgICBjbGVhckxpbmVzOiA9PlxuXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBlbWl0ICdjbGVhckxpbmVzJ1xuXG4gICAgY2xlYXI6ID0+IFxuICAgICAgICBAc2V0TGluZXMgW11cblxuICAgIGZvY3VzOiAtPiBAdmlldy5mb2N1cygpXG5cbiAgICAjICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIGluaXREcmFnOiAtPlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBsYXllclNjcm9sbFxuXG4gICAgICAgICAgICBvblN0YXJ0OiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHZpZXcuZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBldmVudFBvcyA9IEBwb3NGb3JFdmVudCBldmVudFxuXG4gICAgICAgICAgICAgICAgaWYgZXZlbnQuYnV0dG9uID09IDJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgZXZlbnQuYnV0dG9uID09IDFcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IEBqdW1wVG9GaWxlQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIEBqdW1wVG9Xb3JkQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudFxuICAgICAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgZXZlbnRQb3MsIEBjbGlja1Bvc1xuICAgICAgICAgICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudCA9PSAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5IG9yIEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZFJhbmdlVG9TZWxlY3Rpb24gcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JMaW5lQXRJbmRleCBAY2xpY2tQb3NbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQG9uQ2xpY2tUaW1lb3V0KClcblxuICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ID0gMVxuICAgICAgICAgICAgICAgIEBjbGlja1BvcyA9IGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG5cbiAgICAgICAgICAgICAgICBwID0gQHBvc0ZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgQGNsaWNrQXRQb3MgcCwgZXZlbnRcblxuICAgICAgICAgICAgb25Nb3ZlOiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgICAgICAgICAgQGFkZEN1cnNvckF0UG9zIFtAbWFpbkN1cnNvcigpWzBdLCBwWzFdXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDp0cnVlXG5cbiAgICAgICAgICAgIG9uU3RvcDogPT5cbiAgICAgICAgICAgICAgICBAc2VsZWN0Tm9uZSgpIGlmIEBudW1TZWxlY3Rpb25zKCkgYW5kIGVtcHR5IEB0ZXh0T2ZTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBzdGFydENsaWNrVGltZXI6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja1RpbWVyID0gc2V0VGltZW91dCBAb25DbGlja1RpbWVvdXQsIEBzdGlja3lTZWxlY3Rpb24gYW5kIDMwMCBvciAxMDAwXG5cbiAgICBvbkNsaWNrVGltZW91dDogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQGNsaWNrVGltZXJcbiAgICAgICAgQGNsaWNrQ291bnQgID0gMFxuICAgICAgICBAY2xpY2tUaW1lciAgPSBudWxsXG4gICAgICAgIEBjbGlja1BvcyAgICA9IG51bGxcblxuICAgIGZ1bmNJbmZvQXRMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJywgJ2ZpbGVzJywgQGN1cnJlbnRGaWxlXG4gICAgICAgIGZpbGVJbmZvID0gZmlsZXNbQGN1cnJlbnRGaWxlXVxuICAgICAgICBmb3IgZnVuYyBpbiBmaWxlSW5mby5mdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy5saW5lIDw9IGxpIDw9IGZ1bmMubGFzdFxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jLmNsYXNzICsgJy4nICsgZnVuYy5uYW1lICsgJyAnXG4gICAgICAgICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xpY2tBdFBvczogKHAsIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGV2ZW50LmFsdEtleVxuICAgICAgICAgICAgQHRvZ2dsZUN1cnNvckF0UG9zIHBcbiAgICAgICAgZWxzZSBpZiBldmVudC5tZXRhS2V5IG9yIGV2ZW50LmN0cmxLZXlcbiAgICAgICAgICAgIEBqdW1wVG9Xb3JkQXRQb3MgcFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIGlmIGV2ZW50LmN0cmxLZXlcbiAgICAgICAgICAgICAgICAjIEBsb2cganNiZWF1dHkuaHRtbF9iZWF1dGlmeSBAbGluZURpdnNbcFsxXV0uZmlyc3RDaGlsZC5pbm5lckhUTUwsIGluZGVudF9zaXplOjIgLCBwcmVzZXJ2ZV9uZXdsaW5lczpmYWxzZSwgd3JhcF9saW5lX2xlbmd0aDoyMDAsIHVuZm9ybWF0dGVkOiBbXVxuICAgICAgICAgICAgICAgICMgQGxvZyBAbGluZSBwWzFdXG4gICAgICAgICAgICAgICAgIyBAc3ludGF4Lm5ld0Rpc3MgcFsxXVxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDpldmVudC5zaGlmdEtleVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGF1dG9jb21wbGV0ZT9cbiAgICAgICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAYXV0b2NvbXBsZXRlLmhhbmRsZU1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnIHRoZW4gcmV0dXJuICd1bmhhbmRsZWQnICMgaGFzIGNoYXIgc2V0IG9uIHdpbmRvd3M/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAc2FsdGVyTW9kZSAgICAgICAgICB0aGVuIHJldHVybiBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICAgICAgICAgIGlmIEBudW1IaWdobGlnaHRzKCkgICAgIHRoZW4gcmV0dXJuIEBjbGVhckhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgICAgIGlmIEBudW1DdXJzb3JzKCkgPiAxICAgIHRoZW4gcmV0dXJuIEBjbGVhckN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIGlmIEBzdGlja3lTZWxlY3Rpb24gICAgIHRoZW4gcmV0dXJuIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgICAgIHRoZW4gcmV0dXJuIEBzZWxlY3ROb25lKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtlbnRlcicsICdjdHJsK2VudGVyJywnZjEyJyB0aGVuIEBqdW1wVG9Xb3JkKClcblxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbi5jb21ibyA9PSBjb21ibyBvciBhY3Rpb24uYWNjZWwgPT0gY29tYm9cbiAgICAgICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnY3RybCthJywgJ2NvbW1hbmQrYScgdGhlbiByZXR1cm4gQHNlbGVjdEFsbCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uYWNjZWxzPyBhbmQgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJ1xuICAgICAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uYWNjZWxzXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgYWN0aW9uLmNvbWJvcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5jb21ib3NcbiAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGNoYXIgYW5kIG1vZCBpbiBbXCJzaGlmdFwiLCBcIlwiXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gQGluc2VydENoYXJhY3RlciBjaGFyXG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uS2V5RG93bjogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuICAgICAgICByZXR1cm4gaWYga2V5ID09ICdyaWdodCBjbGljaycgIyB3ZWlyZCByaWdodCBjb21tYW5kIGtleVxuXG4gICAgICAgIHJlc3VsdCA9IEBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudCBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gcmVzdWx0XG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGxvZzogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBuYW1lICE9ICdlZGl0b3InXG4gICAgICAgIGtsb2cuc2xvZy5kZXB0aCA9IDNcbiAgICAgICAga2xvZy5hcHBseSBrbG9nLCBbXS5zcGxpY2UuY2FsbCBhcmd1bWVudHMsIDBcbiAgICAgICAga2xvZy5zbG9nLmRlcHRoID0gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/texteditor.coffee