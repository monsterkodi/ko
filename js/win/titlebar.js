// koffee 1.3.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7O0FBUUEsTUFBK0IsT0FBQSxDQUFRLEtBQVIsQ0FBL0IsRUFBRSxlQUFGLEVBQVEseUJBQVIsRUFBbUIsZUFBbkIsRUFBeUI7O0FBRW5CO0lBRVcsa0JBQUE7Ozs7Ozs7UUFFVCxJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxVQUFGO1FBQ1AsSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFDO1FBRWIsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZCxDQUErQixVQUEvQixFQUEyQyxJQUFDLENBQUEsU0FBNUM7UUFDQSxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFkLENBQStCLFNBQS9CLEVBQTJDLElBQUMsQ0FBQSxTQUE1QztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQ0k7WUFBQSxPQUFBLEVBQVMsQ0FBVDtZQUNBLE1BQUEsRUFBUyxLQURUO1lBRUEsS0FBQSxFQUFTLElBRlQ7O1FBSUosSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQW9CLElBQUMsQ0FBQSxTQUFyQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsVUFBUixFQUFvQixJQUFDLENBQUEsVUFBckI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFNBQVIsRUFBb0IsSUFBQyxDQUFBLFNBQXJCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxRQUFSLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtJQWhCUzs7dUJBa0JiLFNBQUEsR0FBVyxTQUFDLE9BQUQ7UUFFUCxJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixLQUFpQixPQUFwQjttQkFDSSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sR0FBZ0IsUUFEcEI7O0lBRk87O3VCQUtYLFFBQUEsR0FBVSxTQUFDLE1BQUQ7UUFFTixJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMs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QSxJQUFDLENBQUEsSUFBSSxDQUFDLFFBQVMsQ0FBQSxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsU0FBUyxDQUFDLEdBQXBDLENBQXdDLFVBQXhDLEVBQUE7O0lBVE07O3VCQWlCVixzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtBQUVwQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1Msa0JBRFQ7QUFBQSxpQkFDNkIsbUJBRDdCO0FBQ3NELHVCQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBWCxDQUFvQixHQUFwQjtBQUQ3RCxpQkFFUyx3QkFGVDtBQUFBLGlCQUVtQyx5QkFGbkM7QUFFa0UsdUJBQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFaLENBQWlCLEdBQWpCO0FBRnpFO1FBSUEsSUFBRyxpQkFBSDtBQUNJLG9CQUFPLEtBQVA7QUFBQSxxQkFDUyxLQURUO0FBQUEscUJBQ2dCLE9BRGhCO0FBQ2dDLDJCQUFPLElBQUMsQ0FBQSxTQUFELENBQUE7QUFEdkMscUJBRVMsSUFGVDtBQUFBLHFCQUVlLE1BRmY7QUFFZ0MsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWO0FBRnZDLHFCQUdTLE9BSFQ7QUFJUSwyQkFBTyxJQUFDLENBQUEsWUFBRCxDQUFBO0FBSmYsYUFESjs7ZUFNQTtJQVpvQjs7Ozs7O0FBYzVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwgZWxlbSwgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBUaXRsZWJhclxuICAgIFxuICAgIGNvbnN0cnVjdG9yOiAtPlxuXG4gICAgICAgIEBlbGVtID0kICd0aXRsZWJhcidcbiAgICAgICAgQHNlbGVjdGVkID0gLTFcbiAgICAgICAgXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXNvdXQnLCBAY2xvc2VMaXN0XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXNpbicsICBAY2xvc2VMaXN0XG4gICAgICAgIFxuICAgICAgICBAaW5mbyA9IFxuICAgICAgICAgICAgbnVtV2luczogMSAgXG4gICAgICAgICAgICBzdGlja3k6ICBmYWxzZVxuICAgICAgICAgICAgZm9jdXM6ICAgdHJ1ZVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnbnVtV2lucycsICBAb25OdW1XaW5zXG4gICAgICAgIHBvc3Qub24gJ3dpbkZvY3VzJywgQG9uV2luRm9jdXNcbiAgICAgICAgcG9zdC5vbiAnd2luVGFicycsICBAb25XaW5UYWJzXG4gICAgICAgIHBvc3Qub24gJ3N0aWNreScsICAgQG9uU3RpY2t5XG4gICAgICAgIFxuICAgIG9uTnVtV2luczogKG51bVdpbnMpID0+IFxuICAgICAgICBcbiAgICAgICAgaWYgQGluZm8ubnVtV2lucyAhPSBudW1XaW5zXG4gICAgICAgICAgICBAaW5mby5udW1XaW5zID0gbnVtV2luc1xuICAgIFxuICAgIG9uU3RpY2t5OiAoc3RpY2t5KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGluZm8uc3RpY2t5ICE9IHN0aWNreVxuICAgICAgICAgICAgQGluZm8uc3RpY2t5ID0gc3RpY2t5XG5cbiAgICBvbldpbkZvY3VzOiAoZm9jdXMpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAaW5mby5mb2N1cyAhPSBmb2N1c1xuICAgICAgICAgICAgQGluZm8uZm9jdXMgPSBmb2N1c1xuICAgICAgICAgICAgQGVsZW0uY2xhc3NMaXN0LnRvZ2dsZSAnZm9jdXMnLCBAaW5mby5mb2N1c1xuICAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgXG4gICAgc2hvd0xpc3Q6IChldmVudCkgPT5cbiAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAbGlzdD9cbiAgICAgICAgd2luSW5mb3MgPSBwb3N0LmdldCAnd2luSW5mb3MnXG4gICAgICAgIHJldHVybiBpZiB3aW5JbmZvcy5sZW5ndGggPD0gMVxuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKVxuICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICd3aW5saXN0J1xuICAgICAgICBAZWxlbS5wYXJlbnROb2RlLmluc2VydEJlZm9yZSBAbGlzdCwgQGVsZW0ubmV4dFNpYmxpbmdcbiAgICAgICAgQGxpc3RXaW5JbmZvcyB3aW5JbmZvc1xuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGNsb3NlTGlzdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0P1xuICAgICAgICAgICAgd2luZG93LnNwbGl0LmZvY3VzQW55dGhpbmcoKVxuICAgICAgICAgICAgQHNlbGVjdGVkID0gLTFcbiAgICAgICAgICAgIEBsaXN0Py5yZW1vdmUoKVxuICAgICAgICAgICAgQGxpc3QgPSBudWxsXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGxpc3RXaW5JbmZvczogKHdpbkluZm9zKSAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QuaW5uZXJIVE1MID0gXCJcIiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBmb3IgaW5mbyBpbiB3aW5JbmZvc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250aW51ZSBpZiBpbmZvLmlkID09IHdpbmRvdy53aW5JRFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBcIndpbmxpc3QtaXRlbVwiLCBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIGVsZW0gJ3NwYW4nLCBjbGFzczogJ3dpbnRhYnMnLCB0ZXh0OiAnJ1xuICAgICAgICAgICAgXVxuICAgICAgICAgICAgZGl2LndpbklEID0gaW5mby5pZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhY3RpdmF0ZVdpbmRvdyA9IChpZCkgPT4gKGV2ZW50KSA9PiBcbiAgICAgICAgICAgICAgICBAbG9hZFdpbmRvd1dpdGhJRCBpZFxuICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIGFjdGl2YXRlV2luZG93IGluZm8uaWRcbiAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGRpdlxuICAgICAgICAgICAgXG4gICAgICAgIHBvc3QudG9PdGhlcldpbnMgJ3NlbmRUYWJzJywgd2luZG93LndpbklEXG4gICAgICAgIEBuYXZpZ2F0ZSAnZG93bidcbiAgICAgICAgQFxuXG4gICAgb25XaW5UYWJzOiAod2luSUQsIHRhYnMpID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdD9cbiAgICAgICAgcmV0dXJuIGlmIHdpbklEID09IHdpbmRvdy53aW5JRFxuICAgICAgICBmb3IgZGl2IGluIEBsaXN0LmNoaWxkcmVuXG4gICAgICAgICAgICBpZiBkaXYud2luSUQgPT0gd2luSURcbiAgICAgICAgICAgICAgICAkKCcud2ludGFicycsIGRpdik/LmlubmVySFRNTCA9IHRhYnNcbiAgICAgICAgICAgICAgICB3aWR0aCA9IGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aFxuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICBsb2FkV2luZG93V2l0aElEOiAoaWQpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGNsb3NlTGlzdCgpXG4gICAgICAgIHBvc3QudG9NYWluICdhY3RpdmF0ZVdpbmRvdycsIGlkXG4gICAgICAgIFxuICAgIGxvYWRTZWxlY3RlZDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAY2xvc2VMaXN0KCkgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAbG9hZFdpbmRvd1dpdGhJRCBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdLndpbklEXG4gICAgXG4gICAgbmF2aWdhdGU6IChkaXIgPSAnZG93bicpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgKz0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiArMVxuICAgICAgICBAc2VsZWN0ZWQgPSBAbGlzdC5jaGlsZHJlbi5sZW5ndGgtMSBpZiBAc2VsZWN0ZWQgPCAtMVxuICAgICAgICBAc2VsZWN0ZWQgPSAtMSBpZiBAc2VsZWN0ZWQgPj0gQGxpc3QuY2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+IC0xXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIGdsb2JhbE1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCthbHQrbGVmdCcsICdjb21tYW5kK2FsdCtyaWdodCcgdGhlbiByZXR1cm4gd2lub3cudGFicy5uYXZpZ2F0ZSBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3NoaWZ0K2xlZnQnLCAnY29tbWFuZCthbHQrc2hpZnQrcmlnaHQnIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm1vdmUga2V5XG5cbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdlc2MnLCAnYWx0K2AnICAgIHRoZW4gcmV0dXJuIEBjbG9zZUxpc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJywgJ2Rvd24nICAgICAgdGhlbiByZXR1cm4gQG5hdmlnYXRlIGtleVxuICAgICAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGxvYWRTZWxlY3RlZCgpXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBUaXRsZWJhclxuIl19
//# sourceURL=../../coffee/win/titlebar.coffee