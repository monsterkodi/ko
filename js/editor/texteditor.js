// koffee 1.6.0

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
                    klog(_this.name + ".shiftLines.divInto - no div? " + top + " " + bot + " " + num + " old " + oldTop + " " + oldBot + " lo " + lo + " li " + li);
                    return;
                }
                if (!_.isElement(_this.lineDivs[lo])) {
                    klog(_this.name + ".shiftLines.divInto - no element? " + top + " " + bot + " " + num + " old " + oldTop + " " + oldBot + " lo " + lo + " li " + li);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3RixPQUFBLENBQVEsS0FBUixDQUF4RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsaUJBQTVCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsZUFBdkQsRUFBNkQsV0FBN0QsRUFBaUUsbUJBQWpFLEVBQXlFLGVBQXpFLEVBQStFLFNBQS9FLEVBQWtGOztBQUVsRixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxhQUFSOztBQUNmLFFBQUEsR0FBZSxPQUFBLENBQVEsVUFBUjs7QUFFVDs7O0lBRUMsb0JBQUMsUUFBRCxFQUFXLE1BQVg7Ozs7Ozs7Ozs7Ozs7O0FBRUMsWUFBQTtRQUFBLElBQUEsR0FBTztRQUNQLElBQXVCLElBQUssQ0FBQSxDQUFBLENBQUwsS0FBVyxHQUFsQztZQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsRUFBUDs7UUFFQSw0Q0FBTSxJQUFOLEVBQVksTUFBWjtRQUVBLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFFZCxJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxRQUFGO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBZSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFFBQU47U0FBTDtRQUNmLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxhQUFOO1lBQW9CLEtBQUEsRUFBTSxJQUFDLENBQUEsTUFBM0I7U0FBTDtRQUNmLElB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QVUsR0FBQSxLQUFPLGFBQWpCO0FBQUEsbUJBQUE7O1FBRUEsTUFBQSxHQUFTLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixHQUE1QixFQUFpQyxHQUFqQyxFQUFzQyxLQUF0QyxFQUE2QyxJQUE3QyxFQUFtRCxLQUFuRDtRQUVULElBQUcsV0FBQSxLQUFlLE1BQWxCO21CQUNJLFNBQUEsQ0FBVSxLQUFWLEVBREo7O0lBVE87O3lCQVlYLEdBQUEsR0FBSyxTQUFBO1FBQ0QsSUFBVSxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQW5CO0FBQUEsbUJBQUE7O1FBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFWLEdBQWtCO1FBQ2xCLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixFQUFFLENBQUMsTUFBTSxDQUFDLElBQVYsQ0FBZSxTQUFmLEVBQTBCLENBQTFCLENBQWpCO2VBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFWLEdBQWtCO0lBSmpCOzs7O0dBcHZCZ0I7O0FBMHZCekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwga2V5aW5mbywgcHJlZnMsIGNsYW1wLCBlbXB0eSwgZWxlbSwgZHJhZywgb3MsIGtlcnJvciwga2xvZywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuICBcbnJlbmRlciAgICAgICA9IHJlcXVpcmUgJy4vcmVuZGVyJ1xuRWRpdG9yU2Nyb2xsID0gcmVxdWlyZSAnLi9lZGl0b3JzY3JvbGwnXG5FZGl0b3IgICAgICAgPSByZXF1aXJlICcuL2VkaXRvcidcbmpzYmVhdXR5ICAgICA9IHJlcXVpcmUgJ2pzLWJlYXV0aWZ5J1xuZWxlY3Ryb24gICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIFRleHRFZGl0b3IgZXh0ZW5kcyBFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSwgY29uZmlnKSAtPlxuXG4gICAgICAgIG5hbWUgPSB2aWV3RWxlbVxuICAgICAgICBuYW1lID0gbmFtZS5zbGljZSAxIGlmIG5hbWVbMF0gPT0gJy4nXG5cbiAgICAgICAgc3VwZXIgbmFtZSwgY29uZmlnXG5cbiAgICAgICAgQGNsaWNrQ291bnQgPSAwXG5cbiAgICAgICAgQHZpZXcgPSQgdmlld0VsZW1cblxuICAgICAgICBAbGF5ZXJzICAgICAgPSBlbGVtIGNsYXNzOlwibGF5ZXJzXCJcbiAgICAgICAgQGxheWVyU2Nyb2xsID0gZWxlbSBjbGFzczpcImxheWVyU2Nyb2xsXCIgY2hpbGQ6QGxheWVyc1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAbGF5ZXJTY3JvbGxcblxuICAgICAgICBsYXllciA9IFtdXG4gICAgICAgIGxheWVyLnB1c2ggJ3NlbGVjdGlvbnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2hpZ2hsaWdodHMnXG4gICAgICAgIGxheWVyLnB1c2ggJ21ldGEnICAgIGlmICdNZXRhJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIGxheWVyLnB1c2ggJ2xpbmVzJ1xuICAgICAgICBsYXllci5wdXNoICdjdXJzb3JzJ1xuICAgICAgICBsYXllci5wdXNoICdudW1iZXJzJyBpZiAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBAaW5pdExheWVycyBsYXllclxuXG4gICAgICAgIEBzaXplID0ge31cbiAgICAgICAgQGVsZW0gPSBAbGF5ZXJEaWN0LmxpbmVzXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdICMgY2FjaGUgZm9yIHJlbmRlcmVkIGxpbmUgc3BhbnNcbiAgICAgICAgQGxpbmVEaXZzICA9IHt9ICMgbWFwcyBsaW5lIG51bWJlcnMgdG8gZGlzcGxheWVkIGRpdnNcblxuICAgICAgICBAY29uZmlnLmxpbmVIZWlnaHQgPz0gMS4yXG5cbiAgICAgICAgQHNldEZvbnRTaXplIHByZWZzLmdldCBcIiN7QG5hbWV9Rm9udFNpemVcIiwgQGNvbmZpZy5mb250U2l6ZSA/IDE5XG4gICAgICAgIEBzY3JvbGwgPSBuZXcgRWRpdG9yU2Nyb2xsIEBcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hpZnRMaW5lcycgQHNoaWZ0TGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hvd0xpbmVzJyAgQHNob3dMaW5lc1xuXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInICAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uS2V5RG93blxuXG4gICAgICAgIEBpbml0RHJhZygpICAgICAgICBcblxuICAgICAgICBmb3IgZmVhdHVyZSBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgICAgICBpZiBmZWF0dXJlID09ICdDdXJzb3JMaW5lJ1xuICAgICAgICAgICAgICAgIEBjdXJzb3JMaW5lID0gZWxlbSAnZGl2JyBjbGFzczonY3Vyc29yLWxpbmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmVhdHVyZU5hbWUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBmZWF0dXJlQ2xzcyA9IHJlcXVpcmUgXCIuLyN7ZmVhdHVyZU5hbWV9XCJcbiAgICAgICAgICAgICAgICBAW2ZlYXR1cmVOYW1lXSA9IG5ldyBmZWF0dXJlQ2xzcyBAXG5cbiAgICAgICAgcG9zdC5vbiAnc2NoZW1lQ2hhbmdlZCcgQG9uU2NoZW1lQ2hhbmdlZFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGRlbDogLT5cblxuICAgICAgICBwb3N0LnJlbW92ZUxpc3RlbmVyICdzY2hlbWVDaGFuZ2VkJyBAb25TY2hlbWVDaGFuZ2VkXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsYmFyPy5kZWwoKVxuXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2tleWRvd24nIEBvbktleURvd25cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdmb2N1cycgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIG9uRm9jdXM6ID0+XG5cbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBAZW1pdCAnZm9jdXMnIEBcbiAgICAgICAgcG9zdC5lbWl0ICdlZGl0b3JGb2N1cycgQFxuXG4gICAgb25CbHVyOiA9PlxuXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAZW1pdCAnYmx1cicgQFxuXG4gICAgb25TY2hlbWVDaGFuZ2VkOiA9PlxuXG4gICAgICAgIEBzeW50YXg/LnNjaGVtZUNoYW5nZWQoKVxuICAgICAgICBpZiBAbWluaW1hcFxuICAgICAgICAgICAgdXBkYXRlTWluaW1hcCA9ID0+IEBtaW5pbWFwPy5kcmF3TGluZXMoKVxuICAgICAgICAgICAgc2V0VGltZW91dCB1cGRhdGVNaW5pbWFwLCAxMFxuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMDAwMDAwMCAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0TGF5ZXJzOiAobGF5ZXJDbGFzc2VzKSAtPlxuXG4gICAgICAgIEBsYXllckRpY3QgPSB7fVxuICAgICAgICBmb3IgY2xzIGluIGxheWVyQ2xhc3Nlc1xuICAgICAgICAgICAgQGxheWVyRGljdFtjbHNdID0gQGFkZExheWVyIGNsc1xuXG4gICAgYWRkTGF5ZXI6IChjbHMpIC0+XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogY2xzXG4gICAgICAgIEBsYXllcnMuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgIGRpdlxuXG4gICAgdXBkYXRlTGF5ZXJzOiAoKSAtPlxuXG4gICAgICAgIEByZW5kZXJIaWdobGlnaHRzKClcbiAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgIEByZW5kZXJDdXJzb3JzKClcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBjbGVhckxpbmVzKClcblxuICAgICAgICBsaW5lcyA/PSBbXVxuXG4gICAgICAgIEBzcGFuQ2FjaGUgPSBbXVxuICAgICAgICBAbGluZURpdnMgID0ge31cblxuICAgICAgICBzdXBlciBsaW5lc1xuXG4gICAgICAgIEBzY3JvbGwucmVzZXQoKVxuXG4gICAgICAgIHZpZXdIZWlnaHQgPSBAdmlld0hlaWdodCgpXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnN0YXJ0IHZpZXdIZWlnaHQsIEBudW1MaW5lcygpXG5cbiAgICAgICAgQGxheWVyU2Nyb2xsLnNjcm9sbExlZnQgPSAwXG4gICAgICAgIEBsYXllcnNXaWR0aCAgPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcbiAgICAgICAgQGxheWVyc0hlaWdodCA9IEBsYXllclNjcm9sbC5vZmZzZXRIZWlnaHRcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYXBwZW5kVGV4dDogKHRleHQpIC0+XG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5hcHBlbmRUZXh0IC0gbm8gdGV4dD9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgYXBwZW5kZWQgPSBbXVxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5hcHBlbmRMaW5lIGxcbiAgICAgICAgICAgIGFwcGVuZGVkLnB1c2ggQG51bUxpbmVzKCktMVxuXG4gICAgICAgIGlmIEBzY3JvbGwudmlld0hlaWdodCAhPSBAdmlld0hlaWdodCgpXG4gICAgICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgQHZpZXdIZWlnaHQoKVxuXG4gICAgICAgIHNob3dMaW5lcyA9IChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudG9wKSBvciAoQHNjcm9sbC5ib3QgPCBAc2Nyb2xsLnZpZXdMaW5lcylcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpLCBzaG93TGluZXM6c2hvd0xpbmVzXG5cbiAgICAgICAgZm9yIGxpIGluIGFwcGVuZGVkXG4gICAgICAgICAgICBAZW1pdCAnbGluZUFwcGVuZGVkJyxcbiAgICAgICAgICAgICAgICBsaW5lSW5kZXg6IGxpXG4gICAgICAgICAgICAgICAgdGV4dDogQGxpbmUgbGlcblxuICAgICAgICBAZW1pdCAnbGluZXNBcHBlbmRlZCcgbHNcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyBAbnVtTGluZXMoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHNldEZvbnRTaXplOiAoZm9udFNpemUpID0+XG4gICAgICAgIFxuICAgICAgICBAbGF5ZXJzLnN0eWxlLmZvbnRTaXplID0gXCIje2ZvbnRTaXplfXB4XCJcbiAgICAgICAgQHNpemUubnVtYmVyc1dpZHRoID0gJ051bWJlcnMnIGluIEBjb25maWcuZmVhdHVyZXMgYW5kIDUwIG9yIDBcbiAgICAgICAgQHNpemUuZm9udFNpemUgICAgID0gZm9udFNpemVcbiAgICAgICAgQHNpemUubGluZUhlaWdodCAgID0gTWF0aC5mbG9vciBmb250U2l6ZSAqIEBjb25maWcubGluZUhlaWdodFxuICAgICAgICBAc2l6ZS5jaGFyV2lkdGggICAgPSBmb250U2l6ZSAqIDAuNlxuICAgICAgICBAc2l6ZS5vZmZzZXRYICAgICAgPSBNYXRoLmZsb29yIEBzaXplLmNoYXJXaWR0aC8yICsgQHNpemUubnVtYmVyc1dpZHRoXG4gICAgICAgIEBzaXplLm9mZnNldFggICAgICA9IE1hdGgubWF4IEBzaXplLm9mZnNldFgsIChAc2NyZWVuU2l6ZSgpLndpZHRoIC0gQHNjcmVlblNpemUoKS5oZWlnaHQpIC8gMiBpZiBAc2l6ZS5jZW50ZXJUZXh0XG5cbiAgICAgICAgQHNjcm9sbD8uc2V0TGluZUhlaWdodCBAc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgQGVtaXQgJ2ZvbnRTaXplQ2hhbmdlZCcgIyBudW1iZXJzXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgQHN5bnRheC5jaGFuZ2VkIGNoYW5nZUluZm9cblxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgW2RpLGxpLGNoXSA9IFtjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLm5ld0luZGV4LCBjaGFuZ2UuY2hhbmdlXVxuICAgICAgICAgICAgc3dpdGNoIGNoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCdcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGksIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lQ2hhbmdlZCcgbGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVEZWxldGVkJyBkaVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdpbnNlcnRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVJbnNlcnRlZCcgbGksIGRpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5pbnNlcnRzIG9yIGNoYW5nZUluZm8uZGVsZXRlc1xuICAgICAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpXG4gICAgICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG4gICAgICAgICAgICBAcmVuZGVyQ3Vyc29ycygpXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcbiAgICAgICAgICAgIEBlbWl0ICdjdXJzb3InXG4gICAgICAgICAgICBAc3VzcGVuZEJsaW5rKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgICAgIEByZW5kZXJTZWxlY3Rpb24oKVxuICAgICAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICAgICBAZW1pdCAnY2hhbmdlZCcgY2hhbmdlSW5mb1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmU6IChsaSwgb2kpIC0+XG5cbiAgICAgICAgb2kgPSBsaSBpZiBub3Qgb2k/XG5cbiAgICAgICAgaWYgbGkgPCBAc2Nyb2xsLnRvcCBvciBsaSA+IEBzY3JvbGwuYm90XG4gICAgICAgICAgICBrZXJyb3IgXCJkYW5nbGluZyBsaW5lIGRpdj8gI3tsaX1cIiwgQGxpbmVEaXZzW2xpXSBpZiBAbGluZURpdnNbbGldP1xuICAgICAgICAgICAgZGVsZXRlIEBzcGFuQ2FjaGVbbGldXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwidXBkYXRlTGluZSAtIG91dCBvZiBib3VuZHM/IGxpICN7bGl9IG9pICN7b2l9XCIgaWYgbm90IEBsaW5lRGl2c1tvaV1cblxuICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuXG4gICAgICAgIGRpdiA9IEBsaW5lRGl2c1tvaV1cbiAgICAgICAgZGl2LnJlcGxhY2VDaGlsZCBAc3BhbkNhY2hlW2xpXSwgZGl2LmZpcnN0Q2hpbGRcbiAgICAgICAgXG4gICAgcmVmcmVzaExpbmVzOiAodG9wLCBib3QpIC0+XG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAc3ludGF4LmdldERpc3MgbGksIHRydWVcbiAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNob3dMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgQGxpbmVEaXZzID0ge31cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcblxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQGFwcGVuZExpbmUgbGlcblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgICBAZW1pdCAnbGluZXNFeHBvc2VkJyB0b3A6dG9wLCBib3Q6Ym90LCBudW06bnVtXG4gICAgICAgIEBlbWl0ICdsaW5lc1Nob3duJyB0b3AsIGJvdCwgbnVtXG5cbiAgICBhcHBlbmRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgQGxpbmVEaXZzW2xpXSA9IGVsZW0gY2xhc3M6ICdsaW5lJ1xuICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIEBjYWNoZWRTcGFuIGxpXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lRGl2c1tsaV1cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hpZnRMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBrbG9nIFwiI3tAbmFtZX0uc2hpZnRMaW5lcy5kaXZJbnRvIC0gbm8gZGl2PyAje3RvcH0gI3tib3R9ICN7bnVtfSBvbGQgI3tvbGRUb3B9ICN7b2xkQm90fSBsbyAje2xvfSBsaSAje2xpfVwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgXy5pc0VsZW1lbnQgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgICAgIGtsb2cgXCIje0BuYW1lfS5zaGlmdExpbmVzLmRpdkludG8gLSBubyBlbGVtZW50PyAje3RvcH0gI3tib3R9ICN7bnVtfSBvbGQgI3tvbGRUb3B9ICN7b2xkQm90fSBsbyAje2xvfSBsaSAje2xpfVwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0gPSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBkZWxldGUgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5yZXBsYWNlQ2hpbGQgQGNhY2hlZFNwYW4obGkpLCBAbGluZURpdnNbbGldLmZpcnN0Q2hpbGRcblxuICAgICAgICAgICAgaWYgQHNob3dJbnZpc2libGVzXG4gICAgICAgICAgICAgICAgdHggPSBAbGluZShsaSkubGVuZ3RoICogQHNpemUuY2hhcldpZHRoICsgMVxuICAgICAgICAgICAgICAgIHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczogXCJpbnZpc2libGUgbmV3bGluZVwiLCBodG1sOiAnJiM5Njg3J1xuICAgICAgICAgICAgICAgIHNwYW4uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoI3t0eH1weCwgLTEuNXB4KVwiXG4gICAgICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBzcGFuXG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgd2hpbGUgb2xkQm90IDwgYm90XG4gICAgICAgICAgICAgICAgb2xkQm90ICs9IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZEJvdCwgb2xkVG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wICs9IDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgb2xkVG9wID4gdG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wIC09IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZFRvcCwgb2xkQm90XG4gICAgICAgICAgICAgICAgb2xkQm90IC09IDFcblxuICAgICAgICBAZW1pdCAnbGluZXNTaGlmdGVkJyB0b3AsIGJvdCwgbnVtXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGVMaW5lUG9zaXRpb25zOiAoYW5pbWF0ZT0wKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGxpLGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGlmIGRpdj8uc3R5bGU/XG4gICAgICAgICAgICAgICAgeSA9IEBzaXplLmxpbmVIZWlnaHQgKiAobGkgLSBAc2Nyb2xsLnRvcClcbiAgICAgICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZCgje0BzaXplLm9mZnNldFh9cHgsI3t5fXB4LCAwKVwiXG4gICAgICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zaXRpb24gPSBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgICAgIGRpdi5zdHlsZS56SW5kZXggPSBsaVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIHJlc2V0VHJhbnMgPSA9PlxuICAgICAgICAgICAgICAgIGZvciBjIGluIEBlbGVtLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgIGMuc3R5bGUudHJhbnNpdGlvbiA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgc2V0VGltZW91dCByZXNldFRyYW5zLCBhbmltYXRlXG5cbiAgICB1cGRhdGVMaW5lczogKCkgLT5cblxuICAgICAgICBmb3IgbGkgaW4gW0BzY3JvbGwudG9wLi5Ac2Nyb2xsLmJvdF1cbiAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpXG5cbiAgICBjbGVhckhpZ2hsaWdodHM6ICgpIC0+XG5cbiAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgJCgnLmhpZ2hsaWdodHMnIEBsYXllcnMpLmlubmVySFRNTCA9ICcnXG4gICAgICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2FjaGVkU3BhbjogKGxpKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAc3BhbkNhY2hlW2xpXVxuXG4gICAgICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldXG5cbiAgICByZW5kZXJDdXJzb3JzOiAtPlxuXG4gICAgICAgIGNzID0gW11cbiAgICAgICAgZm9yIGMgaW4gQGN1cnNvcnMoKVxuICAgICAgICAgICAgaWYgY1sxXSA+PSBAc2Nyb2xsLnRvcCBhbmQgY1sxXSA8PSBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAgICAgIGNzLnB1c2ggW2NbMF0sIGNbMV0gLSBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA9PSAxXG5cbiAgICAgICAgICAgIGlmIGNzLmxlbmd0aCA9PSAxXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbWNbMV0gPCAwXG5cbiAgICAgICAgICAgICAgICBpZiBtY1sxXSA+IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIiN7QG5hbWV9LnJlbmRlckN1cnNvcnMgbWFpbkN1cnNvciBEQUZVSz9cIiwgQG51bUxpbmVzKCksIHN0ciBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgICAgICAgICByaSA9IG1jWzFdLUBzY3JvbGwudG9wXG4gICAgICAgICAgICAgICAgY3Vyc29yTGluZSA9IEBzdGF0ZS5saW5lKG1jWzFdKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIG1haW4gY3Vyc29yIGxpbmU/JyBpZiBub3QgY3Vyc29yTGluZT9cbiAgICAgICAgICAgICAgICBpZiBtY1swXSA+IGN1cnNvckxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ3ZpcnR1YWwnXG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2ggW2N1cnNvckxpbmUubGVuZ3RoLCByaSwgJ21haW4gb2ZmJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ21haW4gb2ZmJ1xuXG4gICAgICAgIGVsc2UgaWYgQG51bUN1cnNvcnMoKSA+IDFcblxuICAgICAgICAgICAgdmMgPSBbXSAjIHZpcnR1YWwgY3Vyc29yc1xuICAgICAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgQG1haW5DdXJzb3IoKSwgW2NbMF0sIGNbMV0gKyBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICAgICAgY1syXSA9ICdtYWluJ1xuICAgICAgICAgICAgICAgIGxpbmUgPSBAbGluZShAc2Nyb2xsLnRvcCtjWzFdKVxuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB2Yy5wdXNoIFtsaW5lLmxlbmd0aCwgY1sxXSwgJ3ZpcnR1YWwnXVxuICAgICAgICAgICAgY3MgPSBjcy5jb25jYXQgdmNcblxuICAgICAgICBodG1sID0gcmVuZGVyLmN1cnNvcnMgY3MsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3QuY3Vyc29ycy5pbm5lckhUTUwgPSBodG1sXG4gICAgICAgIFxuICAgICAgICB0eSA9IChtY1sxXSAtIEBzY3JvbGwudG9wKSAqIEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJzb3JMaW5lXG4gICAgICAgICAgICBAY3Vyc29yTGluZS5zdHlsZSA9IFwiei1pbmRleDowO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgwLCN7dHl9cHgsMCk7IGhlaWdodDoje0BzaXplLmxpbmVIZWlnaHR9cHg7XCJcbiAgICAgICAgICAgIEBsYXllcnMuaW5zZXJ0QmVmb3JlIEBjdXJzb3JMaW5lLCBAbGF5ZXJzLmZpcnN0Q2hpbGRcblxuICAgIHJlbmRlclNlbGVjdGlvbjogLT5cblxuICAgICAgICBoID0gXCJcIlxuICAgICAgICBzID0gQHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleCBbQHNjcm9sbC50b3AsIEBzY3JvbGwuYm90XSwgQHNjcm9sbC50b3BcbiAgICAgICAgaWYgc1xuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3Quc2VsZWN0aW9ucy5pbm5lckhUTUwgPSBoXG5cbiAgICByZW5kZXJIaWdobGlnaHRzOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIHMgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICBpZiBzXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemUsIFwiaGlnaGxpZ2h0XCJcbiAgICAgICAgQGxheWVyRGljdC5oaWdobGlnaHRzLmlubmVySFRNTCA9IGhcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY3Vyc29yRGl2OiAtPiAkICcuY3Vyc29yLm1haW4nIEBsYXllckRpY3RbJ2N1cnNvcnMnXVxuXG4gICAgc3VzcGVuZEJsaW5rOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGJsaW5rVGltZXJcbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAc3VzcGVuZFRpbWVyID0gc2V0VGltZW91dCBAcmVsZWFzZUJsaW5rLCBibGlua0RlbGF5WzBdXG5cbiAgICByZWxlYXNlQmxpbms6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzdXNwZW5kVGltZXJcbiAgICAgICAgZGVsZXRlIEBzdXNwZW5kVGltZXJcbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuXG4gICAgdG9nZ2xlQmxpbms6IC0+XG5cbiAgICAgICAgYmxpbmsgPSBub3QgcHJlZnMuZ2V0ICdibGluaycgZmFsc2VcbiAgICAgICAgcHJlZnMuc2V0ICdibGluaycgYmxpbmtcbiAgICAgICAgaWYgYmxpbmtcbiAgICAgICAgICAgIEBzdGFydEJsaW5rKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHN0b3BCbGluaygpXG5cbiAgICBkb0JsaW5rOiA9PlxuXG4gICAgICAgIEBibGluayA9IG5vdCBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIEBibGlua1xuICAgICAgICBAbWluaW1hcD8uZHJhd01haW5DdXJzb3IgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgYmxpbmtEZWxheSA9IHByZWZzLmdldCAnY3Vyc29yQmxpbmtEZWxheScgWzgwMCwyMDBdXG4gICAgICAgIEBibGlua1RpbWVyID0gc2V0VGltZW91dCBAZG9CbGluaywgQGJsaW5rIGFuZCBibGlua0RlbGF5WzFdIG9yIGJsaW5rRGVsYXlbMF1cblxuICAgIHN0YXJ0Qmxpbms6IC0+IFxuICAgIFxuICAgICAgICBpZiBub3QgQGJsaW5rVGltZXIgYW5kIHByZWZzLmdldCAnYmxpbmsnXG4gICAgICAgICAgICBAZG9CbGluaygpIFxuXG4gICAgc3RvcEJsaW5rOiAtPlxuXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgZGVsZXRlIEBibGlua1RpbWVyXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHJlc2l6ZWQ6IC0+XG5cbiAgICAgICAgdmggPSBAdmlldy5jbGllbnRIZWlnaHRcblxuICAgICAgICByZXR1cm4gaWYgdmggPT0gQHNjcm9sbC52aWV3SGVpZ2h0XG5cbiAgICAgICAgQG51bWJlcnM/LmVsZW0uc3R5bGUuaGVpZ2h0ID0gXCIje0BzY3JvbGwuZXhwb3NlTnVtICogQHNjcm9sbC5saW5lSGVpZ2h0fXB4XCJcbiAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG5cbiAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IHZoXG5cbiAgICAgICAgQGVtaXQgJ3ZpZXdIZWlnaHQnIHZoXG5cbiAgICBzY3JlZW5TaXplOiAtPiBlbGVjdHJvbi5yZW1vdGUuc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIHBvc0F0WFk6KHgseSkgLT5cblxuICAgICAgICBzbCA9IEBsYXllclNjcm9sbC5zY3JvbGxMZWZ0XG4gICAgICAgIHN0ID0gQHNjcm9sbC5vZmZzZXRUb3BcbiAgICAgICAgYnIgPSBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBseCA9IGNsYW1wIDAsIEBsYXllcnMub2Zmc2V0V2lkdGgsICB4IC0gYnIubGVmdCAtIEBzaXplLm9mZnNldFggKyBAc2l6ZS5jaGFyV2lkdGgvM1xuICAgICAgICBseSA9IGNsYW1wIDAsIEBsYXllcnMub2Zmc2V0SGVpZ2h0LCB5IC0gYnIudG9wXG4gICAgICAgIHB4ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigoTWF0aC5tYXgoMCwgc2wgKyBseCkpL0BzaXplLmNoYXJXaWR0aCkpXG4gICAgICAgIHB5ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigoTWF0aC5tYXgoMCwgc3QgKyBseSkpL0BzaXplLmxpbmVIZWlnaHQpKSArIEBzY3JvbGwudG9wXG4gICAgICAgIHAgID0gW3B4LCBNYXRoLm1pbihAbnVtTGluZXMoKS0xLCBweSldXG4gICAgICAgIHBcblxuICAgIHBvc0ZvckV2ZW50OiAoZXZlbnQpIC0+IEBwb3NBdFhZIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFlcblxuICAgIGxpbmVFbGVtQXRYWTooeCx5KSAtPlxuXG4gICAgICAgIHAgPSBAcG9zQXRYWSB4LHlcbiAgICAgICAgQGxpbmVEaXZzW3BbMV1dXG5cbiAgICBsaW5lU3BhbkF0WFk6KHgseSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmVFbGVtID0gQGxpbmVFbGVtQXRYWSB4LHlcbiAgICAgICAgICAgIGxyID0gbGluZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIGZvciBlIGluIGxpbmVFbGVtLmZpcnN0Q2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBiciA9IGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgICAgICBpZiBici5sZWZ0IDw9IHggPD0gYnIubGVmdCtici53aWR0aFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB4LWJyLmxlZnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwYW46ZSwgb2Zmc2V0TGVmdDpvZmZzZXQsIG9mZnNldENoYXI6cGFyc2VJbnQgb2Zmc2V0L0BzaXplLmNoYXJXaWR0aFxuICAgICAgICBudWxsXG5cbiAgICAjIG51bUZ1bGxMaW5lczogLT4gTWF0aC5mbG9vcihAdmlld0hlaWdodCgpIC8gQHNpemUubGluZUhlaWdodClcbiAgICBudW1GdWxsTGluZXM6IC0+IEBzY3JvbGwuZnVsbExpbmVzXG4gICAgXG4gICAgdmlld0hlaWdodDogLT4gXG4gICAgICAgIFxuICAgICAgICBpZiBAc2Nyb2xsPy52aWV3SGVpZ2h0ID49IDAgdGhlbiByZXR1cm4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgIEB2aWV3Py5jbGllbnRIZWlnaHRcblxuICAgIGNsZWFyTGluZXM6ID0+XG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG5cbiAgICBjbGVhcjogPT4gXG4gICAgICAgIEBzZXRMaW5lcyBbXVxuXG4gICAgZm9jdXM6IC0+IEB2aWV3LmZvY3VzKClcblxuICAgICMgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuXG4gICAgaW5pdERyYWc6IC0+XG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGxheWVyU2Nyb2xsXG5cbiAgICAgICAgICAgIG9uU3RhcnQ6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAdmlldy5mb2N1cygpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGV2ZW50UG9zID0gQHBvc0ZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgICAgICAgICBpZiBldmVudC5idXR0b24gPT0gMlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBldmVudC5idXR0b24gPT0gMVxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgQGp1bXBUb0ZpbGVBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICAgICAgQGp1bXBUb1dvcmRBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBldmVudFBvcywgQGNsaWNrUG9zXG4gICAgICAgICAgICAgICAgICAgICAgICBAc3RhcnRDbGlja1RpbWVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZSA9IEByYW5nZUZvcldvcmRBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXkgb3IgQHN0aWNreVNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGhpZ2hsaWdodFdvcmRBbmRBZGRUb1NlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudCA9PSAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IEByYW5nZUZvckxpbmVBdEluZGV4IEBjbGlja1Bvc1sxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZFJhbmdlVG9TZWxlY3Rpb24gclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNlbGVjdFNpbmdsZVJhbmdlIHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAb25DbGlja1RpbWVvdXQoKVxuXG4gICAgICAgICAgICAgICAgQGNsaWNrQ291bnQgPSAxXG4gICAgICAgICAgICAgICAgQGNsaWNrUG9zID0gZXZlbnRQb3NcbiAgICAgICAgICAgICAgICBAc3RhcnRDbGlja1RpbWVyKClcblxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBAY2xpY2tBdFBvcyBwLCBldmVudFxuXG4gICAgICAgICAgICBvbk1vdmU6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBwID0gQHBvc0ZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICBAYWRkQ3Vyc29yQXRQb3MgW0BtYWluQ3Vyc29yKClbMF0sIHBbMV1dXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcCwgZXh0ZW5kOnRydWVcblxuICAgICAgICAgICAgb25TdG9wOiA9PlxuICAgICAgICAgICAgICAgIEBzZWxlY3ROb25lKCkgaWYgQG51bVNlbGVjdGlvbnMoKSBhbmQgZW1wdHkgQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIHN0YXJ0Q2xpY2tUaW1lcjogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQGNsaWNrVGltZXJcbiAgICAgICAgQGNsaWNrVGltZXIgPSBzZXRUaW1lb3V0IEBvbkNsaWNrVGltZW91dCwgQHN0aWNreVNlbGVjdGlvbiBhbmQgMzAwIG9yIDEwMDBcblxuICAgIG9uQ2xpY2tUaW1lb3V0OiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tDb3VudCAgPSAwXG4gICAgICAgIEBjbGlja1RpbWVyICA9IG51bGxcbiAgICAgICAgQGNsaWNrUG9zICAgID0gbnVsbFxuXG4gICAgZnVuY0luZm9BdExpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIGZpbGVzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmaWxlcycgQGN1cnJlbnRGaWxlXG4gICAgICAgIGZpbGVJbmZvID0gZmlsZXNbQGN1cnJlbnRGaWxlXVxuICAgICAgICBmb3IgZnVuYyBpbiBmaWxlSW5mby5mdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy5saW5lIDw9IGxpIDw9IGZ1bmMubGFzdFxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jLmNsYXNzICsgJy4nICsgZnVuYy5uYW1lICsgJyAnXG4gICAgICAgICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xpY2tBdFBvczogKHAsIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGV2ZW50LmFsdEtleVxuICAgICAgICAgICAgQHRvZ2dsZUN1cnNvckF0UG9zIHBcbiAgICAgICAgZWxzZSBpZiBldmVudC5tZXRhS2V5IG9yIGV2ZW50LmN0cmxLZXlcbiAgICAgICAgICAgIEBqdW1wVG9Xb3JkQXRQb3MgcFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIGlmIGV2ZW50LmN0cmxLZXlcbiAgICAgICAgICAgICAgICAjIEBsb2cganNiZWF1dHkuaHRtbF9iZWF1dGlmeSBAbGluZURpdnNbcFsxXV0uZmlyc3RDaGlsZC5pbm5lckhUTUwsIGluZGVudF9zaXplOjIgLCBwcmVzZXJ2ZV9uZXdsaW5lczpmYWxzZSwgd3JhcF9saW5lX2xlbmd0aDoyMDAsIHVuZm9ybWF0dGVkOiBbXVxuICAgICAgICAgICAgICAgICMgQGxvZyBAbGluZSBwWzFdXG4gICAgICAgICAgICAgICAgIyBAc3ludGF4Lm5ld0Rpc3MgcFsxXVxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDpldmVudC5zaGlmdEtleVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGF1dG9jb21wbGV0ZT9cbiAgICAgICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAYXV0b2NvbXBsZXRlLmhhbmRsZU1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnIHRoZW4gcmV0dXJuICd1bmhhbmRsZWQnICMgaGFzIGNoYXIgc2V0IG9uIHdpbmRvd3M/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAc2FsdGVyTW9kZSAgICAgICAgICB0aGVuIHJldHVybiBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICAgICAgICAgIGlmIEBudW1IaWdobGlnaHRzKCkgICAgIHRoZW4gcmV0dXJuIEBjbGVhckhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgICAgIGlmIEBudW1DdXJzb3JzKCkgPiAxICAgIHRoZW4gcmV0dXJuIEBjbGVhckN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIGlmIEBzdGlja3lTZWxlY3Rpb24gICAgIHRoZW4gcmV0dXJuIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgICAgIHRoZW4gcmV0dXJuIEBzZWxlY3ROb25lKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtlbnRlcicgJ2N0cmwrZW50ZXInICdmMTInIHRoZW4gQGp1bXBUb1dvcmQoKVxuXG4gICAgICAgIGZvciBhY3Rpb24gaW4gRWRpdG9yLmFjdGlvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uLmNvbWJvID09IGNvbWJvIG9yIGFjdGlvbi5hY2NlbCA9PSBjb21ib1xuICAgICAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgICAgICB3aGVuICdjdHJsK2EnICdjb21tYW5kK2EnIHRoZW4gcmV0dXJuIEBzZWxlY3RBbGwoKVxuICAgICAgICAgICAgICAgIHJldHVybiAndW5oYW5kbGVkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uLmFjY2Vscz8gYW5kIG9zLnBsYXRmb3JtKCkgIT0gJ2RhcndpbidcbiAgICAgICAgICAgICAgICBmb3IgYWN0aW9uQ29tYm8gaW4gYWN0aW9uLmFjY2Vsc1xuICAgICAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udGludWUgaWYgbm90IGFjdGlvbi5jb21ib3M/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uY29tYm9zXG4gICAgICAgICAgICAgICAgaWYgY29tYm8gPT0gYWN0aW9uQ29tYm9cbiAgICAgICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBjaGFyIGFuZCBtb2QgaW4gW1wic2hpZnRcIiwgXCJcIl1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEBpbnNlcnRDaGFyYWN0ZXIgY2hhclxuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBvbktleURvd246IChldmVudCkgPT5cblxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHJldHVybiBpZiBub3QgY29tYm9cbiAgICAgICAgcmV0dXJuIGlmIGtleSA9PSAncmlnaHQgY2xpY2snICMgd2VpcmQgcmlnaHQgY29tbWFuZCBrZXlcblxuICAgICAgICByZXN1bHQgPSBAaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuXG4gICAgICAgIGlmICd1bmhhbmRsZWQnICE9IHJlc3VsdFxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBsb2c6IC0+XG4gICAgICAgIHJldHVybiBpZiBAbmFtZSAhPSAnZWRpdG9yJ1xuICAgICAgICBrbG9nLnNsb2cuZGVwdGggPSAzXG4gICAgICAgIGtsb2cuYXBwbHkga2xvZywgW10uc3BsaWNlLmNhbGwgYXJndW1lbnRzLCAwXG4gICAgICAgIGtsb2cuc2xvZy5kZXB0aCA9IDJcblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0RWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/texteditor.coffee