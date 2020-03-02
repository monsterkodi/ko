// koffee 1.7.0

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

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, drag = ref.drag, elem = ref.elem, empty = ref.empty, kerror = ref.kerror, keyinfo = ref.keyinfo, klog = ref.klog, os = ref.os, post = ref.post, prefs = ref.prefs, stopEvent = ref.stopEvent;

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
            "class": 'layers'
        });
        this.layerScroll = elem({
            "class": 'layerScroll',
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3RixPQUFBLENBQVEsS0FBUixDQUF4RixFQUFFLFNBQUYsRUFBSyxTQUFMLEVBQVEsaUJBQVIsRUFBZSxlQUFmLEVBQXFCLGVBQXJCLEVBQTJCLGlCQUEzQixFQUFrQyxtQkFBbEMsRUFBMEMscUJBQTFDLEVBQW1ELGVBQW5ELEVBQXlELFdBQXpELEVBQTZELGVBQTdELEVBQW1FLGlCQUFuRSxFQUEwRTs7QUFFMUUsTUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUNmLFlBQUEsR0FBZSxPQUFBLENBQVEsZ0JBQVI7O0FBQ2YsTUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUNmLFFBQUEsR0FBZSxPQUFBLENBQVEsYUFBUjs7QUFDZixRQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBRVQ7OztJQUVDLG9CQUFDLFFBQUQsRUFBVyxNQUFYOzs7Ozs7Ozs7Ozs7OztBQUVDLFlBQUE7UUFBQSxJQUFBLEdBQU87UUFDUCxJQUF1QixJQUFLLENBQUEsQ0FBQSxDQUFMLEtBQVcsR0FBbEM7WUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLEVBQVA7O1FBRUEsNENBQU0sSUFBTixFQUFZLE1BQVo7UUFFQSxJQUFDLENBQUEsVUFBRCxHQUFjO1FBRWQsSUFBQyxDQUFBLElBQUQsR0FBTyxDQUFBLENBQUUsUUFBRjtRQUVQLElBQUMsQ0FBQSxNQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxRQUFOO1NBQUw7UUFDZixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sYUFBTjtZQUFvQixLQUFBLEVBQU0sSUFBQyxDQUFBLE1BQTNCO1NBQUw7UUFDZixJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFBQyxDQUFBLFdBQW5CO1FBRUEsS0FBQSxHQUFRO1FBQ1IsS0FBSyxDQUFDLElBQU4sQ0FBVyxZQUFYO1FBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxZQUFYO1FBQ0EsSUFBd0IsYUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQWxCLEVBQUEsTUFBQSxNQUF4QjtZQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBWCxFQUFBOztRQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBWDtRQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsU0FBWDtRQUNBLElBQXdCLGFBQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFyQixFQUFBLFNBQUEsTUFBeEI7WUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLFNBQVgsRUFBQTs7UUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLEtBQVo7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsU0FBUyxDQUFDO1FBRW5CLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsUUFBRCxHQUFhOztnQkFFTixDQUFDOztnQkFBRCxDQUFDLGFBQWM7O1FBRXRCLElBQUMsQ0FBQSxXQUFELENBQWEsS0FBSyxDQUFDLEdBQU4sQ0FBYSxJQUFDLENBQUEsSUFBRixHQUFPLFVBQW5CLGlEQUFpRCxFQUFqRCxDQUFiO1FBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLFlBQUosQ0FBaUIsSUFBakI7UUFDVixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQXdCLElBQUMsQ0FBQSxVQUF6QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFdBQVgsRUFBd0IsSUFBQyxDQUFBLFNBQXpCO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixNQUF2QixFQUFrQyxJQUFDLENBQUEsTUFBbkM7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLE9BQXZCLEVBQWtDLElBQUMsQ0FBQSxPQUFuQztRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsU0FBdkIsRUFBa0MsSUFBQyxDQUFBLFNBQW5DO1FBRUEsSUFBQyxDQUFBLFFBQUQsQ0FBQTtBQUVBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLE9BQUEsS0FBVyxZQUFkO2dCQUNJLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQSxDQUFLLEtBQUwsRUFBVztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGFBQU47aUJBQVgsRUFEbEI7YUFBQSxNQUFBO2dCQUdJLFdBQUEsR0FBYyxPQUFPLENBQUMsV0FBUixDQUFBO2dCQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsSUFBQSxHQUFLLFdBQWI7Z0JBQ2QsSUFBRSxDQUFBLFdBQUEsQ0FBRixHQUFpQixJQUFJLFdBQUosQ0FBZ0IsSUFBaEIsRUFMckI7O0FBREo7UUFRQSxJQUFJLENBQUMsRUFBTCxDQUFRLGVBQVIsRUFBd0IsSUFBQyxDQUFBLGVBQXpCO0lBbkREOzt5QkEyREgsR0FBQSxHQUFLLFNBQUE7QUFFRCxZQUFBO1FBQUEsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsZUFBcEIsRUFBb0MsSUFBQyxDQUFBLGVBQXJDOztnQkFFVSxDQUFFLEdBQVosQ0FBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLG1CQUFOLENBQTBCLFNBQTFCLEVBQW9DLElBQUMsQ0FBQSxTQUFyQztRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsbUJBQU4sQ0FBMEIsTUFBMUIsRUFBb0MsSUFBQyxDQUFBLE1BQXJDO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxtQkFBTixDQUEwQixPQUExQixFQUFvQyxJQUFDLENBQUEsT0FBckM7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7ZUFFbEIsa0NBQUE7SUFYQzs7eUJBbUJMLE9BQUEsR0FBUyxTQUFBO1FBRUwsSUFBQyxDQUFBLFVBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sT0FBTixFQUFjLElBQWQ7ZUFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLGFBQVYsRUFBd0IsSUFBeEI7SUFKSzs7eUJBTVQsTUFBQSxHQUFRLFNBQUE7UUFFSixJQUFDLENBQUEsU0FBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOLEVBQWEsSUFBYjtJQUhJOzt5QkFLUixlQUFBLEdBQWlCLFNBQUE7QUFFYixZQUFBOztnQkFBTyxDQUFFLGFBQVQsQ0FBQTs7UUFDQSxJQUFHLElBQUMsQ0FBQSxPQUFKO1lBQ0ksYUFBQSxHQUFnQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFBO0FBQUcsd0JBQUE7Z0VBQVEsQ0FBRSxTQUFWLENBQUE7Z0JBQUg7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO21CQUNoQixVQUFBLENBQVcsYUFBWCxFQUEwQixFQUExQixFQUZKOztJQUhhOzt5QkFhakIsVUFBQSxHQUFZLFNBQUMsWUFBRDtBQUVSLFlBQUE7UUFBQSxJQUFDLENBQUEsU0FBRCxHQUFhO0FBQ2I7YUFBQSw4Q0FBQTs7eUJBQ0ksSUFBQyxDQUFBLFNBQVUsQ0FBQSxHQUFBLENBQVgsR0FBa0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWO0FBRHRCOztJQUhROzt5QkFNWixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLEdBQVA7U0FBTDtRQUNOLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQixHQUFwQjtlQUNBO0lBSk07O3lCQU1WLFlBQUEsR0FBYyxTQUFBO1FBRVYsSUFBQyxDQUFBLGdCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQUpVOzt5QkFZZCxRQUFBLEdBQVUsU0FBQyxLQUFEO0FBRU4sWUFBQTtRQUFBLElBQUMsQ0FBQSxVQUFELENBQUE7O1lBRUE7O1lBQUEsUUFBUzs7UUFFVCxJQUFDLENBQUEsU0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUViLHlDQUFNLEtBQU47UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQTtRQUVBLFVBQUEsR0FBYSxJQUFDLENBQUEsVUFBRCxDQUFBO1FBRWIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQWMsVUFBZCxFQUEwQixJQUFDLENBQUEsUUFBRCxDQUFBLENBQTFCO1FBRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxVQUFiLEdBQTBCO1FBQzFCLElBQUMsQ0FBQSxXQUFELEdBQWdCLElBQUMsQ0FBQSxXQUFXLENBQUM7UUFDN0IsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLFdBQVcsQ0FBQztlQUU3QixJQUFDLENBQUEsWUFBRCxDQUFBO0lBckJNOzt5QkE2QlYsVUFBQSxHQUFZLFNBQUMsSUFBRDtBQUVSLFlBQUE7UUFBQSxJQUFPLFlBQVA7WUFDRyxPQUFBLENBQUMsR0FBRCxDQUFRLElBQUMsQ0FBQSxJQUFGLEdBQU8sd0JBQWQ7QUFDQyxtQkFGSjs7UUFJQSxRQUFBLEdBQVc7UUFDWCxFQUFBLGtCQUFLLElBQUksQ0FBRSxLQUFOLENBQVksSUFBWjtBQUVMLGFBQUEsb0NBQUE7O1lBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsQ0FBa0IsQ0FBbEI7WUFDVCxRQUFRLENBQUMsSUFBVCxDQUFjLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBQSxHQUFZLENBQTFCO0FBRko7UUFJQSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixLQUFzQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQXpCO1lBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBdEIsRUFESjs7UUFHQSxTQUFBLEdBQVksQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsR0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQXZCLENBQUEsSUFBK0IsQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsR0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQXZCO1FBRTNDLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQixJQUFDLENBQUEsUUFBRCxDQUFBLENBQXBCLEVBQWlDO1lBQUEsU0FBQSxFQUFVLFNBQVY7U0FBakM7QUFFQSxhQUFBLDRDQUFBOztZQUNJLElBQUMsQ0FBQSxJQUFELENBQU0sY0FBTixFQUNJO2dCQUFBLFNBQUEsRUFBVyxFQUFYO2dCQUNBLElBQUEsRUFBTSxJQUFDLENBQUEsSUFBRCxDQUFNLEVBQU4sQ0FETjthQURKO0FBREo7UUFLQSxJQUFDLENBQUEsSUFBRCxDQUFNLGVBQU4sRUFBc0IsRUFBdEI7ZUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFVBQU4sRUFBaUIsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFqQjtJQTFCUTs7eUJBa0NaLFdBQUEsR0FBYSxTQUFDLFFBQUQ7QUFFVCxZQUFBO1FBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBZCxHQUE0QixRQUFELEdBQVU7UUFDckMsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFOLEdBQXFCLGFBQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFyQixFQUFBLFNBQUEsTUFBQSxJQUFrQyxFQUFsQyxJQUF3QztRQUM3RCxJQUFDLENBQUEsSUFBSSxDQUFDLFFBQU4sR0FBcUI7UUFDckIsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLEdBQXFCLElBQUksQ0FBQyxLQUFMLENBQVcsUUFBQSxHQUFXLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBOUI7UUFDckIsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQXFCLFFBQUEsR0FBVztRQUNoQyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sR0FBcUIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBZ0IsQ0FBaEIsR0FBb0IsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFyQztRQUNyQixJQUFpRyxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQXZHO1lBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLEdBQXFCLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFmLEVBQXdCLENBQUMsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsS0FBZCxHQUFzQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQWEsQ0FBQyxNQUFyQyxDQUFBLEdBQStDLENBQXZFLEVBQXJCOzs7Z0JBRU8sQ0FBRSxhQUFULENBQXVCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBN0I7O2VBRUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxpQkFBTjtJQVpTOzt5QkFvQmIsT0FBQSxHQUFTLFNBQUMsVUFBRDtBQUtMLFlBQUE7UUFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsVUFBaEI7QUFFQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksT0FBYSxDQUFDLE1BQU0sQ0FBQyxPQUFSLEVBQWlCLE1BQU0sQ0FBQyxRQUF4QixFQUFrQyxNQUFNLENBQUMsTUFBekMsQ0FBYixFQUFDLFlBQUQsRUFBSSxZQUFKLEVBQU87QUFDUCxvQkFBTyxFQUFQO0FBQUEscUJBRVMsU0FGVDtvQkFHUSxJQUFDLENBQUEsVUFBRCxDQUFZLEVBQVosRUFBZ0IsRUFBaEI7b0JBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLEVBQW9CLEVBQXBCO0FBRkM7QUFGVCxxQkFNUyxTQU5UO29CQU9RLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxLQUFYLENBQWlCLENBQWpCLEVBQW9CLEVBQXBCO29CQUNiLElBQUMsQ0FBQSxJQUFELENBQU0sYUFBTixFQUFvQixFQUFwQjtBQUZDO0FBTlQscUJBVVMsVUFWVDtvQkFXUSxJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQSxTQUFTLENBQUMsS0FBWCxDQUFpQixDQUFqQixFQUFvQixFQUFwQjtvQkFDYixJQUFDLENBQUEsSUFBRCxDQUFNLGNBQU4sRUFBcUIsRUFBckIsRUFBeUIsRUFBekI7QUFaUjtBQUZKO1FBZ0JBLElBQUcsVUFBVSxDQUFDLE9BQVgsSUFBc0IsVUFBVSxDQUFDLE9BQXBDO1lBQ0ksSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsV0FBVyxDQUFDO1lBQzVCLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQixJQUFDLENBQUEsUUFBRCxDQUFBLENBQXBCO1lBQ0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFISjs7UUFLQSxJQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBdEI7WUFDSSxJQUFDLENBQUEsZUFBRCxDQUFBLEVBREo7O1FBR0EsSUFBRyxVQUFVLENBQUMsT0FBZDtZQUNJLElBQUMsQ0FBQSxhQUFELENBQUE7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtZQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sUUFBTjtZQUNBLElBQUMsQ0FBQSxZQUFELENBQUEsRUFKSjs7UUFNQSxJQUFHLFVBQVUsQ0FBQyxPQUFkO1lBQ0ksSUFBQyxDQUFBLGVBQUQsQ0FBQTtZQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sV0FBTixFQUZKOztlQUlBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBTixFQUFnQixVQUFoQjtJQXpDSzs7eUJBaURULFVBQUEsR0FBWSxTQUFDLEVBQUQsRUFBSyxFQUFMO0FBRVIsWUFBQTtRQUFBLElBQWUsVUFBZjtZQUFBLEVBQUEsR0FBSyxHQUFMOztRQUVBLElBQUcsRUFBQSxHQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBYixJQUFvQixFQUFBLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFwQztZQUNJLElBQW9ELHlCQUFwRDtnQkFBQSxNQUFBLENBQU8scUJBQUEsR0FBc0IsRUFBN0IsRUFBbUMsSUFBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLENBQTdDLEVBQUE7O1lBQ0EsT0FBTyxJQUFDLENBQUEsU0FBVSxDQUFBLEVBQUE7QUFDbEIsbUJBSEo7O1FBS0EsSUFBaUUsQ0FBSSxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBL0U7QUFBQSxtQkFBTyxNQUFBLENBQU8saUNBQUEsR0FBa0MsRUFBbEMsR0FBcUMsTUFBckMsR0FBMkMsRUFBbEQsRUFBUDs7UUFFQSxJQUFDLENBQUEsU0FBVSxDQUFBLEVBQUEsQ0FBWCxHQUFpQixNQUFNLENBQUMsUUFBUCxDQUFnQixJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBaEIsRUFBcUMsSUFBQyxDQUFBLElBQXRDO1FBRWpCLEdBQUEsR0FBTSxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUE7ZUFDaEIsR0FBRyxDQUFDLFlBQUosQ0FBaUIsSUFBQyxDQUFBLFNBQVUsQ0FBQSxFQUFBLENBQTVCLEVBQWlDLEdBQUcsQ0FBQyxVQUFyQztJQWRROzt5QkFnQlosWUFBQSxHQUFjLFNBQUMsR0FBRCxFQUFNLEdBQU47QUFDVixZQUFBO0FBQUE7YUFBVSxvR0FBVjtZQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFnQixFQUFoQixFQUFvQixJQUFwQjt5QkFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLEVBQVo7QUFGSjs7SUFEVTs7eUJBV2QsU0FBQSxHQUFXLFNBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYO0FBRVAsWUFBQTtRQUFBLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFDWixJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7QUFFbEIsYUFBVSxvR0FBVjtZQUNJLElBQUMsQ0FBQSxVQUFELENBQVksRUFBWjtBQURKO1FBR0EsSUFBQyxDQUFBLG1CQUFELENBQUE7UUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxZQUFOLEVBQW1CLEdBQW5CLEVBQXdCLEdBQXhCLEVBQTZCLEdBQTdCO0lBVk87O3lCQVlYLFVBQUEsR0FBWSxTQUFDLEVBQUQ7UUFFUixJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBVixHQUFnQixJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLE1BQVA7U0FBTDtRQUNoQixJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFdBQWQsQ0FBMEIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaLENBQTFCO2VBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUE1QjtJQUpROzt5QkFZWixVQUFBLEdBQVksU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVg7QUFFUixZQUFBO1FBQUEsTUFBQSxHQUFTLEdBQUEsR0FBTTtRQUNmLE1BQUEsR0FBUyxHQUFBLEdBQU07UUFFZixPQUFBLEdBQVUsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxFQUFELEVBQUksRUFBSjtBQUVOLG9CQUFBO2dCQUFBLElBQUcsQ0FBSSxLQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBakI7b0JBQ0csT0FBQSxDQUFDLEdBQUQsQ0FBUSxLQUFDLENBQUEsSUFBRixHQUFPLGdDQUFQLEdBQXVDLEdBQXZDLEdBQTJDLEdBQTNDLEdBQThDLEdBQTlDLEdBQWtELEdBQWxELEdBQXFELEdBQXJELEdBQXlELE9BQXpELEdBQWdFLE1BQWhFLEdBQXVFLEdBQXZFLEdBQTBFLE1BQTFFLEdBQWlGLE1BQWpGLEdBQXVGLEVBQXZGLEdBQTBGLE1BQTFGLEdBQWdHLEVBQXZHO0FBQ0MsMkJBRko7O2dCQUlBLElBQUcsQ0FBSSxDQUFDLENBQUMsU0FBRixDQUFZLEtBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUF0QixDQUFQO29CQUNHLE9BQUEsQ0FBQyxHQUFELENBQVEsS0FBQyxDQUFBLElBQUYsR0FBTyxvQ0FBUCxHQUEyQyxHQUEzQyxHQUErQyxHQUEvQyxHQUFrRCxHQUFsRCxHQUFzRCxHQUF0RCxHQUF5RCxHQUF6RCxHQUE2RCxPQUE3RCxHQUFvRSxNQUFwRSxHQUEyRSxHQUEzRSxHQUE4RSxNQUE5RSxHQUFxRixNQUFyRixHQUEyRixFQUEzRixHQUE4RixNQUE5RixHQUFvRyxFQUEzRztBQUNDLDJCQUZKOztnQkFJQSxLQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBVixHQUFnQixLQUFDLENBQUEsUUFBUyxDQUFBLEVBQUE7Z0JBQzFCLE9BQU8sS0FBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBO2dCQUNqQixLQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFlBQWQsQ0FBMkIsS0FBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaLENBQTNCLEVBQTRDLEtBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUFHLENBQUMsVUFBMUQ7Z0JBRUEsSUFBRyxLQUFDLENBQUEsY0FBSjtvQkFDSSxFQUFBLEdBQUssS0FBQyxDQUFBLElBQUQsQ0FBTSxFQUFOLENBQVMsQ0FBQyxNQUFWLEdBQW1CLEtBQUMsQ0FBQSxJQUFJLENBQUMsU0FBekIsR0FBcUM7b0JBQzFDLElBQUEsR0FBTyxJQUFBLENBQUssTUFBTCxFQUFZO3dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQVA7d0JBQTRCLElBQUEsRUFBTSxRQUFsQztxQkFBWjtvQkFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVgsR0FBdUIsWUFBQSxHQUFhLEVBQWIsR0FBZ0I7MkJBQ3ZDLEtBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUFHLENBQUMsV0FBZCxDQUEwQixJQUExQixFQUpKOztZQWRNO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtRQW9CVixJQUFHLEdBQUEsR0FBTSxDQUFUO0FBQ0ksbUJBQU0sTUFBQSxHQUFTLEdBQWY7Z0JBQ0ksTUFBQSxJQUFVO2dCQUNWLE9BQUEsQ0FBUSxNQUFSLEVBQWdCLE1BQWhCO2dCQUNBLE1BQUEsSUFBVTtZQUhkLENBREo7U0FBQSxNQUFBO0FBTUksbUJBQU0sTUFBQSxHQUFTLEdBQWY7Z0JBQ0ksTUFBQSxJQUFVO2dCQUNWLE9BQUEsQ0FBUSxNQUFSLEVBQWdCLE1BQWhCO2dCQUNBLE1BQUEsSUFBVTtZQUhkLENBTko7O1FBV0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxjQUFOLEVBQXFCLEdBQXJCLEVBQTBCLEdBQTFCLEVBQStCLEdBQS9CO1FBRUEsSUFBQyxDQUFBLG1CQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO0lBdkNROzt5QkErQ1osbUJBQUEsR0FBcUIsU0FBQyxPQUFEO0FBRWpCLFlBQUE7O1lBRmtCLFVBQVE7O0FBRTFCO0FBQUEsYUFBQSxVQUFBOztZQUNJLElBQUcsMENBQUg7Z0JBQ0ksQ0FBQSxHQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixHQUFtQixDQUFDLEVBQUEsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQWQ7Z0JBQ3ZCLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBVixHQUFzQixjQUFBLEdBQWUsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFyQixHQUE2QixLQUE3QixHQUFrQyxDQUFsQyxHQUFvQztnQkFDMUQsSUFBaUQsT0FBakQ7b0JBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFWLEdBQXVCLE1BQUEsR0FBTSxDQUFDLE9BQUEsR0FBUSxJQUFULENBQU4sR0FBb0IsSUFBM0M7O2dCQUNBLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBVixHQUFtQixHQUp2Qjs7QUFESjtRQU9BLElBQUcsT0FBSDtZQUNJLFVBQUEsR0FBYSxDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFBO0FBQ1Qsd0JBQUE7QUFBQTtBQUFBO3lCQUFBLHNDQUFBOztxQ0FDSSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVIsR0FBcUI7QUFEekI7O2dCQURTO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTttQkFHYixVQUFBLENBQVcsVUFBWCxFQUF1QixPQUF2QixFQUpKOztJQVRpQjs7eUJBZXJCLFdBQUEsR0FBYSxTQUFBO0FBRVQsWUFBQTtBQUFBO2FBQVUsNEhBQVY7eUJBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaO0FBREo7O0lBRlM7O3lCQUtiLGVBQUEsR0FBaUIsU0FBQTtRQUViLElBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFIO1lBQ0ksQ0FBQSxDQUFFLGFBQUYsRUFBZ0IsSUFBQyxDQUFBLE1BQWpCLENBQXdCLENBQUMsU0FBekIsR0FBcUM7bUJBQ3JDLDhDQUFBLEVBRko7O0lBRmE7O3lCQVlqQixVQUFBLEdBQVksU0FBQyxFQUFEO1FBRVIsSUFBRyxDQUFJLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQSxDQUFsQjtZQUVJLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQSxDQUFYLEdBQWlCLE1BQU0sQ0FBQyxRQUFQLENBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFnQixFQUFoQixDQUFoQixFQUFxQyxJQUFDLENBQUEsSUFBdEMsRUFGckI7O2VBSUEsSUFBQyxDQUFBLFNBQVUsQ0FBQSxFQUFBO0lBTkg7O3lCQVFaLGFBQUEsR0FBZSxTQUFBO0FBRVgsWUFBQTtRQUFBLEVBQUEsR0FBSztBQUNMO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLENBQUUsQ0FBQSxDQUFBLENBQUYsSUFBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQWhCLElBQXdCLENBQUUsQ0FBQSxDQUFBLENBQUYsSUFBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQTNDO2dCQUNJLEVBQUUsQ0FBQyxJQUFILENBQVEsQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFILEVBQU8sQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBdEIsQ0FBUixFQURKOztBQURKO1FBSUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxVQUFELENBQUE7UUFFTCxJQUFHLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBQSxLQUFpQixDQUFwQjtZQUVJLElBQUcsRUFBRSxDQUFDLE1BQUgsS0FBYSxDQUFoQjtnQkFFSSxJQUFVLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxDQUFsQjtBQUFBLDJCQUFBOztnQkFFQSxJQUFHLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsR0FBWSxDQUF2QjtBQUNJLDJCQUFPLE1BQUEsQ0FBVSxJQUFDLENBQUEsSUFBRixHQUFPLGtDQUFoQixFQUFtRCxJQUFDLENBQUEsUUFBRCxDQUFBLENBQW5ELEVBQWdFLEdBQUEsQ0FBSSxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUosQ0FBaEUsRUFEWDs7Z0JBR0EsRUFBQSxHQUFLLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDO2dCQUNuQixVQUFBLEdBQWEsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksRUFBRyxDQUFBLENBQUEsQ0FBZjtnQkFDYixJQUE0QyxrQkFBNUM7QUFBQSwyQkFBTyxNQUFBLENBQU8sc0JBQVAsRUFBUDs7Z0JBQ0EsSUFBRyxFQUFHLENBQUEsQ0FBQSxDQUFILEdBQVEsVUFBVSxDQUFDLE1BQXRCO29CQUNJLEVBQUcsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQU4sR0FBVztvQkFDWCxFQUFFLENBQUMsSUFBSCxDQUFRLENBQUMsVUFBVSxDQUFDLE1BQVosRUFBb0IsRUFBcEIsRUFBd0IsVUFBeEIsQ0FBUixFQUZKO2lCQUFBLE1BQUE7b0JBSUksRUFBRyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTixHQUFXLFdBSmY7aUJBVko7YUFGSjtTQUFBLE1Ba0JLLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFBLEdBQWdCLENBQW5CO1lBRUQsRUFBQSxHQUFLO0FBQ0wsaUJBQUEsc0NBQUE7O2dCQUNJLElBQUcsU0FBQSxDQUFVLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBVixFQUF5QixDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUgsRUFBTyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUF0QixDQUF6QixDQUFIO29CQUNJLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxPQURYOztnQkFFQSxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUQsQ0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsR0FBWSxDQUFFLENBQUEsQ0FBQSxDQUFwQjtnQkFDUCxJQUFHLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxJQUFJLENBQUMsTUFBZjtvQkFDSSxFQUFFLENBQUMsSUFBSCxDQUFRLENBQUMsSUFBSSxDQUFDLE1BQU4sRUFBYyxDQUFFLENBQUEsQ0FBQSxDQUFoQixFQUFvQixTQUFwQixDQUFSLEVBREo7O0FBSko7WUFNQSxFQUFBLEdBQUssRUFBRSxDQUFDLE1BQUgsQ0FBVSxFQUFWLEVBVEo7O1FBV0wsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQWUsRUFBZixFQUFtQixJQUFDLENBQUEsSUFBcEI7UUFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFuQixHQUErQjtRQUUvQixFQUFBLEdBQUssQ0FBQyxFQUFHLENBQUEsQ0FBQSxDQUFILEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFqQixDQUFBLEdBQXdCLElBQUMsQ0FBQSxJQUFJLENBQUM7UUFFbkMsSUFBRyxJQUFDLENBQUEsVUFBSjtZQUNJLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixHQUFvQixvQ0FBQSxHQUFxQyxFQUFyQyxHQUF3QyxnQkFBeEMsR0FBd0QsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUE5RCxHQUF5RTttQkFDN0YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLElBQUMsQ0FBQSxVQUF0QixFQUFrQyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQTFDLEVBRko7O0lBM0NXOzt5QkErQ2YsZUFBQSxHQUFpQixTQUFBO0FBRWIsWUFBQTtRQUFBLENBQUEsR0FBSTtRQUNKLENBQUEsR0FBSSxJQUFDLENBQUEsNkNBQUQsQ0FBK0MsQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVQsRUFBYyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQXRCLENBQS9DLEVBQTJFLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBbkY7UUFDSixJQUFHLENBQUg7WUFDSSxDQUFBLElBQUssTUFBTSxDQUFDLFNBQVAsQ0FBaUIsQ0FBakIsRUFBb0IsSUFBQyxDQUFBLElBQXJCLEVBRFQ7O2VBRUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBdEIsR0FBa0M7SUFOckI7O3lCQVFqQixnQkFBQSxHQUFrQixTQUFBO0FBRWQsWUFBQTtRQUFBLENBQUEsR0FBSTtRQUNKLENBQUEsR0FBSSxJQUFDLENBQUEsNkNBQUQsQ0FBK0MsQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVQsRUFBYyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQXRCLENBQS9DLEVBQTJFLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBbkY7UUFDSixJQUFHLENBQUg7WUFDSSxDQUFBLElBQUssTUFBTSxDQUFDLFNBQVAsQ0FBaUIsQ0FBakIsRUFBb0IsSUFBQyxDQUFBLElBQXJCLEVBQTJCLFdBQTNCLEVBRFQ7O2VBRUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBdEIsR0FBa0M7SUFOcEI7O3lCQWNsQixTQUFBLEdBQVcsU0FBQTtlQUFHLENBQUEsQ0FBRSxjQUFGLEVBQWlCLElBQUMsQ0FBQSxTQUFVLENBQUEsU0FBQSxDQUE1QjtJQUFIOzt5QkFFWCxZQUFBLEdBQWMsU0FBQTtBQUVWLFlBQUE7UUFBQSxJQUFVLENBQUksSUFBQyxDQUFBLFVBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFDLENBQUEsU0FBRCxDQUFBOztnQkFDWSxDQUFFLFNBQVMsQ0FBQyxNQUF4QixDQUErQixPQUEvQixFQUF1QyxLQUF2Qzs7UUFDQSxZQUFBLENBQWEsSUFBQyxDQUFBLFlBQWQ7UUFDQSxVQUFBLEdBQWEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxrQkFBVixFQUE2QixDQUFDLEdBQUQsRUFBSyxHQUFMLENBQTdCO2VBQ2IsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsVUFBQSxDQUFXLElBQUMsQ0FBQSxZQUFaLEVBQTBCLFVBQVcsQ0FBQSxDQUFBLENBQXJDO0lBUE47O3lCQVNkLFlBQUEsR0FBYyxTQUFBO1FBRVYsWUFBQSxDQUFhLElBQUMsQ0FBQSxZQUFkO1FBQ0EsT0FBTyxJQUFDLENBQUE7ZUFDUixJQUFDLENBQUEsVUFBRCxDQUFBO0lBSlU7O3lCQU1kLFdBQUEsR0FBYSxTQUFBO0FBRVQsWUFBQTtRQUFBLEtBQUEsR0FBUSxDQUFJLEtBQUssQ0FBQyxHQUFOLENBQVUsT0FBVixFQUFrQixLQUFsQjtRQUNaLEtBQUssQ0FBQyxHQUFOLENBQVUsT0FBVixFQUFrQixLQUFsQjtRQUNBLElBQUcsS0FBSDttQkFDSSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBREo7U0FBQSxNQUFBO21CQUdJLElBQUMsQ0FBQSxTQUFELENBQUEsRUFISjs7SUFKUzs7eUJBU2IsT0FBQSxHQUFTLFNBQUE7QUFFTCxZQUFBO1FBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFJLElBQUMsQ0FBQTs7Z0JBRUYsQ0FBRSxTQUFTLENBQUMsTUFBeEIsQ0FBK0IsT0FBL0IsRUFBdUMsSUFBQyxDQUFBLEtBQXhDOzs7Z0JBQ1EsQ0FBRSxjQUFWLENBQXlCLElBQUMsQ0FBQSxLQUExQjs7UUFFQSxZQUFBLENBQWEsSUFBQyxDQUFBLFVBQWQ7UUFDQSxVQUFBLEdBQWEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxrQkFBVixFQUE2QixDQUFDLEdBQUQsRUFBSyxHQUFMLENBQTdCO2VBQ2IsSUFBQyxDQUFBLFVBQUQsR0FBYyxVQUFBLENBQVcsSUFBQyxDQUFBLE9BQVosRUFBcUIsSUFBQyxDQUFBLEtBQUQsSUFBVyxVQUFXLENBQUEsQ0FBQSxDQUF0QixJQUE0QixVQUFXLENBQUEsQ0FBQSxDQUE1RDtJQVRUOzt5QkFXVCxVQUFBLEdBQVksU0FBQTtRQUVSLElBQUcsQ0FBSSxJQUFDLENBQUEsVUFBTCxJQUFvQixLQUFLLENBQUMsR0FBTixDQUFVLE9BQVYsQ0FBdkI7bUJBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBQSxFQURKOztJQUZROzt5QkFLWixTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7O2dCQUFZLENBQUUsU0FBUyxDQUFDLE1BQXhCLENBQStCLE9BQS9CLEVBQXVDLEtBQXZDOztRQUVBLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBZDtlQUNBLE9BQU8sSUFBQyxDQUFBO0lBTEQ7O3lCQWFYLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLEVBQUEsR0FBSyxJQUFDLENBQUEsSUFBSSxDQUFDO1FBRVgsSUFBVSxFQUFBLEtBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUF4QjtBQUFBLG1CQUFBOzs7Z0JBRVEsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQXJCLEdBQWdDLENBQUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLEdBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBN0IsQ0FBQSxHQUF3Qzs7UUFDeEUsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsV0FBVyxDQUFDO1FBRTVCLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFzQixFQUF0QjtlQUVBLElBQUMsQ0FBQSxJQUFELENBQU0sWUFBTixFQUFtQixFQUFuQjtJQVhLOzt5QkFhVCxVQUFBLEdBQVksU0FBQTtlQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGlCQUF2QixDQUFBLENBQTBDLENBQUM7SUFBOUM7O3lCQVFaLE9BQUEsR0FBUSxTQUFDLENBQUQsRUFBRyxDQUFIO0FBRUosWUFBQTtRQUFBLEVBQUEsR0FBSyxJQUFDLENBQUEsV0FBVyxDQUFDO1FBQ2xCLEVBQUEsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDO1FBQ2IsRUFBQSxHQUFLLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBQTtRQUNMLEVBQUEsR0FBSyxLQUFBLENBQU0sQ0FBTixFQUFTLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBakIsRUFBK0IsQ0FBQSxHQUFJLEVBQUUsQ0FBQyxJQUFQLEdBQWMsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFwQixHQUE4QixJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBZ0IsQ0FBN0U7UUFDTCxFQUFBLEdBQUssS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQWpCLEVBQStCLENBQUEsR0FBSSxFQUFFLENBQUMsR0FBdEM7UUFDTCxFQUFBLEdBQUssUUFBQSxDQUFTLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBQyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxFQUFBLEdBQUssRUFBakIsQ0FBRCxDQUFBLEdBQXVCLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBeEMsQ0FBVDtRQUNMLEVBQUEsR0FBSyxRQUFBLENBQVMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFDLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLEVBQUEsR0FBSyxFQUFqQixDQUFELENBQUEsR0FBdUIsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUF4QyxDQUFULENBQUEsR0FBZ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUM3RSxDQUFBLEdBQUssQ0FBQyxFQUFELEVBQUssSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsR0FBWSxDQUFyQixFQUF3QixFQUF4QixDQUFMO2VBQ0w7SUFWSTs7eUJBWVIsV0FBQSxHQUFhLFNBQUMsS0FBRDtlQUFXLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBSyxDQUFDLE9BQWYsRUFBd0IsS0FBSyxDQUFDLE9BQTlCO0lBQVg7O3lCQUViLFlBQUEsR0FBYSxTQUFDLENBQUQsRUFBRyxDQUFIO0FBRVQsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLENBQVQsRUFBVyxDQUFYO2VBQ0osSUFBQyxDQUFBLFFBQVMsQ0FBQSxDQUFFLENBQUEsQ0FBQSxDQUFGO0lBSEQ7O3lCQUtiLFlBQUEsR0FBYSxTQUFDLENBQUQsRUFBRyxDQUFIO0FBRVQsWUFBQTtRQUFBLElBQUcsUUFBQSxHQUFXLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUFnQixDQUFoQixDQUFkO1lBQ0ksRUFBQSxHQUFLLFFBQVEsQ0FBQyxxQkFBVCxDQUFBO0FBQ0w7QUFBQSxpQkFBQSxzQ0FBQTs7Z0JBQ0ksRUFBQSxHQUFLLENBQUMsQ0FBQyxxQkFBRixDQUFBO2dCQUNMLElBQUcsQ0FBQSxFQUFFLENBQUMsSUFBSCxJQUFXLENBQVgsSUFBVyxDQUFYLElBQWdCLEVBQUUsQ0FBQyxJQUFILEdBQVEsRUFBRSxDQUFDLEtBQTNCLENBQUg7b0JBQ0ksTUFBQSxHQUFTLENBQUEsR0FBRSxFQUFFLENBQUM7QUFDZCwyQkFBTzt3QkFBQSxJQUFBLEVBQUssQ0FBTDt3QkFBUSxVQUFBLEVBQVcsTUFBbkI7d0JBQTJCLFVBQUEsRUFBVyxRQUFBLENBQVMsTUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBdEIsQ0FBdEM7c0JBRlg7O0FBRkosYUFGSjs7ZUFPQTtJQVRTOzt5QkFZYixZQUFBLEdBQWMsU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFNLENBQUM7SUFBWDs7eUJBRWQsVUFBQSxHQUFZLFNBQUE7QUFFUixZQUFBO1FBQUEsd0NBQVUsQ0FBRSxvQkFBVCxJQUF1QixDQUExQjtBQUFpQyxtQkFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQWhEOztnREFDSyxDQUFFO0lBSEM7O3lCQUtaLFVBQUEsR0FBWSxTQUFBO1FBRVIsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO2VBQ2xCLElBQUMsQ0FBQSxJQUFELENBQU0sWUFBTjtJQUhROzt5QkFLWixLQUFBLEdBQU8sU0FBQTtlQUNILElBQUMsQ0FBQSxRQUFELENBQVUsRUFBVjtJQURHOzt5QkFHUCxLQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO0lBQUg7O3lCQVFQLFFBQUEsR0FBVSxTQUFBO2VBRU4sSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLElBQUosQ0FDSjtZQUFBLE1BQUEsRUFBUyxJQUFDLENBQUEsV0FBVjtZQUVBLE9BQUEsRUFBUyxDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFDLElBQUQsRUFBTyxLQUFQO0FBRUwsd0JBQUE7b0JBQUEsS0FBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQUE7b0JBRUEsUUFBQSxHQUFXLEtBQUMsQ0FBQSxXQUFELENBQWEsS0FBYjtvQkFFWCxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO0FBQ0ksK0JBQU8sT0FEWDtxQkFBQSxNQUVLLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7d0JBQ0QsSUFBRyxDQUFJLEtBQUMsQ0FBQSxlQUFELENBQWlCLFFBQWpCLENBQVA7NEJBQ0ksS0FBQyxDQUFBLGVBQUQsQ0FBaUIsUUFBakIsRUFESjs7d0JBRUEsU0FBQSxDQUFVLEtBQVY7QUFDQSwrQkFBTyxPQUpOOztvQkFNTCxJQUFHLEtBQUMsQ0FBQSxVQUFKO3dCQUNJLElBQUcsU0FBQSxDQUFVLFFBQVYsRUFBb0IsS0FBQyxDQUFBLFFBQXJCLENBQUg7NEJBQ0ksS0FBQyxDQUFBLGVBQUQsQ0FBQTs0QkFDQSxLQUFDLENBQUEsVUFBRCxJQUFlOzRCQUNmLElBQUcsS0FBQyxDQUFBLFVBQUQsS0FBZSxDQUFsQjtnQ0FDSSxLQUFBLEdBQVEsS0FBQyxDQUFBLGlCQUFELENBQW1CLFFBQW5CO2dDQUNSLElBQUcsS0FBSyxDQUFDLE9BQU4sSUFBaUIsS0FBQyxDQUFBLGVBQXJCO29DQUNJLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQURKO2lDQUFBLE1BQUE7b0NBR0ksS0FBQyxDQUFBLDhCQUFELENBQUEsRUFISjtpQ0FGSjs7NEJBTUEsSUFBRyxLQUFDLENBQUEsVUFBRCxLQUFlLENBQWxCO2dDQUNJLEtBQUMsQ0FBQSxlQUFELENBQUE7Z0NBQ0EsQ0FBQSxHQUFJLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFDLENBQUEsUUFBUyxDQUFBLENBQUEsQ0FBL0I7Z0NBQ0osSUFBRyxLQUFLLENBQUMsT0FBVDtvQ0FDSSxLQUFDLENBQUEsbUJBQUQsQ0FBcUIsQ0FBckIsRUFESjtpQ0FBQSxNQUFBO29DQUdJLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQixFQUhKO2lDQUhKOztBQU9BLG1DQWhCSjt5QkFBQSxNQUFBOzRCQWtCSSxLQUFDLENBQUEsY0FBRCxDQUFBLEVBbEJKO3lCQURKOztvQkFxQkEsS0FBQyxDQUFBLFVBQUQsR0FBYztvQkFDZCxLQUFDLENBQUEsUUFBRCxHQUFZO29CQUNaLEtBQUMsQ0FBQSxlQUFELENBQUE7b0JBRUEsQ0FBQSxHQUFJLEtBQUMsQ0FBQSxXQUFELENBQWEsS0FBYjsyQkFDSixLQUFDLENBQUEsVUFBRCxDQUFZLENBQVosRUFBZSxLQUFmO2dCQXhDSztZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGVDtZQTRDQSxNQUFBLEVBQVEsQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQyxJQUFELEVBQU8sS0FBUDtBQUNKLHdCQUFBO29CQUFBLENBQUEsR0FBSSxLQUFDLENBQUEsV0FBRCxDQUFhLEtBQWI7b0JBQ0osSUFBRyxLQUFLLENBQUMsT0FBVDsrQkFDSSxLQUFDLENBQUEsY0FBRCxDQUFnQixDQUFDLEtBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBZixFQUFtQixDQUFFLENBQUEsQ0FBQSxDQUFyQixDQUFoQixFQURKO3FCQUFBLE1BQUE7K0JBR0ksS0FBQyxDQUFBLGlCQUFELENBQW1CLENBQW5CLEVBQXNCOzRCQUFBLE1BQUEsRUFBTyxJQUFQO3lCQUF0QixFQUhKOztnQkFGSTtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0E1Q1I7WUFtREEsTUFBQSxFQUFRLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUE7b0JBQ0osSUFBaUIsS0FBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLElBQXFCLEtBQUEsQ0FBTSxLQUFDLENBQUEsZUFBRCxDQUFBLENBQU4sQ0FBdEM7K0JBQUEsS0FBQyxDQUFBLFVBQUQsQ0FBQSxFQUFBOztnQkFESTtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FuRFI7U0FESTtJQUZGOzt5QkF5RFYsZUFBQSxHQUFpQixTQUFBO1FBRWIsWUFBQSxDQUFhLElBQUMsQ0FBQSxVQUFkO2VBQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxVQUFBLENBQVcsSUFBQyxDQUFBLGNBQVosRUFBNEIsSUFBQyxDQUFBLGVBQUQsSUFBcUIsR0FBckIsSUFBNEIsSUFBeEQ7SUFIRDs7eUJBS2pCLGNBQUEsR0FBZ0IsU0FBQTtRQUVaLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBZDtRQUNBLElBQUMsQ0FBQSxVQUFELEdBQWU7UUFDZixJQUFDLENBQUEsVUFBRCxHQUFlO2VBQ2YsSUFBQyxDQUFBLFFBQUQsR0FBZTtJQUxIOzt5QkFPaEIsbUJBQUEsR0FBcUIsU0FBQyxFQUFEO0FBRWpCLFlBQUE7UUFBQSxLQUFBLEdBQVEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW1CLE9BQW5CLEVBQTJCLElBQUMsQ0FBQSxXQUE1QjtRQUNSLFFBQUEsR0FBVyxLQUFNLENBQUEsSUFBQyxDQUFBLFdBQUQ7QUFDakI7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUcsQ0FBQSxJQUFJLENBQUMsSUFBTCxJQUFhLEVBQWIsSUFBYSxFQUFiLElBQW1CLElBQUksQ0FBQyxJQUF4QixDQUFIO0FBQ0ksdUJBQU8sSUFBSSxFQUFDLEtBQUQsRUFBSixHQUFhLEdBQWIsR0FBbUIsSUFBSSxDQUFDLElBQXhCLEdBQStCLElBRDFDOztBQURKO2VBR0E7SUFQaUI7O3lCQWVyQixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUksS0FBSjtRQUVSLElBQUcsS0FBSyxDQUFDLE1BQVQ7bUJBQ0ksSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQW5CLEVBREo7U0FBQSxNQUVLLElBQUcsS0FBSyxDQUFDLE9BQU4sSUFBaUIsS0FBSyxDQUFDLE9BQTFCO21CQUNELElBQUMsQ0FBQSxlQUFELENBQWlCLENBQWpCLEVBREM7U0FBQSxNQUFBO21CQUdELElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQixFQUFzQjtnQkFBQSxNQUFBLEVBQU8sS0FBSyxDQUFDLFFBQWI7YUFBdEIsRUFIQzs7SUFKRzs7eUJBZVosMEJBQUEsR0FBNEIsU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEtBQVgsRUFBa0IsSUFBbEIsRUFBd0IsS0FBeEI7QUFFeEIsWUFBQTtRQUFBLElBQUcseUJBQUg7WUFDSSxJQUFVLFdBQUEsS0FBZSxJQUFDLENBQUEsWUFBWSxDQUFDLHNCQUFkLENBQXFDLEdBQXJDLEVBQTBDLEdBQTFDLEVBQStDLEtBQS9DLEVBQXNELEtBQXRELENBQXpCO0FBQUEsdUJBQUE7YUFESjs7QUFHQSxnQkFBTyxLQUFQO0FBQUEsaUJBRVMsV0FGVDtBQUUwQix1QkFBTztBQUZqQyxpQkFJUyxLQUpUO2dCQUtRLElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZjtnQkFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO2dCQUNBLElBQUMsQ0FBQSxZQUFELENBQUE7Z0JBQ0EsSUFBQyxDQUFBLGtCQUFELENBQUE7Z0JBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBQTtBQUNBO0FBVlIsaUJBaUJTLGVBakJUO0FBQUEsaUJBaUJ5QixZQWpCekI7QUFBQSxpQkFpQnNDLEtBakJ0QztnQkFpQmlELElBQUMsQ0FBQSxVQUFELENBQUE7QUFqQmpEO0FBbUJBO0FBQUEsYUFBQSxzQ0FBQTs7WUFFSSxJQUFHLE1BQU0sQ0FBQyxLQUFQLEtBQWdCLEtBQWhCLElBQXlCLE1BQU0sQ0FBQyxLQUFQLEtBQWdCLEtBQTVDO0FBQ0ksd0JBQU8sS0FBUDtBQUFBLHlCQUNTLFFBRFQ7QUFBQSx5QkFDa0IsV0FEbEI7QUFDbUMsK0JBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBQTtBQUQxQztBQUVBLHVCQUFPLFlBSFg7O1lBS0EsSUFBRyx1QkFBQSxJQUFtQixFQUFFLENBQUMsUUFBSCxDQUFBLENBQUEsS0FBaUIsUUFBdkM7QUFDSTtBQUFBLHFCQUFBLHdDQUFBOztvQkFDSSxJQUFHLEtBQUEsS0FBUyxXQUFaO3dCQUNJLElBQUcsb0JBQUEsSUFBZ0IsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxJQUFFLENBQUEsTUFBTSxDQUFDLEdBQVAsQ0FBZixDQUFuQjs0QkFDSSxJQUFFLENBQUEsTUFBTSxDQUFDLEdBQVAsQ0FBRixDQUFjLEdBQWQsRUFBbUI7Z0NBQUEsS0FBQSxFQUFPLEtBQVA7Z0NBQWMsR0FBQSxFQUFLLEdBQW5CO2dDQUF3QixLQUFBLEVBQU8sS0FBL0I7NkJBQW5CO0FBQ0EsbUNBRko7eUJBREo7O0FBREosaUJBREo7O1lBT0EsSUFBZ0IscUJBQWhCO0FBQUEseUJBQUE7O0FBRUE7QUFBQSxpQkFBQSx3Q0FBQTs7Z0JBQ0ksSUFBRyxLQUFBLEtBQVMsV0FBWjtvQkFDSSxJQUFHLG9CQUFBLElBQWdCLENBQUMsQ0FBQyxVQUFGLENBQWEsSUFBRSxDQUFBLE1BQU0sQ0FBQyxHQUFQLENBQWYsQ0FBbkI7d0JBQ0ksSUFBRSxDQUFBLE1BQU0sQ0FBQyxHQUFQLENBQUYsQ0FBYyxHQUFkLEVBQW1COzRCQUFBLEtBQUEsRUFBTyxLQUFQOzRCQUFjLEdBQUEsRUFBSyxHQUFuQjs0QkFBd0IsS0FBQSxFQUFPLEtBQS9CO3lCQUFuQjtBQUNBLCtCQUZKO3FCQURKOztBQURKO0FBaEJKO1FBc0JBLElBQUcsSUFBQSxJQUFTLENBQUEsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWlCLEVBQWpCLENBQVo7QUFFSSxtQkFBTyxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixFQUZYOztlQUlBO0lBbER3Qjs7eUJBb0Q1QixTQUFBLEdBQVcsU0FBQyxLQUFEO0FBRVAsWUFBQTtRQUFBLE9BQTRCLE9BQU8sQ0FBQyxRQUFSLENBQWlCLEtBQWpCLENBQTVCLEVBQUUsY0FBRixFQUFPLGNBQVAsRUFBWSxrQkFBWixFQUFtQjtRQUVuQixJQUFVLENBQUksS0FBZDtBQUFBLG1CQUFBOztRQUNBLElBQVUsR0FBQSxLQUFPLGFBQWpCO0FBQUEsbUJBQUE7O1FBRUEsTUFBQSxHQUFTLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixHQUE1QixFQUFpQyxHQUFqQyxFQUFzQyxLQUF0QyxFQUE2QyxJQUE3QyxFQUFtRCxLQUFuRDtRQUVULElBQUcsV0FBQSxLQUFlLE1BQWxCO21CQUNJLFNBQUEsQ0FBVSxLQUFWLEVBREo7O0lBVE87O3lCQVlYLEdBQUEsR0FBSyxTQUFBO1FBQ0QsSUFBVSxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQW5CO0FBQUEsbUJBQUE7O1FBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFWLEdBQWtCO1FBQ2xCLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixFQUFFLENBQUMsTUFBTSxDQUFDLElBQVYsQ0FBZSxTQUFmLEVBQTBCLENBQTFCLENBQWpCO2VBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFWLEdBQWtCO0lBSmpCOzs7O0dBeHZCZ0I7O0FBOHZCekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57ICQsIF8sIGNsYW1wLCBkcmFnLCBlbGVtLCBlbXB0eSwga2Vycm9yLCBrZXlpbmZvLCBrbG9nLCBvcywgcG9zdCwgcHJlZnMsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuICBcbnJlbmRlciAgICAgICA9IHJlcXVpcmUgJy4vcmVuZGVyJ1xuRWRpdG9yU2Nyb2xsID0gcmVxdWlyZSAnLi9lZGl0b3JzY3JvbGwnXG5FZGl0b3IgICAgICAgPSByZXF1aXJlICcuL2VkaXRvcidcbmpzYmVhdXR5ICAgICA9IHJlcXVpcmUgJ2pzLWJlYXV0aWZ5J1xuZWxlY3Ryb24gICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIFRleHRFZGl0b3IgZXh0ZW5kcyBFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSwgY29uZmlnKSAtPlxuXG4gICAgICAgIG5hbWUgPSB2aWV3RWxlbVxuICAgICAgICBuYW1lID0gbmFtZS5zbGljZSAxIGlmIG5hbWVbMF0gPT0gJy4nXG5cbiAgICAgICAgc3VwZXIgbmFtZSwgY29uZmlnXG5cbiAgICAgICAgQGNsaWNrQ291bnQgPSAwXG5cbiAgICAgICAgQHZpZXcgPSQgdmlld0VsZW1cblxuICAgICAgICBAbGF5ZXJzICAgICAgPSBlbGVtIGNsYXNzOidsYXllcnMnXG4gICAgICAgIEBsYXllclNjcm9sbCA9IGVsZW0gY2xhc3M6J2xheWVyU2Nyb2xsJyBjaGlsZDpAbGF5ZXJzXG4gICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBsYXllclNjcm9sbFxuXG4gICAgICAgIGxheWVyID0gW11cbiAgICAgICAgbGF5ZXIucHVzaCAnc2VsZWN0aW9ucydcbiAgICAgICAgbGF5ZXIucHVzaCAnaGlnaGxpZ2h0cydcbiAgICAgICAgbGF5ZXIucHVzaCAnbWV0YScgICAgaWYgJ01ldGEnIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgbGF5ZXIucHVzaCAnbGluZXMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2N1cnNvcnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ251bWJlcnMnIGlmICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIEBpbml0TGF5ZXJzIGxheWVyXG5cbiAgICAgICAgQHNpemUgPSB7fVxuICAgICAgICBAZWxlbSA9IEBsYXllckRpY3QubGluZXNcblxuICAgICAgICBAc3BhbkNhY2hlID0gW10gIyBjYWNoZSBmb3IgcmVuZGVyZWQgbGluZSBzcGFuc1xuICAgICAgICBAbGluZURpdnMgID0ge30gIyBtYXBzIGxpbmUgbnVtYmVycyB0byBkaXNwbGF5ZWQgZGl2c1xuXG4gICAgICAgIEBjb25maWcubGluZUhlaWdodCA/PSAxLjJcblxuICAgICAgICBAc2V0Rm9udFNpemUgcHJlZnMuZ2V0IFwiI3tAbmFtZX1Gb250U2l6ZVwiLCBAY29uZmlnLmZvbnRTaXplID8gMTlcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBFZGl0b3JTY3JvbGwgQFxuICAgICAgICBAc2Nyb2xsLm9uICdzaGlmdExpbmVzJyBAc2hpZnRMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdzaG93TGluZXMnICBAc2hvd0xpbmVzXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgIEBvbkZvY3VzXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICBAb25LZXlEb3duXG5cbiAgICAgICAgQGluaXREcmFnKCkgICAgICAgIFxuXG4gICAgICAgIGZvciBmZWF0dXJlIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgICAgIGlmIGZlYXR1cmUgPT0gJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICAgICAgQGN1cnNvckxpbmUgPSBlbGVtICdkaXYnIGNsYXNzOidjdXJzb3ItbGluZSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmZWF0dXJlTmFtZSA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIGZlYXR1cmVDbHNzID0gcmVxdWlyZSBcIi4vI3tmZWF0dXJlTmFtZX1cIlxuICAgICAgICAgICAgICAgIEBbZmVhdHVyZU5hbWVdID0gbmV3IGZlYXR1cmVDbHNzIEBcblxuICAgICAgICBwb3N0Lm9uICdzY2hlbWVDaGFuZ2VkJyBAb25TY2hlbWVDaGFuZ2VkXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgZGVsOiAtPlxuXG4gICAgICAgIHBvc3QucmVtb3ZlTGlzdGVuZXIgJ3NjaGVtZUNoYW5nZWQnIEBvblNjaGVtZUNoYW5nZWRcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGxiYXI/LmRlbCgpXG5cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgQG9uS2V5RG93blxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdibHVyJyAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgIEBvbkZvY3VzXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgb25Gb2N1czogPT5cblxuICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIEBlbWl0ICdmb2N1cycgQFxuICAgICAgICBwb3N0LmVtaXQgJ2VkaXRvckZvY3VzJyBAXG5cbiAgICBvbkJsdXI6ID0+XG5cbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBlbWl0ICdibHVyJyBAXG5cbiAgICBvblNjaGVtZUNoYW5nZWQ6ID0+XG5cbiAgICAgICAgQHN5bnRheD8uc2NoZW1lQ2hhbmdlZCgpXG4gICAgICAgIGlmIEBtaW5pbWFwXG4gICAgICAgICAgICB1cGRhdGVNaW5pbWFwID0gPT4gQG1pbmltYXA/LmRyYXdMaW5lcygpXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHVwZGF0ZU1pbmltYXAsIDEwXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRMYXllcnM6IChsYXllckNsYXNzZXMpIC0+XG5cbiAgICAgICAgQGxheWVyRGljdCA9IHt9XG4gICAgICAgIGZvciBjbHMgaW4gbGF5ZXJDbGFzc2VzXG4gICAgICAgICAgICBAbGF5ZXJEaWN0W2Nsc10gPSBAYWRkTGF5ZXIgY2xzXG5cbiAgICBhZGRMYXllcjogKGNscykgLT5cblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNcbiAgICAgICAgQGxheWVycy5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgZGl2XG5cbiAgICB1cGRhdGVMYXllcnM6ICgpIC0+XG5cbiAgICAgICAgQHJlbmRlckhpZ2hsaWdodHMoKVxuICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgQGNsZWFyTGluZXMoKVxuXG4gICAgICAgIGxpbmVzID89IFtdXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdXG4gICAgICAgIEBsaW5lRGl2cyAgPSB7fVxuXG4gICAgICAgIHN1cGVyIGxpbmVzXG5cbiAgICAgICAgQHNjcm9sbC5yZXNldCgpXG5cbiAgICAgICAgdmlld0hlaWdodCA9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwuc3RhcnQgdmlld0hlaWdodCwgQG51bUxpbmVzKClcblxuICAgICAgICBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdCA9IDBcbiAgICAgICAgQGxheWVyc1dpZHRoICA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICBAbGF5ZXJzSGVpZ2h0ID0gQGxheWVyU2Nyb2xsLm9mZnNldEhlaWdodFxuXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhcHBlbmRUZXh0OiAodGV4dCkgLT5cblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIGxvZyBcIiN7QG5hbWV9LmFwcGVuZFRleHQgLSBubyB0ZXh0P1wiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBhcHBlbmRlZCA9IFtdXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLmFwcGVuZExpbmUgbFxuICAgICAgICAgICAgYXBwZW5kZWQucHVzaCBAbnVtTGluZXMoKS0xXG5cbiAgICAgICAgaWYgQHNjcm9sbC52aWV3SGVpZ2h0ICE9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCBAdmlld0hlaWdodCgpXG5cbiAgICAgICAgc2hvd0xpbmVzID0gKEBzY3JvbGwuYm90IDwgQHNjcm9sbC50b3ApIG9yIChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudmlld0xpbmVzKVxuXG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKCksIHNob3dMaW5lczpzaG93TGluZXNcblxuICAgICAgICBmb3IgbGkgaW4gYXBwZW5kZWRcbiAgICAgICAgICAgIEBlbWl0ICdsaW5lQXBwZW5kZWQnLFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleDogbGlcbiAgICAgICAgICAgICAgICB0ZXh0OiBAbGluZSBsaVxuXG4gICAgICAgIEBlbWl0ICdsaW5lc0FwcGVuZGVkJyBsc1xuICAgICAgICBAZW1pdCAnbnVtTGluZXMnIEBudW1MaW5lcygpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc2V0Rm9udFNpemU6IChmb250U2l6ZSkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsYXllcnMuc3R5bGUuZm9udFNpemUgPSBcIiN7Zm9udFNpemV9cHhcIlxuICAgICAgICBAc2l6ZS5udW1iZXJzV2lkdGggPSAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlcyBhbmQgNTAgb3IgMFxuICAgICAgICBAc2l6ZS5mb250U2l6ZSAgICAgPSBmb250U2l6ZVxuICAgICAgICBAc2l6ZS5saW5lSGVpZ2h0ICAgPSBNYXRoLmZsb29yIGZvbnRTaXplICogQGNvbmZpZy5saW5lSGVpZ2h0XG4gICAgICAgIEBzaXplLmNoYXJXaWR0aCAgICA9IGZvbnRTaXplICogMC42XG4gICAgICAgIEBzaXplLm9mZnNldFggICAgICA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoLzIgKyBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgQHNpemUub2Zmc2V0WCAgICAgID0gTWF0aC5tYXggQHNpemUub2Zmc2V0WCwgKEBzY3JlZW5TaXplKCkud2lkdGggLSBAc2NyZWVuU2l6ZSgpLmhlaWdodCkgLyAyIGlmIEBzaXplLmNlbnRlclRleHRcblxuICAgICAgICBAc2Nyb2xsPy5zZXRMaW5lSGVpZ2h0IEBzaXplLmxpbmVIZWlnaHRcblxuICAgICAgICBAZW1pdCAnZm9udFNpemVDaGFuZ2VkJyAjIG51bWJlcnNcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICAjIGlmIHZhbGlkIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgIyBrbG9nICd0ZXh0ZWRpdG9yLmNoYW5nZWQnIGNoYW5nZUluZm9cblxuICAgICAgICBAc3ludGF4LmNoYW5nZWQgY2hhbmdlSW5mb1xuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBbZGksbGksY2hdID0gW2NoYW5nZS5kb0luZGV4LCBjaGFuZ2UubmV3SW5kZXgsIGNoYW5nZS5jaGFuZ2VdXG4gICAgICAgICAgICBzd2l0Y2ggY2hcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlTGluZSBsaSwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVDaGFuZ2VkJyBsaVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJ1xuICAgICAgICAgICAgICAgICAgICBAc3BhbkNhY2hlID0gQHNwYW5DYWNoZS5zbGljZSAwLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZURlbGV0ZWQnIGRpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2luc2VydGVkJ1xuICAgICAgICAgICAgICAgICAgICBAc3BhbkNhY2hlID0gQHNwYW5DYWNoZS5zbGljZSAwLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZUluc2VydGVkJyBsaSwgZGlcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmluc2VydHMgb3IgY2hhbmdlSW5mby5kZWxldGVzXG4gICAgICAgICAgICBAbGF5ZXJzV2lkdGggPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKClcbiAgICAgICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmN1cnNvcnNcbiAgICAgICAgICAgIEByZW5kZXJDdXJzb3JzKClcbiAgICAgICAgICAgIEBzY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuICAgICAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgICAgIEBzdXNwZW5kQmxpbmsoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgICAgIEBlbWl0ICdjaGFuZ2VkJyBjaGFuZ2VJbmZvXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZTogKGxpLCBvaSkgLT5cblxuICAgICAgICBvaSA9IGxpIGlmIG5vdCBvaT9cblxuICAgICAgICBpZiBsaSA8IEBzY3JvbGwudG9wIG9yIGxpID4gQHNjcm9sbC5ib3RcbiAgICAgICAgICAgIGtlcnJvciBcImRhbmdsaW5nIGxpbmUgZGl2PyAje2xpfVwiLCBAbGluZURpdnNbbGldIGlmIEBsaW5lRGl2c1tsaV0/XG4gICAgICAgICAgICBkZWxldGUgQHNwYW5DYWNoZVtsaV1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJ1cGRhdGVMaW5lIC0gb3V0IG9mIGJvdW5kcz8gbGkgI3tsaX0gb2kgI3tvaX1cIiBpZiBub3QgQGxpbmVEaXZzW29pXVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldID0gcmVuZGVyLmxpbmVTcGFuIEBzeW50YXguZ2V0RGlzcyhsaSksIEBzaXplXG5cbiAgICAgICAgZGl2ID0gQGxpbmVEaXZzW29pXVxuICAgICAgICBkaXYucmVwbGFjZUNoaWxkIEBzcGFuQ2FjaGVbbGldLCBkaXYuZmlyc3RDaGlsZFxuICAgICAgICBcbiAgICByZWZyZXNoTGluZXM6ICh0b3AsIGJvdCkgLT5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBzeW50YXguZ2V0RGlzcyBsaSwgdHJ1ZVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hvd0xpbmVzOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBAbGluZURpdnMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAYXBwZW5kTGluZSBsaVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgIEBlbWl0ICdsaW5lc1Nob3duJyB0b3AsIGJvdCwgbnVtXG4gICAgXG4gICAgYXBwZW5kTGluZTogKGxpKSAtPlxuXG4gICAgICAgIEBsaW5lRGl2c1tsaV0gPSBlbGVtIGNsYXNzOiAnbGluZSdcbiAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBAY2FjaGVkU3BhbiBsaVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZURpdnNbbGldXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNoaWZ0TGluZXM6ICh0b3AsIGJvdCwgbnVtKSA9PlxuICAgICAgICBcbiAgICAgICAgb2xkVG9wID0gdG9wIC0gbnVtXG4gICAgICAgIG9sZEJvdCA9IGJvdCAtIG51bVxuXG4gICAgICAgIGRpdkludG8gPSAobGksbG8pID0+XG5cbiAgICAgICAgICAgIGlmIG5vdCBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICAgICAgbG9nIFwiI3tAbmFtZX0uc2hpZnRMaW5lcy5kaXZJbnRvIC0gbm8gZGl2PyAje3RvcH0gI3tib3R9ICN7bnVtfSBvbGQgI3tvbGRUb3B9ICN7b2xkQm90fSBsbyAje2xvfSBsaSAje2xpfVwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgXy5pc0VsZW1lbnQgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgICAgIGxvZyBcIiN7QG5hbWV9LnNoaWZ0TGluZXMuZGl2SW50byAtIG5vIGVsZW1lbnQ/ICN7dG9wfSAje2JvdH0gI3tudW19IG9sZCAje29sZFRvcH0gI3tvbGRCb3R9IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBAbGluZURpdnNbbGldLnJlcGxhY2VDaGlsZCBAY2FjaGVkU3BhbihsaSksIEBsaW5lRGl2c1tsaV0uZmlyc3RDaGlsZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAc2hvd0ludmlzaWJsZXNcbiAgICAgICAgICAgICAgICB0eCA9IEBsaW5lKGxpKS5sZW5ndGggKiBAc2l6ZS5jaGFyV2lkdGggKyAxXG4gICAgICAgICAgICAgICAgc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOiBcImludmlzaWJsZSBuZXdsaW5lXCIsIGh0bWw6ICcmIzk2ODcnXG4gICAgICAgICAgICAgICAgc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgje3R4fXB4LCAtMS41cHgpXCJcbiAgICAgICAgICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIHNwYW5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICB3aGlsZSBvbGRCb3QgPCBib3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgKz0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkQm90LCBvbGRUb3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgKz0gMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBvbGRUb3AgPiB0b3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgLT0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkVG9wLCBvbGRCb3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgLT0gMVxuXG4gICAgICAgIEBlbWl0ICdsaW5lc1NoaWZ0ZWQnIHRvcCwgYm90LCBudW1cblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmVQb3NpdGlvbnM6IChhbmltYXRlPTApIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbGksZGl2IG9mIEBsaW5lRGl2c1xuICAgICAgICAgICAgaWYgZGl2Py5zdHlsZT9cbiAgICAgICAgICAgICAgICB5ID0gQHNpemUubGluZUhlaWdodCAqIChsaSAtIEBzY3JvbGwudG9wKVxuICAgICAgICAgICAgICAgIGRpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZTNkKCN7QHNpemUub2Zmc2V0WH1weCwje3l9cHgsIDApXCJcbiAgICAgICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNpdGlvbiA9IFwiYWxsICN7YW5pbWF0ZS8xMDAwfXNcIiBpZiBhbmltYXRlXG4gICAgICAgICAgICAgICAgZGl2LnN0eWxlLnpJbmRleCA9IGxpXG5cbiAgICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGVsZW0uY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2l0aW9uID0gJ2luaXRpYWwnXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcblxuICAgIHVwZGF0ZUxpbmVzOiAoKSAtPlxuXG4gICAgICAgIGZvciBsaSBpbiBbQHNjcm9sbC50b3AuLkBzY3JvbGwuYm90XVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcblxuICAgIGNsZWFySGlnaGxpZ2h0czogKCkgLT5cblxuICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAkKCcuaGlnaGxpZ2h0cycgQGxheWVycykuaW5uZXJIVE1MID0gJydcbiAgICAgICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjYWNoZWRTcGFuOiAobGkpIC0+XG5cbiAgICAgICAgaWYgbm90IEBzcGFuQ2FjaGVbbGldXG5cbiAgICAgICAgICAgIEBzcGFuQ2FjaGVbbGldID0gcmVuZGVyLmxpbmVTcGFuIEBzeW50YXguZ2V0RGlzcyhsaSksIEBzaXplXG5cbiAgICAgICAgQHNwYW5DYWNoZVtsaV1cblxuICAgIHJlbmRlckN1cnNvcnM6IC0+XG5cbiAgICAgICAgY3MgPSBbXVxuICAgICAgICBmb3IgYyBpbiBAY3Vyc29ycygpXG4gICAgICAgICAgICBpZiBjWzFdID49IEBzY3JvbGwudG9wIGFuZCBjWzFdIDw9IEBzY3JvbGwuYm90XG4gICAgICAgICAgICAgICAgY3MucHVzaCBbY1swXSwgY1sxXSAtIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcblxuICAgICAgICBpZiBAbnVtQ3Vyc29ycygpID09IDFcblxuICAgICAgICAgICAgaWYgY3MubGVuZ3RoID09IDFcblxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBtY1sxXSA8IDBcblxuICAgICAgICAgICAgICAgIGlmIG1jWzFdID4gQG51bUxpbmVzKCktMVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiI3tAbmFtZX0ucmVuZGVyQ3Vyc29ycyBtYWluQ3Vyc29yIERBRlVLP1wiLCBAbnVtTGluZXMoKSwgc3RyIEBtYWluQ3Vyc29yKClcblxuICAgICAgICAgICAgICAgIHJpID0gbWNbMV0tQHNjcm9sbC50b3BcbiAgICAgICAgICAgICAgICBjdXJzb3JMaW5lID0gQHN0YXRlLmxpbmUobWNbMV0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbWFpbiBjdXJzb3IgbGluZT8nIGlmIG5vdCBjdXJzb3JMaW5lP1xuICAgICAgICAgICAgICAgIGlmIG1jWzBdID4gY3Vyc29yTGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAndmlydHVhbCdcbiAgICAgICAgICAgICAgICAgICAgY3MucHVzaCBbY3Vyc29yTGluZS5sZW5ndGgsIHJpLCAnbWFpbiBvZmYnXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAnbWFpbiBvZmYnXG5cbiAgICAgICAgZWxzZSBpZiBAbnVtQ3Vyc29ycygpID4gMVxuXG4gICAgICAgICAgICB2YyA9IFtdICMgdmlydHVhbCBjdXJzb3JzXG4gICAgICAgICAgICBmb3IgYyBpbiBjc1xuICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBAbWFpbkN1cnNvcigpLCBbY1swXSwgY1sxXSArIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgICAgICBjWzJdID0gJ21haW4nXG4gICAgICAgICAgICAgICAgbGluZSA9IEBsaW5lKEBzY3JvbGwudG9wK2NbMV0pXG4gICAgICAgICAgICAgICAgaWYgY1swXSA+IGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHZjLnB1c2ggW2xpbmUubGVuZ3RoLCBjWzFdLCAndmlydHVhbCddXG4gICAgICAgICAgICBjcyA9IGNzLmNvbmNhdCB2Y1xuXG4gICAgICAgIGh0bWwgPSByZW5kZXIuY3Vyc29ycyBjcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5jdXJzb3JzLmlubmVySFRNTCA9IGh0bWxcbiAgICAgICAgXG4gICAgICAgIHR5ID0gKG1jWzFdIC0gQHNjcm9sbC50b3ApICogQHNpemUubGluZUhlaWdodFxuICAgICAgICBcbiAgICAgICAgaWYgQGN1cnNvckxpbmVcbiAgICAgICAgICAgIEBjdXJzb3JMaW5lLnN0eWxlID0gXCJ6LWluZGV4OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZTNkKDAsI3t0eX1weCwwKTsgaGVpZ2h0OiN7QHNpemUubGluZUhlaWdodH1weDtcIlxuICAgICAgICAgICAgQGxheWVycy5pbnNlcnRCZWZvcmUgQGN1cnNvckxpbmUsIEBsYXllcnMuZmlyc3RDaGlsZFxuXG4gICAgcmVuZGVyU2VsZWN0aW9uOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIHMgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICBpZiBzXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5zZWxlY3Rpb25zLmlubmVySFRNTCA9IGhcblxuICAgIHJlbmRlckhpZ2hsaWdodHM6IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgcyA9IEBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgIGlmIHNcbiAgICAgICAgICAgIGggKz0gcmVuZGVyLnNlbGVjdGlvbiBzLCBAc2l6ZSwgXCJoaWdobGlnaHRcIlxuICAgICAgICBAbGF5ZXJEaWN0LmhpZ2hsaWdodHMuaW5uZXJIVE1MID0gaFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjdXJzb3JEaXY6IC0+ICQgJy5jdXJzb3IubWFpbicgQGxheWVyRGljdFsnY3Vyc29ycyddXG5cbiAgICBzdXNwZW5kQmxpbms6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYmxpbmtUaW1lclxuICAgICAgICBAc3RvcEJsaW5rKClcbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgZmFsc2VcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzdXNwZW5kVGltZXJcbiAgICAgICAgYmxpbmtEZWxheSA9IHByZWZzLmdldCAnY3Vyc29yQmxpbmtEZWxheScgWzgwMCwyMDBdXG4gICAgICAgIEBzdXNwZW5kVGltZXIgPSBzZXRUaW1lb3V0IEByZWxlYXNlQmxpbmssIGJsaW5rRGVsYXlbMF1cblxuICAgIHJlbGVhc2VCbGluazogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBkZWxldGUgQHN1c3BlbmRUaW1lclxuICAgICAgICBAc3RhcnRCbGluaygpXG5cbiAgICB0b2dnbGVCbGluazogLT5cblxuICAgICAgICBibGluayA9IG5vdCBwcmVmcy5nZXQgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBwcmVmcy5zZXQgJ2JsaW5rJyBibGlua1xuICAgICAgICBpZiBibGlua1xuICAgICAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc3RvcEJsaW5rKClcblxuICAgIGRvQmxpbms6ID0+XG5cbiAgICAgICAgQGJsaW5rID0gbm90IEBibGlua1xuICAgICAgICBcbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgQGJsaW5rXG4gICAgICAgIEBtaW5pbWFwPy5kcmF3TWFpbkN1cnNvciBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYmxpbmtUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JyBbODAwLDIwMF1cbiAgICAgICAgQGJsaW5rVGltZXIgPSBzZXRUaW1lb3V0IEBkb0JsaW5rLCBAYmxpbmsgYW5kIGJsaW5rRGVsYXlbMV0gb3IgYmxpbmtEZWxheVswXVxuXG4gICAgc3RhcnRCbGluazogLT4gXG4gICAgXG4gICAgICAgIGlmIG5vdCBAYmxpbmtUaW1lciBhbmQgcHJlZnMuZ2V0ICdibGluaydcbiAgICAgICAgICAgIEBkb0JsaW5rKCkgXG5cbiAgICBzdG9wQmxpbms6IC0+XG5cbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYmxpbmtUaW1lclxuICAgICAgICBkZWxldGUgQGJsaW5rVGltZXJcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgcmVzaXplZDogLT5cblxuICAgICAgICB2aCA9IEB2aWV3LmNsaWVudEhlaWdodFxuXG4gICAgICAgIHJldHVybiBpZiB2aCA9PSBAc2Nyb2xsLnZpZXdIZWlnaHRcblxuICAgICAgICBAbnVtYmVycz8uZWxlbS5zdHlsZS5oZWlnaHQgPSBcIiN7QHNjcm9sbC5leHBvc2VOdW0gKiBAc2Nyb2xsLmxpbmVIZWlnaHR9cHhcIlxuICAgICAgICBAbGF5ZXJzV2lkdGggPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcblxuICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgdmhcblxuICAgICAgICBAZW1pdCAndmlld0hlaWdodCcgdmhcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnJlbW90ZS5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS53b3JrQXJlYVNpemVcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgcG9zQXRYWTooeCx5KSAtPlxuXG4gICAgICAgIHNsID0gQGxheWVyU2Nyb2xsLnNjcm9sbExlZnRcbiAgICAgICAgc3QgPSBAc2Nyb2xsLm9mZnNldFRvcFxuICAgICAgICBiciA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIGx4ID0gY2xhbXAgMCwgQGxheWVycy5vZmZzZXRXaWR0aCwgIHggLSBici5sZWZ0IC0gQHNpemUub2Zmc2V0WCArIEBzaXplLmNoYXJXaWR0aC8zXG4gICAgICAgIGx5ID0gY2xhbXAgMCwgQGxheWVycy5vZmZzZXRIZWlnaHQsIHkgLSBici50b3BcbiAgICAgICAgcHggPSBwYXJzZUludChNYXRoLmZsb29yKChNYXRoLm1heCgwLCBzbCArIGx4KSkvQHNpemUuY2hhcldpZHRoKSlcbiAgICAgICAgcHkgPSBwYXJzZUludChNYXRoLmZsb29yKChNYXRoLm1heCgwLCBzdCArIGx5KSkvQHNpemUubGluZUhlaWdodCkpICsgQHNjcm9sbC50b3BcbiAgICAgICAgcCAgPSBbcHgsIE1hdGgubWluKEBudW1MaW5lcygpLTEsIHB5KV1cbiAgICAgICAgcFxuXG4gICAgcG9zRm9yRXZlbnQ6IChldmVudCkgLT4gQHBvc0F0WFkgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WVxuXG4gICAgbGluZUVsZW1BdFhZOih4LHkpIC0+XG5cbiAgICAgICAgcCA9IEBwb3NBdFhZIHgseVxuICAgICAgICBAbGluZURpdnNbcFsxXV1cblxuICAgIGxpbmVTcGFuQXRYWTooeCx5KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZUVsZW0gPSBAbGluZUVsZW1BdFhZIHgseVxuICAgICAgICAgICAgbHIgPSBsaW5lRWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgZm9yIGUgaW4gbGluZUVsZW0uZmlyc3RDaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGJyID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgICAgIGlmIGJyLmxlZnQgPD0geCA8PSBici5sZWZ0K2JyLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHgtYnIubGVmdFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3BhbjplLCBvZmZzZXRMZWZ0Om9mZnNldCwgb2Zmc2V0Q2hhcjpwYXJzZUludCBvZmZzZXQvQHNpemUuY2hhcldpZHRoXG4gICAgICAgIG51bGxcblxuICAgICMgbnVtRnVsbExpbmVzOiAtPiBNYXRoLmZsb29yKEB2aWV3SGVpZ2h0KCkgLyBAc2l6ZS5saW5lSGVpZ2h0KVxuICAgIG51bUZ1bGxMaW5lczogLT4gQHNjcm9sbC5mdWxsTGluZXNcbiAgICBcbiAgICB2aWV3SGVpZ2h0OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIEBzY3JvbGw/LnZpZXdIZWlnaHQgPj0gMCB0aGVuIHJldHVybiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgQHZpZXc/LmNsaWVudEhlaWdodFxuXG4gICAgY2xlYXJMaW5lczogPT5cblxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAZW1pdCAnY2xlYXJMaW5lcydcblxuICAgIGNsZWFyOiA9PiBcbiAgICAgICAgQHNldExpbmVzIFtdXG5cbiAgICBmb2N1czogLT4gQHZpZXcuZm9jdXMoKVxuXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBpbml0RHJhZzogLT5cblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAbGF5ZXJTY3JvbGxcblxuICAgICAgICAgICAgb25TdGFydDogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEB2aWV3LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZXZlbnRQb3MgPSBAcG9zRm9yRXZlbnQgZXZlbnRcblxuICAgICAgICAgICAgICAgIGlmIGV2ZW50LmJ1dHRvbiA9PSAyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGV2ZW50LmJ1dHRvbiA9PSAxXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBAanVtcFRvRmlsZUF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgICAgICBAanVtcFRvV29yZEF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnRcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIGV2ZW50UG9zLCBAY2xpY2tQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNsaWNrQ291bnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlID0gQHJhbmdlRm9yV29yZEF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleSBvciBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAaGlnaGxpZ2h0V29yZEFuZEFkZFRvU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gQHJhbmdlRm9yTGluZUF0SW5kZXggQGNsaWNrUG9zWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBvbkNsaWNrVGltZW91dCgpXG5cbiAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCA9IDFcbiAgICAgICAgICAgICAgICBAY2xpY2tQb3MgPSBldmVudFBvc1xuICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuXG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIEBjbGlja0F0UG9zIHAsIGV2ZW50XG5cbiAgICAgICAgICAgIG9uTW92ZTogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBbQG1haW5DdXJzb3IoKVswXSwgcFsxXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6dHJ1ZVxuXG4gICAgICAgICAgICBvblN0b3A6ID0+XG4gICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKSBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBlbXB0eSBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgc3RhcnRDbGlja1RpbWVyOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tUaW1lciA9IHNldFRpbWVvdXQgQG9uQ2xpY2tUaW1lb3V0LCBAc3RpY2t5U2VsZWN0aW9uIGFuZCAzMDAgb3IgMTAwMFxuXG4gICAgb25DbGlja1RpbWVvdXQ6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja0NvdW50ICA9IDBcbiAgICAgICAgQGNsaWNrVGltZXIgID0gbnVsbFxuICAgICAgICBAY2xpY2tQb3MgICAgPSBudWxsXG5cbiAgICBmdW5jSW5mb0F0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJyBAY3VycmVudEZpbGVcbiAgICAgICAgZmlsZUluZm8gPSBmaWxlc1tAY3VycmVudEZpbGVdXG4gICAgICAgIGZvciBmdW5jIGluIGZpbGVJbmZvLmZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLmxpbmUgPD0gbGkgPD0gZnVuYy5sYXN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2xhc3MgKyAnLicgKyBmdW5jLm5hbWUgKyAnICdcbiAgICAgICAgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQuYWx0S2V5XG4gICAgICAgICAgICBAdG9nZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICBlbHNlIGlmIGV2ZW50Lm1ldGFLZXkgb3IgZXZlbnQuY3RybEtleVxuICAgICAgICAgICAgQGp1bXBUb1dvcmRBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6ZXZlbnQuc2hpZnRLZXlcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhdXRvY29tcGxldGU/XG4gICAgICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gQGF1dG9jb21wbGV0ZS5oYW5kbGVNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJyB0aGVuIHJldHVybiAndW5oYW5kbGVkJyAjIGhhcyBjaGFyIHNldCBvbiB3aW5kb3dzP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICBAY2xlYXJDdXJzb3JzKClcbiAgICAgICAgICAgICAgICBAZW5kU3RpY2t5U2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICBAc2VsZWN0Tm9uZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgIyBpZiBAc2FsdGVyTW9kZSAgICAgICAgICB0aGVuIHJldHVybiBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICAgICAgICAgICMgaWYgQG51bUhpZ2hsaWdodHMoKSAgICAgdGhlbiByZXR1cm4gQGNsZWFySGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgIyBpZiBAbnVtQ3Vyc29ycygpID4gMSAgICB0aGVuIHJldHVybiBAY2xlYXJDdXJzb3JzKClcbiAgICAgICAgICAgICAgICAjIGlmIEBzdGlja3lTZWxlY3Rpb24gICAgIHRoZW4gcmV0dXJuIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICMgaWYgQG51bVNlbGVjdGlvbnMoKSAgICAgdGhlbiByZXR1cm4gQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJyAnY3RybCtlbnRlcicgJ2YxMicgdGhlbiBAanVtcFRvV29yZCgpXG5cbiAgICAgICAgZm9yIGFjdGlvbiBpbiBFZGl0b3IuYWN0aW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uY29tYm8gPT0gY29tYm8gb3IgYWN0aW9uLmFjY2VsID09IGNvbWJvXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgJ2NvbW1hbmQrYScgdGhlbiByZXR1cm4gQHNlbGVjdEFsbCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uYWNjZWxzPyBhbmQgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJ1xuICAgICAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uYWNjZWxzXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgYWN0aW9uLmNvbWJvcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5jb21ib3NcbiAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGNoYXIgYW5kIG1vZCBpbiBbXCJzaGlmdFwiLCBcIlwiXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gQGluc2VydENoYXJhY3RlciBjaGFyXG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uS2V5RG93bjogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuICAgICAgICByZXR1cm4gaWYga2V5ID09ICdyaWdodCBjbGljaycgIyB3ZWlyZCByaWdodCBjb21tYW5kIGtleVxuXG4gICAgICAgIHJlc3VsdCA9IEBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudCBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gcmVzdWx0XG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGxvZzogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBuYW1lICE9ICdlZGl0b3InXG4gICAgICAgIGtsb2cuc2xvZy5kZXB0aCA9IDNcbiAgICAgICAga2xvZy5hcHBseSBrbG9nLCBbXS5zcGxpY2UuY2FsbCBhcmd1bWVudHMsIDBcbiAgICAgICAga2xvZy5zbG9nLmRlcHRoID0gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/texteditor.coffee