// koffee 1.11.0

/*
000000000  000  000000000  000      00000000  0000000     0000000   00000000 
   000     000     000     000      000       000   000  000   000  000   000
   000     000     000     000      0000000   0000000    000000000  0000000  
   000     000     000     000      000       000   000  000   000  000   000
   000     000     000     0000000  00000000  0000000    000   000  000   000
 */
var $, Titlebar, elem, post, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, elem = ref.elem, post = ref.post, stopEvent = ref.stopEvent;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL3dpbiIsInNvdXJjZXMiOlsidGl0bGViYXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7O0FBUUEsTUFBK0IsT0FBQSxDQUFRLEtBQVIsQ0FBL0IsRUFBRSxTQUFGLEVBQUssZUFBTCxFQUFXLGVBQVgsRUFBaUI7O0FBRVg7SUFFQyxrQkFBQTs7Ozs7OztRQUVDLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLFVBQUY7UUFDUCxJQUFDLENBQUEsUUFBRCxHQUFZLENBQUM7UUFFYixRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFkLENBQStCLFVBQS9CLEVBQTBDLElBQUMsQ0FBQSxTQUEzQztRQUNBLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWQsQ0FBK0IsU0FBL0IsRUFBMEMsSUFBQyxDQUFBLFNBQTNDO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FDSTtZQUFBLE9BQUEsRUFBUyxDQUFUO1lBQ0EsTUFBQSxFQUFTLEtBRFQ7WUFFQSxLQUFBLEVBQVMsSUFGVDs7UUFJSixJQUFJLENBQUMsRUFBTCxDQUFRLFNBQVIsRUFBbUIsSUFBQyxDQUFBLFNBQXBCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQW1CLElBQUMsQ0FBQSxVQUFwQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsU0FBUixFQUFtQixJQUFDLENBQUEsU0FBcEI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBbUIsSUFBQyxDQUFBLFFBQXBCO0lBaEJEOzt1QkFrQkgsU0FBQSxHQUFXLFNBQUMsT0FBRDtRQUVQLElBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLEtBQWlCLE9BQXBCO21CQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixHQUFnQixRQURwQjs7SUFGTzs7dUJBS1gsUUFBQSxHQUFVLFNBQUMsTUFBRDtRQUVOLElBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLEtBQWdCLE1BQW5CO21CQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixHQUFlLE9BRG5COztJQUZNOzt1QkFLVixVQUFBLEdBQVksU0FBQyxLQUFEO1FBRVIsSUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sS0FBZSxLQUFsQjtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixHQUFjO21CQUNkLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQWhCLENBQXVCLE9BQXZCLEVBQStCLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBckMsRUFGSjs7SUFGUTs7dUJBWVosUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUVOLFlBQUE7UUFBQSxJQUFVLGlCQUFWO0FBQUEsbUJBQUE7O1FBQ0EsUUFBQSxHQUFXLElBQUksQ0FBQyxHQUFMLENBQVMsVUFBVDtRQUNYLElBQVUsUUFBUSxDQUFDLE1BQVQsSUFBbUIsQ0FBN0I7QUFBQSxtQkFBQTs7UUFDQSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQXZCLENBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLENBQUM7UUFDYixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtTQUFMO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBakIsQ0FBOEIsSUFBQyxDQUFBLElBQS9CLEVBQXFDLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBM0M7UUFDQSxJQUFDLENBQUEsWUFBRCxDQUFjLFFBQWQ7ZUFDQSxTQUFBLENBQVUsS0FBVjtJQVZNOzt1QkFZVixTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFHLGlCQUFIO1lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFiLENBQUE7WUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLENBQUM7O29CQUNSLENBQUUsTUFBUCxDQUFBOzttQkFDQSxJQUFDLENBQUEsSUFBRCxHQUFRLEtBSlo7O0lBRk87O3VCQWNYLFlBQUEsR0FBYyxTQUFDLFFBQUQ7QUFFVixZQUFBO1FBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO0FBRWxCLGFBQUEsMENBQUE7O1lBRUksSUFBWSxJQUFJLENBQUMsRUFBTCxLQUFXLE1BQU0sQ0FBQyxLQUE5QjtBQUFBLHlCQUFBOztZQUVBLEdBQUEsR0FBTSxJQUFBLENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2dCQUFzQixRQUFBLEVBQVU7b0JBQ3ZDLElBQUEsQ0FBSyxNQUFMLEVBQVk7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxTQUFOO3dCQUFnQixJQUFBLEVBQU0sRUFBdEI7cUJBQVosQ0FEdUM7aUJBQWhDO2FBQUw7WUFHTixHQUFHLENBQUMsS0FBSixHQUFZLElBQUksQ0FBQztZQUVqQixjQUFBLEdBQWlCLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUMsRUFBRDsyQkFBUSxTQUFDLEtBQUQ7d0JBQ3JCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixFQUFsQjsrQkFDQSxTQUFBLENBQVUsS0FBVjtvQkFGcUI7Z0JBQVI7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1lBSWpCLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixXQUFyQixFQUFpQyxjQUFBLENBQWUsSUFBSSxDQUFDLEVBQXBCLENBQWpDO1lBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLEdBQWxCO0FBZEo7UUFnQkEsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsVUFBakIsRUFBNEIsTUFBTSxDQUFDLEtBQW5DO1FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWO2VBQ0E7SUF0QlU7O3VCQXdCZCxTQUFBLEdBQVcsU0FBQyxLQUFELEVBQVEsSUFBUjtBQUVQLFlBQUE7UUFBQSxJQUFjLGlCQUFkO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxLQUFBLEtBQVMsTUFBTSxDQUFDLEtBQTFCO0FBQUEsbUJBQUE7O0FBQ0E7QUFBQTthQUFBLHNDQUFBOztZQUNJLElBQUcsR0FBRyxDQUFDLEtBQUosS0FBYSxLQUFoQjs7d0JBQ3NCLENBQUUsU0FBcEIsR0FBZ0M7O2dCQUNoQyxLQUFBLEdBQVEsR0FBRyxDQUFDLHFCQUFKLENBQUEsQ0FBMkIsQ0FBQztBQUNwQyxzQkFISjthQUFBLE1BQUE7cUNBQUE7O0FBREo7O0lBSk87O3VCQVVYLGdCQUFBLEdBQWtCLFNBQUMsRUFBRDtRQUVkLElBQUMsQ0FBQSxTQUFELENBQUE7ZUFDQSxJQUFJLENBQUMsTUFBTCxDQUFZLGdCQUFaLEVBQTZCLEVBQTdCO0lBSGM7O3VCQUtsQixZQUFBLEdBQWMsU0FBQTtRQUVWLElBQXVCLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBbkM7QUFBQSxtQkFBTyxJQUFDLENBQUEsU0FBRCxDQUFBLEVBQVA7O2VBQ0EsSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBUyxDQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxLQUE1QztJQUhVOzt1QkFLZCxRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTs7WUFGTyxNQUFNOztRQUViLElBQVUsQ0FBSSxJQUFDLENBQUEsSUFBZjtBQUFBLG1CQUFBOzs7Z0JBQ3lCLENBQUUsU0FBUyxDQUFDLE1BQXJDLENBQTRDLFVBQTVDOztRQUNBLElBQUMsQ0FBQSxRQUFEO0FBQWEsb0JBQU8sR0FBUDtBQUFBLHFCQUNKLElBREk7MkJBQ1EsQ0FBQztBQURULHFCQUVKLE1BRkk7MkJBRVEsQ0FBQztBQUZUOztRQUdiLElBQXVDLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBQyxDQUFwRDtZQUFBLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBZixHQUFzQixFQUFsQzs7UUFDQSxJQUFrQixJQUFDLENBQUEsUUFBRCxJQUFhLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQTlDO1lBQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFDLEVBQWI7O1FBQ0EsSUFBc0QsSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFDLENBQW5FO21CQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBUyxDQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxTQUFTLENBQUMsR0FBcEMsQ0FBd0MsVUFBeEMsRUFBQTs7SUFUTTs7dUJBaUJWLHNCQUFBLEdBQXdCLFNBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxLQUFYLEVBQWtCLEtBQWxCO0FBRXBCLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxrQkFEVDtBQUFBLGlCQUM0QixtQkFENUI7QUFDcUQsdUJBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFYLENBQW9CLEdBQXBCO0FBRDVELGlCQUVTLHdCQUZUO0FBQUEsaUJBRWtDLHlCQUZsQztBQUVpRSx1QkFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQVosQ0FBaUIsR0FBakI7QUFGeEU7UUFJQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLEtBRFQ7QUFBQSxxQkFDZSxPQURmO0FBQytCLDJCQUFPLElBQUMsQ0FBQSxTQUFELENBQUE7QUFEdEMscUJBRVMsSUFGVDtBQUFBLHFCQUVjLE1BRmQ7QUFFK0IsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWO0FBRnRDLHFCQUdTLE9BSFQ7QUFJUSwyQkFBTyxJQUFDLENBQUEsWUFBRCxDQUFBO0FBSmYsYUFESjs7ZUFNQTtJQVpvQjs7Ozs7O0FBYzVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57ICQsIGVsZW0sIHBvc3QsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBUaXRsZWJhclxuICAgIFxuICAgIEA6IC0+XG5cbiAgICAgICAgQGVsZW0gPSQgJ3RpdGxlYmFyJ1xuICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyICdmb2N1c291dCcgQGNsb3NlTGlzdFxuICAgICAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzaW4nICBAY2xvc2VMaXN0XG4gICAgICAgIFxuICAgICAgICBAaW5mbyA9IFxuICAgICAgICAgICAgbnVtV2luczogMSAgXG4gICAgICAgICAgICBzdGlja3k6ICBmYWxzZVxuICAgICAgICAgICAgZm9jdXM6ICAgdHJ1ZVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnbnVtV2lucycgIEBvbk51bVdpbnNcbiAgICAgICAgcG9zdC5vbiAnd2luRm9jdXMnIEBvbldpbkZvY3VzXG4gICAgICAgIHBvc3Qub24gJ3dpblRhYnMnICBAb25XaW5UYWJzXG4gICAgICAgIHBvc3Qub24gJ3N0aWNreScgICBAb25TdGlja3lcbiAgICAgICAgXG4gICAgb25OdW1XaW5zOiAobnVtV2lucykgPT4gXG4gICAgICAgIFxuICAgICAgICBpZiBAaW5mby5udW1XaW5zICE9IG51bVdpbnNcbiAgICAgICAgICAgIEBpbmZvLm51bVdpbnMgPSBudW1XaW5zXG4gICAgXG4gICAgb25TdGlja3k6IChzdGlja3kpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAaW5mby5zdGlja3kgIT0gc3RpY2t5XG4gICAgICAgICAgICBAaW5mby5zdGlja3kgPSBzdGlja3lcblxuICAgIG9uV2luRm9jdXM6IChmb2N1cykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBpbmZvLmZvY3VzICE9IGZvY3VzXG4gICAgICAgICAgICBAaW5mby5mb2N1cyA9IGZvY3VzXG4gICAgICAgICAgICBAZWxlbS5jbGFzc0xpc3QudG9nZ2xlICdmb2N1cycgQGluZm8uZm9jdXNcbiAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuICAgIFxuICAgIHNob3dMaXN0OiAoZXZlbnQpID0+XG4gICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGxpc3Q/XG4gICAgICAgIHdpbkluZm9zID0gcG9zdC5nZXQgJ3dpbkluZm9zJ1xuICAgICAgICByZXR1cm4gaWYgd2luSW5mb3MubGVuZ3RoIDw9IDFcbiAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKClcbiAgICAgICAgQHNlbGVjdGVkID0gLTFcbiAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnd2lubGlzdCdcbiAgICAgICAgQGVsZW0ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUgQGxpc3QsIEBlbGVtLm5leHRTaWJsaW5nXG4gICAgICAgIEBsaXN0V2luSW5mb3Mgd2luSW5mb3NcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBjbG9zZUxpc3Q6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIHdpbmRvdy5zcGxpdC5mb2N1c0FueXRoaW5nKClcbiAgICAgICAgICAgIEBzZWxlY3RlZCA9IC0xXG4gICAgICAgICAgICBAbGlzdD8ucmVtb3ZlKClcbiAgICAgICAgICAgIEBsaXN0ID0gbnVsbFxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsaXN0V2luSW5mb3M6ICh3aW5JbmZvcykgLT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LmlubmVySFRNTCA9IFwiXCIgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgZm9yIGluZm8gaW4gd2luSW5mb3NcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udGludWUgaWYgaW5mby5pZCA9PSB3aW5kb3cud2luSURcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogXCJ3aW5saXN0LWl0ZW1cIiBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIGVsZW0gJ3NwYW4nIGNsYXNzOid3aW50YWJzJyB0ZXh0OiAnJ1xuICAgICAgICAgICAgXVxuICAgICAgICAgICAgZGl2LndpbklEID0gaW5mby5pZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhY3RpdmF0ZVdpbmRvdyA9IChpZCkgPT4gKGV2ZW50KSA9PiBcbiAgICAgICAgICAgICAgICBAbG9hZFdpbmRvd1dpdGhJRCBpZFxuICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgYWN0aXZhdGVXaW5kb3cgaW5mby5pZFxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgICAgICBcbiAgICAgICAgcG9zdC50b090aGVyV2lucyAnc2VuZFRhYnMnIHdpbmRvdy53aW5JRFxuICAgICAgICBAbmF2aWdhdGUgJ2Rvd24nXG4gICAgICAgIEBcblxuICAgIG9uV2luVGFiczogKHdpbklELCB0YWJzKSA9PlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3Q/XG4gICAgICAgIHJldHVybiBpZiB3aW5JRCA9PSB3aW5kb3cud2luSURcbiAgICAgICAgZm9yIGRpdiBpbiBAbGlzdC5jaGlsZHJlblxuICAgICAgICAgICAgaWYgZGl2LndpbklEID09IHdpbklEXG4gICAgICAgICAgICAgICAgJCgnLndpbnRhYnMnLCBkaXYpPy5pbm5lckhUTUwgPSB0YWJzXG4gICAgICAgICAgICAgICAgd2lkdGggPSBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGhcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgbG9hZFdpbmRvd1dpdGhJRDogKGlkKSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBjbG9zZUxpc3QoKVxuICAgICAgICBwb3N0LnRvTWFpbiAnYWN0aXZhdGVXaW5kb3cnIGlkXG4gICAgICAgIFxuICAgIGxvYWRTZWxlY3RlZDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAY2xvc2VMaXN0KCkgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAbG9hZFdpbmRvd1dpdGhJRCBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdLndpbklEXG4gICAgXG4gICAgbmF2aWdhdGU6IChkaXIgPSAnZG93bicpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgKz0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiArMVxuICAgICAgICBAc2VsZWN0ZWQgPSBAbGlzdC5jaGlsZHJlbi5sZW5ndGgtMSBpZiBAc2VsZWN0ZWQgPCAtMVxuICAgICAgICBAc2VsZWN0ZWQgPSAtMSBpZiBAc2VsZWN0ZWQgPj0gQGxpc3QuY2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+IC0xXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIGdsb2JhbE1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCthbHQrbGVmdCcgJ2NvbW1hbmQrYWx0K3JpZ2h0JyB0aGVuIHJldHVybiB3aW5vdy50YWJzLm5hdmlnYXRlIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCthbHQrc2hpZnQrbGVmdCcgJ2NvbW1hbmQrYWx0K3NoaWZ0K3JpZ2h0JyB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlIGtleVxuXG4gICAgICAgIGlmIEBsaXN0P1xuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAnZXNjJyAnYWx0K2AnICAgIHRoZW4gcmV0dXJuIEBjbG9zZUxpc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJyAnZG93bicgICAgICB0aGVuIHJldHVybiBAbmF2aWdhdGUga2V5XG4gICAgICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAbG9hZFNlbGVjdGVkKClcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFRpdGxlYmFyXG4iXX0=
//# sourceURL=../../coffee/win/titlebar.coffee