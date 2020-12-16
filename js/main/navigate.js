// koffee 1.14.0

/*
000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
0000  000  000   000  000   000  000  000        000   000     000     000
000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
000  0000  000   000     000     000  000   000  000   000     000     000
000   000  000   000      0      000   0000000   000   000     000     00000000
 */
var Navigate, _, clamp, post, prefs, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, clamp = ref.clamp, post = ref.post, prefs = ref.prefs, slash = ref.slash;

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
        var filePos, fp, i, j, ref1, results;
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
        this.filePositions.push({
            file: file,
            pos: pos,
            line: pos[1] + 1,
            column: pos[0],
            name: filePos,
            text: slash.file(filePos)
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
                return _.pullAllWith(this.filePositions, [opt.item], function(a, b) {
                    return a.file === b.file && a.line === b.line && a.column === b.column;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL21haW4iLCJzb3VyY2VzIjpbIm5hdmlnYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwyQ0FBQTtJQUFBOztBQVFBLE1BQW1DLE9BQUEsQ0FBUSxLQUFSLENBQW5DLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksZUFBWixFQUFrQixpQkFBbEIsRUFBeUI7O0FBRW5CO0lBRUMsa0JBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEOzs7UUFFQSxJQUFjLGlCQUFkO0FBQUEsbUJBQUE7O1FBRUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxVQUFYLEVBQXNCLElBQUMsQ0FBQSxLQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsVUFBUixFQUFtQixJQUFDLENBQUEsUUFBcEI7UUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQjtRQUNqQixJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDO1FBQ2pCLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFSZjs7dUJBZ0JILEtBQUEsR0FBTyxTQUFDLEdBQUQ7ZUFBUyxJQUFFLENBQUEsR0FBQTtJQUFYOzt1QkFFUCxZQUFBLEdBQWMsU0FBQyxJQUFELEVBQU8sR0FBUDtBQUVWLFlBQUE7UUFBQSxJQUFVLENBQUksSUFBQyxDQUFBLElBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFjLFlBQWQ7QUFBQSxtQkFBQTs7O1lBRUE7O1lBQUEsTUFBTyxDQUFDLENBQUQsRUFBRyxDQUFIOztRQUVQLElBQUcsQ0FBSSxHQUFJLENBQUEsQ0FBQSxDQUFSLElBQWUsQ0FBSSxHQUFJLENBQUEsQ0FBQSxDQUF2QixJQUE4QixJQUFDLENBQUEsYUFBYSxDQUFDLE1BQWhEO0FBQ0ksaUJBQVMsb0dBQVQ7Z0JBQ0ksRUFBQSxHQUFLLElBQUMsQ0FBQSxhQUFjLENBQUEsQ0FBQTtnQkFDcEIsSUFBRyxLQUFLLENBQUMsUUFBTixDQUFlLEVB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QUFHLENBQUMsTUFBSixHQUFhO1FBQ2IsR0FBRyxFQUFDLEdBQUQsRUFBSCxHQUFVO2VBQ1YsSUFBSSxDQUFDLE1BQUwsQ0FBWSxVQUFaLEVBQXVCLEdBQXZCO0lBSFE7O3VCQUtaLFdBQUEsR0FBYSxTQUFDLEdBQUQ7UUFDVCxHQUFHLENBQUMsTUFBSixHQUFhO1FBQ2IsR0FBRyxFQUFDLEdBQUQsRUFBSCxHQUFVO2VBQ1YsSUFBSSxDQUFDLE1BQUwsQ0FBWSxVQUFaLEVBQXVCLEdBQXZCO0lBSFM7O3VCQUtiLFFBQUEsR0FBVSxTQUFBO2VBQUcsSUFBSSxDQUFDLE1BQUwsQ0FBWSxVQUFaLEVBQXVCO1lBQUEsTUFBQSxFQUFRLFVBQVI7WUFBbUIsS0FBQSxFQUFPLE1BQU0sQ0FBQyxLQUFqQztTQUF2QjtJQUFIOzt1QkFDVixPQUFBLEdBQVUsU0FBQTtlQUFHLElBQUksQ0FBQyxNQUFMLENBQVksVUFBWixFQUF1QjtZQUFBLE1BQUEsRUFBUSxTQUFSO1lBQW1CLEtBQUEsRUFBTyxNQUFNLENBQUMsS0FBakM7U0FBdkI7SUFBSDs7dUJBQ1YsS0FBQSxHQUFVLFNBQUE7ZUFBRyxJQUFJLENBQUMsTUFBTCxDQUFZLFVBQVosRUFBdUI7WUFBQSxNQUFBLEVBQVEsT0FBUjtZQUFtQixLQUFBLEVBQU8sTUFBTSxDQUFDLEtBQWpDO1NBQXZCO0lBQUg7Ozs7OztBQUVkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4wMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuIyMjXG5cbnsgXywgY2xhbXAsIHBvc3QsIHByZWZzLCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBOYXZpZ2F0ZVxuXG4gICAgQDogKEBtYWluKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQG1haW4/ICMgbm90IHZlcnkgb2J2aW91czogdGhpcyBpcyBpbnN0YW50aWF0ZWQgaW4gbWFpbiBhbmQgd2luZG93IHByb2Nlc3Nlc1xuXG4gICAgICAgIHBvc3Qub25HZXQgJ25hdmlnYXRlJyBAb25HZXRcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGUnIEBuYXZpZ2F0ZVxuICAgICAgICBAZmlsZVBvc2l0aW9ucyA9IFtdXG4gICAgICAgIEBjdXJyZW50SW5kZXggPSAtMVxuICAgICAgICBAbmF2aWdhdGluZyA9IGZhbHNlXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkdldDogKGtleSkgPT4gQFtrZXldXG5cbiAgICBhZGRUb0hpc3Rvcnk6IChmaWxlLCBwb3MpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbWFpblxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGU/XG4gICAgICAgIFxuICAgICAgICBwb3MgPz0gWzAsMF1cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBwb3NbMF0gYW5kIG5vdCBwb3NbMV0gYW5kIEBmaWxlUG9zaXRpb25zLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGkgaW4gW0BmaWxlUG9zaXRpb25zLmxlbmd0aC0xLi4wXVxuICAgICAgICAgICAgICAgIGZwID0gQGZpbGVQb3NpdGlvbnNbaV1cbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5zYW1lUGF0aCBmcC5maWxlLCBmaWxlXG4gICAgICAgICAgICAgICAgICAgIHBvcyA9IGZwLnBvc1xuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgXG4gICAgICAgIF8ucHVsbEFsbFdpdGggQGZpbGVQb3NpdGlvbnMsIFtmaWxlOmZpbGUsIHBvczpwb3NdLCAoYSxiKSAtPiBcbiAgICAgICAgICAgIHNsYXNoLnNhbWVQYXRoKGEuZmlsZSwgYi5maWxlKSBhbmQgKGEucG9zWzFdID09IGIucG9zWzFdIG9yIGEucG9zWzFdIDw9IDEpXG5cbiAgICAgICAgZmlsZVBvcyA9IHNsYXNoLnRpbGRlIHNsYXNoLmpvaW5GaWxlUG9zIGZpbGUsIHBvc1xuICAgICAgICBcbiAgICAgICAgQGZpbGVQb3NpdGlvbnMucHVzaFxuICAgICAgICAgICAgZmlsZTogICBmaWxlXG4gICAgICAgICAgICBwb3M6ICAgIHBvc1xuICAgICAgICAgICAgbGluZTogICBwb3NbMV0rMVxuICAgICAgICAgICAgY29sdW1uOiBwb3NbMF1cbiAgICAgICAgICAgIG5hbWU6ICAgZmlsZVBvc1xuICAgICAgICAgICAgdGV4dDogICBzbGFzaC5maWxlIGZpbGVQb3NcbiAgICAgICAgICAgIFxuICAgICAgICB3aGlsZSBAZmlsZVBvc2l0aW9ucy5sZW5ndGggPiBwcmVmcy5nZXQgJ25hdmlnYXRlSGlzdG9yeUxlbmd0aCcgMTVcbiAgICAgICAgICAgIEBmaWxlUG9zaXRpb25zLnNoaWZ0KClcblxuICAgIG5hdmlnYXRlOiAob3B0KSA9PlxuXG4gICAgICAgIHN3aXRjaCBvcHQuYWN0aW9uXG5cbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJ1xuICAgICAgICAgICAgICAgIEBmaWxlUG9zaXRpb25zID0gW11cbiAgICAgICAgICAgICAgICBAY3VycmVudEluZGV4ID0gLTFcblxuICAgICAgICAgICAgd2hlbiAnYmFja3dhcmQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlsZVBvc2l0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgICAgICAjIGtsb2cgJzw8JyAgQGZpbGVQb3NpdGlvbnMubWFwIChmcCkgLT4gZnAudGV4dFxuICAgICAgICAgICAgICAgIEBjdXJyZW50SW5kZXggPSBjbGFtcCAwLCBNYXRoLm1heCgwLEBmaWxlUG9zaXRpb25zLmxlbmd0aC0yKSwgQGN1cnJlbnRJbmRleC0xXG4gICAgICAgICAgICAgICAgQG5hdmlnYXRpbmcgPSB0cnVlXG4gICAgICAgICAgICAgICAgQGxvYWRGaWxlUG9zIEBmaWxlUG9zaXRpb25zW0BjdXJyZW50SW5kZXhdLCBvcHRcblxuICAgICAgICAgICAgd2hlbiAnZm9yd2FyZCdcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IEBmaWxlUG9zaXRpb25zLmxlbmd0aFxuICAgICAgICAgICAgICAgICMga2xvZyAnPj4nIEBmaWxlUG9zaXRpb25zLm1hcCAoZnApIC0+ICBmcC50ZXh0XG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xLCBAY3VycmVudEluZGV4KzFcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGluZyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuXG4gICAgICAgICAgICB3aGVuICdkZWxGaWxlUG9zJ1xuICAgICAgICAgICAgICAgIF8ucHVsbEFsbFdpdGggQGZpbGVQb3NpdGlvbnMsIFtvcHQuaXRlbV0sIChhLGIpIC0+XG4gICAgICAgICAgICAgICAgICAgIGEuZmlsZSA9PSBiLmZpbGUgYW5kIGEubGluZSA9PSBiLmxpbmUgYW5kIGEuY29sdW1uID09IGIuY29sdW1uXG5cbiAgICAgICAgICAgIHdoZW4gJ2FkZEZpbGVQb3MnXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IG9wdD8uZmlsZT8ubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICBAYWRkVG9IaXN0b3J5IG9wdC5vbGRGaWxlLCBvcHQub2xkUG9zXG5cbiAgICAgICAgICAgICAgICBoYXNGaWxlID0gXy5maW5kIEBmaWxlUG9zaXRpb25zLCAodikgLT4gdi5maWxlID09IG9wdC5maWxlXG5cbiAgICAgICAgICAgICAgICBpZiBub3QgQG5hdmlnYXRpbmcgb3Igbm90IGhhc0ZpbGUgb3Igb3B0Py5mb3IgaW4gWydlZGl0JyAnZ290byddXG5cbiAgICAgICAgICAgICAgICAgICAgQG5hdmlnYXRpbmcgPSBmYWxzZSBpZiBvcHQ/LmZvciBpbiBbJ2VkaXQnICdnb3RvJ11cblxuICAgICAgICAgICAgICAgICAgICBAYWRkVG9IaXN0b3J5IG9wdC5maWxlLCBvcHQucG9zXG5cbiAgICAgICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgb3B0Py5mb3IgPT0gJ2dvdG8nXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcgQGZpbGVQb3NpdGlvbnMsIEBjdXJyZW50SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkRmlsZVBvcyBAZmlsZVBvc2l0aW9uc1tAY3VycmVudEluZGV4XSwgb3B0XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjdXJyZW50SW5kZXggPSBAZmlsZVBvc2l0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICduYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkJyBAZmlsZVBvc2l0aW9ucywgQGN1cnJlbnRJbmRleFxuXG4gICAgbG9hZEZpbGVQb3M6IChmaWxlUG9zLCBvcHQpIC0+XG5cbiAgICAgICAgaWYgb3B0Py5uZXdXaW5kb3dcbiAgICAgICAgICAgIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgXCIje2ZpbGVQb3MuZmlsZX06I3tmaWxlUG9zLnBvc1sxXSsxfToje2ZpbGVQb3MucG9zWzBdfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVycm9yICdubyB3aW5JRD8nIGlmIG5vdCBvcHQ/LndpbklEP1xuICAgICAgICAgICAgcG9zdC50b1dpbiBvcHQud2luSUQsICdsb2FkRmlsZScgXCIje2ZpbGVQb3MuZmlsZX06I3tmaWxlUG9zLnBvc1sxXSsxfToje2ZpbGVQb3MucG9zWzBdfVwiXG5cbiAgICAgICAgcG9zdC50b1dpbnMgJ25hdmlnYXRlSW5kZXhDaGFuZ2VkJyBAY3VycmVudEluZGV4LCBAZmlsZVBvc2l0aW9uc1tAY3VycmVudEluZGV4XVxuXG4gICAgICAgIGZpbGVQb3NcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgIyB0aGVzZSBhcmUgY2FsbGVkIGluIHdpbmRvdyBwcm9jZXNzXG5cbiAgICBkZWxGaWxlUG9zOiAoaXRlbSkgLT5cbiAgICAgICAgcG9zdC50b01haW4gJ25hdmlnYXRlJyBhY3Rpb246J2RlbEZpbGVQb3MnIHdpbklEOiB3aW5kb3cud2luSUQsIGl0ZW06aXRlbVxuXG4gICAgYWRkRmlsZVBvczogKG9wdCkgLT4gIyBjYWxsZWQgb24gZWRpdGluZ1xuICAgICAgICBvcHQuYWN0aW9uID0gJ2FkZEZpbGVQb3MnXG4gICAgICAgIG9wdC5mb3IgPSAnZWRpdCdcbiAgICAgICAgcG9zdC50b01haW4gJ25hdmlnYXRlJyBvcHRcblxuICAgIGdvdG9GaWxlUG9zOiAob3B0KSAtPiAjIGNhbGxlZCBvbiBqdW1wVG9cbiAgICAgICAgb3B0LmFjdGlvbiA9ICdhZGRGaWxlUG9zJ1xuICAgICAgICBvcHQuZm9yID0gJ2dvdG8nXG4gICAgICAgIHBvc3QudG9NYWluICduYXZpZ2F0ZScgb3B0XG5cbiAgICBiYWNrd2FyZDogLT4gcG9zdC50b01haW4gJ25hdmlnYXRlJyBhY3Rpb246ICdiYWNrd2FyZCcgd2luSUQ6IHdpbmRvdy53aW5JRFxuICAgIGZvcndhcmQ6ICAtPiBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnIGFjdGlvbjogJ2ZvcndhcmQnICB3aW5JRDogd2luZG93LndpbklEXG4gICAgY2xlYXI6ICAgIC0+IHBvc3QudG9NYWluICduYXZpZ2F0ZScgYWN0aW9uOiAnY2xlYXInICAgIHdpbklEOiB3aW5kb3cud2luSURcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZpZ2F0ZVxuIl19
//# sourceURL=../../coffee/main/navigate.coffee