// koffee 1.4.0

/*
000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
0000  000  000   000  000   000  000  000        000   000     000     000
000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
000  0000  000   000     000     000  000   000  000   000     000     000
000   000  000   000      0      000   0000000   000   000     000     00000000
 */
var Navigate, _, clamp, post, prefs, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), clamp = ref.clamp, slash = ref.slash, prefs = ref.prefs, post = ref.post, _ = ref._;

Navigate = (function() {
    function Navigate(main) {
        this.main = main;
        this.navigate = bind(this.navigate, this);
        this.onGet = bind(this.onGet, this);
        if (this.main == null) {
            return;
        }
        post.onGet('navigate', this.onGet);
        post.on('navigate', this.navigate);
        this.filePositions = [];
        this.currentIndex = -1;
        this.navigating = false;
    }

    Navigate.prototype.onGet = function(key) {
        return this[key];
    };

    Navigate.prototype.addToHistory = function(file, pos) {
        var filePos, results;
        if (!this.main) {
            return;
        }
        if (file == null) {
            return;
        }
        if (pos != null) {
            pos;
        } else {
            pos = [0, 0];
        }
        _.pullAllWith(this.filePositions, [
            {
                file: file,
                pos: pos
            }
        ], function(a, b) {
            return a.file === b.file;
        });
        filePos = slash.tilde(slash.joinFilePos(file, pos));
        this.filePositions.push({
            file: file,
            pos: pos,
            line: pos[1] + 1,
            column: pos[0],
            name: filePos,
            text: slash.basename(filePos)
        });
        results = [];
        while (this.filePositions.length > prefs.get('navigateHistoryLength', 15)) {
            results.push(this.filePositions.shift());
        }
        return results;
    };

    Navigate.prototype.navigate = function(opt) {
        var hasFile, ref1, ref2, ref3;
        switch (opt.action) {
            case 'clear':
                this.filePositions = [];
                return this.currentIndex = -1;
            case 'backward':
                if (!this.filePositions.length) {
                    return;
                }
                this.currentIndex = clamp(0, this.filePositions.length - 1, (this.filePositions.length + this.currentIndex - 1) % this.filePositions.length);
                this.navigating = true;
                return this.loadFilePos(this.filePositions[this.currentIndex], opt);
            case 'forward':
                if (!this.filePositions.length) {
                    return;
                }
                this.currentIndex = clamp(0, this.filePositions.length - 1, (this.currentIndex + 1) % this.filePositions.length);
                this.navigating = true;
                return this.loadFilePos(this.filePositions[this.currentIndex], opt);
            case 'delFilePos':
                return _.pullAllWith(this.filePositions, [opt.item], function(a, b) {
                    var pull;
                    pull = a.file === b.file && a.line === b.line && a.column === b.column;
                    return pull;
                });
            case 'addFilePos':
                if (!(opt != null ? (ref1 = opt.file) != null ? ref1.length : void 0 : void 0)) {
                    return;
                }
                this.addToHistory(opt.oldFile, opt.oldPos);
                hasFile = _.find(this.filePositions, function(v) {
                    return v.file === opt.file;
                });
                if (!this.navigating || !hasFile || ((ref2 = opt != null ? opt["for"] : void 0) === 'edit' || ref2 === 'goto')) {
                    if ((ref3 = opt != null ? opt["for"] : void 0) === 'edit' || ref3 === 'goto') {
                        this.navigating = false;
                    }
                    this.addToHistory(opt.file, opt.pos);
                    this.currentIndex = this.filePositions.length - 1;
                    if ((opt != null ? opt["for"] : void 0) === 'goto') {
                        post.toWins('navigateHistoryChanged', this.filePositions, this.currentIndex);
                        return this.loadFilePos(this.filePositions[this.currentIndex], opt);
                    } else {
                        this.currentIndex = this.filePositions.length;
                        return post.toWins('navigateHistoryChanged', this.filePositions, this.currentIndex);
                    }
                }
        }
    };

    Navigate.prototype.loadFilePos = function(filePos, opt) {
        if (opt != null ? opt.newWindow : void 0) {
            post.toMain('newWindowWithFile', filePos.file + ":" + (filePos.pos[1] + 1) + ":" + filePos.pos[0]);
        } else {
            if ((opt != null ? opt.winID : void 0) == null) {
                console.error('no winID?');
            }
            post.toWin(opt.winID, 'loadFile', filePos.file + ":" + (filePos.pos[1] + 1) + ":" + filePos.pos[0]);
        }
        post.toWins('navigateIndexChanged', this.currentIndex, this.filePositions[this.currentIndex]);
        return filePos;
    };

    Navigate.prototype.delFilePos = function(item) {
        return post.toMain('navigate', {
            action: 'delFilePos',
            winID: window.winID,
            item: item
        });
    };

    Navigate.prototype.addFilePos = function(opt) {
        opt.action = 'addFilePos';
        opt["for"] = 'edit';
        return post.toMain('navigate', opt);
    };

    Navigate.prototype.gotoFilePos = function(opt) {
        opt.action = 'addFilePos';
        opt["for"] = 'goto';
        return post.toMain('navigate', opt);
    };

    Navigate.prototype.backward = function() {
        return post.toMain('navigate', {
            action: 'backward',
            winID: window.winID
        });
    };

    Navigate.prototype.forward = function() {
        return post.toMain('navigate', {
            action: 'forward',
            winID: window.winID
        });
    };

    Navigate.prototype.clear = function() {
        return post.toMain('navigate', {
            action: 'clear',
            winID: window.winID
        });
    };

    return Navigate;

})();

module.exports = Navigate;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJDQUFBO0lBQUE7O0FBUUEsTUFBbUMsT0FBQSxDQUFRLEtBQVIsQ0FBbkMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGlCQUFoQixFQUF1QixlQUF2QixFQUE2Qjs7QUFFdkI7SUFFQyxrQkFBQyxJQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7OztRQUVBLElBQWMsaUJBQWQ7QUFBQSxtQkFBQTs7UUFFQSxJQUFJLENBQUMsS0FBTCxDQUFXLFVBQVgsRUFBdUIsSUFBQyxDQUFBLEtBQXhCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLFVBQUQsR0FBYztJQVJmOzt1QkFnQkgsS0FBQSxHQUFPLFNBQUMsR0FBRDtlQUFTLElBQUUsQ0FBQSxHQUFBO0lBQVg7O3VCQUVQLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxHQUFQO0FBRVYsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsSUFBZjtBQUFBLG1CQUFBOztRQUNBLElBQWMsWUFBZDtBQUFBLG1CQUFBOzs7WUFDQTs7WUFBQSxNQUFPLENBQUMsQ0FBRCxFQUFHLENBQUg7O1FBRVAsQ0FBQyxDQUFDLFdBQUYsQ0FBYyxJQUFDLENBQUEsYUFBZixFQUE4QjtZQUFDO2dCQUFBLElBQUEsRUFBSyxJQUFMO2dCQUFXLEdBQUEsRUFBSSxHQUFmO2FBQUQ7U0FBOUIsRUFBb0QsU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUNoRCxtQkFBTyxDQUFDLENBQUMsSUFBRixLQUFVLENBQUMsQ0FBQztRQUQ2QixDQUFwRDtRQUdBLE9BQUEsR0FBVSxLQUFLLENBQUMsS0FBTixDQUFZ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O0lBQU47O3VCQUNWLE9BQUEsR0FBVSxTQUFBO2VBQU0sSUFBSSxDQUFDLE1BQUwsQ0FBWSxVQUFaLEVBQXVCO1lBQUEsTUFBQSxFQUFRLFNBQVI7WUFBbUIsS0FBQSxFQUFPLE1BQU0sQ0FBQyxLQUFqQztTQUF2QjtJQUFOOzt1QkFDVixLQUFBLEdBQVUsU0FBQTtlQUFNLElBQUksQ0FBQyxNQUFMLENBQVksVUFBWixFQUF1QjtZQUFBLE1BQUEsRUFBUSxPQUFSO1lBQW1CLEtBQUEsRUFBTyxNQUFNLENBQUMsS0FBakM7U0FBdkI7SUFBTjs7Ozs7O0FBRWQsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBjbGFtcCwgc2xhc2gsIHByZWZzLCBwb3N0LCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIE5hdmlnYXRlXG5cbiAgICBAOiAoQG1haW4pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbWFpbj8gIyBub3QgdmVyeSBvYnZpb3VzOiB0aGlzIGlzIGluc3RhbnRpYXRlZCBpbiBtYWluIGFuZCB3aW5kb3cgcHJvY2Vzc2VzXG5cbiAgICAgICAgcG9zdC5vbkdldCAnbmF2aWdhdGUnLCBAb25HZXRcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGUnLCBAbmF2aWdhdGVcbiAgICAgICAgQGZpbGVQb3NpdGlvbnMgPSBbXVxuICAgICAgICBAY3VycmVudEluZGV4ID0gLTFcbiAgICAgICAgQG5hdmlnYXRpbmcgPSBmYWxzZVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25HZXQ6IChrZXkpID0+IEBba2V5XVxuXG4gICAgYWRkVG9IaXN0b3J5OiAoZmlsZSwgcG9zKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQG1haW5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlP1xuICAgICAgICBwb3MgPz0gWzAsMF1cblxuICAgICAgICBfLnB1bGxBbGxXaXRoIEBmaWxlUG9zaXRpb25zLCBbZmlsZTpmaWxlLCBwb3M6cG9zXSwgKGEsYikgLT5cbiAgICAgICAgICAgIHJldHVybiBhLmZpbGUgPT0gYi5maWxlXG5cbiAgICAgICAgZmlsZVBvcyA9IHNsYXNoLnRpbGRlIHNsYXNoLmpvaW5GaWxlUG9zIGZpbGUsIHBvc1xuICAgICAgICBAZmlsZVBvc2l0aW9ucy5wdXNoXG4gICAgICAgICAgICBmaWxlOiAgIGZpbGVcbiAgICAgICAgICAgIHBvczogICAgcG9zXG4gICAgICAgICAgICBsaW5lOiAgIHBvc1sxXSsxXG4gICAgICAgICAgICBjb2x1bW46IHBvc1swXVxuICAgICAgICAgICAgbmFtZTogICBmaWxlUG9zXG4gICAgICAgICAgICB0ZXh0OiAgIHNsYXNoLmJhc2VuYW1lIGZpbGVQb3NcblxuICAgICAgICB3aGlsZSBAZmlsZVBvc2l0aW9ucy5sZW5ndGggPiBwcmVmcy5nZXQgJ25hdmlnYXRlSGlzdG9yeUxlbmd0aCcsIDE1XG4gICAgICAgICAgICBAZmlsZVBvc2l0aW9ucy5zaGlmdCgpXG5cbiAgICBuYXZpZ2F0ZTogKG9wdCkgPT5cblxuICAgICAgICBzd2l0Y2ggb3B0LmFjdGlvblxuXG4gICAgICAgICAgICB3aGVuICdjbGVhcidcbiAgICAgICAgICAgICAgICBAZmlsZVBvc2l0aW9ucyA9IFtdXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IC0xXG5cbiAgICAgICAgICAgIHdoZW4gJ2JhY2t3YXJkJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xLCAoQGZpbGVQb3NpdGlvbnMubGVuZ3RoICsgQGN1cnJlbnRJbmRleC0xKSAlIEBmaWxlUG9zaXRpb25zLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBuYXZpZ2F0aW5nID0gdHJ1ZVxuICAgICAgICAgICAgICAgIEBsb2FkRmlsZVBvcyBAZmlsZVBvc2l0aW9uc1tAY3VycmVudEluZGV4XSwgb3B0XG5cbiAgICAgICAgICAgIHdoZW4gJ2ZvcndhcmQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlsZVBvc2l0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAY3VycmVudEluZGV4ID0gY2xhbXAgMCwgQGZpbGVQb3NpdGlvbnMubGVuZ3RoLTEsIChAY3VycmVudEluZGV4KzEpICUgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQG5hdmlnYXRpbmcgPSB0cnVlXG4gICAgICAgICAgICAgICAgQGxvYWRGaWxlUG9zIEBmaWxlUG9zaXRpb25zW0BjdXJyZW50SW5kZXhdLCBvcHRcblxuICAgICAgICAgICAgd2hlbiAnZGVsRmlsZVBvcydcbiAgICAgICAgICAgICAgICBfLnB1bGxBbGxXaXRoIEBmaWxlUG9zaXRpb25zLCBbb3B0Lml0ZW1dLCAoYSxiKSAtPlxuICAgICAgICAgICAgICAgICAgICBwdWxsID0gYS5maWxlID09IGIuZmlsZSBhbmQgYS5saW5lID09IGIubGluZSBhbmQgYS5jb2x1bW4gPT0gYi5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgcHVsbFxuXG4gICAgICAgICAgICB3aGVuICdhZGRGaWxlUG9zJ1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBvcHQ/LmZpbGU/Lmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgQGFkZFRvSGlzdG9yeSBvcHQub2xkRmlsZSwgb3B0Lm9sZFBvc1xuXG4gICAgICAgICAgICAgICAgaGFzRmlsZSA9IF8uZmluZCBAZmlsZVBvc2l0aW9ucywgKHYpIC0+IHYuZmlsZSA9PSBvcHQuZmlsZVxuXG4gICAgICAgICAgICAgICAgaWYgbm90IEBuYXZpZ2F0aW5nIG9yIG5vdCBoYXNGaWxlIG9yIG9wdD8uZm9yIGluIFsnZWRpdCcsICdnb3RvJ11cblxuICAgICAgICAgICAgICAgICAgICBAbmF2aWdhdGluZyA9IGZhbHNlIGlmIG9wdD8uZm9yIGluIFsnZWRpdCcsICdnb3RvJ11cblxuICAgICAgICAgICAgICAgICAgICBAYWRkVG9IaXN0b3J5IG9wdC5maWxlLCBvcHQucG9zXG5cbiAgICAgICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgb3B0Py5mb3IgPT0gJ2dvdG8nXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcsIEBmaWxlUG9zaXRpb25zLCBAY3VycmVudEluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VycmVudEluZGV4ID0gQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcsIEBmaWxlUG9zaXRpb25zLCBAY3VycmVudEluZGV4XG5cbiAgICBsb2FkRmlsZVBvczogKGZpbGVQb3MsIG9wdCkgLT5cblxuICAgICAgICBpZiBvcHQ/Lm5ld1dpbmRvd1xuICAgICAgICAgICAgcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJywgXCIje2ZpbGVQb3MuZmlsZX06I3tmaWxlUG9zLnBvc1sxXSsxfToje2ZpbGVQb3MucG9zWzBdfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVycm9yICdubyB3aW5JRD8nIGlmIG5vdCBvcHQ/LndpbklEP1xuICAgICAgICAgICAgcG9zdC50b1dpbiBvcHQud2luSUQsICdsb2FkRmlsZScsIFwiI3tmaWxlUG9zLmZpbGV9OiN7ZmlsZVBvcy5wb3NbMV0rMX06I3tmaWxlUG9zLnBvc1swXX1cIlxuXG4gICAgICAgIHBvc3QudG9XaW5zICduYXZpZ2F0ZUluZGV4Q2hhbmdlZCcsIEBjdXJyZW50SW5kZXgsIEBmaWxlUG9zaXRpb25zW0BjdXJyZW50SW5kZXhdXG5cbiAgICAgICAgZmlsZVBvc1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICAjIHRoZXNlIGFyZSBjYWxsZWQgaW4gd2luZG93IHByb2Nlc3NcblxuICAgIGRlbEZpbGVQb3M6IChpdGVtKSAtPlxuICAgICAgICBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnLCBhY3Rpb246J2RlbEZpbGVQb3MnLCB3aW5JRDogd2luZG93LndpbklELCBpdGVtOml0ZW1cblxuICAgIGFkZEZpbGVQb3M6IChvcHQpIC0+ICMgY2FsbGVkIG9uIGVkaXRpbmdcbiAgICAgICAgb3B0LmFjdGlvbiA9ICdhZGRGaWxlUG9zJ1xuICAgICAgICBvcHQuZm9yID0gJ2VkaXQnXG4gICAgICAgIHBvc3QudG9NYWluICduYXZpZ2F0ZScsIG9wdFxuXG4gICAgZ290b0ZpbGVQb3M6IChvcHQpIC0+ICMgY2FsbGVkIG9uIGp1bXBUb1xuICAgICAgICBvcHQuYWN0aW9uID0gJ2FkZEZpbGVQb3MnXG4gICAgICAgIG9wdC5mb3IgPSAnZ290bydcbiAgICAgICAgcG9zdC50b01haW4gJ25hdmlnYXRlJywgb3B0XG5cbiAgICBiYWNrd2FyZDogKCkgLT4gcG9zdC50b01haW4gJ25hdmlnYXRlJyBhY3Rpb246ICdiYWNrd2FyZCcgd2luSUQ6IHdpbmRvdy53aW5JRFxuICAgIGZvcndhcmQ6ICAoKSAtPiBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnIGFjdGlvbjogJ2ZvcndhcmQnICB3aW5JRDogd2luZG93LndpbklEXG4gICAgY2xlYXI6ICAgICgpIC0+IHBvc3QudG9NYWluICduYXZpZ2F0ZScgYWN0aW9uOiAnY2xlYXInICAgIHdpbklEOiB3aW5kb3cud2luSURcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZpZ2F0ZVxuIl19
//# sourceURL=../../coffee/main/navigate.coffee