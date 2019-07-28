// koffee 1.3.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, _, childp, empty, fs, ref, slash, valid;

ref = require('kxk'), empty = ref.empty, valid = ref.valid, childp = ref.childp, slash = ref.slash, fs = ref.fs, _ = ref._;

File = (function() {
    function File() {}

    File.iconClassName = function(file) {
        var className, err, fileIcons;
        file = slash.removeLinePos(file);
        switch (slash.ext(file)) {
            case 'noon':
                className = 'noon-icon';
                break;
            case 'koffee':
                className = 'coffee-icon';
                break;
            default:
                try {
                    fileIcons = require('file-icons-js');
                    className = fileIcons.getClass(file);
                } catch (error) {
                    err = error;
                    true;
                }
        }
        if (className != null) {
            className;
        } else {
            className = 'file-icon';
        }
        return className;
    };

    File.write = function(file, text, mode, cb) {
        return slash.writeText(file, text, function(done) {
            if (empty(done)) {
                return cb("can't write " + file);
            } else {
                return cb(null, done);
            }
        });
    };

    File.unlock = function(file, text, cb) {
        return fs.chmod(file, 0x1b6, function(err) {
            if (valid(err)) {
                return cb(err);
            } else {
                return File.write(file, text, 0x1b6, cb);
            }
        });
    };

    File.p4edit = function(file, text, cb) {
        var err;
        if (slash.win()) {
            try {
                return childp.exec("p4 edit " + (slash.unslash(file)), function(err) {
                    if (valid(err)) {
                        return File.unlock(file, text, cb);
                    } else {
                        return File.write(file, text, 0x1b6, cb);
                    }
                });
            } catch (error) {
                err = error;
                return File.unlock(file, text, cb);
            }
        } else {
            return File.unlock(file, text, cb);
        }
    };

    File.save = function(file, text, cb) {
        return slash.fileExists(file, function(stat) {
            if (stat) {
                return slash.isWritable(file, function(writable) {
                    if (writable) {
                        return File.write(file, text, stat.mode, cb);
                    } else {
                        return File.p4edit(file, text, cb);
                    }
                });
            } else {
                return File.write(file, text, 0x1b6, cb);
            }
        });
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBeUMsT0FBQSxDQUFRLEtBQVIsQ0FBekMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLG1CQUFoQixFQUF3QixpQkFBeEIsRUFBK0IsV0FBL0IsRUFBbUM7O0FBRTdCOzs7SUFFRixJQUFDLENBQUEsYUFBRCxHQUFnQixTQUFDLElBQUQ7QUFFWixZQUFBO1FBQUEsSUFBQSxHQUFPLEtBQUssQ0FBQyxhQUFOLENBQW9CLElBQXBCO0FBQ1AsZ0JBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQVA7QUFBQSxpQkFDUyxNQURUO2dCQUN1QixTQUFBLEdBQVk7QUFBMUI7QUFEVCxpQkFFUyxRQUZUO2dCQUV1QixTQUFBLEdBQVk7QUFBMUI7QUFGVDtBQUlRO29CQUNJLFNBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjtvQkFDWixTQUFBLEdBQVksU0FBUyxDQUFDLFFBQVYsQ0FBbUIsSUFBbkIsRUFGaEI7aUJBQUEsYUFBQTtvQkFHTTtvQkFDRixLQUpKOztBQUpSOztZQVVBOztZQUFBLFlBQWE7O2VBQ2I7SUFkWTs7SUFnQmhCLElBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsRUFBbkI7ZUFFSixLQUFLLENBQUMsU0FBTixDQUFnQixJQUFoQixFQUFzQixJQUF0QixFQUE0QixTQUFDLElBQUQ7WUFDeEIsSUFBRyxLQUFBLENBQU0sSUFBTixDQUFIO3VCQUNJLEVBQUEsQ0FBRyxjQUFBLEdBQWUsSUFBbEIsRUFESjthQUFBLE1BQUE7dUJBR0ksRUFBQSxDQUFHLElBQUgsRUFBUyxJQUFULEVBSEo7O1FBRHdCLENBQTVCO0lBRkk7O0lBV1IsSUFBQyxDQUFBLE1BQUQsR0FBUyxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsRUFBYjtlQUVMLEVBQUUsQ0FBQyxLQUFILENBQVMsSUFBVCxFQUFlLEtBQWYsRUFBc0IsU0FBQyxHQUFEO1lBRWxCLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDt1QkFDSSxFQUFBLENBQUcsR0FBSCxFQURKO2FBQUEsTUFBQTt1QkFHSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFISjs7UUFGa0IsQ0FBdEI7SUFGSzs7SUFTVCxJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxFQUFiO0FBRUwsWUFBQTtRQUFBLElBQUcsS0FBSyxDQUFDLEdBQU4sQ0FBQSxDQUFIO0FBQ0k7dUJBQ0ksTUFBTSxDQUFDLElBQVAsQ0FBWSxVQUFBLEdBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBRCxDQUF0QixFQUE4QyxTQUFDLEdBQUQ7b0JBQzFDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDsrQkFDSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFESjtxQkFBQSxNQUFBOytCQUdJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixLQUF2QixFQUE4QixFQUE5QixFQUhKOztnQkFEMEMsQ0FBOUMsRUFESjthQUFBLGFBQUE7Z0JBTU07dUJBQ0YsSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBUEo7YUFESjtTQUFBLE1BQUE7bUJBVUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBVko7O0lBRks7O0lBY1QsSUFBQyxDQUFBLElBQUQsR0FBTyxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsRUFBYjtlQUVILEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEVBQXVCLFNBQUMsSUFBRDtZQUVuQixJQUFHLElBQUg7dUJBRUksS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsRUFBdUIsU0FBQyxRQUFEO29CQUVuQixJQUFHLFFBQUg7K0JBRUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLElBQUksQ0FBQyxJQUE1QixFQUFrQyxFQUFsQyxFQUZKO3FCQUFBLE1BQUE7K0JBTUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBTko7O2dCQUZtQixDQUF2QixFQUZKO2FBQUEsTUFBQTt1QkFZSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFaSjs7UUFGbUIsQ0FBdkI7SUFGRzs7Ozs7O0FBa0JYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IGVtcHR5LCB2YWxpZCwgY2hpbGRwLCBzbGFzaCwgZnMsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgRmlsZVxuXG4gICAgQGljb25DbGFzc05hbWU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgZmlsZSA9IHNsYXNoLnJlbW92ZUxpbmVQb3MgZmlsZVxuICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ25vb24nICAgdGhlbiBjbGFzc05hbWUgPSAnbm9vbi1pY29uJ1xuICAgICAgICAgICAgd2hlbiAna29mZmVlJyB0aGVuIGNsYXNzTmFtZSA9ICdjb2ZmZWUtaWNvbidcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAgZmlsZUljb25zID0gcmVxdWlyZSAnZmlsZS1pY29ucy1qcydcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gZmlsZUljb25zLmdldENsYXNzIGZpbGVcbiAgICAgICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAjIGxvZyBcIm5vIGljb24/ICN7ZmlsZX1cIlxuICAgICAgICBjbGFzc05hbWUgPz0gJ2ZpbGUtaWNvbidcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICAgICAgICBcbiAgICBAd3JpdGU6IChmaWxlLCB0ZXh0LCBtb2RlLCBjYikgLT5cbiAgXG4gICAgICAgIHNsYXNoLndyaXRlVGV4dCBmaWxlLCB0ZXh0LCAoZG9uZSkgLT5cbiAgICAgICAgICAgIGlmIGVtcHR5IGRvbmVcbiAgICAgICAgICAgICAgICBjYiBcImNhbid0IHdyaXRlICN7ZmlsZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGwsIGRvbmVcbiAgICAgICAgIyBmcy53cml0ZUZpbGUgZmlsZSwgdGV4dCwgeyBlbmNvZGluZzogJ3V0ZjgnLCBtb2RlOiBtb2RlIH0sIChlcnIpIC0+XG4gICAgICAgICAgICAjIGlmIHZhbGlkIGVyciB0aGVuIGNiIGVyclxuICAgICAgICAgICAgIyBlbHNlIGNiIG51bGwsIGZpbGVcbiAgICBcbiAgICBAdW5sb2NrOiAoZmlsZSwgdGV4dCwgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBmcy5jaG1vZCBmaWxlLCAwbzY2NiwgKGVycikgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICAgICAgY2IgZXJyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIFxuICAgIEBwNGVkaXQ6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjaGlsZHAuZXhlYyBcInA0IGVkaXQgI3tzbGFzaC51bnNsYXNoKGZpbGUpfVwiLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgXG4gICAgQHNhdmU6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICBcbiAgICAgICAgc2xhc2guZmlsZUV4aXN0cyBmaWxlLCAoc3RhdCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc3RhdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNsYXNoLmlzV3JpdGFibGUgZmlsZSwgKHdyaXRhYmxlKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgd3JpdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCBzdGF0Lm1vZGUsIGNiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLnA0ZWRpdCBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee