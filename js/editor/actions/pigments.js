// koffee 1.14.0
var Pigments, matchr,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

matchr = require('kxk').matchr;

Pigments = (function() {
    function Pigments(editor) {
        var hexa, rgb, rgba, trio;
        this.editor = editor;
        this.onFile = bind(this.onFile, this);
        this.onLineChanged = bind(this.onLineChanged, this);
        this.onLineInserted = bind(this.onLineInserted, this);
        this.test = /#[a-fA-F0-9]{3}|rgba?/;
        trio = /#[a-fA-F0-9]{3}(?![\w\d])/;
        hexa = /#[a-fA-F0-9]{6}(?![\w\d])/;
        rgb = /rgb\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\)/;
        rgba = /rgba\s*\(\s*\d+\s*\,\s*\d+\s*\,\s*\d+\s*\,\s*\d+\.?\d*\s*\)/;
        this.regexps = [[trio, 'trio'], [hexa, 'hexa'], [rgb, 'rgb'], [rgba, 'rgbaa']];
        this.editor.on('file', this.onFile);
    }

    Pigments.prototype.del = function() {
        return this.editor.removeListener('file', this.onFile);
    };

    Pigments.prototype.onLineInserted = function(li) {
        var i, len, line, results, ri, rng, rngs;
        line = this.editor.line(li);
        if (this.test.test(line)) {
            rngs = matchr.ranges(this.regexps, line);
            ri = -1;
            results = [];
            for (i = 0, len = rngs.length; i < len; i++) {
                rng = rngs[i];
                ri++;
                results.push(this.editor.meta.add({
                    line: li,
                    start: line.length + 2 + ri * 3,
                    end: line.length + 2 + ri * 3 + 2,
                    clss: 'pigment',
                    style: {
                        backgroundColor: rng.match
                    }
                }));
            }
            return results;
        }
    };

    Pigments.prototype.onLineChanged = function(li) {
        var i, len, m, metas;
        metas = this.editor.meta.metasAtLineIndex(li).filter(function(m) {
            return m[2].clss === 'pigment';
        });
        if (metas.length) {
            for (i = 0, len = metas.length; i < len; i++) {
                m = metas[i];
                this.editor.meta.delMeta(m);
            }
        }
        return this.onLineInserted(li);
    };

    Pigments.prototype.onFile = function(file) {
        if (window.state.get("pigments|" + file)) {
            return this.pigmentize();
        }
    };

    Pigments.prototype.activate = function() {
        window.state.set("pigments|" + this.editor.currentFile, true);
        return this.pigmentize();
    };

    Pigments.prototype.deactivate = function() {
        window.state.set("pigments|" + this.editor.currentFile);
        return this.clear();
    };

    Pigments.prototype.clear = function() {
        this.editor.removeListener('lineChanged', this.onLineChanged);
        this.editor.removeListener('lineInserted', this.onLineInserted);
        return this.editor.meta.delClass('pigment');
    };

    Pigments.prototype.pigmentize = function() {
        var i, li, ref, results;
        this.clear();
        this.editor.on('lineChanged', this.onLineChanged);
        this.editor.on('lineInserted', this.onLineInserted);
        results = [];
        for (li = i = 0, ref = this.editor.numLines(); 0 <= ref ? i < ref : i > ref; li = 0 <= ref ? ++i : --i) {
            results.push(this.onLineInserted(li));
        }
        return results;
    };

    return Pigments;

})();

module.exports = {
    actions: {
        togglePigments: {
            name: 'Toggle Pigments',
            text: 'toggle pigments for current file',
            combo: 'command+alt+shift+p',
            accel: 'alt+ctrl+shift+p'
        }
    },
    initPigments: function() {
        return this.pigments != null ? this.pigments : this.pigments = new Pigments(this);
    },
    togglePigments: function() {
        if (window.state.get("pigments|" + this.currentFile)) {
            return this.pigments.deactivate();
        } else {
            return this.pigments.activate();
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlnbWVudHMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJwaWdtZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUEsZ0JBQUE7SUFBQTs7QUFBRSxTQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUVQO0lBRUMsa0JBQUMsTUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsU0FBRDs7OztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFBLEdBQVE7UUFDUixJQUFBLEdBQVE7UUFDUixHQUFBLEdBQVE7UUFDUixJQUFBLEdBQVE7UUFFUixJQUFDLENBQUEsT0FBRCxHQUFXLENBQUMsQ0FBQyxJQUFELEVBQU8sTUFBUCxDQUFELEVBQWlCLENBQUMsSUFBRCxFQUFPLE1BQVAsQ0FBakIsRUFBaUMsQ0FBQyxHQUFELEVBQU0sS0FBTixDQUFqQyxFQUErQyxDQUFDLElBQUQsRUFBTyxPQUFQLENBQS9DO1FBRVgsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFtQixJQUFDLENBQUEsTUFBcEI7SUFWRDs7dUJBWUgsR0FBQSxHQUFLLFNBQUE7ZUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsTUFBdkIsRUFBK0IsSUFBQyxDQUFBLE1BQWhDO0lBQUg7O3VCQVFMLGNBQUEsR0FBZ0IsU0FBQyxFQUFEO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsQ0FBYSxFQUFiO1FBQ1AsSUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQUg7WUFDSSxJQUFBLEdBQU8sTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFDLENBQUEsT0FBZixFQUF3QixJQUF4QjtZQUNQLEVBQUEsR0FBSyxDQUFDO0FBQ047aUJBQUEsc0NBQUE7O2dCQUNJLEVBQUE7NkJBQ0EsSUFBQyxDQUFBLE1BQU0s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UUFBUSxDQUFDLFVBQVYsQ0FBQSxFQURKO1NBQUEsTUFBQTttQkFHSSxJQUFDLENBQUEsUUFBUSxDQUFDLFFBQVYsQ0FBQSxFQUhKOztJQUZZLENBVmhCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuXG57IG1hdGNociB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBQaWdtZW50c1xuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQHRlc3QgPSAvI1thLWZBLUYwLTldezN9fHJnYmE/L1xuICAgICAgICB0cmlvICA9IC8jW2EtZkEtRjAtOV17M30oPyFbXFx3XFxkXSkvXG4gICAgICAgIGhleGEgID0gLyNbYS1mQS1GMC05XXs2fSg/IVtcXHdcXGRdKS9cbiAgICAgICAgcmdiICAgPSAvcmdiXFxzKlxcKFxccypcXGQrXFxzKlxcLFxccypcXGQrXFxzKlxcLFxccypcXGQrXFxzKlxcKS9cbiAgICAgICAgcmdiYSAgPSAvcmdiYVxccypcXChcXHMqXFxkK1xccypcXCxcXHMqXFxkK1xccypcXCxcXHMqXFxkK1xccypcXCxcXHMqXFxkK1xcLj9cXGQqXFxzKlxcKS9cblxuICAgICAgICBAcmVnZXhwcyA9IFtbdHJpbywgJ3RyaW8nXSwgW2hleGEsICdoZXhhJ10sIFtyZ2IsICdyZ2InXSwgW3JnYmEsICdyZ2JhYSddXVxuXG4gICAgICAgIEBlZGl0b3Iub24gJ2ZpbGUnLCBAb25GaWxlXG5cbiAgICBkZWw6IC0+IEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2ZpbGUnLCBAb25GaWxlXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkxpbmVJbnNlcnRlZDogKGxpKSA9PlxuXG4gICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUgbGlcbiAgICAgICAgaWYgQHRlc3QudGVzdCBsaW5lXG4gICAgICAgICAgICBybmdzID0gbWF0Y2hyLnJhbmdlcyBAcmVnZXhwcywgbGluZVxuICAgICAgICAgICAgcmkgPSAtMVxuICAgICAgICAgICAgZm9yIHJuZyBpbiBybmdzXG4gICAgICAgICAgICAgICAgcmkrK1xuICAgICAgICAgICAgICAgIEBlZGl0b3IubWV0YS5hZGRcbiAgICAgICAgICAgICAgICAgICAgbGluZTogIGxpXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBsaW5lLmxlbmd0aCArIDIgKyByaSAqIDNcbiAgICAgICAgICAgICAgICAgICAgZW5kOiAgIGxpbmUubGVuZ3RoICsgMiArIHJpICogMyArIDJcbiAgICAgICAgICAgICAgICAgICAgY2xzczogICdwaWdtZW50J1xuICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogcm5nLm1hdGNoXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25MaW5lQ2hhbmdlZDogKGxpKSA9PlxuXG4gICAgICAgIG1ldGFzID0gQGVkaXRvci5tZXRhLm1ldGFzQXRMaW5lSW5kZXgobGkpLmZpbHRlciAobSkgLT4gbVsyXS5jbHNzID09ICdwaWdtZW50J1xuICAgICAgICBpZiBtZXRhcy5sZW5ndGhcbiAgICAgICAgICAgIGZvciBtIGluIG1ldGFzXG4gICAgICAgICAgICAgICAgQGVkaXRvci5tZXRhLmRlbE1ldGEgbVxuXG4gICAgICAgIEBvbkxpbmVJbnNlcnRlZCBsaVxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IFwicGlnbWVudHN8I3tmaWxlfVwiXG4gICAgICAgICAgICBAcGlnbWVudGl6ZSgpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGU6IC0+XG5cbiAgICAgICAgd2luZG93LnN0YXRlLnNldCBcInBpZ21lbnRzfCN7QGVkaXRvci5jdXJyZW50RmlsZX1cIiwgdHJ1ZVxuICAgICAgICBAcGlnbWVudGl6ZSgpXG5cbiAgICBkZWFjdGl2YXRlOiAtPlxuXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgXCJwaWdtZW50c3wje0BlZGl0b3IuY3VycmVudEZpbGV9XCJcbiAgICAgICAgQGNsZWFyKClcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2xpbmVDaGFuZ2VkJywgIEBvbkxpbmVDaGFuZ2VkXG4gICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2xpbmVJbnNlcnRlZCcsIEBvbkxpbmVJbnNlcnRlZFxuICAgICAgICBAZWRpdG9yLm1ldGEuZGVsQ2xhc3MgJ3BpZ21lbnQnXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHBpZ21lbnRpemU6IC0+XG5cbiAgICAgICAgQGNsZWFyKClcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQ2hhbmdlZCcsICBAb25MaW5lQ2hhbmdlZFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnLCBAb25MaW5lSW5zZXJ0ZWRcblxuICAgICAgICBmb3IgbGkgaW4gWzAuLi5AZWRpdG9yLm51bUxpbmVzKCldXG4gICAgICAgICAgICBAb25MaW5lSW5zZXJ0ZWQgbGlcblxubW9kdWxlLmV4cG9ydHMgPVxuXG4gICAgYWN0aW9uczpcblxuICAgICAgICB0b2dnbGVQaWdtZW50czpcbiAgICAgICAgICAgIG5hbWU6ICAnVG9nZ2xlIFBpZ21lbnRzJ1xuICAgICAgICAgICAgdGV4dDogICd0b2dnbGUgcGlnbWVudHMgZm9yIGN1cnJlbnQgZmlsZSdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCthbHQrc2hpZnQrcCdcbiAgICAgICAgICAgIGFjY2VsOiAnYWx0K2N0cmwrc2hpZnQrcCdcblxuICAgIGluaXRQaWdtZW50czogLT4gQHBpZ21lbnRzID89IG5ldyBQaWdtZW50cyBAXG5cbiAgICB0b2dnbGVQaWdtZW50czogLT5cblxuICAgICAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IFwicGlnbWVudHN8I3tAY3VycmVudEZpbGV9XCJcbiAgICAgICAgICAgIEBwaWdtZW50cy5kZWFjdGl2YXRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHBpZ21lbnRzLmFjdGl2YXRlKClcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/pigments.coffee