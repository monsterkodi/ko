// koffee 1.16.0

/*
 0000000  000   000  0000000    
000       000 0 000  000   000  
000       000000000  000   000  
000       000   000  000   000  
 0000000  00     00  0000000
 */
var $, CWD, elem, post, ref, slash, syntax,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, slash = ref.slash, elem = ref.elem, $ = ref.$;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3dkLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsiY3dkLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzQ0FBQTtJQUFBOztBQVFBLE1BQTJCLE9BQUEsQ0FBUSxLQUFSLENBQTNCLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQjs7QUFFckIsTUFBQSxHQUFTLE9BQUEsQ0FBUSxrQkFBUjs7QUFFSDtJQUVDLGFBQUE7Ozs7UUFFQyxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sS0FBUDtTQUFMO1FBRVIsQ0FBQSxDQUFFLGtCQUFGLENBQXFCLENBQUMsV0FBdEIsQ0FBa0MsSUFBQyxDQUFBLElBQW5DO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWtCLElBQUMsQ0FBQSxLQUFuQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsU0FBUixFQUFrQixJQUFDLENBQUEsT0FBbkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBa0IsSUFBQyxDQUFBLFFBQW5CO1FBRUEsSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQVZEOztrQkFZSCxRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUZPLElBQUMsQ0FBQSxNQUFEO1FBRVAsSUFBQSxHQUFPLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLEdBQWI7UUFDUCxJQUFBLEdBQU8sTUFBTSxDQUFDLG9CQUFQLENBQTRCLElBQTVCLEVBQWtDLFNBQWxDO2VBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO0lBSlo7O2tCQU1WLE9BQUEsR0FBUyxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWixLQUF1QjtJQUExQjs7a0JBRVQsT0FBQSxHQUFTLFNBQUE7UUFBRyxJQUFhLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF1QixLQUF2QixDQUFBLEtBQWlDLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBOUM7bUJBQUEsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUFBOztJQUFIOztrQkFDVCxLQUFBLEdBQVMsU0FBQTtlQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF1QixJQUFDLENBQUEsT0FBRCxDQUFBLENBQXZCO0lBQUg7O2tCQUVULE1BQUEsR0FBUSxTQUFBO1FBQ0osSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWixHQUFzQixJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsSUFBZSxNQUFmLElBQXlCO2VBQy9DLElBQUMsQ0FBQSxLQUFELENBQUE7SUFGSTs7Ozs7O0FBSVosTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIFxuIyMjXG5cbnsgcG9zdCwgc2xhc2gsIGVsZW0sICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuc3ludGF4ID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcblxuY2xhc3MgQ1dEXG5cbiAgICBAOiAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVsZW0gPSBlbGVtIGNsYXNzOiAnY3dkJ1xuXG4gICAgICAgICQoJ2NvbW1hbmRsaW5lLXNwYW4nKS5hcHBlbmRDaGlsZCBAZWxlbVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnc3Rhc2gnICAgQHN0YXNoXG4gICAgICAgIHBvc3Qub24gJ3Jlc3RvcmUnIEByZXN0b3JlXG4gICAgICAgIHBvc3Qub24gJ2N3ZFNldCcgIEBvbkN3ZFNldFxuICAgICAgICBcbiAgICAgICAgQHJlc3RvcmUoKVxuICAgICAgICAgICAgXG4gICAgb25Dd2RTZXQ6IChAY3dkKSA9PlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIEBjd2RcbiAgICAgICAgaHRtbCA9IHN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCAnYnJvd3NlcidcbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gaHRtbFxuICAgIFxuICAgIHZpc2libGU6IC0+IEBlbGVtLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnXG5cbiAgICByZXN0b3JlOiA9PiBAdG9nZ2xlKCkgaWYgd2luZG93LnN0YXNoLmdldCgnY3dkJyBmYWxzZSkgIT0gQHZpc2libGUoKVxuICAgIHN0YXNoOiAgID0+IHdpbmRvdy5zdGFzaC5zZXQgJ2N3ZCcgQHZpc2libGUoKVxuXG4gICAgdG9nZ2xlOiAtPiBcbiAgICAgICAgQGVsZW0uc3R5bGUuZGlzcGxheSA9IEB2aXNpYmxlKCkgYW5kICdub25lJyBvciAndW5zZXQnXG4gICAgICAgIEBzdGFzaCgpXG5cbm1vZHVsZS5leHBvcnRzID0gQ1dEXG4iXX0=
//# sourceURL=../../coffee/tools/cwd.coffee