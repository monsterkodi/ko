// koffee 1.12.0

/*
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
 */
var $, File, Viewer, elem, empty, keyinfo, klog, open, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, elem = ref.elem, empty = ref.empty, keyinfo = ref.keyinfo, klog = ref.klog, open = ref.open, slash = ref.slash;

File = require('../tools/file');

Viewer = (function() {
    function Viewer(browser, path) {
        this.browser = browser;
        this.path = path;
        this.close = bind(this.close, this);
        this.onKey = bind(this.onKey, this);
        if (slash.isDir(this.path)) {
            slash.list(this.path, (function(_this) {
                return function(items) {
                    var images;
                    images = items.filter(function(item) {
                        return File.isImage(item.file);
                    });
                    if (empty(images)) {
                        return;
                    }
                    return _this.loadImages(images.map(function(item) {
                        return item.file;
                    }));
                };
            })(this));
        } else {
            if (File.isImage(this.path)) {
                this.loadImages([this.path]);
            }
        }
    }

    Viewer.prototype.loadImages = function(images) {
        var cnt, file, i, img, len, main;
        this.div = elem({
            "class": 'viewer',
            tabindex: 1
        });
        this.focus = document.activeElement;
        for (i = 0, len = images.length; i < len; i++) {
            file = images[i];
            img = elem('img', {
                "class": 'viewerImage',
                src: slash.fileUrl(file)
            });
            cnt = elem({
                "class": 'viewerImageContainer',
                child: img
            });
            cnt.addEventListener('dblclick', (function(file) {
                return function() {
                    return open(file);
                };
            })(file));
            this.div.appendChild(cnt);
            main = $('#main');
        }
        main.appendChild(this.div);
        this.div.addEventListener('keydown', this.onKey);
        return this.div.focus();
    };

    Viewer.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'esc':
            case 'space':
                this.close();
                break;
            case 'ctrl+q':
                return;
            default:
                klog('combo', combo);
        }
        return typeof event.stopPropagation === "function" ? event.stopPropagation() : void 0;
    };

    Viewer.prototype.close = function() {
        this.browser.viewer = null;
        this.div.remove();
        return this.focus.focus();
    };

    return Viewer;

})();

module.exports = Viewer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJ2aWV3ZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDZEQUFBO0lBQUE7O0FBUUEsTUFBaUQsT0FBQSxDQUFRLEtBQVIsQ0FBakQsRUFBRSxTQUFGLEVBQUssZUFBTCxFQUFXLGlCQUFYLEVBQWtCLHFCQUFsQixFQUEyQixlQUEzQixFQUFpQyxlQUFqQyxFQUF1Qzs7QUFFdkMsSUFBQSxHQUFVLE9BQUEsQ0FBUSxlQUFSOztBQUdKO0lBRUMsZ0JBQUMsT0FBRCxFQUFXLElBQVg7UUFBQyxJQUFDLENBQUEsVUFBRDtRQUFVLElBQUMsQ0FBQSxPQUFEOzs7UUFFVixJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLElBQWIsQ0FBSDtZQUVJLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQyxDQUFBLElBQVosRUFBa0IsQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQyxLQUFEO0FBRWQsd0JBQUE7b0JBQUEsTUFBQSxHQUFTLEtBQUssQ0FBQyxNQUFOLENBQWEsU0FBQyxJQUFEOytCQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQWxCO29CQUFWLENBQWI7b0JBRVQsSUFBVSxLQUFBLENBQU0sTUFBTixDQUFWO0FBQUEsK0JBQUE7OzJCQUVBLEtBQUMsQ0FBQSxVQUFELENBQVksTUFBTSxDQUFDLEdBQVAsQ0FBVyxTQUFDLElBQUQ7K0JBQVUsSUFBSSxDQUFDO29CQUFmLENBQVgsQ0FBWjtnQkFOYztZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEIsRUFGSjtTQUFBLE1BQUE7WUFVSSxJQUFHLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBQyxDQUFBLElBQWQsQ0FBSDtnQkFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQUMsSUFBQyxDQUFBLElBQUYsQ0FBWixFQURKO2FBVko7O0lBRkQ7O3FCQWVILFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFLUixZQUFBO1FBQUEsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFFBQU47WUFBZSxRQUFBLEVBQVMsQ0FBeEI7U0FBTDtRQUVQLElBQUMsQ0FBQSxLQUFELEdBQVMsUUFBUSxDQUFDO0FBRWxCLGFBQUEsd0NBQUE7O1lBRUksR0FBQSxHQUFNLElBQUEsQ0FBSyxLQUFMLEVBQVc7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxhQUFOO2dCQUFvQixHQUFBLEVBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQXhCO2FBQVg7WUFDTixHQUFBLEdBQU0sSUFBQSxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sc0JBQU47Z0JBQTZCLEtBQUEsRUFBTSxHQUFuQzthQUFMO1lBQ04sR0FBRyxDQUFDLGdCQUFKLENBQXFCLFVBQXJCLEVBQWdDLENBQUMsU0FBQyxJQUFEO3VCQUFVLFNBQUE7MkJBQUcsSUFBQSxDQUFLLElBQUw7Z0JBQUg7WUFBVixDQUFELENBQUEsQ0FBeUIsSUFBekIsQ0FBaEM7WUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLFdBQUwsQ0FBaUIsR0FBakI7WUFFQSxJQUFBLEdBQU0sQ0FBQSxDQUFFLE9BQUY7QUFQVjtRQVNBLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQUMsQ0FBQSxHQUFsQjtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBZ0MsSUFBQyxDQUFBLEtBQWpDO2VBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFMLENBQUE7SUFyQlE7O3FCQTZCWixLQUFBLEdBQU8sU0FBQyxLQUFEO0FBRUgsWUFBQTtRQUFBLE9BQTRCLE9BQU8sQ0FBQyxRQUFSLENBQWlCLEtBQWpCLENBQTVCLEVBQUUsY0FBRixFQUFPLGNBQVAsRUFBWSxrQkFBWixFQUFtQjtBQUVuQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsS0FEVDtBQUFBLGlCQUNlLE9BRGY7Z0JBQzRCLElBQUMsQ0FBQSxLQUFELENBQUE7QUFBYjtBQURmLGlCQUVTLFFBRlQ7QUFFdUI7QUFGdkI7Z0JBR1MsSUFBQSxDQUFLLE9BQUwsRUFBYSxLQUFiO0FBSFQ7NkRBS0EsS0FBSyxDQUFDO0lBVEg7O3FCQVdQLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEdBQWtCO1FBRWxCLElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTCxDQUFBO2VBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQUE7SUFMRzs7Ozs7O0FBT1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgMCAgICAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgJCwgZWxlbSwgZW1wdHksIGtleWluZm8sIGtsb2csIG9wZW4sIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbkZpbGUgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuIyBIZWFkZXIgID0gcmVxdWlyZSAnLi9oZWFkZXInXG5cbmNsYXNzIFZpZXdlclxuXG4gICAgQDogKEBicm93c2VyLCBAcGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIEBwYXRoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNsYXNoLmxpc3QgQHBhdGgsIChpdGVtcykgPT5cbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZXMgPSBpdGVtcy5maWx0ZXIgKGl0ZW0pIC0+IEZpbGUuaXNJbWFnZSBpdGVtLmZpbGVcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgZW1wdHkgaW1hZ2VzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQGxvYWRJbWFnZXMgaW1hZ2VzLm1hcCAoaXRlbSkgLT4gaXRlbS5maWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEZpbGUuaXNJbWFnZSBAcGF0aFxuICAgICAgICAgICAgICAgIEBsb2FkSW1hZ2VzIFtAcGF0aF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBsb2FkSW1hZ2VzOiAoaW1hZ2VzKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICMgQGhlYWRlciA9IG5ldyBIZWFkZXIgQGJyb3dzZXJcbiAgICAgICAgIyBAaGVhZGVyLnNldEZpbGUgQHBhdGhcbiAgICAgICAgXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOid2aWV3ZXInIHRhYmluZGV4OjFcbiAgICAgICAgXG4gICAgICAgIEBmb2N1cyA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcbiAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIGltYWdlc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbWcgPSBlbGVtICdpbWcnIGNsYXNzOid2aWV3ZXJJbWFnZScgc3JjOnNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICAgICAgY250ID0gZWxlbSBjbGFzczondmlld2VySW1hZ2VDb250YWluZXInIGNoaWxkOmltZ1xuICAgICAgICAgICAgY250LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAoKGZpbGUpIC0+IC0+IG9wZW4gZmlsZSkoZmlsZSlcbiAgICAgICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgIFxuICAgICAgICAgICAgbWFpbiA9JCAnI21haW4nXG4gICAgICAgICAgICBcbiAgICAgICAgbWFpbi5hcHBlbmRDaGlsZCBAZGl2XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyBAb25LZXlcbiAgICAgICAgQGRpdi5mb2N1cygpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG5cbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VzYycgJ3NwYWNlJyB0aGVuIEBjbG9zZSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3EnIHRoZW4gcmV0dXJuXG4gICAgICAgICAgICBlbHNlIGtsb2cgJ2NvbWJvJyBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbj8oKVxuICAgICAgICAgICAgXG4gICAgY2xvc2U6ID0+XG5cbiAgICAgICAgQGJyb3dzZXIudmlld2VyID0gbnVsbFxuICAgICAgICAjIEBoZWFkZXIuZGVsKClcbiAgICAgICAgQGRpdi5yZW1vdmUoKVxuICAgICAgICBAZm9jdXMuZm9jdXMoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdlclxuIl19
//# sourceURL=../../coffee/browser/viewer.coffee