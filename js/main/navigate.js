// koffee 1.19.0

/*
000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
0000  000  000   000  000   000  000  000        000   000     000     000
000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
000  0000  000   000     000     000  000   000  000   000     000     000
000   000  000   000      0      000   0000000   000   000     000     00000000
 */
var Navigate, _, clamp, filter, post, prefs, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, clamp = ref.clamp, filter = ref.filter, post = ref.post, prefs = ref.prefs, slash = ref.slash;

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
        this.filePositions = prefs.get('filePositions', []);
        this.currentIndex = -1;
        this.navigating = false;
    }

    Navigate.prototype.onGet = function(key) {
        return this[key];
    };

    Navigate.prototype.addToHistory = function(file, pos) {
        var filePos, fp, i, j, ref1, ref2, ref3;
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
        if (!pos[0] && !pos[1] && this.filePositions.length) {
            for (i = j = ref1 = this.filePositions.length - 1; ref1 <= 0 ? j <= 0 : j >= 0; i = ref1 <= 0 ? ++j : --j) {
                fp = this.filePositions[i];
                if (slash.samePath(fp.file, file)) {
                    pos = fp.pos;
                    break;
                }
            }
        }
        _.pullAllWith(this.filePositions, [
            {
                file: file,
                pos: pos
            }
        ], function(a, b) {
            return slash.samePath(a.file, b.file) && (a.pos[1] === b.pos[1] || a.pos[1] <= 1);
        });
        filePos = slash.tilde(slash.joinFilePos(file, pos));
        if (((ref2 = this.filePositions.slice(-1)[0]) != null ? ref2.file : void 0) === file && ((ref3 = this.filePositions.slice(-1)[0]) != null ? ref3.pos[1] : void 0) === pos[1] - 1) {
            this.filePositions.pop();
        }
        this.filePositions.push({
            file: file,
            pos: pos,
            line: pos[1] + 1,
            column: pos[0],
            name: filePos,
            text: slash.file(filePos)
        });
        while (this.filePositions.length > prefs.get('navigateHistoryLength', 100)) {
            this.filePositions.shift();
        }
        return prefs.set('filePositions', this.filePositions);
    };

    Navigate.prototype.navigate = function(opt) {
        var base, hasFile, ref1, ref2, ref3, ref4;
        switch (opt.action) {
            case 'clear':
                this.filePositions = [];
                return this.currentIndex = -1;
            case 'backward':
                if (!this.filePositions.length) {
                    return;
                }
                this.currentIndex = clamp(0, Math.max(0, this.filePositions.length - 2), this.currentIndex - 1);
                this.navigating = true;
                return this.loadFilePos(this.filePositions[this.currentIndex], opt);
            case 'forward':
                if (!this.filePositions.length) {
                    return;
                }
                this.currentIndex = clamp(0, this.filePositions.length - 1, this.currentIndex + 1);
                this.navigating = true;
                return this.loadFilePos(this.filePositions[this.currentIndex], opt);
            case 'delFilePos':
                if ((base = opt.item).line != null) {
                    base.line;
                } else {
                    base.line = ((ref1 = opt.item.pos) != null ? ref1[1] : void 0) + 1;
                }
                this.filePositions = filter(this.filePositions, function(f) {
                    return f.file !== opt.item.file || f.line !== opt.item.line;
                });
                this.currentIndex = clamp(0, this.filePositions.length - 1, this.currentIndex);
                return post.toWins('navigateHistoryChanged', this.filePositions, this.currentIndex);
            case 'addFilePos':
                if (!(opt != null ? (ref2 = opt.file) != null ? ref2.length : void 0 : void 0)) {
                    return;
                }
                this.addToHistory(opt.oldFile, opt.oldPos);
                hasFile = _.find(this.filePositions, function(v) {
                    return v.file === opt.file;
                });
                if (!this.navigating || !hasFile || ((ref3 = opt != null ? opt["for"] : void 0) === 'edit' || ref3 === 'goto')) {
                    if ((ref4 = opt != null ? opt["for"] : void 0) === 'edit' || ref4 === 'goto') {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL21haW4iLCJzb3VyY2VzIjpbIm5hdmlnYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxtREFBQTtJQUFBOztBQVFBLE1BQTJDLE9BQUEsQ0FBUSxLQUFSLENBQTNDLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksbUJBQVosRUFBb0IsZUFBcEIsRUFBMEIsaUJBQTFCLEVBQWlDOztBQUUzQjtJQUVDLGtCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7O1FBRUEsSUFBYyxpQkFBZDtBQUFBLG1CQUFBOztRQUVBLElBQUksQ0FBQyxLQUFMLENBQVcsVUFBWCxFQUFzQixJQUFDLENBQUEsS0FBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFVBQVIsRUFBbUIsSUFBQyxDQUFBLFFBQXBCO1FBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxlQUFWLEVBQTBCLEVBQTFCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLFVBQUQsR0FBYztJQVJmOzt1QkFnQkgsS0FBQSxHQUFPLFNBQUMsR0FBRDtlQUFTLElBQUUsQ0FBQSxHQUFBO0lBQVg7O3VCQUVQLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxHQUFQO0FBRVYsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsSUFBZjtBQUFBLG1CQUFBOztRQUNBLElBQWMsWUFBZDtBQUFBLG1CQUFBOzs7WUFFQTs7WUFBQSxNQUFPLENBQUMsQ0FBRCxFQUFHLENBQUg7O1FBRVAsSUFBRyxDQUFJLEdBQUksQ0FBQSxDQUFBLENBQVIsSUFBZSxDQUFJLEdBQUksQ0FBQSxDQUFBLENBQXZCLElBQThCLElBQUMsQ0FBQSxhQUFhLENBQUMsTUFBaEQ7QUFDSSxpQkFBUyxvR0FBVDtnQkFDSSxFQUFBLEdBQUssSUFBQyxDQUFB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LEtBQUEsR0FBVSxTQUFBO2VBQUcsSUFBSSxDQUFDLE1BQUwsQ0FBWSxVQUFaLEVBQXVCO1lBQUEsTUFBQSxFQUFRLE9BQVI7WUFBbUIsS0FBQSxFQUFPLE1BQU0sQ0FBQyxLQUFqQztTQUF2QjtJQUFIOzs7Ozs7QUFFZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbjAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IF8sIGNsYW1wLCBmaWx0ZXIsIHBvc3QsIHByZWZzLCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBOYXZpZ2F0ZVxuXG4gICAgQDogKEBtYWluKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQG1haW4/ICMgbm90IHZlcnkgb2J2aW91czogdGhpcyBpcyBpbnN0YW50aWF0ZWQgaW4gbWFpbiBhbmQgd2luZG93IHByb2Nlc3Nlc1xuXG4gICAgICAgIHBvc3Qub25HZXQgJ25hdmlnYXRlJyBAb25HZXRcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGUnIEBuYXZpZ2F0ZVxuICAgICAgICBAZmlsZVBvc2l0aW9ucyA9IHByZWZzLmdldCAnZmlsZVBvc2l0aW9ucycgW11cbiAgICAgICAgQGN1cnJlbnRJbmRleCA9IC0xXG4gICAgICAgIEBuYXZpZ2F0aW5nID0gZmFsc2VcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxuICAgIG9uR2V0OiAoa2V5KSA9PiBAW2tleV1cblxuICAgIGFkZFRvSGlzdG9yeTogKGZpbGUsIHBvcykgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBtYWluXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZT9cbiAgICAgICAgXG4gICAgICAgIHBvcyA/PSBbMCwwXVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHBvc1swXSBhbmQgbm90IHBvc1sxXSBhbmQgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICBmb3IgaSBpbiBbQGZpbGVQb3NpdGlvbnMubGVuZ3RoLTEuLjBdXG4gICAgICAgICAgICAgICAgZnAgPSBAZmlsZVBvc2l0aW9uc1tpXVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLnNhbWVQYXRoIGZwLmZpbGUsIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgcG9zID0gZnAucG9zXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBcbiAgICAgICAgXy5wdWxsQWxsV2l0aCBAZmlsZVBvc2l0aW9ucywgW2ZpbGU6ZmlsZSwgcG9zOnBvc10sIChhLGIpIC0+IFxuICAgICAgICAgICAgc2xhc2guc2FtZVBhdGgoYS5maWxlLCBiLmZpbGUpIGFuZCAoYS5wb3NbMV0gPT0gYi5wb3NbMV0gb3IgYS5wb3NbMV0gPD0gMSlcblxuICAgICAgICBmaWxlUG9zID0gc2xhc2gudGlsZGUgc2xhc2guam9pbkZpbGVQb3MgZmlsZSwgcG9zXG4gICAgICAgIFxuICAgICAgICBpZiBAZmlsZVBvc2l0aW9uc1stMV0/LmZpbGUgPT0gZmlsZSBhbmQgQGZpbGVQb3NpdGlvbnNbLTFdPy5wb3NbMV0gPT0gcG9zWzFdLTFcbiAgICAgICAgICAgIEBmaWxlUG9zaXRpb25zLnBvcCgpXG4gICAgICAgIFxuICAgICAgICBAZmlsZVBvc2l0aW9ucy5wdXNoXG4gICAgICAgICAgICBmaWxlOiAgIGZpbGVcbiAgICAgICAgICAgIHBvczogICAgcG9zXG4gICAgICAgICAgICBsaW5lOiAgIHBvc1sxXSsxXG4gICAgICAgICAgICBjb2x1bW46IHBvc1swXVxuICAgICAgICAgICAgbmFtZTogICBmaWxlUG9zXG4gICAgICAgICAgICB0ZXh0OiAgIHNsYXNoLmZpbGUgZmlsZVBvc1xuXG4gICAgICAgIHdoaWxlIEBmaWxlUG9zaXRpb25zLmxlbmd0aCA+IHByZWZzLmdldCAnbmF2aWdhdGVIaXN0b3J5TGVuZ3RoJyAxMDBcbiAgICAgICAgICAgIEBmaWxlUG9zaXRpb25zLnNoaWZ0KClcbiAgICAgICAgICAgIFxuICAgICAgICBwcmVmcy5zZXQgJ2ZpbGVQb3NpdGlvbnMnIEBmaWxlUG9zaXRpb25zXG5cbiAgICBuYXZpZ2F0ZTogKG9wdCkgPT5cblxuICAgICAgICBzd2l0Y2ggb3B0LmFjdGlvblxuXG4gICAgICAgICAgICB3aGVuICdjbGVhcidcbiAgICAgICAgICAgICAgICBAZmlsZVBvc2l0aW9ucyA9IFtdXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IC0xXG5cbiAgICAgICAgICAgIHdoZW4gJ2JhY2t3YXJkJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIE1hdGgubWF4KDAsQGZpbGVQb3NpdGlvbnMubGVuZ3RoLTIpLCBAY3VycmVudEluZGV4LTFcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGluZyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuXG4gICAgICAgICAgICB3aGVuICdmb3J3YXJkJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xLCBAY3VycmVudEluZGV4KzFcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGluZyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZGVsRmlsZVBvcydcblxuICAgICAgICAgICAgICAgIG9wdC5pdGVtLmxpbmUgPz0gb3B0Lml0ZW0ucG9zP1sxXSsxXG5cbiAgICAgICAgICAgICAgICBAZmlsZVBvc2l0aW9ucyA9IGZpbHRlciBAZmlsZVBvc2l0aW9ucywgKGYpIC0+IGYuZmlsZSAhPSBvcHQuaXRlbS5maWxlIG9yIGYubGluZSAhPSBvcHQuaXRlbS5saW5lXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xLCBAY3VycmVudEluZGV4XG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ25hdmlnYXRlSGlzdG9yeUNoYW5nZWQnIEBmaWxlUG9zaXRpb25zLCBAY3VycmVudEluZGV4XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdhZGRGaWxlUG9zJ1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBvcHQ/LmZpbGU/Lmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgQGFkZFRvSGlzdG9yeSBvcHQub2xkRmlsZSwgb3B0Lm9sZFBvc1xuXG4gICAgICAgICAgICAgICAgaGFzRmlsZSA9IF8uZmluZCBAZmlsZVBvc2l0aW9ucywgKHYpIC0+IHYuZmlsZSA9PSBvcHQuZmlsZVxuXG4gICAgICAgICAgICAgICAgaWYgbm90IEBuYXZpZ2F0aW5nIG9yIG5vdCBoYXNGaWxlIG9yIG9wdD8uZm9yIGluIFsnZWRpdCcgJ2dvdG8nXVxuXG4gICAgICAgICAgICAgICAgICAgIEBuYXZpZ2F0aW5nID0gZmFsc2UgaWYgb3B0Py5mb3IgaW4gWydlZGl0JyAnZ290byddXG5cbiAgICAgICAgICAgICAgICAgICAgQGFkZFRvSGlzdG9yeSBvcHQuZmlsZSwgb3B0LnBvc1xuXG4gICAgICAgICAgICAgICAgICAgIEBjdXJyZW50SW5kZXggPSBAZmlsZVBvc2l0aW9ucy5sZW5ndGgtMVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIG9wdD8uZm9yID09ICdnb3RvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ25hdmlnYXRlSGlzdG9yeUNoYW5nZWQnIEBmaWxlUG9zaXRpb25zLCBAY3VycmVudEluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VycmVudEluZGV4ID0gQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcgQGZpbGVQb3NpdGlvbnMsIEBjdXJyZW50SW5kZXhcblxuICAgIGxvYWRGaWxlUG9zOiAoZmlsZVBvcywgb3B0KSAtPlxuXG4gICAgICAgIGlmIG9wdD8ubmV3V2luZG93XG4gICAgICAgICAgICBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIFwiI3tmaWxlUG9zLmZpbGV9OiN7ZmlsZVBvcy5wb3NbMV0rMX06I3tmaWxlUG9zLnBvc1swXX1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlcnJvciAnbm8gd2luSUQ/JyBpZiBub3Qgb3B0Py53aW5JRD9cbiAgICAgICAgICAgIHBvc3QudG9XaW4gb3B0LndpbklELCAnbG9hZEZpbGUnIFwiI3tmaWxlUG9zLmZpbGV9OiN7ZmlsZVBvcy5wb3NbMV0rMX06I3tmaWxlUG9zLnBvc1swXX1cIlxuXG4gICAgICAgIHBvc3QudG9XaW5zICduYXZpZ2F0ZUluZGV4Q2hhbmdlZCcgQGN1cnJlbnRJbmRleCwgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF1cblxuICAgICAgICBmaWxlUG9zXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDBcblxuICAgICMgdGhlc2UgYXJlIGNhbGxlZCBpbiB3aW5kb3cgcHJvY2Vzc1xuXG4gICAgZGVsRmlsZVBvczogKGl0ZW0pIC0+XG4gICAgICAgIHBvc3QudG9NYWluICduYXZpZ2F0ZScgYWN0aW9uOidkZWxGaWxlUG9zJyB3aW5JRDogd2luZG93LndpbklELCBpdGVtOml0ZW1cblxuICAgIGFkZEZpbGVQb3M6IChvcHQpIC0+ICMgY2FsbGVkIG9uIGVkaXRpbmdcbiAgICAgICAgb3B0LmFjdGlvbiA9ICdhZGRGaWxlUG9zJ1xuICAgICAgICBvcHQuZm9yID0gJ2VkaXQnXG4gICAgICAgIHBvc3QudG9NYWluICduYXZpZ2F0ZScgb3B0XG5cbiAgICBnb3RvRmlsZVBvczogKG9wdCkgLT4gIyBjYWxsZWQgb24ganVtcFRvXG4gICAgICAgIG9wdC5hY3Rpb24gPSAnYWRkRmlsZVBvcydcbiAgICAgICAgb3B0LmZvciA9ICdnb3RvJ1xuICAgICAgICBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnIG9wdFxuXG4gICAgYmFja3dhcmQ6IC0+IHBvc3QudG9NYWluICduYXZpZ2F0ZScgYWN0aW9uOiAnYmFja3dhcmQnIHdpbklEOiB3aW5kb3cud2luSURcbiAgICBmb3J3YXJkOiAgLT4gcG9zdC50b01haW4gJ25hdmlnYXRlJyBhY3Rpb246ICdmb3J3YXJkJyAgd2luSUQ6IHdpbmRvdy53aW5JRFxuICAgIGNsZWFyOiAgICAtPiBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnIGFjdGlvbjogJ2NsZWFyJyAgICB3aW5JRDogd2luZG93LndpbklEXG5cbm1vZHVsZS5leHBvcnRzID0gTmF2aWdhdGVcbiJdfQ==
//# sourceURL=../../coffee/main/navigate.coffee