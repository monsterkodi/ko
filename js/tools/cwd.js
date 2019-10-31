// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3dkLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzQ0FBQTtJQUFBOztBQVFBLE1BQTJCLE9BQUEsQ0FBUSxLQUFSLENBQTNCLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQjs7QUFFckIsTUFBQSxHQUFTLE9BQUEsQ0FBUSxrQkFBUjs7QUFFSDtJQUVDLGFBQUE7Ozs7UUFFQyxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sS0FBUDtTQUFMO1FBRVIsQ0FBQSxDQUFFLGtCQUFGLENBQXFCLENBQUMsV0FBdEIsQ0FBa0MsSUFBQyxDQUFBLElBQW5DO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWtCLElBQUMsQ0FBQSxLQUFuQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsU0FBUixFQUFrQixJQUFDLENBQUEsT0FBbkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBa0IsSUFBQyxDQUFBLFFBQW5CO1FBR0EsSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQVhEOztrQkFhSCxRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUZPLElBQUMsQ0FBQSxNQUFEO1FBRVAsSUFBQSxHQUFPLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLEdBQWI7UUFDUCxJQUFBLEdBQU8sTUFBTSxDQUFDLG9CQUFQLENBQTRCLElBQTVCLEVBQWtDLFNBQWxDO2VBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO0lBSlo7O2tCQU1WLE9BQUEsR0FBUyxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWixLQUF1QjtJQUExQjs7a0JBRVQsT0FBQSxHQUFTLFNBQUE7UUFBRyxJQUFhLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF1QixLQUF2QixDQUFBLEtBQWlDLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBOUM7bUJBQUEsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUFBOztJQUFIOztrQkFDVCxLQUFBLEdBQVMsU0FBQTtlQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF1QixJQUFDLENBQUEsT0FBRCxDQUFBLENBQXZCO0lBQUg7O2tCQUVULE1BQUEsR0FBUSxTQUFBO1FBQ0osSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWixHQUFzQixJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsSUFBZSxNQUFmLElBQXlCO2VBQy9DLElBQUMsQ0FBQSxLQUFELENBQUE7SUFGSTs7Ozs7O0FBSVosTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIFxuIyMjXG5cbnsgc2xhc2gsIHBvc3QsIGVsZW0sICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuc3ludGF4ID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcblxuY2xhc3MgQ1dEXG5cbiAgICBAOiAoKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVsZW0gPSBlbGVtIGNsYXNzOiAnY3dkJ1xuXG4gICAgICAgICQoJ2NvbW1hbmRsaW5lLXNwYW4nKS5hcHBlbmRDaGlsZCBAZWxlbVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnc3Rhc2gnICAgQHN0YXNoXG4gICAgICAgIHBvc3Qub24gJ3Jlc3RvcmUnIEByZXN0b3JlXG4gICAgICAgIHBvc3Qub24gJ2N3ZFNldCcgIEBvbkN3ZFNldFxuICAgICAgICBcbiAgICAgICAgIyBAb25Dd2RTZXQgd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLnRlcm0uY3dkIFxuICAgICAgICBAcmVzdG9yZSgpXG4gICAgICAgICAgICBcbiAgICBvbkN3ZFNldDogKEBjd2QpID0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gc2xhc2gudGlsZGUgQGN3ZFxuICAgICAgICBodG1sID0gc3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IHRleHQsICdicm93c2VyJ1xuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBodG1sXG4gICAgXG4gICAgdmlzaWJsZTogLT4gQGVsZW0uc3R5bGUuZGlzcGxheSAhPSAnbm9uZSdcblxuICAgIHJlc3RvcmU6ID0+IEB0b2dnbGUoKSBpZiB3aW5kb3cuc3Rhc2guZ2V0KCdjd2QnIGZhbHNlKSAhPSBAdmlzaWJsZSgpXG4gICAgc3Rhc2g6ICAgPT4gd2luZG93LnN0YXNoLnNldCAnY3dkJyBAdmlzaWJsZSgpXG5cbiAgICB0b2dnbGU6IC0+IFxuICAgICAgICBAZWxlbS5zdHlsZS5kaXNwbGF5ID0gQHZpc2libGUoKSBhbmQgJ25vbmUnIG9yICd1bnNldCdcbiAgICAgICAgQHN0YXNoKClcblxubW9kdWxlLmV4cG9ydHMgPSBDV0RcbiJdfQ==
//# sourceURL=../../coffee/tools/cwd.coffee