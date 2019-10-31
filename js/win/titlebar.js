// koffee 1.4.0

/*
000000000  000  000000000  000      00000000  0000000     0000000   00000000 
   000     000     000     000      000       000   000  000   000  000   000
   000     000     000     000      0000000   0000000    000000000  0000000  
   000     000     000     000      000       000   000  000   000  000   000
   000     000     000     0000000  00000000  0000000    000   000  000   000
 */
var $, Titlebar, elem, post, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, elem = ref.elem, $ = ref.$;

Titlebar = (function() {
    function Titlebar() {
        this.onWinTabs = bind(this.onWinTabs, this);
        this.closeList = bind(this.closeList, this);
        this.showList = bind(this.showList, this);
        this.onWinFocus = bind(this.onWinFocus, this);
        this.onSticky = bind(this.onSticky, this);
        this.onNumWins = bind(this.onNumWins, this);
        this.elem = $('titlebar');
        this.selected = -1;
        document.body.addEventListener('focusout', this.closeList);
        document.body.addEventListener('focusin', this.closeList);
        this.info = {
            numWins: 1,
            sticky: false,
            focus: true
        };
        post.on('numWins', this.onNumWins);
        post.on('winFocus', this.onWinFocus);
        post.on('winTabs', this.onWinTabs);
        post.on('sticky', this.onSticky);
    }

    Titlebar.prototype.onNumWins = function(numWins) {
        if (this.info.numWins !== numWins) {
            return this.info.numWins = numWins;
        }
    };

    Titlebar.prototype.onSticky = function(sticky) {
        if (this.info.sticky !== sticky) {
            return this.info.sticky = sticky;
        }
    };

    Titlebar.prototype.onWinFocus = function(focus) {
        if (this.info.focus !== focus) {
            this.info.focus = focus;
            return this.elem.classList.toggle('focus', this.info.focus);
        }
    };

    Titlebar.prototype.showList = function(event) {
        var winInfos;
        if (this.list != null) {
            return;
        }
        winInfos = post.get('winInfos');
        if (winInfos.length <= 1) {
            return;
        }
        document.activeElement.blur();
        this.selected = -1;
        this.list = elem({
            "class": 'winlist'
        });
        this.elem.parentNode.insertBefore(this.list, this.elem.nextSibling);
        this.listWinInfos(winInfos);
        return stopEvent(event);
    };

    Titlebar.prototype.closeList = function() {
        var ref1;
        if (this.list != null) {
            window.split.focusAnything();
            this.selected = -1;
            if ((ref1 = this.list) != null) {
                ref1.remove();
            }
            return this.list = null;
        }
    };

    Titlebar.prototype.listWinInfos = function(winInfos) {
        var activateWindow, div, i, info, len;
        this.list.innerHTML = "";
        for (i = 0, len = winInfos.length; i < len; i++) {
            info = winInfos[i];
            if (info.id === window.winID) {
                continue;
            }
            div = elem({
                "class": "winlist-item",
                children: [
                    elem('span', {
                        "class": 'wintabs',
                        text: ''
                    })
                ]
            });
            div.winID = info.id;
            activateWindow = (function(_this) {
                return function(id) {
                    return function(event) {
                        _this.loadWindowWithID(id);
                        return stopEvent(event);
                    };
                };
            })(this);
            div.addEventListener('mousedown', activateWindow(info.id));
            this.list.appendChild(div);
        }
        post.toOtherWins('sendTabs', window.winID);
        this.navigate('down');
        return this;
    };

    Titlebar.prototype.onWinTabs = function(winID, tabs) {
        var div, i, len, ref1, ref2, results, width;
        if (this.list == null) {
            return;
        }
        if (winID === window.winID) {
            return;
        }
        ref1 = this.list.children;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            div = ref1[i];
            if (div.winID === winID) {
                if ((ref2 = $('.wintabs', div)) != null) {
                    ref2.innerHTML = tabs;
                }
                width = div.getBoundingClientRect().width;
                break;
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Titlebar.prototype.loadWindowWithID = function(id) {
        this.closeList();
        return post.toMain('activateWindow', id);
    };

    Titlebar.prototype.loadSelected = function() {
        if (this.selected < 0) {
            return this.closeList();
        }
        return this.loadWindowWithID(this.list.children[this.selected].winID);
    };

    Titlebar.prototype.navigate = function(dir) {
        var ref1;
        if (dir == null) {
            dir = 'down';
        }
        if (!this.list) {
            return;
        }
        if ((ref1 = this.list.children[this.selected]) != null) {
            ref1.classList.remove('selected');
        }
        this.selected += (function() {
            switch (dir) {
                case 'up':
                    return -1;
                case 'down':
                    return +1;
            }
        })();
        if (this.selected < -1) {
            this.selected = this.list.children.length - 1;
        }
        if (this.selected >= this.list.children.length) {
            this.selected = -1;
        }
        if (this.selected > -1) {
            return this.list.children[this.selected].classList.add('selected');
        }
    };

    Titlebar.prototype.globalModKeyComboEvent = function(mod, key, combo, event) {
        switch (combo) {
            case 'command+alt+left':
            case 'command+alt+right':
                return winow.tabs.navigate(key);
            case 'command+alt+shift+left':
            case 'command+alt+shift+right':
                return window.tabs.move(key);
        }
        if (this.list != null) {
            switch (combo) {
                case 'esc':
                case 'alt+`':
                    return this.closeList();
                case 'up':
                case 'down':
                    return this.navigate(key);
                case 'enter':
                    return this.loadSelected();
            }
        }
        return 'unhandled';
    };

    return Titlebar;

})();

module.exports = Titlebar;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7O0FBUUEsTUFBK0IsT0FBQSxDQUFRLEtBQVIsQ0FBL0IsRUFBRSxlQUFGLEVBQVEseUJBQVIsRUFBbUIsZUFBbkIsRUFBeUI7O0FBRW5CO0lBRUMsa0JBQUE7Ozs7Ozs7UUFFQyxJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxVQUFGO1FBQ1AsSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFDO1FBRWIsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZCxDQUErQixVQUEvQixFQUEyQyxJQUFDLENBQUEsU0FBNUM7UUFDQSxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFkLENBQStCLFNBQS9CLEVBQTJDLElBQUMsQ0FBQSxTQUE1QztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQ0k7WUFBQSxPQUFBLEVBQVMsQ0FBVDtZQUNBLE1BQUEsRUFBUyxLQURUO1lBRUEsS0FBQSxFQUFTLElBRlQ7O1FBSUosSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQW9CLElBQUMsQ0FBQSxTQUFyQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsVUFBUixFQUFvQixJQUFDLENBQUEsVUFBckI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFNBQVIsRUFBb0IsSUFBQyxDQUFBLFNBQXJCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxRQUFSLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtJQWhCRDs7dUJBa0JILFNBQUEsR0FBVyxTQUFDLE9BQUQ7UUFFUCxJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixLQUFpQixPQUFwQjttQkFDSSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sR0FBZ0IsUUFEcEI7O0lBRk87O3VCQUtYLFFBQUEsR0FBVSxTQUFDLE1BQUQ7UUFFTixJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMs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QSxJQUFDLENBQUEsSUFBSSxDQUFDLFFBQVMsQ0FBQSxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsU0FBUyxDQUFDLEdBQXBDLENBQXdDLFVBQXhDLEVBQUE7O0lBVE07O3VCQWlCVixzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtBQUVwQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1Msa0JBRFQ7QUFBQSxpQkFDNkIsbUJBRDdCO0FBQ3NELHVCQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBWCxDQUFvQixHQUFwQjtBQUQ3RCxpQkFFUyx3QkFGVDtBQUFBLGlCQUVtQyx5QkFGbkM7QUFFa0UsdUJBQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFaLENBQWlCLEdBQWpCO0FBRnpFO1FBSUEsSUFBRyxpQkFBSDtBQUNJLG9CQUFPLEtBQVA7QUFBQSxxQkFDUyxLQURUO0FBQUEscUJBQ2dCLE9BRGhCO0FBQ2dDLDJCQUFPLElBQUMsQ0FBQSxTQUFELENBQUE7QUFEdkMscUJBRVMsSUFGVDtBQUFBLHFCQUVlLE1BRmY7QUFFZ0MsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWO0FBRnZDLHFCQUdTLE9BSFQ7QUFJUSwyQkFBTyxJQUFDLENBQUEsWUFBRCxDQUFBO0FBSmYsYUFESjs7ZUFNQTtJQVpvQjs7Ozs7O0FBYzVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwgZWxlbSwgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBUaXRsZWJhclxuICAgIFxuICAgIEA6IC0+XG5cbiAgICAgICAgQGVsZW0gPSQgJ3RpdGxlYmFyJ1xuICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyICdmb2N1c291dCcsIEBjbG9zZUxpc3RcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyICdmb2N1c2luJywgIEBjbG9zZUxpc3RcbiAgICAgICAgXG4gICAgICAgIEBpbmZvID0gXG4gICAgICAgICAgICBudW1XaW5zOiAxICBcbiAgICAgICAgICAgIHN0aWNreTogIGZhbHNlXG4gICAgICAgICAgICBmb2N1czogICB0cnVlXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdudW1XaW5zJywgIEBvbk51bVdpbnNcbiAgICAgICAgcG9zdC5vbiAnd2luRm9jdXMnLCBAb25XaW5Gb2N1c1xuICAgICAgICBwb3N0Lm9uICd3aW5UYWJzJywgIEBvbldpblRhYnNcbiAgICAgICAgcG9zdC5vbiAnc3RpY2t5JywgICBAb25TdGlja3lcbiAgICAgICAgXG4gICAgb25OdW1XaW5zOiAobnVtV2lucykgPT4gXG4gICAgICAgIFxuICAgICAgICBpZiBAaW5mby5udW1XaW5zICE9IG51bVdpbnNcbiAgICAgICAgICAgIEBpbmZvLm51bVdpbnMgPSBudW1XaW5zXG4gICAgXG4gICAgb25TdGlja3k6IChzdGlja3kpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAaW5mby5zdGlja3kgIT0gc3RpY2t5XG4gICAgICAgICAgICBAaW5mby5zdGlja3kgPSBzdGlja3lcblxuICAgIG9uV2luRm9jdXM6IChmb2N1cykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBpbmZvLmZvY3VzICE9IGZvY3VzXG4gICAgICAgICAgICBAaW5mby5mb2N1cyA9IGZvY3VzXG4gICAgICAgICAgICBAZWxlbS5jbGFzc0xpc3QudG9nZ2xlICdmb2N1cycsIEBpbmZvLmZvY3VzXG4gICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICBcbiAgICBzaG93TGlzdDogKGV2ZW50KSA9PlxuICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBsaXN0P1xuICAgICAgICB3aW5JbmZvcyA9IHBvc3QuZ2V0ICd3aW5JbmZvcydcbiAgICAgICAgcmV0dXJuIGlmIHdpbkluZm9zLmxlbmd0aCA8PSAxXG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpXG4gICAgICAgIEBzZWxlY3RlZCA9IC0xXG4gICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ3dpbmxpc3QnXG4gICAgICAgIEBlbGVtLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlIEBsaXN0LCBAZWxlbS5uZXh0U2libGluZ1xuICAgICAgICBAbGlzdFdpbkluZm9zIHdpbkluZm9zXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgY2xvc2VMaXN0OiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICB3aW5kb3cuc3BsaXQuZm9jdXNBbnl0aGluZygpXG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICAgICAgQGxpc3Q/LnJlbW92ZSgpXG4gICAgICAgICAgICBAbGlzdCA9IG51bGxcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgbGlzdFdpbkluZm9zOiAod2luSW5mb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5pbm5lckhUTUwgPSBcIlwiICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGZvciBpbmZvIGluIHdpbkluZm9zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGluZm8uaWQgPT0gd2luZG93LndpbklEXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IFwid2lubGlzdC1pdGVtXCIsIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgZWxlbSAnc3BhbicsIGNsYXNzOiAnd2ludGFicycsIHRleHQ6ICcnXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBkaXYud2luSUQgPSBpbmZvLmlkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFjdGl2YXRlV2luZG93ID0gKGlkKSA9PiAoZXZlbnQpID0+IFxuICAgICAgICAgICAgICAgIEBsb2FkV2luZG93V2l0aElEIGlkXG4gICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJywgYWN0aXZhdGVXaW5kb3cgaW5mby5pZFxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgICAgICBcbiAgICAgICAgcG9zdC50b090aGVyV2lucyAnc2VuZFRhYnMnLCB3aW5kb3cud2luSURcbiAgICAgICAgQG5hdmlnYXRlICdkb3duJ1xuICAgICAgICBAXG5cbiAgICBvbldpblRhYnM6ICh3aW5JRCwgdGFicykgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0P1xuICAgICAgICByZXR1cm4gaWYgd2luSUQgPT0gd2luZG93LndpbklEXG4gICAgICAgIGZvciBkaXYgaW4gQGxpc3QuY2hpbGRyZW5cbiAgICAgICAgICAgIGlmIGRpdi53aW5JRCA9PSB3aW5JRFxuICAgICAgICAgICAgICAgICQoJy53aW50YWJzJywgZGl2KT8uaW5uZXJIVE1MID0gdGFic1xuICAgICAgICAgICAgICAgIHdpZHRoID0gZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgIGxvYWRXaW5kb3dXaXRoSUQ6IChpZCkgLT4gXG4gICAgICAgIFxuICAgICAgICBAY2xvc2VMaXN0KClcbiAgICAgICAgcG9zdC50b01haW4gJ2FjdGl2YXRlV2luZG93JywgaWRcbiAgICAgICAgXG4gICAgbG9hZFNlbGVjdGVkOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBjbG9zZUxpc3QoKSBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBsb2FkV2luZG93V2l0aElEIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0ud2luSURcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRpciA9ICdkb3duJykgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCArPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICB0aGVuIC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuICsxXG4gICAgICAgIEBzZWxlY3RlZCA9IEBsaXN0LmNoaWxkcmVuLmxlbmd0aC0xIGlmIEBzZWxlY3RlZCA8IC0xXG4gICAgICAgIEBzZWxlY3RlZCA9IC0xIGlmIEBzZWxlY3RlZCA+PSBAbGlzdC5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXS5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID4gLTFcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgZ2xvYmFsTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2FsdCtsZWZ0JywgJ2NvbW1hbmQrYWx0K3JpZ2h0JyB0aGVuIHJldHVybiB3aW5vdy50YWJzLm5hdmlnYXRlIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCthbHQrc2hpZnQrbGVmdCcsICdjb21tYW5kK2FsdCtzaGlmdCtyaWdodCcgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSBrZXlcblxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ2VzYycsICdhbHQrYCcgICAgdGhlbiByZXR1cm4gQGNsb3NlTGlzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnLCAnZG93bicgICAgICB0aGVuIHJldHVybiBAbmF2aWdhdGUga2V5XG4gICAgICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAbG9hZFNlbGVjdGVkKClcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFRpdGxlYmFyXG4iXX0=
//# sourceURL=../../coffee/win/titlebar.coffee