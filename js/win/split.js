// koffee 1.4.0

/*
 0000000  00000000   000      000  000000000
000       000   000  000      000     000   
0000000   00000000   000      000     000   
     000  000        000      000     000   
0000000   000        0000000  000     000
 */
var $, Flex, Split, event, kerror, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, kerror = ref.kerror, $ = ref.$;

event = require('events');

Flex = require('./flex/flex');

Split = (function() {
    function Split() {
        this.resized = bind(this.resized, this);
        this.hideTerminal = bind(this.hideTerminal, this);
        this.hideEditor = bind(this.hideEditor, this);
        this.restore = bind(this.restore, this);
        this.stash = bind(this.stash, this);
        this.emitSplit = bind(this.emitSplit, this);
        this.onDrag = bind(this.onDrag, this);
        this.commandlineHeight = 30;
        this.handleHeight = 6;
        this.elem = $('split');
        this.terminal = $('terminal');
        this.browser = $('browser');
        this.commandline = $('commandline');
        this.editor = $('editor');
        post.on('focus', this.focus);
        post.on('stash', this.stash);
        post.on('restore', this.restore);
        this.flex = new Flex({
            panes: [
                {
                    div: this.terminal,
                    collapsed: true
                }, {
                    div: this.commandline,
                    fixed: this.commandlineHeight
                }, {
                    div: this.editor
                }
            ],
            direction: 'vertical',
            handleSize: this.handleHeight,
            onDrag: this.onDrag,
            onDragEnd: this.onDrag,
            onPaneSize: this.onDrag,
            snapFirst: 20,
            snapLast: 100
        });
    }

    Split.prototype.onDrag = function() {
        if (this.flex != null) {
            return this.emitSplit();
        }
    };

    Split.prototype.emitSplit = function() {
        return post.emit('split', this.flex.panePositions());
    };

    Split.prototype.stash = function() {
        window.stash.set('split|flex', this.flex.getState());
        return window.stash.set('split|browser', this.flex.panes[0].div === this.browser);
    };

    Split.prototype.restore = function() {
        var state;
        if (state = window.stash.get('split|flex')) {
            this.flex.restoreState(state);
            this.emitSplit();
        } else {
            this["do"]('maximize editor');
        }
        if (this.flex.panes[0].div !== this.browser && window.stash.get('split|browser')) {
            return this.raise('browser');
        }
    };

    Split.prototype["do"] = function(sentence) {
        var action, delta, pos, what, words;
        sentence = sentence.trim();
        if (!sentence.length) {
            return;
        }
        words = sentence.split(/\s+/);
        action = words[0];
        what = words[1];
        switch (action) {
            case 'show':
                return this.show(what);
            case 'focus':
                return this.focus(what);
            case 'half':
                pos = this.flex.size() / 2;
                break;
            case 'third':
                pos = this.flex.size() / 3;
                break;
            case 'quart':
                pos = this.flex.size() / 4;
                break;
            case 'maximize':
                if (what === 'editor') {
                    return this.maximizeEditor();
                }
                delta = this.flex.size();
                break;
            case 'minimize':
                if (what === 'editor') {
                    return this.minimizeEditor();
                }
                delta = -this.flex.size();
                break;
            case 'enlarge':
                if (words[2] === 'by') {
                    delta = parseInt(words[3]);
                } else {
                    delta = parseInt(0.25 * this.termEditHeight());
                }
                break;
            case 'reduce':
                if (words[2] === 'by') {
                    delta = -parseInt(words[3]);
                } else {
                    delta = -parseInt(0.25 * this.termEditHeight());
                }
                break;
            default:
                return console.error("Split.do -- unknown action '" + action + "'");
        }
        switch (what) {
            case 'editor':
                return this.moveCommandLineBy(-delta);
            case 'terminal':
            case 'browser':
            case 'commandline':
                if (what !== 'commandline') {
                    this.raise(what);
                }
                if (delta != null) {
                    this.moveCommandLineBy(delta);
                }
                if (pos != null) {
                    this.flex.moveHandleToPos(this.flex.handles[0], pos);
                }
                return;
        }
        return console.error("Split.do -- unhandled do command? " + sentence + "?");
    };

    Split.prototype.maximizeEditor = function() {
        this.focus('editor');
        this.flex.expand('editor');
        this.hideCommandline();
        return this.flex.resized();
    };

    Split.prototype.minimizeEditor = function() {
        this.showCommandline();
        this.focus('commandline');
        return this.flex.moveHandleToPos(this.flex.handles[1], this.flex.size());
    };

    Split.prototype.show = function(n) {
        switch (n) {
            case 'terminal':
            case 'browser':
                return this.raise(n);
            case 'editor':
                this.flex.expand('editor');
                if (this.editorHeight() < this.flex.size() / 3) {
                    if (this.flex.handles[1].pos() > this.flex.size() / 3) {
                        this.flex.moveHandleToPos(this.flex.handles[1], this.flex.size() / 3);
                    }
                    if (this.flex.handles[2].pos() < 2 * this.flex.size() / 3) {
                        return this.flex.moveHandleToPos(this.flex.handles[2], 2 * this.flex.size() / 3);
                    }
                }
                break;
            case 'command':
                return this.flex.expand('commandline');
            default:
                return console.error("split.show -- unhandled: " + n + "!");
        }
    };

    Split.prototype.hideEditor = function() {
        return this.flex.collapse('editor');
    };

    Split.prototype.hideTerminal = function() {
        return this.flex.collapse('terminal');
    };

    Split.prototype.swap = function(old, nju) {
        if (this.flex.panes[0].div !== nju) {
            nju.style.height = (this.flex.sizeOfPane(0)) + "px";
            old.style.display = 'none';
            nju.style.display = 'block';
            return this.flex.panes[0].div = nju;
        }
    };

    Split.prototype.raise = function(n) {
        switch (n) {
            case 'terminal':
                this.swap(this.browser, this.terminal);
                break;
            case 'browser':
                this.swap(this.terminal, this.browser);
        }
        this.flex.calculate();
        if (n === 'editor') {
            if (this.editorHeight() < this.flex.size() / 8) {
                return this.flex.moveHandleToPos(this.flex.handles[0], 3 * this.flex.size() / 4);
            }
        } else {
            if (this.terminalHeight() < this.flex.size() / 8) {
                return this.flex.moveHandleToPos(this.flex.handles[0], this.flex.size() / 4);
            }
        }
    };

    Split.prototype.moveCommandLineBy = function(delta) {
        return this.flex.moveHandle({
            index: 1,
            pos: this.flex.posOfHandle(1) + delta
        });
    };

    Split.prototype.hideCommandline = function() {
        if (!this.flex.isCollapsed('commandline')) {
            this.flex.collapse('terminal');
            this.flex.collapse('commandline');
            return post.emit('commandline', 'hidden');
        }
    };

    Split.prototype.showCommandline = function() {
        if (this.flex.isCollapsed('commandline')) {
            this.flex.expand('commandline');
            return post.emit('commandline', 'shown');
        }
    };

    Split.prototype.focus = function(n) {
        var ref1, ref2;
        if (n === 'commandline') {
            n = 'commandline-editor';
        }
        if (n === '.' || ($(n) == null)) {
            return kerror("Split.focus -- can't find element '" + n + "'");
        }
        if (((ref1 = $(n)) != null ? ref1.focus : void 0) != null) {
            window.setLastFocus(n);
        }
        return (ref2 = $(n)) != null ? typeof ref2.focus === "function" ? ref2.focus() : void 0 : void 0;
    };

    Split.prototype.focusAnything = function() {
        if (this.editorVisible()) {
            return this.focus('editor');
        }
        if (this.terminalVisible()) {
            return this.focus('terminal');
        }
        return this.focus('commandline-editor');
    };

    Split.prototype.resized = function() {
        var main;
        main = $('main');
        this.elem.style.width = main.clientWidth + "px";
        this.elem.style.height = main.clientHeight + "px";
        this.flex.resized();
        return this.emitSplit();
    };

    Split.prototype.elemHeight = function() {
        return this.elem.getBoundingClientRect().height - this.handleHeight;
    };

    Split.prototype.splitPosY = function(i) {
        return this.flex.posOfHandle(i);
    };

    Split.prototype.terminalHeight = function() {
        return this.flex.sizeOfPane(0);
    };

    Split.prototype.editorHeight = function() {
        return this.flex.sizeOfPane(2);
    };

    Split.prototype.termEditHeight = function() {
        return this.terminalHeight() + this.commandlineHeight + this.editorHeight();
    };

    Split.prototype.commandlineVisible = function() {
        return !this.flex.isCollapsed('commandline');
    };

    Split.prototype.terminalVisible = function() {
        return !this.flex.isCollapsed('terminal');
    };

    Split.prototype.editorVisible = function() {
        return !this.flex.isCollapsed('editor');
    };

    return Split;

})();

module.exports = Split;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BsaXQuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHdDQUFBO0lBQUE7O0FBUUEsTUFBc0IsT0FBQSxDQUFRLEtBQVIsQ0FBdEIsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0I7O0FBRWhCLEtBQUEsR0FBUSxPQUFBLENBQVEsUUFBUjs7QUFDUixJQUFBLEdBQVEsT0FBQSxDQUFRLGFBQVI7O0FBRUY7SUFRQyxlQUFBOzs7Ozs7OztRQUVDLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtRQUNyQixJQUFDLENBQUEsWUFBRCxHQUFxQjtRQUVyQixJQUFDLENBQUEsSUFBRCxHQUFjLENBQUEsQ0FBRSxPQUFGO1FBQ2QsSUFBQyxDQUFBLFFBQUQsR0FBYyxDQUFBLENBQUUsVUFBRjtRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWMsQ0FBQSxDQUFFLFNBQUY7UUFDZCxJQUFDLENBQUEsV0FBRCxHQUFjLENBQUEsQ0FBRSxhQUFGO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYyxDQUFBLENBQUUsUUFBRjtRQUVkLElBQUksQ0FBQyxFQUFMLENBQVEsT0FBUixFQUFrQixJQUFDLENBQUEsS0FBbkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBa0IsSUFBQyxDQUFBLEtBQW5CO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxLQUFBLEVBQU87Z0JBQ0M7b0JBQUEsR0FBQSxFQUFZLElBQUMsQ0FBQSxRQUFiO29CQUNBLFNBQUEsRUFBWSxJQURaO2lCQURELEVBSUM7b0JBQUEsR0FBQSxFQUFZLElBQUMsQ0FBQSxXQUFiO29CQUNBLEtBQUEsRUFBWSxJQUFDLENBQUEsaUJBRGI7aUJBSkQsRUFPQztvQkFBQSxHQUFBLEVBQVksSUFBQyxDQUFB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LElBQUksQ0FBQyxXQUFOLENBQWtCLFFBQWxCO0lBQVA7Ozs7OztBQUV4QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgIDAwMCAgIFxuICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAwMDAgICBcbjAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgXG4jIyNcblxueyBwb3N0LCBrZXJyb3IsICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuZXZlbnQgPSByZXF1aXJlICdldmVudHMnXG5GbGV4ICA9IHJlcXVpcmUgJy4vZmxleC9mbGV4J1xuXG5jbGFzcyBTcGxpdFxuICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBAOiAtPlxuXG4gICAgICAgIEBjb21tYW5kbGluZUhlaWdodCA9IDMwXG4gICAgICAgIEBoYW5kbGVIZWlnaHQgICAgICA9IDZcbiAgICAgICAgXG4gICAgICAgIEBlbGVtICAgICAgICA9JCAnc3BsaXQnXG4gICAgICAgIEB0ZXJtaW5hbCAgICA9JCAndGVybWluYWwnXG4gICAgICAgIEBicm93c2VyICAgICA9JCAnYnJvd3NlcidcbiAgICAgICAgQGNvbW1hbmRsaW5lID0kICdjb21tYW5kbGluZSdcbiAgICAgICAgQGVkaXRvciAgICAgID0kICdlZGl0b3InXG5cbiAgICAgICAgcG9zdC5vbiAnZm9jdXMnICAgQGZvY3VzXG4gICAgICAgIHBvc3Qub24gJ3N0YXNoJyAgIEBzdGFzaFxuICAgICAgICBwb3N0Lm9uICdyZXN0b3JlJyBAcmVzdG9yZVxuXG4gICAgICAgIEBmbGV4ID0gbmV3IEZsZXhcbiAgICAgICAgICAgIHBhbmVzOiBbXG4gICAgICAgICAgICAgICAgICAgIGRpdjogICAgICAgIEB0ZXJtaW5hbFxuICAgICAgICAgICAgICAgICAgICBjb2xsYXBzZWQ6ICB0cnVlXG4gICAgICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgICAgICBkaXY6ICAgICAgICBAY29tbWFuZGxpbmVcbiAgICAgICAgICAgICAgICAgICAgZml4ZWQ6ICAgICAgQGNvbW1hbmRsaW5lSGVpZ2h0XG4gICAgICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgICAgICBkaXY6ICAgICAgICBAZWRpdG9yXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBkaXJlY3Rpb246ICAndmVydGljYWwnXG4gICAgICAgICAgICBoYW5kbGVTaXplOiBAaGFuZGxlSGVpZ2h0XG4gICAgICAgICAgICBvbkRyYWc6ICAgICBAb25EcmFnXG4gICAgICAgICAgICBvbkRyYWdFbmQ6ICBAb25EcmFnXG4gICAgICAgICAgICBvblBhbmVTaXplOiBAb25EcmFnXG4gICAgICAgICAgICBzbmFwRmlyc3Q6ICAyMFxuICAgICAgICAgICAgc25hcExhc3Q6ICAgMTAwXG4gICAgICAgICAgICBcbiAgICBvbkRyYWc6ID0+IGlmIEBmbGV4PyB0aGVuIEBlbWl0U3BsaXQoKVxuICAgIFxuICAgIGVtaXRTcGxpdDogPT4gcG9zdC5lbWl0ICdzcGxpdCcgQGZsZXgucGFuZVBvc2l0aW9ucygpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBzdGFzaDogPT4gXG4gICAgICAgIFxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdzcGxpdHxmbGV4JyBAZmxleC5nZXRTdGF0ZSgpXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3NwbGl0fGJyb3dzZXInIEBmbGV4LnBhbmVzWzBdLmRpdiA9PSBAYnJvd3NlclxuICAgICAgICBcbiAgICByZXN0b3JlOiA9PiBcblxuICAgICAgICBpZiBzdGF0ZSA9IHdpbmRvdy5zdGFzaC5nZXQgJ3NwbGl0fGZsZXgnXG4gICAgICAgICAgICBAZmxleC5yZXN0b3JlU3RhdGUgc3RhdGVcbiAgICAgICAgICAgIEBlbWl0U3BsaXQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZG8gJ21heGltaXplIGVkaXRvcidcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAZmxleC5wYW5lc1swXS5kaXYgIT0gQGJyb3dzZXIgYW5kIHdpbmRvdy5zdGFzaC5nZXQgJ3NwbGl0fGJyb3dzZXInXG4gICAgICAgICAgICBAcmFpc2UgJ2Jyb3dzZXInXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCBcbiAgICBcbiAgICBkbzogKHNlbnRlbmNlKSAtPlxuICAgICAgICBcbiAgICAgICAgc2VudGVuY2UgPSBzZW50ZW5jZS50cmltKClcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBzZW50ZW5jZS5sZW5ndGhcbiAgICAgICAgd29yZHMgID0gc2VudGVuY2Uuc3BsaXQgL1xccysvXG4gICAgICAgIGFjdGlvbiA9IHdvcmRzWzBdXG4gICAgICAgIHdoYXQgICA9IHdvcmRzWzFdXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ3Nob3cnICAgICB0aGVuIHJldHVybiBAc2hvdyAgd2hhdFxuICAgICAgICAgICAgd2hlbiAnZm9jdXMnICAgIHRoZW4gcmV0dXJuIEBmb2N1cyB3aGF0XG4gICAgICAgICAgICB3aGVuICdoYWxmJyAgICAgdGhlbiBwb3MgICA9ICBAZmxleC5zaXplKCkvMlxuICAgICAgICAgICAgd2hlbiAndGhpcmQnICAgIHRoZW4gcG9zICAgPSAgQGZsZXguc2l6ZSgpLzNcbiAgICAgICAgICAgIHdoZW4gJ3F1YXJ0JyAgICB0aGVuIHBvcyAgID0gIEBmbGV4LnNpemUoKS80XG4gICAgICAgICAgICB3aGVuICdtYXhpbWl6ZScgXG4gICAgICAgICAgICAgICAgaWYgd2hhdCA9PSAnZWRpdG9yJyB0aGVuIHJldHVybiBAbWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAgICAgICAgIGRlbHRhID0gIEBmbGV4LnNpemUoKVxuICAgICAgICAgICAgd2hlbiAnbWluaW1pemUnIFxuICAgICAgICAgICAgICAgIGlmIHdoYXQgPT0gJ2VkaXRvcicgdGhlbiByZXR1cm4gQG1pbmltaXplRWRpdG9yKClcbiAgICAgICAgICAgICAgICBkZWx0YSA9IC1AZmxleC5zaXplKClcbiAgICAgICAgICAgIHdoZW4gJ2VubGFyZ2UnXG4gICAgICAgICAgICAgICAgaWYgd29yZHNbMl0gPT0gJ2J5J1xuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IHBhcnNlSW50IHdvcmRzWzNdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IHBhcnNlSW50IDAuMjUgKiBAdGVybUVkaXRIZWlnaHQoKVxuICAgICAgICAgICAgd2hlbiAncmVkdWNlJ1xuICAgICAgICAgICAgICAgIGlmIHdvcmRzWzJdID09ICdieSdcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSAtIHBhcnNlSW50IHdvcmRzWzNdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IC0gcGFyc2VJbnQgMC4yNSAqIEB0ZXJtRWRpdEhlaWdodCgpXG4gICAgICAgICAgICBlbHNlIHJldHVybiBlcnJvciBcIlNwbGl0LmRvIC0tIHVua25vd24gYWN0aW9uICcje2FjdGlvbn0nXCJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCB3aGF0XG4gICAgICAgICAgICB3aGVuICdlZGl0b3InIHRoZW4gcmV0dXJuIEBtb3ZlQ29tbWFuZExpbmVCeSAtZGVsdGFcbiAgICAgICAgICAgIHdoZW4gJ3Rlcm1pbmFsJywgJ2Jyb3dzZXInLCAnY29tbWFuZGxpbmUnXG4gICAgICAgICAgICAgICAgQHJhaXNlIHdoYXQgaWYgd2hhdCAhPSAnY29tbWFuZGxpbmUnXG4gICAgICAgICAgICAgICAgaWYgZGVsdGE/IHRoZW4gQG1vdmVDb21tYW5kTGluZUJ5IGRlbHRhXG4gICAgICAgICAgICAgICAgaWYgcG9zPyB0aGVuIEBmbGV4Lm1vdmVIYW5kbGVUb1BvcyBAZmxleC5oYW5kbGVzWzBdLCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGVycm9yIFwiU3BsaXQuZG8gLS0gdW5oYW5kbGVkIGRvIGNvbW1hbmQ/ICN7c2VudGVuY2V9P1wiXG5cbiAgICBtYXhpbWl6ZUVkaXRvcjogLT4gXG4gICAgICAgIFxuICAgICAgICBAZm9jdXMgJ2VkaXRvcidcbiAgICAgICAgQGZsZXguZXhwYW5kICdlZGl0b3InXG4gICAgICAgIEBoaWRlQ29tbWFuZGxpbmUoKVxuICAgICAgICBAZmxleC5yZXNpemVkKClcblxuICAgIG1pbmltaXplRWRpdG9yOiAtPlxuICAgICAgICBcbiAgICAgICAgQHNob3dDb21tYW5kbGluZSgpXG4gICAgICAgIEBmb2N1cyAnY29tbWFuZGxpbmUnXG4gICAgICAgIEBmbGV4Lm1vdmVIYW5kbGVUb1BvcyBAZmxleC5oYW5kbGVzWzFdLCBAZmxleC5zaXplKClcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcblxuICAgIHNob3c6IChuKSAtPlxuXG4gICAgICAgIHN3aXRjaCBuXG4gICAgICAgICAgICB3aGVuICd0ZXJtaW5hbCcsICdicm93c2VyJyB0aGVuIEByYWlzZSBuXG4gICAgICAgICAgICB3aGVuICdlZGl0b3InICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAZmxleC5leHBhbmQgJ2VkaXRvcidcbiAgICAgICAgICAgICAgICBpZiBAZWRpdG9ySGVpZ2h0KCkgPCBAZmxleC5zaXplKCkvM1xuICAgICAgICAgICAgICAgICAgICBpZiBAZmxleC5oYW5kbGVzWzFdLnBvcygpID4gQGZsZXguc2l6ZSgpLzNcbiAgICAgICAgICAgICAgICAgICAgICAgIEBmbGV4Lm1vdmVIYW5kbGVUb1BvcyBAZmxleC5oYW5kbGVzWzFdLCBAZmxleC5zaXplKCkvM1xuICAgICAgICAgICAgICAgICAgICBpZiBAZmxleC5oYW5kbGVzWzJdLnBvcygpIDwgMipAZmxleC5zaXplKCkvM1xuICAgICAgICAgICAgICAgICAgICAgICAgQGZsZXgubW92ZUhhbmRsZVRvUG9zIEBmbGV4LmhhbmRsZXNbMl0sIDIqQGZsZXguc2l6ZSgpLzNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCcgICAgICAgICAgdGhlbiBAZmxleC5leHBhbmQgJ2NvbW1hbmRsaW5lJ1xuICAgICAgICAgICAgZWxzZSBlcnJvciBcInNwbGl0LnNob3cgLS0gdW5oYW5kbGVkOiAje259IVwiXG5cbiAgICBoaWRlRWRpdG9yOiAgICAgPT4gQGZsZXguY29sbGFwc2UgJ2VkaXRvcidcbiAgICBoaWRlVGVybWluYWw6ICAgPT4gQGZsZXguY29sbGFwc2UgJ3Rlcm1pbmFsJ1xuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICBcblxuICAgIHN3YXA6IChvbGQsIG5qdSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBmbGV4LnBhbmVzWzBdLmRpdiAhPSBuanVcbiAgICAgICAgICAgIG5qdS5zdHlsZS5oZWlnaHQgICA9IFwiI3tAZmxleC5zaXplT2ZQYW5lIDB9cHhcIlxuICAgICAgICAgICAgb2xkLnN0eWxlLmRpc3BsYXkgID0gJ25vbmUnXG4gICAgICAgICAgICBuanUuc3R5bGUuZGlzcGxheSAgPSAnYmxvY2snXG4gICAgICAgICAgICBAZmxleC5wYW5lc1swXS5kaXYgPSBuanVcblxuICAgIHJhaXNlOiAobikgLT5cblxuICAgICAgICBzd2l0Y2ggblxuICAgICAgICAgICAgd2hlbiAndGVybWluYWwnIHRoZW4gQHN3YXAgQGJyb3dzZXIsIEB0ZXJtaW5hbFxuICAgICAgICAgICAgd2hlbiAnYnJvd3NlcicgIHRoZW4gQHN3YXAgQHRlcm1pbmFsLCBAYnJvd3NlclxuICAgICAgICAgICAgXG4gICAgICAgIEBmbGV4LmNhbGN1bGF0ZSgpXG5cbiAgICAgICAgaWYgbiA9PSAnZWRpdG9yJ1xuICAgICAgICAgICAgaWYgQGVkaXRvckhlaWdodCgpIDwgQGZsZXguc2l6ZSgpLzhcbiAgICAgICAgICAgICAgICBAZmxleC5tb3ZlSGFuZGxlVG9Qb3MgQGZsZXguaGFuZGxlc1swXSwgMypAZmxleC5zaXplKCkvNFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAdGVybWluYWxIZWlnaHQoKSA8IEBmbGV4LnNpemUoKS84XG4gICAgICAgICAgICAgICAgQGZsZXgubW92ZUhhbmRsZVRvUG9zIEBmbGV4LmhhbmRsZXNbMF0sIEBmbGV4LnNpemUoKS80XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICBcbiAgICBtb3ZlQ29tbWFuZExpbmVCeTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgQGZsZXgubW92ZUhhbmRsZSBpbmRleDoxLCBwb3M6QGZsZXgucG9zT2ZIYW5kbGUoMSkgKyBkZWx0YVxuICAgICAgICBcbiAgICBoaWRlQ29tbWFuZGxpbmU6IC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBmbGV4LmlzQ29sbGFwc2VkICdjb21tYW5kbGluZSdcbiAgICAgICAgICAgIEBmbGV4LmNvbGxhcHNlICd0ZXJtaW5hbCdcbiAgICAgICAgICAgIEBmbGV4LmNvbGxhcHNlICdjb21tYW5kbGluZSdcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnY29tbWFuZGxpbmUnLCAnaGlkZGVuJ1xuICAgICAgICBcbiAgICBzaG93Q29tbWFuZGxpbmU6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZmxleC5pc0NvbGxhcHNlZCAnY29tbWFuZGxpbmUnXG4gICAgICAgICAgICBAZmxleC5leHBhbmQgJ2NvbW1hbmRsaW5lJ1xuICAgICAgICAgICAgcG9zdC5lbWl0ICdjb21tYW5kbGluZScsICdzaG93bidcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgXG4gICAgZm9jdXM6IChuKSAtPlxuICAgICAgICBcbiAgICAgICAgbiA9ICdjb21tYW5kbGluZS1lZGl0b3InIGlmIG4gPT0gJ2NvbW1hbmRsaW5lJ1xuICAgICAgICBpZiBuID09ICcuJyBvciBub3QgJChuKT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJTcGxpdC5mb2N1cyAtLSBjYW4ndCBmaW5kIGVsZW1lbnQgJyN7bn0nXCJcbiAgICAgICAgICAgIFxuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIG4gaWYgJChuKT8uZm9jdXM/XG4gICAgICAgICQobik/LmZvY3VzPygpXG4gICAgICAgICAgICBcbiAgICBmb2N1c0FueXRoaW5nOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBmb2N1cyAnZWRpdG9yJyAgIGlmIEBlZGl0b3JWaXNpYmxlKClcbiAgICAgICAgcmV0dXJuIEBmb2N1cyAndGVybWluYWwnIGlmIEB0ZXJtaW5hbFZpc2libGUoKVxuICAgICAgICBAZm9jdXMgJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIHJlc2l6ZWQ6ID0+XG4gICAgICAgIFxuICAgICAgICBtYWluID0kICdtYWluJ1xuICAgICAgICBAZWxlbS5zdHlsZS53aWR0aCAgPSBcIiN7bWFpbi5jbGllbnRXaWR0aH1weFwiXG4gICAgICAgIEBlbGVtLnN0eWxlLmhlaWdodCA9IFwiI3ttYWluLmNsaWVudEhlaWdodH1weFwiXG4gICAgICAgIEBmbGV4LnJlc2l6ZWQoKVxuICAgICAgICBAZW1pdFNwbGl0KClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMCAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAwICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgIFxuICAgIGVsZW1IZWlnaHQ6IC0+IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCAtIEBoYW5kbGVIZWlnaHRcbiAgICBcbiAgICBzcGxpdFBvc1k6ICAoaSkgLT4gQGZsZXgucG9zT2ZIYW5kbGUgaVxuICAgIHRlcm1pbmFsSGVpZ2h0OiAtPiBAZmxleC5zaXplT2ZQYW5lIDBcbiAgICBlZGl0b3JIZWlnaHQ6ICAgLT4gQGZsZXguc2l6ZU9mUGFuZSAyXG4gICAgdGVybUVkaXRIZWlnaHQ6IC0+IEB0ZXJtaW5hbEhlaWdodCgpICsgQGNvbW1hbmRsaW5lSGVpZ2h0ICsgQGVkaXRvckhlaWdodCgpXG4gICAgICAgIFxuICAgIGNvbW1hbmRsaW5lVmlzaWJsZTogLT4gbm90IEBmbGV4LmlzQ29sbGFwc2VkICdjb21tYW5kbGluZSdcbiAgICB0ZXJtaW5hbFZpc2libGU6ICAgIC0+IG5vdCBAZmxleC5pc0NvbGxhcHNlZCAndGVybWluYWwnXG4gICAgZWRpdG9yVmlzaWJsZTogICAgICAtPiBub3QgQGZsZXguaXNDb2xsYXBzZWQgJ2VkaXRvcidcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNwbGl0XG4iXX0=
//# sourceURL=../../coffee/win/split.coffee