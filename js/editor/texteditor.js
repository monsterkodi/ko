// koffee 1.4.0

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
                                    _this.highlightWordAndAddToSelection('skipScroll');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0xBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3SCxPQUFBLENBQVEsS0FBUixDQUF4SCxFQUFFLHFCQUFGLEVBQVcseUJBQVgsRUFBc0IsdUJBQXRCLEVBQWdDLGlCQUFoQyxFQUF1QyxpQkFBdkMsRUFBOEMsZUFBOUMsRUFBb0QsaUJBQXBELEVBQTJELGVBQTNELEVBQWlFLGVBQWpFLEVBQXVFLGlCQUF2RSxFQUE4RSxlQUE5RSxFQUFvRixhQUFwRixFQUF5RixXQUF6RixFQUE2RixXQUE3RixFQUFpRyxtQkFBakcsRUFBeUcsZUFBekcsRUFBK0csU0FBL0csRUFBa0g7O0FBRWxILE1BQUEsR0FBZSxPQUFBLENBQVEsVUFBUjs7QUFDZixZQUFBLEdBQWUsT0FBQSxDQUFRLGdCQUFSOztBQUNmLE1BQUEsR0FBZSxPQUFBLENBQVEsVUFBUjs7QUFDZixRQUFBLEdBQWUsT0FBQSxDQUFRLGFBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFVyxvQkFBQyxRQUFELEVBQVcsTUFBWDs7Ozs7Ozs7Ozs7Ozs7QUFFVCxZQUFBO1FBQUEsSUFBQSxHQUFPO1FBQ1AsSUFBdUIsSUFBSyxDQUFBLENBQUEsQ0FBTCxLQUFXLEdBQWxDO1lBQUEsSUFBQSxHQUFPLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxFQUFQOztRQUVBLDRDQUFNLElBQU4sRUFBWSxNQUFaO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUVkLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLFFBQUY7UUFFUCxJQUFDLENBQUEsTUFBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtTQUFMO1FBQ2YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLENBQUs7WUFBQSxDQUFBLEtB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LDBCQUFELENBQTRCLEdBQTVCLEVBQWlDLEdBQWpDLEVBQXNDLEtBQXRDLEVBQTZDLElBQTdDLEVBQW1ELEtBQW5EO1FBRVQsSUFBRyxXQUFBLEtBQWUsTUFBbEI7bUJBQ0ksU0FBQSxDQUFVLEtBQVYsRUFESjs7SUFUTzs7eUJBWVgsR0FBQSxHQUFLLFNBQUE7UUFDRCxJQUFVLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBbkI7QUFBQSxtQkFBQTs7UUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQVYsR0FBa0I7UUFDbEIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBVixDQUFlLFNBQWYsRUFBMEIsQ0FBMUIsQ0FBakI7ZUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQVYsR0FBa0I7SUFKakI7Ozs7R0FwdkJnQjs7QUEwdkJ6QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsga2V5aW5mbywgc3RvcEV2ZW50LCBzZXRTdHlsZSwgc2xhc2gsIHByZWZzLCBkcmFnLCBlbXB0eSwgZWxlbSwgcG9zdCwgY2xhbXAsIGtwb3MsIHN0ciwgc3csIG9zLCBrZXJyb3IsIGtsb2csICQsIF8gfSA9IHJlcXVpcmUgJ2t4aycgXG4gIFxucmVuZGVyICAgICAgID0gcmVxdWlyZSAnLi9yZW5kZXInXG5FZGl0b3JTY3JvbGwgPSByZXF1aXJlICcuL2VkaXRvcnNjcm9sbCdcbkVkaXRvciAgICAgICA9IHJlcXVpcmUgJy4vZWRpdG9yJ1xuanNiZWF1dHkgICAgID0gcmVxdWlyZSAnanMtYmVhdXRpZnknXG5lbGVjdHJvbiAgICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgVGV4dEVkaXRvciBleHRlbmRzIEVkaXRvclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3RWxlbSwgY29uZmlnKSAtPlxuXG4gICAgICAgIG5hbWUgPSB2aWV3RWxlbVxuICAgICAgICBuYW1lID0gbmFtZS5zbGljZSAxIGlmIG5hbWVbMF0gPT0gJy4nXG5cbiAgICAgICAgc3VwZXIgbmFtZSwgY29uZmlnXG5cbiAgICAgICAgQGNsaWNrQ291bnQgPSAwXG5cbiAgICAgICAgQHZpZXcgPSQgdmlld0VsZW1cblxuICAgICAgICBAbGF5ZXJzICAgICAgPSBlbGVtIGNsYXNzOiBcImxheWVyc1wiXG4gICAgICAgIEBsYXllclNjcm9sbCA9IGVsZW0gY2xhc3M6IFwibGF5ZXJTY3JvbGxcIiwgY2hpbGQ6IEBsYXllcnNcbiAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGxheWVyU2Nyb2xsXG5cbiAgICAgICAgbGF5ZXIgPSBbXVxuICAgICAgICBsYXllci5wdXNoICdzZWxlY3Rpb25zJ1xuICAgICAgICBsYXllci5wdXNoICdoaWdobGlnaHRzJ1xuICAgICAgICBsYXllci5wdXNoICdtZXRhJyAgICBpZiAnTWV0YScgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBsYXllci5wdXNoICdsaW5lcydcbiAgICAgICAgbGF5ZXIucHVzaCAnY3Vyc29ycydcbiAgICAgICAgbGF5ZXIucHVzaCAnbnVtYmVycycgaWYgJ051bWJlcnMnIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgQGluaXRMYXllcnMgbGF5ZXJcblxuICAgICAgICBAc2l6ZSA9IHt9XG4gICAgICAgIEBlbGVtID0gQGxheWVyRGljdC5saW5lc1xuXG4gICAgICAgIEBzcGFuQ2FjaGUgPSBbXSAjIGNhY2hlIGZvciByZW5kZXJlZCBsaW5lIHNwYW5zXG4gICAgICAgIEBsaW5lRGl2cyAgPSB7fSAjIG1hcHMgbGluZSBudW1iZXJzIHRvIGRpc3BsYXllZCBkaXZzXG5cbiAgICAgICAgQGNvbmZpZy5saW5lSGVpZ2h0ID89IDEuMlxuXG4gICAgICAgIEBzZXRGb250U2l6ZSBwcmVmcy5nZXQgXCIje0BuYW1lfUZvbnRTaXplXCIsIEBjb25maWcuZm9udFNpemUgPyAxOVxuICAgICAgICBAc2Nyb2xsID0gbmV3IEVkaXRvclNjcm9sbCBAXG4gICAgICAgIEBzY3JvbGwub24gJ3NoaWZ0TGluZXMnIEBzaGlmdExpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3Nob3dMaW5lcycgIEBzaG93TGluZXNcblxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbktleURvd25cblxuICAgICAgICBAaW5pdERyYWcoKSAgICAgICAgXG5cbiAgICAgICAgZm9yIGZlYXR1cmUgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICAgICAgaWYgZmVhdHVyZSA9PSAnQ3Vyc29yTGluZSdcbiAgICAgICAgICAgICAgICBAY3Vyc29yTGluZSA9IGVsZW0gJ2RpdicgY2xhc3M6J2N1cnNvci1saW5lJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZlYXR1cmVOYW1lID0gZmVhdHVyZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgZmVhdHVyZUNsc3MgPSByZXF1aXJlIFwiLi8je2ZlYXR1cmVOYW1lfVwiXG4gICAgICAgICAgICAgICAgQFtmZWF0dXJlTmFtZV0gPSBuZXcgZmVhdHVyZUNsc3MgQFxuXG4gICAgICAgIHBvc3Qub24gJ3NjaGVtZUNoYW5nZWQnIEBvblNjaGVtZUNoYW5nZWRcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBkZWw6IC0+XG5cbiAgICAgICAgcG9zdC5yZW1vdmVMaXN0ZW5lciAnc2NoZW1lQ2hhbmdlZCcgQG9uU2NoZW1lQ2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbGJhcj8uZGVsKClcblxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyBAb25LZXlEb3duXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2JsdXInICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuaW5uZXJIVE1MID0gJydcblxuICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBvbkZvY3VzOiA9PlxuXG4gICAgICAgIEBzdGFydEJsaW5rKClcbiAgICAgICAgQGVtaXQgJ2ZvY3VzJyBAXG4gICAgICAgIHBvc3QuZW1pdCAnZWRpdG9yRm9jdXMnIEBcblxuICAgIG9uQmx1cjogPT5cblxuICAgICAgICBAc3RvcEJsaW5rKClcbiAgICAgICAgQGVtaXQgJ2JsdXInIEBcblxuICAgIG9uU2NoZW1lQ2hhbmdlZDogPT5cblxuICAgICAgICBAc3ludGF4Py5zY2hlbWVDaGFuZ2VkKClcbiAgICAgICAgaWYgQG1pbmltYXBcbiAgICAgICAgICAgIHVwZGF0ZU1pbmltYXAgPSA9PiBAbWluaW1hcD8uZHJhd0xpbmVzKClcbiAgICAgICAgICAgIHNldFRpbWVvdXQgdXBkYXRlTWluaW1hcCwgMTBcblxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAwMDAwMDAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdExheWVyczogKGxheWVyQ2xhc3NlcykgLT5cblxuICAgICAgICBAbGF5ZXJEaWN0ID0ge31cbiAgICAgICAgZm9yIGNscyBpbiBsYXllckNsYXNzZXNcbiAgICAgICAgICAgIEBsYXllckRpY3RbY2xzXSA9IEBhZGRMYXllciBjbHNcblxuICAgIGFkZExheWVyOiAoY2xzKSAtPlxuXG4gICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IGNsc1xuICAgICAgICBAbGF5ZXJzLmFwcGVuZENoaWxkIGRpdlxuICAgICAgICBkaXZcblxuICAgIHVwZGF0ZUxheWVyczogKCkgLT5cblxuICAgICAgICBAcmVuZGVySGlnaGxpZ2h0cygpXG4gICAgICAgIEByZW5kZXJTZWxlY3Rpb24oKVxuICAgICAgICBAcmVuZGVyQ3Vyc29ycygpXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cblxuICAgICAgICBAY2xlYXJMaW5lcygpXG5cbiAgICAgICAgbGluZXMgPz0gW11cblxuICAgICAgICBAc3BhbkNhY2hlID0gW11cbiAgICAgICAgQGxpbmVEaXZzICA9IHt9XG5cbiAgICAgICAgc3VwZXIgbGluZXNcblxuICAgICAgICBAc2Nyb2xsLnJlc2V0KClcblxuICAgICAgICB2aWV3SGVpZ2h0ID0gQHZpZXdIZWlnaHQoKVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC5zdGFydCB2aWV3SGVpZ2h0LCBAbnVtTGluZXMoKVxuXG4gICAgICAgIEBsYXllclNjcm9sbC5zY3JvbGxMZWZ0ID0gMFxuICAgICAgICBAbGF5ZXJzV2lkdGggID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgIEBsYXllcnNIZWlnaHQgPSBAbGF5ZXJTY3JvbGwub2Zmc2V0SGVpZ2h0XG5cbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGFwcGVuZFRleHQ6ICh0ZXh0KSAtPlxuXG4gICAgICAgIGlmIG5vdCB0ZXh0P1xuICAgICAgICAgICAgbG9nIFwiI3tAbmFtZX0uYXBwZW5kVGV4dCAtIG5vIHRleHQ/XCJcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGFwcGVuZGVkID0gW11cbiAgICAgICAgbHMgPSB0ZXh0Py5zcGxpdCAvXFxuL1xuXG4gICAgICAgIGZvciBsIGluIGxzXG4gICAgICAgICAgICBAc3RhdGUgPSBAc3RhdGUuYXBwZW5kTGluZSBsXG4gICAgICAgICAgICBhcHBlbmRlZC5wdXNoIEBudW1MaW5lcygpLTFcblxuICAgICAgICBpZiBAc2Nyb2xsLnZpZXdIZWlnaHQgIT0gQHZpZXdIZWlnaHQoKVxuICAgICAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IEB2aWV3SGVpZ2h0KClcblxuICAgICAgICBzaG93TGluZXMgPSAoQHNjcm9sbC5ib3QgPCBAc2Nyb2xsLnRvcCkgb3IgKEBzY3JvbGwuYm90IDwgQHNjcm9sbC52aWV3TGluZXMpXG5cbiAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAbnVtTGluZXMoKSwgc2hvd0xpbmVzOnNob3dMaW5lc1xuXG4gICAgICAgIGZvciBsaSBpbiBhcHBlbmRlZFxuICAgICAgICAgICAgQGVtaXQgJ2xpbmVBcHBlbmRlZCcsXG4gICAgICAgICAgICAgICAgbGluZUluZGV4OiBsaVxuICAgICAgICAgICAgICAgIHRleHQ6IEBsaW5lIGxpXG5cbiAgICAgICAgQGVtaXQgJ2xpbmVzQXBwZW5kZWQnIGxzXG4gICAgICAgIEBlbWl0ICdudW1MaW5lcycgQG51bUxpbmVzKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzZXRGb250U2l6ZTogKGZvbnRTaXplKSA9PlxuICAgICAgICBcbiAgICAgICAgQGxheWVycy5zdHlsZS5mb250U2l6ZSA9IFwiI3tmb250U2l6ZX1weFwiXG4gICAgICAgIEBzaXplLm51bWJlcnNXaWR0aCA9ICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzIGFuZCA1MCBvciAwXG4gICAgICAgIEBzaXplLmZvbnRTaXplICAgICA9IGZvbnRTaXplXG4gICAgICAgIEBzaXplLmxpbmVIZWlnaHQgICA9IE1hdGguZmxvb3IgZm9udFNpemUgKiBAY29uZmlnLmxpbmVIZWlnaHRcbiAgICAgICAgQHNpemUuY2hhcldpZHRoICAgID0gZm9udFNpemUgKiAwLjZcbiAgICAgICAgQHNpemUub2Zmc2V0WCAgICAgID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICBAc2l6ZS5vZmZzZXRYICAgICAgPSBNYXRoLm1heCBAc2l6ZS5vZmZzZXRYLCAoQHNjcmVlblNpemUoKS53aWR0aCAtIEBzY3JlZW5TaXplKCkuaGVpZ2h0KSAvIDIgaWYgQHNpemUuY2VudGVyVGV4dFxuXG4gICAgICAgIEBzY3JvbGw/LnNldExpbmVIZWlnaHQgQHNpemUubGluZUhlaWdodFxuXG4gICAgICAgIEBlbWl0ICdmb250U2l6ZUNoYW5nZWQnICMgbnVtYmVyc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIEBzeW50YXguY2hhbmdlZCBjaGFuZ2VJbmZvXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIFtkaSxsaSxjaF0gPSBbY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5uZXdJbmRleCwgY2hhbmdlLmNoYW5nZV1cbiAgICAgICAgICAgIHN3aXRjaCBjaFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZUNoYW5nZWQnIGxpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lRGVsZXRlZCcgZGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lSW5zZXJ0ZWQnIGxpLCBkaVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uaW5zZXJ0cyBvciBjaGFuZ2VJbmZvLmRlbGV0ZXNcbiAgICAgICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAbnVtTGluZXMoKVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIEBjbGVhckhpZ2hsaWdodHMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY3Vyc29yc1xuICAgICAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG4gICAgICAgICAgICBAZW1pdCAnY3Vyc29yJ1xuICAgICAgICAgICAgQHN1c3BlbmRCbGluaygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5zZWxlY3RzXG4gICAgICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICAgICAgQGVtaXQgJ2NoYW5nZWQnIGNoYW5nZUluZm9cblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGVMaW5lOiAobGksIG9pKSAtPlxuXG4gICAgICAgIG9pID0gbGkgaWYgbm90IG9pP1xuXG4gICAgICAgIGlmIGxpIDwgQHNjcm9sbC50b3Agb3IgbGkgPiBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAga2Vycm9yIFwiZGFuZ2xpbmcgbGluZSBkaXY/ICN7bGl9XCIsIEBsaW5lRGl2c1tsaV0gaWYgQGxpbmVEaXZzW2xpXT9cbiAgICAgICAgICAgIGRlbGV0ZSBAc3BhbkNhY2hlW2xpXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcInVwZGF0ZUxpbmUgLSBvdXQgb2YgYm91bmRzPyBsaSAje2xpfSBvaSAje29pfVwiIGlmIG5vdCBAbGluZURpdnNbb2ldXG5cbiAgICAgICAgQHNwYW5DYWNoZVtsaV0gPSByZW5kZXIubGluZVNwYW4gQHN5bnRheC5nZXREaXNzKGxpKSwgQHNpemVcblxuICAgICAgICBkaXYgPSBAbGluZURpdnNbb2ldXG4gICAgICAgIGRpdi5yZXBsYWNlQ2hpbGQgQHNwYW5DYWNoZVtsaV0sIGRpdi5maXJzdENoaWxkXG4gICAgICAgIFxuICAgIHJlZnJlc2hMaW5lczogKHRvcCwgYm90KSAtPlxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQHN5bnRheC5nZXREaXNzIGxpLCB0cnVlXG4gICAgICAgICAgICBAdXBkYXRlTGluZSBsaVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzaG93TGluZXM6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBhcHBlbmRMaW5lIGxpXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQGVtaXQgJ2xpbmVzRXhwb3NlZCcgdG9wOnRvcCwgYm90OmJvdCwgbnVtOm51bVxuICAgICAgICBAZW1pdCAnbGluZXNTaG93bicgdG9wLCBib3QsIG51bVxuXG4gICAgYXBwZW5kTGluZTogKGxpKSAtPlxuXG4gICAgICAgIEBsaW5lRGl2c1tsaV0gPSBlbGVtIGNsYXNzOiAnbGluZSdcbiAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBAY2FjaGVkU3BhbiBsaVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZURpdnNbbGldXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNoaWZ0TGluZXM6ICh0b3AsIGJvdCwgbnVtKSA9PlxuICAgICAgICBcbiAgICAgICAgb2xkVG9wID0gdG9wIC0gbnVtXG4gICAgICAgIG9sZEJvdCA9IGJvdCAtIG51bVxuXG4gICAgICAgIGRpdkludG8gPSAobGksbG8pID0+XG5cbiAgICAgICAgICAgIGlmIG5vdCBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICAgICAgbG9nIFwiI3tAbmFtZX0uc2hpZnRMaW5lcy5kaXZJbnRvIC0gbm8gZGl2PyAje3RvcH0gI3tib3R9ICN7bnVtfSBvbGQgI3tvbGRUb3B9ICN7b2xkQm90fSBsbyAje2xvfSBsaSAje2xpfVwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0gPSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBkZWxldGUgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5yZXBsYWNlQ2hpbGQgQGNhY2hlZFNwYW4obGkpLCBAbGluZURpdnNbbGldLmZpcnN0Q2hpbGRcblxuICAgICAgICAgICAgaWYgQHNob3dJbnZpc2libGVzXG4gICAgICAgICAgICAgICAgdHggPSBAbGluZShsaSkubGVuZ3RoICogQHNpemUuY2hhcldpZHRoICsgMVxuICAgICAgICAgICAgICAgIHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczogXCJpbnZpc2libGUgbmV3bGluZVwiLCBodG1sOiAnJiM5Njg3J1xuICAgICAgICAgICAgICAgIHNwYW4uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoI3t0eH1weCwgLTEuNXB4KVwiXG4gICAgICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBzcGFuXG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgd2hpbGUgb2xkQm90IDwgYm90XG4gICAgICAgICAgICAgICAgb2xkQm90ICs9IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZEJvdCwgb2xkVG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wICs9IDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgb2xkVG9wID4gdG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wIC09IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZFRvcCwgb2xkQm90XG4gICAgICAgICAgICAgICAgb2xkQm90IC09IDFcblxuICAgICAgICBAZW1pdCAnbGluZXNTaGlmdGVkJyB0b3AsIGJvdCwgbnVtXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGVMaW5lUG9zaXRpb25zOiAoYW5pbWF0ZT0wKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGxpLCBkaXYgb2YgQGxpbmVEaXZzXG4gICAgICAgICAgICBpZiBub3QgZGl2PyBcbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBkaXY/JyBsaVxuICAgICAgICAgICAgaWYgbm90IGRpdi5zdHlsZT9cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBkaXYuc3R5bGU/JyBsaSwgXy5pc0VsZW1lbnQoZGl2KSwgdHlwZW9mIGRpdlxuICAgICAgICAgICAgeSA9IEBzaXplLmxpbmVIZWlnaHQgKiAobGkgLSBAc2Nyb2xsLnRvcClcbiAgICAgICAgICAgIGRpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZTNkKCN7QHNpemUub2Zmc2V0WH1weCwje3l9cHgsIDApXCJcbiAgICAgICAgICAgIGRpdi5zdHlsZS50cmFuc2l0aW9uID0gXCJhbGwgI3thbmltYXRlLzEwMDB9c1wiIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIGRpdi5zdHlsZS56SW5kZXggPSBsaVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIHJlc2V0VHJhbnMgPSA9PlxuICAgICAgICAgICAgICAgIGZvciBjIGluIEBlbGVtLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgIGMuc3R5bGUudHJhbnNpdGlvbiA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgc2V0VGltZW91dCByZXNldFRyYW5zLCBhbmltYXRlXG5cbiAgICB1cGRhdGVMaW5lczogKCkgLT5cblxuICAgICAgICBmb3IgbGkgaW4gW0BzY3JvbGwudG9wLi5Ac2Nyb2xsLmJvdF1cbiAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpXG5cbiAgICBjbGVhckhpZ2hsaWdodHM6ICgpIC0+XG5cbiAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgJCgnLmhpZ2hsaWdodHMnIEBsYXllcnMpLmlubmVySFRNTCA9ICcnXG4gICAgICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2FjaGVkU3BhbjogKGxpKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAc3BhbkNhY2hlW2xpXVxuXG4gICAgICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldXG5cbiAgICByZW5kZXJDdXJzb3JzOiAtPlxuXG4gICAgICAgIGNzID0gW11cbiAgICAgICAgZm9yIGMgaW4gQGN1cnNvcnMoKVxuICAgICAgICAgICAgaWYgY1sxXSA+PSBAc2Nyb2xsLnRvcCBhbmQgY1sxXSA8PSBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAgICAgIGNzLnB1c2ggW2NbMF0sIGNbMV0gLSBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA9PSAxXG5cbiAgICAgICAgICAgIGlmIGNzLmxlbmd0aCA9PSAxXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbWNbMV0gPCAwXG5cbiAgICAgICAgICAgICAgICBpZiBtY1sxXSA+IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIiN7QG5hbWV9LnJlbmRlckN1cnNvcnMgbWFpbkN1cnNvciBEQUZVSz9cIiwgQG51bUxpbmVzKCksIHN0ciBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgICAgICAgICByaSA9IG1jWzFdLUBzY3JvbGwudG9wXG4gICAgICAgICAgICAgICAgY3Vyc29yTGluZSA9IEBzdGF0ZS5saW5lKG1jWzFdKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIG1haW4gY3Vyc29yIGxpbmU/JyBpZiBub3QgY3Vyc29yTGluZT9cbiAgICAgICAgICAgICAgICBpZiBtY1swXSA+IGN1cnNvckxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ3ZpcnR1YWwnXG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2ggW2N1cnNvckxpbmUubGVuZ3RoLCByaSwgJ21haW4gb2ZmJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ21haW4gb2ZmJ1xuXG4gICAgICAgIGVsc2UgaWYgQG51bUN1cnNvcnMoKSA+IDFcblxuICAgICAgICAgICAgdmMgPSBbXSAjIHZpcnR1YWwgY3Vyc29yc1xuICAgICAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgQG1haW5DdXJzb3IoKSwgW2NbMF0sIGNbMV0gKyBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICAgICAgY1syXSA9ICdtYWluJ1xuICAgICAgICAgICAgICAgIGxpbmUgPSBAbGluZShAc2Nyb2xsLnRvcCtjWzFdKVxuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB2Yy5wdXNoIFtsaW5lLmxlbmd0aCwgY1sxXSwgJ3ZpcnR1YWwnXVxuICAgICAgICAgICAgY3MgPSBjcy5jb25jYXQgdmNcblxuICAgICAgICBodG1sID0gcmVuZGVyLmN1cnNvcnMgY3MsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3QuY3Vyc29ycy5pbm5lckhUTUwgPSBodG1sXG4gICAgICAgIFxuICAgICAgICB0eSA9IChtY1sxXSAtIEBzY3JvbGwudG9wKSAqIEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJzb3JMaW5lXG4gICAgICAgICAgICBAY3Vyc29yTGluZS5zdHlsZSA9IFwiei1pbmRleDowO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgwLCN7dHl9cHgsMCk7IGhlaWdodDoje0BzaXplLmxpbmVIZWlnaHR9cHg7XCJcbiAgICAgICAgICAgIEBsYXllcnMuaW5zZXJ0QmVmb3JlIEBjdXJzb3JMaW5lLCBAbGF5ZXJzLmZpcnN0Q2hpbGRcblxuICAgIHJlbmRlclNlbGVjdGlvbjogLT5cblxuICAgICAgICBoID0gXCJcIlxuICAgICAgICBzID0gQHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleCBbQHNjcm9sbC50b3AsIEBzY3JvbGwuYm90XSwgQHNjcm9sbC50b3BcbiAgICAgICAgaWYgc1xuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3Quc2VsZWN0aW9ucy5pbm5lckhUTUwgPSBoXG5cbiAgICByZW5kZXJIaWdobGlnaHRzOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIHMgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICBpZiBzXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemUsIFwiaGlnaGxpZ2h0XCJcbiAgICAgICAgQGxheWVyRGljdC5oaWdobGlnaHRzLmlubmVySFRNTCA9IGhcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY3Vyc29yRGl2OiAtPiAkICcuY3Vyc29yLm1haW4nIEBsYXllckRpY3RbJ2N1cnNvcnMnXVxuXG4gICAgc3VzcGVuZEJsaW5rOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGJsaW5rVGltZXJcbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAc3VzcGVuZFRpbWVyID0gc2V0VGltZW91dCBAcmVsZWFzZUJsaW5rLCBibGlua0RlbGF5WzBdXG5cbiAgICByZWxlYXNlQmxpbms6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzdXNwZW5kVGltZXJcbiAgICAgICAgZGVsZXRlIEBzdXNwZW5kVGltZXJcbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuXG4gICAgdG9nZ2xlQmxpbms6IC0+XG5cbiAgICAgICAgYmxpbmsgPSBub3QgcHJlZnMuZ2V0ICdibGluaycgZmFsc2VcbiAgICAgICAgcHJlZnMuc2V0ICdibGluaycgYmxpbmtcbiAgICAgICAgaWYgYmxpbmtcbiAgICAgICAgICAgIEBzdGFydEJsaW5rKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHN0b3BCbGluaygpXG5cbiAgICBkb0JsaW5rOiA9PlxuXG4gICAgICAgIEBibGluayA9IG5vdCBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIEBibGlua1xuICAgICAgICBAbWluaW1hcD8uZHJhd01haW5DdXJzb3IgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgYmxpbmtEZWxheSA9IHByZWZzLmdldCAnY3Vyc29yQmxpbmtEZWxheScgWzgwMCwyMDBdXG4gICAgICAgIEBibGlua1RpbWVyID0gc2V0VGltZW91dCBAZG9CbGluaywgQGJsaW5rIGFuZCBibGlua0RlbGF5WzFdIG9yIGJsaW5rRGVsYXlbMF1cblxuICAgIHN0YXJ0Qmxpbms6IC0+IFxuICAgIFxuICAgICAgICBpZiBub3QgQGJsaW5rVGltZXIgYW5kIHByZWZzLmdldCAnYmxpbmsnXG4gICAgICAgICAgICBAZG9CbGluaygpIFxuXG4gICAgc3RvcEJsaW5rOiAtPlxuXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgZGVsZXRlIEBibGlua1RpbWVyXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHJlc2l6ZWQ6IC0+XG5cbiAgICAgICAgdmggPSBAdmlldy5jbGllbnRIZWlnaHRcblxuICAgICAgICByZXR1cm4gaWYgdmggPT0gQHNjcm9sbC52aWV3SGVpZ2h0XG5cbiAgICAgICAgQG51bWJlcnM/LmVsZW0uc3R5bGUuaGVpZ2h0ID0gXCIje0BzY3JvbGwuZXhwb3NlTnVtICogQHNjcm9sbC5saW5lSGVpZ2h0fXB4XCJcbiAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG5cbiAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IHZoXG5cbiAgICAgICAgQGVtaXQgJ3ZpZXdIZWlnaHQnIHZoXG5cbiAgICBzY3JlZW5TaXplOiAtPiBlbGVjdHJvbi5yZW1vdGUuc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIHBvc0F0WFk6KHgseSkgLT5cblxuICAgICAgICBzbCA9IEBsYXllclNjcm9sbC5zY3JvbGxMZWZ0XG4gICAgICAgIHN0ID0gQHNjcm9sbC5vZmZzZXRUb3BcbiAgICAgICAgYnIgPSBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBseCA9IGNsYW1wIDAsIEBsYXllcnMub2Zmc2V0V2lkdGgsICB4IC0gYnIubGVmdCAtIEBzaXplLm9mZnNldFggKyBAc2l6ZS5jaGFyV2lkdGgvM1xuICAgICAgICBseSA9IGNsYW1wIDAsIEBsYXllcnMub2Zmc2V0SGVpZ2h0LCB5IC0gYnIudG9wXG4gICAgICAgIHB4ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigoTWF0aC5tYXgoMCwgc2wgKyBseCkpL0BzaXplLmNoYXJXaWR0aCkpXG4gICAgICAgIHB5ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigoTWF0aC5tYXgoMCwgc3QgKyBseSkpL0BzaXplLmxpbmVIZWlnaHQpKSArIEBzY3JvbGwudG9wXG4gICAgICAgIHAgID0gW3B4LCBNYXRoLm1pbihAbnVtTGluZXMoKS0xLCBweSldXG4gICAgICAgIHBcblxuICAgIHBvc0ZvckV2ZW50OiAoZXZlbnQpIC0+IEBwb3NBdFhZIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFlcblxuICAgIGxpbmVFbGVtQXRYWTooeCx5KSAtPlxuXG4gICAgICAgIHAgPSBAcG9zQXRYWSB4LHlcbiAgICAgICAgQGxpbmVEaXZzW3BbMV1dXG5cbiAgICBsaW5lU3BhbkF0WFk6KHgseSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmVFbGVtID0gQGxpbmVFbGVtQXRYWSB4LHlcbiAgICAgICAgICAgIGxyID0gbGluZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIGZvciBlIGluIGxpbmVFbGVtLmZpcnN0Q2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBiciA9IGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgICAgICBpZiBici5sZWZ0IDw9IHggPD0gYnIubGVmdCtici53aWR0aFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB4LWJyLmxlZnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwYW46ZSwgb2Zmc2V0TGVmdDpvZmZzZXQsIG9mZnNldENoYXI6cGFyc2VJbnQgb2Zmc2V0L0BzaXplLmNoYXJXaWR0aFxuICAgICAgICBudWxsXG5cbiAgICAjIG51bUZ1bGxMaW5lczogLT4gTWF0aC5mbG9vcihAdmlld0hlaWdodCgpIC8gQHNpemUubGluZUhlaWdodClcbiAgICBudW1GdWxsTGluZXM6IC0+IEBzY3JvbGwuZnVsbExpbmVzXG4gICAgXG4gICAgdmlld0hlaWdodDogLT4gXG4gICAgICAgIFxuICAgICAgICBpZiBAc2Nyb2xsPy52aWV3SGVpZ2h0ID49IDAgdGhlbiByZXR1cm4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgIEB2aWV3Py5jbGllbnRIZWlnaHRcblxuICAgIGNsZWFyTGluZXM6ID0+XG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG5cbiAgICBjbGVhcjogPT4gXG4gICAgICAgIEBzZXRMaW5lcyBbXVxuXG4gICAgZm9jdXM6IC0+IEB2aWV3LmZvY3VzKClcblxuICAgICMgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuXG4gICAgaW5pdERyYWc6IC0+XG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGxheWVyU2Nyb2xsXG5cbiAgICAgICAgICAgIG9uU3RhcnQ6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAdmlldy5mb2N1cygpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGV2ZW50UG9zID0gQHBvc0ZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgICAgICAgICBpZiBldmVudC5idXR0b24gPT0gMlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBldmVudC5idXR0b24gPT0gMVxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgQGp1bXBUb0ZpbGVBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICAgICAgQGp1bXBUb1dvcmRBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBldmVudFBvcywgQGNsaWNrUG9zXG4gICAgICAgICAgICAgICAgICAgICAgICBAc3RhcnRDbGlja1RpbWVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZSA9IEByYW5nZUZvcldvcmRBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXkgb3IgQHN0aWNreVNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBAc2VsZWN0U2luZ2xlUmFuZ2UgcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGhpZ2hsaWdodFdvcmRBbmRBZGRUb1NlbGVjdGlvbiAnc2tpcFNjcm9sbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gQHJhbmdlRm9yTGluZUF0SW5kZXggQGNsaWNrUG9zWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBvbkNsaWNrVGltZW91dCgpXG5cbiAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCA9IDFcbiAgICAgICAgICAgICAgICBAY2xpY2tQb3MgPSBldmVudFBvc1xuICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuXG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIEBjbGlja0F0UG9zIHAsIGV2ZW50XG5cbiAgICAgICAgICAgIG9uTW92ZTogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBbQG1haW5DdXJzb3IoKVswXSwgcFsxXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6dHJ1ZVxuXG4gICAgICAgICAgICBvblN0b3A6ID0+XG4gICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKSBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBlbXB0eSBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgc3RhcnRDbGlja1RpbWVyOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tUaW1lciA9IHNldFRpbWVvdXQgQG9uQ2xpY2tUaW1lb3V0LCBAc3RpY2t5U2VsZWN0aW9uIGFuZCAzMDAgb3IgMTAwMFxuXG4gICAgb25DbGlja1RpbWVvdXQ6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja0NvdW50ICA9IDBcbiAgICAgICAgQGNsaWNrVGltZXIgID0gbnVsbFxuICAgICAgICBAY2xpY2tQb3MgICAgPSBudWxsXG5cbiAgICBmdW5jSW5mb0F0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJyBAY3VycmVudEZpbGVcbiAgICAgICAgZmlsZUluZm8gPSBmaWxlc1tAY3VycmVudEZpbGVdXG4gICAgICAgIGZvciBmdW5jIGluIGZpbGVJbmZvLmZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLmxpbmUgPD0gbGkgPD0gZnVuYy5sYXN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2xhc3MgKyAnLicgKyBmdW5jLm5hbWUgKyAnICdcbiAgICAgICAgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQuYWx0S2V5XG4gICAgICAgICAgICBAdG9nZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICBlbHNlIGlmIGV2ZW50Lm1ldGFLZXkgb3IgZXZlbnQuY3RybEtleVxuICAgICAgICAgICAgQGp1bXBUb1dvcmRBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgaWYgZXZlbnQuY3RybEtleVxuICAgICAgICAgICAgICAgICMgQGxvZyBqc2JlYXV0eS5odG1sX2JlYXV0aWZ5IEBsaW5lRGl2c1twWzFdXS5maXJzdENoaWxkLmlubmVySFRNTCwgaW5kZW50X3NpemU6MiAsIHByZXNlcnZlX25ld2xpbmVzOmZhbHNlLCB3cmFwX2xpbmVfbGVuZ3RoOjIwMCwgdW5mb3JtYXR0ZWQ6IFtdXG4gICAgICAgICAgICAgICAgIyBAbG9nIEBsaW5lIHBbMV1cbiAgICAgICAgICAgICAgICAjIEBzeW50YXgubmV3RGlzcyBwWzFdXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcCwgZXh0ZW5kOmV2ZW50LnNoaWZ0S2V5XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYXV0b2NvbXBsZXRlP1xuICAgICAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEBhdXRvY29tcGxldGUuaGFuZGxlTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgdGhlbiByZXR1cm4gJ3VuaGFuZGxlZCcgIyBoYXMgY2hhciBzZXQgb24gd2luZG93cz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBzYWx0ZXJNb2RlICAgICAgICAgIHRoZW4gcmV0dXJuIEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgICAgICAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKSAgICAgdGhlbiByZXR1cm4gQGNsZWFySGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA+IDEgICAgdGhlbiByZXR1cm4gQGNsZWFyQ3Vyc29ycygpXG4gICAgICAgICAgICAgICAgaWYgQHN0aWNreVNlbGVjdGlvbiAgICAgdGhlbiByZXR1cm4gQGVuZFN0aWNreVNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSAgICAgdGhlbiByZXR1cm4gQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJyAnY3RybCtlbnRlcicgJ2YxMicgdGhlbiBAanVtcFRvV29yZCgpXG5cbiAgICAgICAgZm9yIGFjdGlvbiBpbiBFZGl0b3IuYWN0aW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uY29tYm8gPT0gY29tYm8gb3IgYWN0aW9uLmFjY2VsID09IGNvbWJvXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgJ2NvbW1hbmQrYScgdGhlbiByZXR1cm4gQHNlbGVjdEFsbCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uYWNjZWxzPyBhbmQgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJ1xuICAgICAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uYWNjZWxzXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgYWN0aW9uLmNvbWJvcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5jb21ib3NcbiAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGNoYXIgYW5kIG1vZCBpbiBbXCJzaGlmdFwiLCBcIlwiXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gQGluc2VydENoYXJhY3RlciBjaGFyXG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uS2V5RG93bjogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuICAgICAgICByZXR1cm4gaWYga2V5ID09ICdyaWdodCBjbGljaycgIyB3ZWlyZCByaWdodCBjb21tYW5kIGtleVxuXG4gICAgICAgIHJlc3VsdCA9IEBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudCBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gcmVzdWx0XG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGxvZzogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBuYW1lICE9ICdlZGl0b3InXG4gICAgICAgIGtsb2cuc2xvZy5kZXB0aCA9IDNcbiAgICAgICAga2xvZy5hcHBseSBrbG9nLCBbXS5zcGxpY2UuY2FsbCBhcmd1bWVudHMsIDBcbiAgICAgICAga2xvZy5zbG9nLmRlcHRoID0gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/texteditor.coffee