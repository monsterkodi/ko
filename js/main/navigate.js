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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJDQUFBO0lBQUE7O0FBUUEsTUFBbUMsT0FBQSxDQUFRLEtBQVIsQ0FBbkMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGlCQUFoQixFQUF1QixlQUF2QixFQUE2Qjs7QUFFdkI7SUFFVyxrQkFBQyxJQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7OztRQUVWLElBQWMsaUJBQWQ7QUFBQSxtQkFBQTs7UUFFQSxJQUFJLENBQUMsS0FBTCxDQUFXLFVBQVgsRUFBdUIsSUFBQyxDQUFBLEtBQXhCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLFVBQUQsR0FBYztJQVJMOzt1QkFnQmIsS0FBQSxHQUFPLFNBQUMsR0FBRDtlQUFTLElBQUUsQ0FBQSxHQUFBO0lBQVg7O3VCQUVQLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxHQUFQO0FBRVYsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsSUFBZjtBQUFBLG1CQUFBOztRQUNBLElBQWMsWUFBZDtBQUFBLG1CQUFBOzs7WUFDQTs7WUFBQSxNQUFPLENBQUMsQ0FBRCxFQUFHLENBQUg7O1FBRVAsQ0FBQyxDQUFDLFdBQUYsQ0FBYyxJQUFDLENBQUEsYUFBZixFQUE4QjtZQUFDO2dCQUFBLElBQUEsRUFBSyxJQUFMO2dCQUFXLEdBQUEsRUFBSSxHQUFmO2FBQUQ7U0FBOUIsRUFBb0QsU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUNoRCxtQkFBTyxDQUFDLENBQUMsSUFBRixLQUFVLENBQUMsQ0FBQztRQUQ2QixDQUFwRDtRQUdBLE9BQUEsR0FBVSxLQUFLLENBQUMsS0FBTixDQUFZ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O0lBQU47O3VCQUNWLE9BQUEsR0FBVSxTQUFBO2VBQU0sSUFBSSxDQUFDLE1BQUwsQ0FBWSxVQUFaLEVBQXdCO1lBQUEsTUFBQSxFQUFRLFNBQVI7WUFBb0IsS0FBQSxFQUFPLE1BQU0sQ0FBQyxLQUFsQztTQUF4QjtJQUFOOzt1QkFDVixLQUFBLEdBQVUsU0FBQTtlQUFNLElBQUksQ0FBQyxNQUFMLENBQVksVUFBWixFQUF3QjtZQUFBLE1BQUEsRUFBUSxPQUFSO1lBQW9CLEtBQUEsRUFBTyxNQUFNLENBQUMsS0FBbEM7U0FBeEI7SUFBTjs7Ozs7O0FBRWQsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBjbGFtcCwgc2xhc2gsIHByZWZzLCBwb3N0LCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIE5hdmlnYXRlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBtYWluKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQG1haW4/ICMgbm90IHZlcnkgb2J2aW91czogdGhpcyBpcyBpbnN0YW50aWF0ZWQgaW4gbWFpbiBhbmQgd2luZG93IHByb2Nlc3Nlc1xuXG4gICAgICAgIHBvc3Qub25HZXQgJ25hdmlnYXRlJywgQG9uR2V0XG4gICAgICAgIHBvc3Qub24gJ25hdmlnYXRlJywgQG5hdmlnYXRlXG4gICAgICAgIEBmaWxlUG9zaXRpb25zID0gW11cbiAgICAgICAgQGN1cnJlbnRJbmRleCA9IC0xXG4gICAgICAgIEBuYXZpZ2F0aW5nID0gZmFsc2VcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxuICAgIG9uR2V0OiAoa2V5KSA9PiBAW2tleV1cblxuICAgIGFkZFRvSGlzdG9yeTogKGZpbGUsIHBvcykgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBtYWluXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZT9cbiAgICAgICAgcG9zID89IFswLDBdXG5cbiAgICAgICAgXy5wdWxsQWxsV2l0aCBAZmlsZVBvc2l0aW9ucywgW2ZpbGU6ZmlsZSwgcG9zOnBvc10sIChhLGIpIC0+XG4gICAgICAgICAgICByZXR1cm4gYS5maWxlID09IGIuZmlsZVxuXG4gICAgICAgIGZpbGVQb3MgPSBzbGFzaC50aWxkZSBzbGFzaC5qb2luRmlsZVBvcyBmaWxlLCBwb3NcbiAgICAgICAgQGZpbGVQb3NpdGlvbnMucHVzaFxuICAgICAgICAgICAgZmlsZTogICBmaWxlXG4gICAgICAgICAgICBwb3M6ICAgIHBvc1xuICAgICAgICAgICAgbGluZTogICBwb3NbMV0rMVxuICAgICAgICAgICAgY29sdW1uOiBwb3NbMF1cbiAgICAgICAgICAgIG5hbWU6ICAgZmlsZVBvc1xuICAgICAgICAgICAgdGV4dDogICBzbGFzaC5iYXNlbmFtZSBmaWxlUG9zXG5cbiAgICAgICAgd2hpbGUgQGZpbGVQb3NpdGlvbnMubGVuZ3RoID4gcHJlZnMuZ2V0ICduYXZpZ2F0ZUhpc3RvcnlMZW5ndGgnLCAxNVxuICAgICAgICAgICAgQGZpbGVQb3NpdGlvbnMuc2hpZnQoKVxuXG4gICAgbmF2aWdhdGU6IChvcHQpID0+XG5cbiAgICAgICAgc3dpdGNoIG9wdC5hY3Rpb25cblxuICAgICAgICAgICAgd2hlbiAnY2xlYXInXG4gICAgICAgICAgICAgICAgQGZpbGVQb3NpdGlvbnMgPSBbXVxuICAgICAgICAgICAgICAgIEBjdXJyZW50SW5kZXggPSAtMVxuXG4gICAgICAgICAgICB3aGVuICdiYWNrd2FyZCdcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IEBmaWxlUG9zaXRpb25zLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBjdXJyZW50SW5kZXggPSBjbGFtcCAwLCBAZmlsZVBvc2l0aW9ucy5sZW5ndGgtMSwgKEBmaWxlUG9zaXRpb25zLmxlbmd0aCArIEBjdXJyZW50SW5kZXgtMSkgJSBAZmlsZVBvc2l0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGluZyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuXG4gICAgICAgICAgICB3aGVuICdmb3J3YXJkJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xLCAoQGN1cnJlbnRJbmRleCsxKSAlIEBmaWxlUG9zaXRpb25zLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBuYXZpZ2F0aW5nID0gdHJ1ZVxuICAgICAgICAgICAgICAgIEBsb2FkRmlsZVBvcyBAZmlsZVBvc2l0aW9uc1tAY3VycmVudEluZGV4XSwgb3B0XG5cbiAgICAgICAgICAgIHdoZW4gJ2RlbEZpbGVQb3MnXG4gICAgICAgICAgICAgICAgXy5wdWxsQWxsV2l0aCBAZmlsZVBvc2l0aW9ucywgW29wdC5pdGVtXSwgKGEsYikgLT5cbiAgICAgICAgICAgICAgICAgICAgcHVsbCA9IGEuZmlsZSA9PSBiLmZpbGUgYW5kIGEubGluZSA9PSBiLmxpbmUgYW5kIGEuY29sdW1uID09IGIuY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIHB1bGxcblxuICAgICAgICAgICAgd2hlbiAnYWRkRmlsZVBvcydcblxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3Qgb3B0Py5maWxlPy5sZW5ndGhcblxuICAgICAgICAgICAgICAgIEBhZGRUb0hpc3Rvcnkgb3B0Lm9sZEZpbGUsIG9wdC5vbGRQb3NcblxuICAgICAgICAgICAgICAgIGhhc0ZpbGUgPSBfLmZpbmQgQGZpbGVQb3NpdGlvbnMsICh2KSAtPiB2LmZpbGUgPT0gb3B0LmZpbGVcblxuICAgICAgICAgICAgICAgIGlmIG5vdCBAbmF2aWdhdGluZyBvciBub3QgaGFzRmlsZSBvciBvcHQ/LmZvciBpbiBbJ2VkaXQnLCAnZ290byddXG5cbiAgICAgICAgICAgICAgICAgICAgQG5hdmlnYXRpbmcgPSBmYWxzZSBpZiBvcHQ/LmZvciBpbiBbJ2VkaXQnLCAnZ290byddXG5cbiAgICAgICAgICAgICAgICAgICAgQGFkZFRvSGlzdG9yeSBvcHQuZmlsZSwgb3B0LnBvc1xuXG4gICAgICAgICAgICAgICAgICAgIEBjdXJyZW50SW5kZXggPSBAZmlsZVBvc2l0aW9ucy5sZW5ndGgtMVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIG9wdD8uZm9yID09ICdnb3RvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ25hdmlnYXRlSGlzdG9yeUNoYW5nZWQnLCBAZmlsZVBvc2l0aW9ucywgQGN1cnJlbnRJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRGaWxlUG9zIEBmaWxlUG9zaXRpb25zW0BjdXJyZW50SW5kZXhdLCBvcHRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IEBmaWxlUG9zaXRpb25zLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ25hdmlnYXRlSGlzdG9yeUNoYW5nZWQnLCBAZmlsZVBvc2l0aW9ucywgQGN1cnJlbnRJbmRleFxuXG4gICAgbG9hZEZpbGVQb3M6IChmaWxlUG9zLCBvcHQpIC0+XG5cbiAgICAgICAgaWYgb3B0Py5uZXdXaW5kb3dcbiAgICAgICAgICAgIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScsIFwiI3tmaWxlUG9zLmZpbGV9OiN7ZmlsZVBvcy5wb3NbMV0rMX06I3tmaWxlUG9zLnBvc1swXX1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlcnJvciAnbm8gd2luSUQ/JyBpZiBub3Qgb3B0Py53aW5JRD9cbiAgICAgICAgICAgIHBvc3QudG9XaW4gb3B0LndpbklELCAnbG9hZEZpbGUnLCBcIiN7ZmlsZVBvcy5maWxlfToje2ZpbGVQb3MucG9zWzFdKzF9OiN7ZmlsZVBvcy5wb3NbMF19XCJcblxuICAgICAgICBwb3N0LnRvV2lucyAnbmF2aWdhdGVJbmRleENoYW5nZWQnLCBAY3VycmVudEluZGV4LCBAZmlsZVBvc2l0aW9uc1tAY3VycmVudEluZGV4XVxuXG4gICAgICAgIGZpbGVQb3NcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgIyB0aGVzZSBhcmUgY2FsbGVkIGluIHdpbmRvdyBwcm9jZXNzXG5cbiAgICBkZWxGaWxlUG9zOiAoaXRlbSkgLT5cbiAgICAgICAgcG9zdC50b01haW4gJ25hdmlnYXRlJywgYWN0aW9uOidkZWxGaWxlUG9zJywgd2luSUQ6IHdpbmRvdy53aW5JRCwgaXRlbTppdGVtXG5cbiAgICBhZGRGaWxlUG9zOiAob3B0KSAtPiAjIGNhbGxlZCBvbiBlZGl0aW5nXG4gICAgICAgIG9wdC5hY3Rpb24gPSAnYWRkRmlsZVBvcydcbiAgICAgICAgb3B0LmZvciA9ICdlZGl0J1xuICAgICAgICBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnLCBvcHRcblxuICAgIGdvdG9GaWxlUG9zOiAob3B0KSAtPiAjIGNhbGxlZCBvbiBqdW1wVG9cbiAgICAgICAgb3B0LmFjdGlvbiA9ICdhZGRGaWxlUG9zJ1xuICAgICAgICBvcHQuZm9yID0gJ2dvdG8nXG4gICAgICAgIHBvc3QudG9NYWluICduYXZpZ2F0ZScsIG9wdFxuXG4gICAgYmFja3dhcmQ6ICgpIC0+IHBvc3QudG9NYWluICduYXZpZ2F0ZScsIGFjdGlvbjogJ2JhY2t3YXJkJywgd2luSUQ6IHdpbmRvdy53aW5JRFxuICAgIGZvcndhcmQ6ICAoKSAtPiBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnLCBhY3Rpb246ICdmb3J3YXJkJywgIHdpbklEOiB3aW5kb3cud2luSURcbiAgICBjbGVhcjogICAgKCkgLT4gcG9zdC50b01haW4gJ25hdmlnYXRlJywgYWN0aW9uOiAnY2xlYXInLCAgICB3aW5JRDogd2luZG93LndpbklEXG5cbm1vZHVsZS5leHBvcnRzID0gTmF2aWdhdGVcbiJdfQ==
//# sourceURL=../../coffee/main/navigate.coffee