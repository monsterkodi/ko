// koffee 1.3.0

/*
 0000000  000   000  0000000    
000       000 0 000  000   000  
000       000000000  000   000  
000       000   000  000   000  
 0000000  00     00  0000000
 */
var $, CWD, elem, post, ref, slash, syntax,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, post = ref.post, elem = ref.elem, $ = ref.$;

syntax = require('../editor/syntax');

CWD = (function() {
    function CWD() {
        this.stash = bind(this.stash, this);
        this.restore = bind(this.restore, this);
        this.onCwdSet = bind(this.onCwdSet, this);
        this.elem = elem({
            "class": 'cwd'
        });
        $('commandline-span').appendChild(this.elem);
        post.on('stash', this.stash);
        post.on('restore', this.restore);
        post.on('cwdSet', this.onCwdSet);
        this.restore();
    }

    CWD.prototype.onCwdSet = function(cwd) {
        var html, text;
        this.cwd = cwd;
        text = slash.tilde(this.cwd);
        html = syntax.spanForTextAndSyntax(text, 'browser');
        return this.elem.innerHTML = html;
    };

    CWD.prototype.visible = function() {
        return this.elem.style.display !== 'none';
    };

    CWD.prototype.restore = function() {
        if (window.stash.get('cwd', false) !== this.visible()) {
            return this.toggle();
        }
    };

    CWD.prototype.stash = function() {
        return window.stash.set('cwd', this.visible());
    };

    CWD.prototype.toggle = function() {
        this.elem.style.display = this.visible() && 'none' || 'unset';
        return this.stash();
    };

    return CWD;

})();

module.exports = CWD;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3dkLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzQ0FBQTtJQUFBOztBQVFBLE1BQTJCLE9BQUEsQ0FBUSxLQUFSLENBQTNCLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQjs7QUFFckIsTUFBQSxHQUFTLE9BQUEsQ0FBUSxrQkFBUjs7QUFFSDtJQUVXLGFBQUE7Ozs7UUFFVCxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sS0FBUDtTQUFMO1FBRVIsQ0FBQSxDQUFFLGtCQUFGLENBQXFCLENBQUMsV0FBdEIsQ0FBa0MsSUFBQyxDQUFBLElBQW5DO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQW1CLElBQUMsQ0FBQSxLQUFwQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsU0FBUixFQUFtQixJQUFDLENBQUEsT0FBcEI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBbUIsSUFBQyxDQUFBLFFBQXBCO1FBR0EsSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQVhTOztrQkFhYixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUZPLElBQUMsQ0FBQSxNQUFEO1FBRVAsSUFBQSxHQUFPLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLEdBQWI7UUFDUCxJQUFBLEdBQU8sTUFBTSxDQUFDLG9CQUFQLENBQTRCLElBQTVCLEVBQWtDLFNBQWxDO2VBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO0lBSlo7O2tCQU1WLE9BQUEsR0FBUyxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWixLQUF1QjtJQUExQjs7a0JBRVQsT0FBQSxHQUFTLFNBQUE7UUFBRyxJQUFhLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF3QixLQUF4QixDQUFBLEtBQWtDLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBL0M7bUJBQUEsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUFBOztJQUFIOztrQkFDVCxLQUFBLEdBQVMsU0FBQTtlQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF3QixJQUFDLENBQUEsT0FBRCxDQUFBLENBQXhCO0lBQUg7O2tCQUVULE1BQUEsR0FBUSxTQUFBO1FBQ0osSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWixHQUFzQixJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsSUFBZSxNQUFmLElBQXlCO2VBQy9DLElBQUMsQ0FBQSxLQUFELENBQUE7SUFGSTs7Ozs7O0FBSVosTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIFxuIyMjXG5cbnsgc2xhc2gsIHBvc3QsIGVsZW0sICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuc3ludGF4ID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcblxuY2xhc3MgQ1dEXG5cbiAgICBjb25zdHJ1Y3RvcjogKCkgLT5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBlbGVtID0gZWxlbSBjbGFzczogJ2N3ZCdcblxuICAgICAgICAkKCdjb21tYW5kbGluZS1zcGFuJykuYXBwZW5kQ2hpbGQgQGVsZW1cbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ3N0YXNoJywgICBAc3Rhc2hcbiAgICAgICAgcG9zdC5vbiAncmVzdG9yZScsIEByZXN0b3JlXG4gICAgICAgIHBvc3Qub24gJ2N3ZFNldCcsICBAb25Dd2RTZXRcbiAgICAgICAgXG4gICAgICAgICMgQG9uQ3dkU2V0IHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy50ZXJtLmN3ZCBcbiAgICAgICAgQHJlc3RvcmUoKVxuICAgICAgICAgICAgXG4gICAgb25Dd2RTZXQ6IChAY3dkKSA9PlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIEBjd2RcbiAgICAgICAgaHRtbCA9IHN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCAnYnJvd3NlcidcbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gaHRtbFxuICAgIFxuICAgIHZpc2libGU6IC0+IEBlbGVtLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnXG5cbiAgICByZXN0b3JlOiA9PiBAdG9nZ2xlKCkgaWYgd2luZG93LnN0YXNoLmdldCgnY3dkJywgZmFsc2UpICE9IEB2aXNpYmxlKClcbiAgICBzdGFzaDogICA9PiB3aW5kb3cuc3Rhc2guc2V0ICdjd2QnLCBAdmlzaWJsZSgpXG5cbiAgICB0b2dnbGU6IC0+IFxuICAgICAgICBAZWxlbS5zdHlsZS5kaXNwbGF5ID0gQHZpc2libGUoKSBhbmQgJ25vbmUnIG9yICd1bnNldCdcbiAgICAgICAgQHN0YXNoKClcblxubW9kdWxlLmV4cG9ydHMgPSBDV0RcbiJdfQ==
//# sourceURL=../../coffee/tools/cwd.coffee