// koffee 1.11.0

/*
000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
0000  000  000   000  000   000  000  000        000   000     000     000
000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
000  0000  000   000     000     000  000   000  000   000     000     000
000   000  000   000      0      000   0000000   000   000     000     00000000
 */
var Navigate, _, clamp, post, prefs, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, slash = ref.slash, prefs = ref.prefs, clamp = ref.clamp, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL21haW4iLCJzb3VyY2VzIjpbIm5hdmlnYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwyQ0FBQTtJQUFBOztBQVFBLE1BQW1DLE9BQUEsQ0FBUSxLQUFSLENBQW5DLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsaUJBQWYsRUFBc0IsaUJBQXRCLEVBQTZCOztBQUV2QjtJQUVDLGtCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7O1FBRUEsSUFBYyxpQkFBZDtBQUFBLG1CQUFBOztRQUVBLElBQUksQ0FBQyxLQUFMLENBQVcsVUFBWCxFQUFzQixJQUFDLENBQUEsS0FBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFVBQVIsRUFBbUIsSUFBQyxDQUFBLFFBQXBCO1FBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQztRQUNqQixJQUFDLENBQUEsVUFBRCxHQUFjO0lBUmY7O3VCQWdCSCxLQUFBLEdBQU8sU0FBQyxHQUFEO2VBQVMsSUFBRSxDQUFBLEdBQUE7SUFBWDs7dUJBRVAsWUFBQSxHQUFjLFNBQUMsSUFBRCxFQUFPLEdBQVA7QUFFVixZQUFBO1FBQUEsSUFBVSxDQUFJLElBQUMsQ0FBQSxJQUFmO0FBQUEsbUJBQUE7O1FBQ0EsSUFBYyxZQUFkO0FBQUEsbUJBQUE7OztZQUVBOztZQUFBLE1BQU8sQ0FBQyxDQUFELEVBQUcsQ0FBSDs7UUFFUCxJQUFHLENBQUksR0FBSSxDQUFBLENBQUEsQ0FBUixJQUFlLENBQUksR0FBSSxDQUFBLENBQUEsQ0FBdkIsSUFBOEIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxNQUFoRDtBQUNJLGlCQUFTLG9HQUFUO2dCQUNJLEVBQUEsR0FBSyxJQUFDLENBQUEsYUFBYyxDQUFBLENBQUE7Z0JBQ3BCLElBQUcsS0FBSyxDQUFDLFFBQU4sQ0FBZSxFQUFFLENBQUMsSUFBbEIsRUFBd0IsSUFBeEIsQ0FBSDtvQkFDSSxHQUFBLEdBQU0sRUFBRSxDQUFDO0FBQ1QsMEJBRko7O0FBRkosYUFESjs7UUFPQSxDQUFDLENBQUMsV0FBRixDQUFjLElBQUMsQ0FBQSxhQUFmLEVBQThCO1lBQUM7Z0JBQUEsSUFBQSxFQUFLLElBQUw7Z0JBQVcsR0FBQSxFQUFJLEdBQWY7YUFBRDtTQUE5QixFQUFvRCxTQUFDLENBQUQsRUFBRyxDQUFIO21CQUNoRCxLQUFLLENBQUMsUUFBTixDQUFlLENBQUMsQ0FBQyxJQUFqQixFQUF1QixDQUFDLENBQUMsSUFBekIsQ0FBQSxJQUFtQyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUEsQ0FBQSxDQUFOLEtBQVksQ0FBQyxDQUFDLEdBQUksQ0FBQSxDQUFBLENBQWxCLElBQXdCLENBQUMsQ0FBQyxHQUFJLENBQUEsQ0FBQSxDQUFOLElBQVksQ0FBckM7UUFEYSxDQUFwRDtRQUdBLE9BQUEsR0FBVSxLQUFLLENBQUMsS0FBTixDQUFZLEtBQUssQ0FBQyxXQUFOLENBQWtCLElBQWxCLEVBQXdCLEdBQXhCLENBQVo7UUFFVixJQUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FDSTtZQUFBLElBQUEsRUFBUSxJQUFSO1lBQ0EsR0FBQSxFQUFRLEdBRFI7WUFFQSxJQUFBLEVBQVEsR0FBSSxDQUFBLENBQUEsQ0FBSixHQUFPLENBRmY7WUFHQSxNQUFBLEVBQVEsR0FBSSxDQUFBLENBQUEsQ0FIWjtZQUlBLElBQUEsRUFBUSxPQUpSO1lBS0EsSUFBQSxFQUFRLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBWCxDQUxSO1NBREo7QUFVQTtlQUFNLElBQUMsQ0FBQSxhQUFhLENBQUMsTUFBZixHQUF3QixLQUFLLENBQUMsR0FBTixDQUFVLHVCQUFWLEVBQWtDLEVBQWxDLENBQTlCO3lCQUNJLElBQUMsQ0FBQSxhQUFhLENBQUMsS0FBZixDQUFBO1FBREosQ0FBQTs7SUE3QlU7O3VCQWdDZCxRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtBQUFBLGdCQUFPLEdBQUcsQ0FBQyxNQUFYO0FBQUEsaUJBRVMsT0FGVDtnQkFHUSxJQUFDLENBQUEsYUFBRCxHQUFpQjt1QkFDakIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQztBQUp6QixpQkFNUyxVQU5UO2dCQU9RLElBQVUsQ0FBSSxJQUFDLENBQUEsYUFBYSxDQUFDLE1BQTdCO0FBQUEsMkJBQUE7O2dCQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLEtBQUEsQ0FBTSxDQUFOLEVBQVMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVcsSUFBQyxDQUFBLGFBQWEsQ0FBQyxNQUFmLEdBQXNCLENBQWpDLENBQVQsRUFBOEMsSUFBQyxDQUFBLFlBQUQsR0FBYyxDQUE1RDtnQkFDaEIsSUFBQyxDQUFBLFVBQUQsR0FBYzt1QkFDZCxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxhQUFjLENBQUEsSUFBQyxDQUFBLFlBQUQsQ0FBNUIsRUFBNEMsR0FBNUM7QUFYUixpQkFhUyxTQWJUO2dCQWNRLElBQVUsQ0FBSSxJQUFDLENBQUEsYUFBYSxDQUFDLE1BQTdCO0FBQUEsMkJBQUE7O2dCQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLEtBQUEsQ0FBTSxDQUFOLEVBQVMsSUFBQyxDQUFBLGFBQWEsQ0FBQyxNQUFmLEdBQXNCLENBQS9CLEVBQWtDLElBQUMsQ0FBQSxZQUFELEdBQWMsQ0FBaEQ7Z0JBQ2hCLElBQUMsQ0FBQSxVQUFELEdBQWM7dUJBQ2QsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsYUFBYyxDQUFBLElBQUMsQ0FBQSxZQUFELENBQTVCLEVBQTRDLEdBQTVDO0FBbEJSLGlCQW9CUyxZQXBCVDt1QkFxQlEsQ0FBQyxDQUFDLFdBQUYsQ0FBYyxJQUFDLENBQUEsYUFBZixFQUE4QixDQUFDLEdBQUcsQ0FBQyxJQUFMLENBQTlCLEVBQTBDLFNBQUMsQ0FBRCxFQUFHLENBQUg7MkJBQ3RDLENBQUMsQ0FBQyxJQUFGLEtBQVUsQ0FBQyxDQUFDLElBQVosSUFBcUIsQ0FBQyxDQUFDLElBQUYsS0FBVSxDQUFDLENBQUMsSUFBakMsSUFBMEMsQ0FBQyxDQUFDLE1BQUYsS0FBWSxDQUFDLENBQUM7Z0JBRGxCLENBQTFDO0FBckJSLGlCQXdCUyxZQXhCVDtnQkEwQlEsSUFBVSxnREFBYSxDQUFFLHlCQUF6QjtBQUFBLDJCQUFBOztnQkFFQSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQUcsQ0FBQyxPQUFsQixFQUEyQixHQUFHLENBQUMsTUFBL0I7Z0JBRUEsT0FBQSxHQUFVLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLGFBQVIsRUFBdUIsU0FBQyxDQUFEOzJCQUFPLENBQUMsQ0FBQyxJQUFGLEtBQVUsR0FBRyxDQUFDO2dCQUFyQixDQUF2QjtnQkFFVixJQUFHLENBQUksSUFBQyxDQUFBLFVBQUwsSUFBbUIsQ0FBSSxPQUF2QixJQUFrQyx1QkFBQSxHQUFHLEVBQUUsR0FBRixZQUFILEtBQWEsTUFBYixJQUFBLElBQUEsS0FBb0IsTUFBcEIsQ0FBckM7b0JBRUksMEJBQXVCLEdBQUcsRUFBRSxHQUFGLFlBQUgsS0FBYSxNQUFiLElBQUEsSUFBQSxLQUFvQixNQUEzQzt3QkFBQSxJQUFDLENBQUEsVUFBRCxHQUFjLE1BQWQ7O29CQUVBLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBRyxDQUFDLElBQWxCLEVBQXdCLEdBQUcsQ0FBQyxHQUE1QjtvQkFFQSxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsYUFBYSxDQUFDLE1BQWYsR0FBc0I7b0JBRXRDLG1CQUFHLEdBQUcsRUFBRSxHQUFGLFlBQUgsS0FBWSxNQUFmO3dCQUNJLElBQUksQ0FBQyxNQUFMLENBQVksd0JBQVosRUFBcUMsSUFBQyxDQUFBLGFBQXRDLEVBQXFELElBQUMsQ0FBQSxZQUF0RDsrQkFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxhQUFjLENBQUEsSUFBQyxDQUFBLFlBQUQsQ0FBNUIsRUFBNEMsR0FBNUMsRUFGSjtxQkFBQSxNQUFBO3dCQUlJLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxhQUFhLENBQUM7K0JBQy9CLElBQUksQ0FBQyxNQUFMLENBQVksd0JBQVosRUFBcUMsSUFBQyxDQUFBLGFBQXRDLEVBQXFELElBQUMsQ0FBQSxZQUF0RCxFQUxKO3FCQVJKOztBQWhDUjtJQUZNOzt1QkFpRFYsV0FBQSxHQUFhLFNBQUMsT0FBRCxFQUFVLEdBQVY7UUFFVCxrQkFBRyxHQUFHLENBQUUsa0JBQVI7WUFDSSxJQUFJLENBQUMsTUFBTCxDQUFZLG1CQUFaLEVBQW1DLE9BQU8sQ0FBQyxJQUFULEdBQWMsR0FBZCxHQUFnQixDQUFDLE9BQU8sQ0FBQyxHQUFJLENBQUEsQ0FBQSxDQUFaLEdBQWUsQ0FBaEIsQ0FBaEIsR0FBa0MsR0FBbEMsR0FBcUMsT0FBTyxDQUFDLEdBQUksQ0FBQSxDQUFBLENBQW5GLEVBREo7U0FBQSxNQUFBO1lBR0csSUFBMEIsMENBQTFCO2dCQUFBLE9BQUEsQ0FBQyxLQUFELENBQU8sV0FBUCxFQUFBOztZQUNDLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBRyxDQUFDLEtBQWYsRUFBc0IsVUFBdEIsRUFBb0MsT0FBTyxDQUFDLElBQVQsR0FBYyxHQUFkLEdBQWdCLENBQUMsT0FBTyxDQUFDLEdBQUksQ0FBQSxDQUFBLENBQVosR0FBZSxDQUFoQixDQUFoQixHQUFrQyxHQUFsQyxHQUFxQyxPQUFPLENBQUMsR0FBSSxDQUFBLENBQUEsQ0FBcEYsRUFKSjs7UUFNQSxJQUFJLENBQUMsTUFBTCxDQUFZLHNCQUFaLEVBQW1DLElBQUMsQ0FBQSxZQUFwQyxFQUFrRCxJQUFDLENBQUEsYUFBYyxDQUFBLElBQUMsQ0FBQSxZQUFELENBQWpFO2VBRUE7SUFWUzs7dUJBb0JiLFVBQUEsR0FBWSxTQUFDLElBQUQ7ZUFDUixJQUFJLENBQUMsTUFBTCxDQUFZLFVBQVosRUFBdUI7WUFBQSxNQUFBLEVBQU8sWUFBUDtZQUFvQixLQUFBLEVBQU8sTUFBTSxDQUFDLEtBQWxDO1lBQXlDLElBQUEsRUFBSyxJQUE5QztTQUF2QjtJQURROzt1QkFHWixVQUFBLEdBQVksU0FBQyxHQUFEO1FBQ1IsR0FBRyxDQUFDLE1BQUosR0FBYTtRQUNiLEdBQUcsRUFBQyxHQUFELEVBQUgsR0FBVTtlQUNWLElBQUksQ0FBQyxNQUFMLENBQVksVUFBWixFQUF1QixHQUF2QjtJQUhROzt1QkFLWixXQUFBLEdBQWEsU0FBQyxHQUFEO1FBQ1QsR0FBRyxDQUFDLE1BQUosR0FBYTtRQUNiLEdBQUcsRUFBQyxHQUFELEVBQUgsR0FBVTtlQUNWLElBQUksQ0FBQyxNQUFMLENBQVksVUFBWixFQUF1QixHQUF2QjtJQUhTOzt1QkFLYixRQUFBLEdBQVUsU0FBQTtlQUFHLElBQUksQ0FBQyxNQUFMLENBQVksVUFBWixFQUF1QjtZQUFBLE1BQUEsRUFBUSxVQUFSO1lBQW1CLEtBQUEsRUFBTyxNQUFNLENBQUMsS0FBakM7U0FBdkI7SUFBSDs7dUJBQ1YsT0FBQSxHQUFVLFNBQUE7ZUFBRyxJQUFJLENBQUMsTUFBTCxDQUFZLFVBQVosRUFBdUI7WUFBQSxNQUFBLEVBQVEsU0FBUjtZQUFtQixLQUFBLEVBQU8sTUFBTSxDQUFDLEtBQWpDO1NBQXZCO0lBQUg7O3VCQUNWLEtBQUEsR0FBVSxTQUFBO2VBQUcsSUFBSSxDQUFDLE1BQUwsQ0FBWSxVQUFaLEVBQXVCO1lBQUEsTUFBQSxFQUFRLE9BQVI7WUFBbUIsS0FBQSxFQUFPLE1BQU0sQ0FBQyxLQUFqQztTQUF2QjtJQUFIOzs7Ozs7QUFFZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbjAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIHNsYXNoLCBwcmVmcywgY2xhbXAsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgTmF2aWdhdGVcblxuICAgIEA6IChAbWFpbikgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBtYWluPyAjIG5vdCB2ZXJ5IG9idmlvdXM6IHRoaXMgaXMgaW5zdGFudGlhdGVkIGluIG1haW4gYW5kIHdpbmRvdyBwcm9jZXNzZXNcblxuICAgICAgICBwb3N0Lm9uR2V0ICduYXZpZ2F0ZScgQG9uR2V0XG4gICAgICAgIHBvc3Qub24gJ25hdmlnYXRlJyBAbmF2aWdhdGVcbiAgICAgICAgQGZpbGVQb3NpdGlvbnMgPSBbXVxuICAgICAgICBAY3VycmVudEluZGV4ID0gLTFcbiAgICAgICAgQG5hdmlnYXRpbmcgPSBmYWxzZVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25HZXQ6IChrZXkpID0+IEBba2V5XVxuXG4gICAgYWRkVG9IaXN0b3J5OiAoZmlsZSwgcG9zKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQG1haW5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlP1xuICAgICAgICBcbiAgICAgICAgcG9zID89IFswLDBdXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgcG9zWzBdIGFuZCBub3QgcG9zWzFdIGFuZCBAZmlsZVBvc2l0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgIGZvciBpIGluIFtAZmlsZVBvc2l0aW9ucy5sZW5ndGgtMS4uMF1cbiAgICAgICAgICAgICAgICBmcCA9IEBmaWxlUG9zaXRpb25zW2ldXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guc2FtZVBhdGggZnAuZmlsZSwgZmlsZVxuICAgICAgICAgICAgICAgICAgICBwb3MgPSBmcC5wb3NcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIFxuICAgICAgICBfLnB1bGxBbGxXaXRoIEBmaWxlUG9zaXRpb25zLCBbZmlsZTpmaWxlLCBwb3M6cG9zXSwgKGEsYikgLT4gXG4gICAgICAgICAgICBzbGFzaC5zYW1lUGF0aChhLmZpbGUsIGIuZmlsZSkgYW5kIChhLnBvc1sxXSA9PSBiLnBvc1sxXSBvciBhLnBvc1sxXSA8PSAxKVxuXG4gICAgICAgIGZpbGVQb3MgPSBzbGFzaC50aWxkZSBzbGFzaC5qb2luRmlsZVBvcyBmaWxlLCBwb3NcbiAgICAgICAgXG4gICAgICAgIEBmaWxlUG9zaXRpb25zLnB1c2hcbiAgICAgICAgICAgIGZpbGU6ICAgZmlsZVxuICAgICAgICAgICAgcG9zOiAgICBwb3NcbiAgICAgICAgICAgIGxpbmU6ICAgcG9zWzFdKzFcbiAgICAgICAgICAgIGNvbHVtbjogcG9zWzBdXG4gICAgICAgICAgICBuYW1lOiAgIGZpbGVQb3NcbiAgICAgICAgICAgIHRleHQ6ICAgc2xhc2guZmlsZSBmaWxlUG9zXG4gICAgICAgICAgICBcbiAgICAgICAgIyBrbG9nICcrJyBAZmlsZVBvc2l0aW9ucy5tYXAgKGZwKSAtPiBmcC50ZXh0XG5cbiAgICAgICAgd2hpbGUgQGZpbGVQb3NpdGlvbnMubGVuZ3RoID4gcHJlZnMuZ2V0ICduYXZpZ2F0ZUhpc3RvcnlMZW5ndGgnIDE1XG4gICAgICAgICAgICBAZmlsZVBvc2l0aW9ucy5zaGlmdCgpXG5cbiAgICBuYXZpZ2F0ZTogKG9wdCkgPT5cblxuICAgICAgICBzd2l0Y2ggb3B0LmFjdGlvblxuXG4gICAgICAgICAgICB3aGVuICdjbGVhcidcbiAgICAgICAgICAgICAgICBAZmlsZVBvc2l0aW9ucyA9IFtdXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IC0xXG5cbiAgICAgICAgICAgIHdoZW4gJ2JhY2t3YXJkJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgIyBrbG9nICc8JyBAZmlsZVBvc2l0aW9ucy5tYXAgKGZwKSAtPiBmcC50ZXh0XG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIE1hdGgubWF4KDAsQGZpbGVQb3NpdGlvbnMubGVuZ3RoLTIpLCBAY3VycmVudEluZGV4LTFcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGluZyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuXG4gICAgICAgICAgICB3aGVuICdmb3J3YXJkJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBub3QgQGZpbGVQb3NpdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgIyBrbG9nICc+JyBAZmlsZVBvc2l0aW9ucy5tYXAgKGZwKSAtPiBmcC50ZXh0XG4gICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IGNsYW1wIDAsIEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xLCBAY3VycmVudEluZGV4KzFcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGluZyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVQb3MgQGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRJbmRleF0sIG9wdFxuXG4gICAgICAgICAgICB3aGVuICdkZWxGaWxlUG9zJ1xuICAgICAgICAgICAgICAgIF8ucHVsbEFsbFdpdGggQGZpbGVQb3NpdGlvbnMsIFtvcHQuaXRlbV0sIChhLGIpIC0+XG4gICAgICAgICAgICAgICAgICAgIGEuZmlsZSA9PSBiLmZpbGUgYW5kIGEubGluZSA9PSBiLmxpbmUgYW5kIGEuY29sdW1uID09IGIuY29sdW1uXG5cbiAgICAgICAgICAgIHdoZW4gJ2FkZEZpbGVQb3MnXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IG9wdD8uZmlsZT8ubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICBAYWRkVG9IaXN0b3J5IG9wdC5vbGRGaWxlLCBvcHQub2xkUG9zXG5cbiAgICAgICAgICAgICAgICBoYXNGaWxlID0gXy5maW5kIEBmaWxlUG9zaXRpb25zLCAodikgLT4gdi5maWxlID09IG9wdC5maWxlXG5cbiAgICAgICAgICAgICAgICBpZiBub3QgQG5hdmlnYXRpbmcgb3Igbm90IGhhc0ZpbGUgb3Igb3B0Py5mb3IgaW4gWydlZGl0JyAnZ290byddXG5cbiAgICAgICAgICAgICAgICAgICAgQG5hdmlnYXRpbmcgPSBmYWxzZSBpZiBvcHQ/LmZvciBpbiBbJ2VkaXQnICdnb3RvJ11cblxuICAgICAgICAgICAgICAgICAgICBAYWRkVG9IaXN0b3J5IG9wdC5maWxlLCBvcHQucG9zXG5cbiAgICAgICAgICAgICAgICAgICAgQGN1cnJlbnRJbmRleCA9IEBmaWxlUG9zaXRpb25zLmxlbmd0aC0xXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgb3B0Py5mb3IgPT0gJ2dvdG8nXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcgQGZpbGVQb3NpdGlvbnMsIEBjdXJyZW50SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkRmlsZVBvcyBAZmlsZVBvc2l0aW9uc1tAY3VycmVudEluZGV4XSwgb3B0XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjdXJyZW50SW5kZXggPSBAZmlsZVBvc2l0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICduYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkJyBAZmlsZVBvc2l0aW9ucywgQGN1cnJlbnRJbmRleFxuXG4gICAgbG9hZEZpbGVQb3M6IChmaWxlUG9zLCBvcHQpIC0+XG5cbiAgICAgICAgaWYgb3B0Py5uZXdXaW5kb3dcbiAgICAgICAgICAgIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgXCIje2ZpbGVQb3MuZmlsZX06I3tmaWxlUG9zLnBvc1sxXSsxfToje2ZpbGVQb3MucG9zWzBdfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVycm9yICdubyB3aW5JRD8nIGlmIG5vdCBvcHQ/LndpbklEP1xuICAgICAgICAgICAgcG9zdC50b1dpbiBvcHQud2luSUQsICdsb2FkRmlsZScgXCIje2ZpbGVQb3MuZmlsZX06I3tmaWxlUG9zLnBvc1sxXSsxfToje2ZpbGVQb3MucG9zWzBdfVwiXG5cbiAgICAgICAgcG9zdC50b1dpbnMgJ25hdmlnYXRlSW5kZXhDaGFuZ2VkJyBAY3VycmVudEluZGV4LCBAZmlsZVBvc2l0aW9uc1tAY3VycmVudEluZGV4XVxuXG4gICAgICAgIGZpbGVQb3NcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgIyB0aGVzZSBhcmUgY2FsbGVkIGluIHdpbmRvdyBwcm9jZXNzXG5cbiAgICBkZWxGaWxlUG9zOiAoaXRlbSkgLT5cbiAgICAgICAgcG9zdC50b01haW4gJ25hdmlnYXRlJyBhY3Rpb246J2RlbEZpbGVQb3MnIHdpbklEOiB3aW5kb3cud2luSUQsIGl0ZW06aXRlbVxuXG4gICAgYWRkRmlsZVBvczogKG9wdCkgLT4gIyBjYWxsZWQgb24gZWRpdGluZ1xuICAgICAgICBvcHQuYWN0aW9uID0gJ2FkZEZpbGVQb3MnXG4gICAgICAgIG9wdC5mb3IgPSAnZWRpdCdcbiAgICAgICAgcG9zdC50b01haW4gJ25hdmlnYXRlJyBvcHRcblxuICAgIGdvdG9GaWxlUG9zOiAob3B0KSAtPiAjIGNhbGxlZCBvbiBqdW1wVG9cbiAgICAgICAgb3B0LmFjdGlvbiA9ICdhZGRGaWxlUG9zJ1xuICAgICAgICBvcHQuZm9yID0gJ2dvdG8nXG4gICAgICAgIHBvc3QudG9NYWluICduYXZpZ2F0ZScgb3B0XG5cbiAgICBiYWNrd2FyZDogLT4gcG9zdC50b01haW4gJ25hdmlnYXRlJyBhY3Rpb246ICdiYWNrd2FyZCcgd2luSUQ6IHdpbmRvdy53aW5JRFxuICAgIGZvcndhcmQ6ICAtPiBwb3N0LnRvTWFpbiAnbmF2aWdhdGUnIGFjdGlvbjogJ2ZvcndhcmQnICB3aW5JRDogd2luZG93LndpbklEXG4gICAgY2xlYXI6ICAgIC0+IHBvc3QudG9NYWluICduYXZpZ2F0ZScgYWN0aW9uOiAnY2xlYXInICAgIHdpbklEOiB3aW5kb3cud2luSURcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZpZ2F0ZVxuIl19
//# sourceURL=../../coffee/main/navigate.coffee