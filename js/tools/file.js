// koffee 1.12.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, childp, empty, fs, icons, kerror, ref, slash, valid;

ref = require('kxk'), childp = ref.childp, empty = ref.empty, fs = ref.fs, kerror = ref.kerror, slash = ref.slash, valid = ref.valid;

icons = require('./icons.json');

File = (function() {
    function File() {}

    File.sourceFileExtensions = ['koffee', 'coffee', 'styl', 'swift', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp', 'ts', 'js', 'frag', 'vert'];

    File.isCode = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'coffee' || ref1 === 'py' || ref1 === 'cpp' || ref1 === 'cc' || ref1 === 'c' || ref1 === 'cs' || ref1 === 'ts' || ref1 === 'js' || ref1 === 'h' || ref1 === 'hpp' || ref1 === 'frag' || ref1 === 'vert';
    };

    File.isImage = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'gif' || ref1 === 'png' || ref1 === 'jpg' || ref1 === 'jpeg' || ref1 === 'svg' || ref1 === 'bmp' || ref1 === 'ico';
    };

    File.isText = function(file) {
        return slash.isText(file);
    };

    File.rename = function(from, to, cb) {
        return fs.mkdir(slash.dir(to), {
            recursive: true
        }, function(err) {
            if (err) {
                return kerror("mkdir failed " + err);
            }
            if (slash.isDir(to)) {
                to = slash.join(to, slash.file(from));
            }
            return fs.move(from, to, {
                overwrite: true
            }, function(err) {
                if (err) {
                    return kerror("rename failed " + err);
                }
                return cb(from, to);
            });
        });
    };

    File.duplicate = function(from, cb) {
        return slash.unused(from, (function(_this) {
            return function(target) {
                return _this.copy(from, target, cb);
            };
        })(this));
    };

    File.copy = function(from, to, cb) {
        if (slash.isDir(to)) {
            to = slash.join(to, slash.file(from));
        }
        return fs.copy(from, to, function(err) {
            if (err) {
                return kerror("copy failed " + err);
            }
            return cb(from, to);
        });
    };

    File.iconClassName = function(file) {
        var clss;
        file = slash.removeLinePos(file);
        clss = icons.ext[slash.ext(file)];
        if (clss != null) {
            clss;
        } else {
            clss = icons.base[slash.base(file).toLowerCase()];
        }
        if (clss != null) {
            clss;
        } else {
            clss = 'file';
        }
        return "icon " + clss;
    };

    File.write = function(file, text, mode, cb) {
        slash.logErrors = true;
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
        slash.logErrors = true;
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
        slash.logErrors = true;
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

    File.span = function(text) {
        var base, clss, ext, span;
        base = slash.base(text);
        ext = slash.ext(text).toLowerCase();
        clss = valid(ext) && ' ' + ext || '';
        if (base.startsWith('.')) {
            clss += ' dotfile';
        }
        span = ("<span class='text" + clss + "'>") + base + "</span>";
        if (valid(ext)) {
            span += ("<span class='ext punct" + clss + "'>.</span>") + ("<span class='ext text" + clss + "'>") + ext + "</span>";
        }
        return span;
    };

    File.crumbSpan = function(file) {
        var i, j, ref1, s, spans, split;
        if (file === '/' || file === '') {
            return "<span>/</span>";
        }
        spans = [];
        split = slash.split(file);
        for (i = j = 0, ref1 = split.length - 1; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            s = split[i];
            spans.push("<div class='inline path' id='" + (split.slice(0, +i + 1 || 9e9).join('/')) + "'>" + s + "</div>");
        }
        spans.push("<div class='inline' id='" + file + "'>" + split.slice(-1)[0] + "</div>");
        return spans.join("<span class='punct'>/</span>");
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvdG9vbHMiLCJzb3VyY2VzIjpbImZpbGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQThDLE9BQUEsQ0FBUSxLQUFSLENBQTlDLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixXQUFqQixFQUFxQixtQkFBckIsRUFBNkIsaUJBQTdCLEVBQW9DOztBQUVwQyxLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxvQkFBRCxHQUF1QixDQUFFLFFBQUYsRUFBVyxRQUFYLEVBQW9CLE1BQXBCLEVBQTJCLE9BQTNCLEVBQW1DLEtBQW5DLEVBQXlDLElBQXpDLEVBQThDLE1BQTlDLEVBQXFELEtBQXJELEVBQTJELE1BQTNELEVBQWtFLElBQWxFLEVBQXVFLElBQXZFLEVBQTRFLEtBQTVFLEVBQWtGLElBQWxGLEVBQXVGLEdBQXZGLEVBQTJGLElBQTNGLEVBQWdHLEdBQWhHLEVBQW9HLEtBQXBHLEVBQTBHLElBQTFHLEVBQStHLElBQS9HLEVBQW9ILE1BQXBILEVBQTJILE1BQTNIOztJQUV2QixJQUFDLENBQUEsTUFBRCxHQUFVLFNBQUMsSUFBRDtBQUFVLFlBQUE7dUJBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLEVBQUEsS0FBb0IsUUFBcEIsSUFBQSxJQUFBLEtBQTZCLElBQTdCLElBQUEsSUFBQSxLQUFrQyxLQUFsQyxJQUFBLElBQUEsS0FBd0MsSUFBeEMsSUFBQSxJQUFBLEtBQTZDLEdBQTdDLElBQUEsSUFBQSxLQUFpRCxJQUFqRCxJQUFBLElBQUEsS0FBc0QsSUFBdEQsSUFBQSxJQUFBLEtBQTJELElBQTNELElBQUEsSUFBQSxLQUFnRSxHQUFoRSxJQUFBLElBQUEsS0FBb0UsS0FBcEUsSUFBQSxJQUFBLEtBQTBFLE1BQTFFLElBQUEsSUFBQSxLQUFpRjtJQUEzRjs7SUFDVixJQUFDLENB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SUFBcEIsR0FBeUIsSUFBekIsQ0FBQSxHQUE2QixJQUE3QixHQUFrQztRQUV6QyxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7WUFDSSxJQUFBLElBQVEsQ0FBQSx3QkFBQSxHQUF5QixJQUF6QixHQUE4QixZQUE5QixDQUFBLEdBQTRDLENBQUEsdUJBQUEsR0FBd0IsSUFBeEIsR0FBNkIsSUFBN0IsQ0FBNUMsR0FBNkUsR0FBN0UsR0FBaUYsVUFEN0Y7O2VBRUE7SUFaRzs7SUFjUCxJQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsSUFBRDtBQUVSLFlBQUE7UUFBQSxJQUEyQixJQUFBLEtBQVMsR0FBVCxJQUFBLElBQUEsS0FBYSxFQUF4QztBQUFBLG1CQUFPLGlCQUFQOztRQUVBLEtBQUEsR0FBUTtRQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsS0FBTixDQUFZLElBQVo7QUFFUixhQUFTLDhGQUFUO1lBQ0ksQ0FBQSxHQUFJLEtBQU0sQ0FBQSxDQUFBO1lBQ1YsS0FBSyxDQUFDLElBQU4sQ0FBVywrQkFBQSxHQUErQixDQUFDLEtBQU0sd0JBQUssQ0FBQyxJQUFaLENBQWlCLEdBQWpCLENBQUQsQ0FBL0IsR0FBcUQsSUFBckQsR0FBeUQsQ0FBekQsR0FBMkQsUUFBdEU7QUFGSjtRQUdBLEtBQUssQ0FBQyxJQUFOLENBQVcsMEJBQUEsR0FBMkIsSUFBM0IsR0FBZ0MsSUFBaEMsR0FBb0MsS0FBTSxVQUFFLENBQUEsQ0FBQSxDQUE1QyxHQUE4QyxRQUF6RDtlQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsOEJBQVg7SUFYUTs7Ozs7O0FBYWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IGNoaWxkcCwgZW1wdHksIGZzLCBrZXJyb3IsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5pY29ucyA9IHJlcXVpcmUgJy4vaWNvbnMuanNvbidcblxuY2xhc3MgRmlsZVxuICAgIFxuICAgIEBzb3VyY2VGaWxlRXh0ZW5zaW9uczogWyAna29mZmVlJyAnY29mZmVlJyAnc3R5bCcgJ3N3aWZ0JyAncHVnJyAnbWQnICdub29uJyAndHh0JyAnanNvbicgJ3NoJyAncHknICdjcHAnICdjYycgJ2MnICdjcycgJ2gnICdocHAnICd0cycgJ2pzJyAnZnJhZycgJ3ZlcnQnXVxuXG4gICAgQGlzQ29kZTogIChmaWxlKSAtPiBzbGFzaC5leHQoZmlsZSkgaW4gWydjb2ZmZWUnICdweScgJ2NwcCcgJ2NjJyAnYycgJ2NzJyAndHMnICdqcycgJ2gnICdocHAnICdmcmFnJyAndmVydCddXG4gICAgQGlzSW1hZ2U6IChmaWxlKSAtPiBzbGFzaC5leHQoZmlsZSkgaW4gWydnaWYnICdwbmcnICdqcGcnICdqcGVnJyAnc3ZnJyAnYm1wJyAnaWNvJ11cbiAgICBAaXNUZXh0OiAgKGZpbGUpIC0+IHNsYXNoLmlzVGV4dCBmaWxlXG4gICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJta2RpciBmYWlsZWQgI3tlcnJ9XCIgaWYgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgICAgIHRvID0gc2xhc2guam9pbiB0bywgc2xhc2guZmlsZSBmcm9tXG5cbiAgICAgICAgICAgIGZzLm1vdmUgZnJvbSwgdG8sIG92ZXJ3cml0ZTp0cnVlLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJyZW5hbWUgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgICAgIGNiIGZyb20sIHRvXG5cbiAgICBAZHVwbGljYXRlOiAoZnJvbSwgY2IpIC0+IFxuXG4gICAgICAgIHNsYXNoLnVudXNlZCBmcm9tLCAodGFyZ2V0KSA9PiAgICAgICAgICBcbiAgICAgICAgICAgIEBjb3B5IGZyb20sIHRhcmdldCwgY2JcbiAgICBcbiAgICBAY29weTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cblxuICAgICAgICAjIGtsb2cgXCJjb3B5ICN7ZnJvbX0gI3t0b31cIlxuICAgICAgICBmcy5jb3B5IGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNvcHkgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgY2IgZnJvbSwgdG9cbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucmVtb3ZlTGluZVBvcyBmaWxlXG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICBcbiAgICBAd3JpdGU6IChmaWxlLCB0ZXh0LCBtb2RlLCBjYikgLT5cbiAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIHNsYXNoLndyaXRlVGV4dCBmaWxlLCB0ZXh0LCAoZG9uZSkgLT5cbiAgICAgICAgICAgIGlmIGVtcHR5IGRvbmVcbiAgICAgICAgICAgICAgICBjYiBcImNhbid0IHdyaXRlICN7ZmlsZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGwsIGRvbmVcbiAgICAgICAgIyBmcy53cml0ZUZpbGUgZmlsZSwgdGV4dCwgeyBlbmNvZGluZzogJ3V0ZjgnLCBtb2RlOiBtb2RlIH0sIChlcnIpIC0+XG4gICAgICAgICAgICAjIGlmIHZhbGlkIGVyciB0aGVuIGNiIGVyclxuICAgICAgICAgICAgIyBlbHNlIGNiIG51bGwsIGZpbGVcbiAgICBcbiAgICBAdW5sb2NrOiAoZmlsZSwgdGV4dCwgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBmcy5jaG1vZCBmaWxlLCAwbzY2NiwgKGVycikgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICAgICAgY2IgZXJyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIFxuICAgIEBwNGVkaXQ6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjaGlsZHAuZXhlYyBcInA0IGVkaXQgI3tzbGFzaC51bnNsYXNoKGZpbGUpfVwiLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgXG4gICAgQHNhdmU6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICBcbiAgICAgICAgc2xhc2gubG9nRXJyb3JzID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgc2xhc2guZmlsZUV4aXN0cyBmaWxlLCAoc3RhdCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc3RhdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNsYXNoLmlzV3JpdGFibGUgZmlsZSwgKHdyaXRhYmxlKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgd3JpdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCBzdGF0Lm1vZGUsIGNiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLnA0ZWRpdCBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgIFxuICAgIEBzcGFuOiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIGJhc2UgPSBzbGFzaC5iYXNlIHRleHRcbiAgICAgICAgZXh0ICA9IHNsYXNoLmV4dCh0ZXh0KS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGNsc3MgPSB2YWxpZChleHQpIGFuZCAnICcrZXh0IG9yICcnXG4gICAgICAgIFxuICAgICAgICBpZiBiYXNlLnN0YXJ0c1dpdGggJy4nIHRoZW4gY2xzcyArPSAnIGRvdGZpbGUnXG4gICAgICAgIFxuICAgICAgICBzcGFuID0gXCI8c3BhbiBjbGFzcz0ndGV4dCN7Y2xzc30nPlwiK2Jhc2UrXCI8L3NwYW4+XCJcbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIGV4dFxuICAgICAgICAgICAgc3BhbiArPSBcIjxzcGFuIGNsYXNzPSdleHQgcHVuY3Qje2Nsc3N9Jz4uPC9zcGFuPlwiICsgXCI8c3BhbiBjbGFzcz0nZXh0IHRleHQje2Nsc3N9Jz5cIitleHQrXCI8L3NwYW4+XCJcbiAgICAgICAgc3BhblxuICAgICAgICAgICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgc3BhbnMuam9pbiBcIjxzcGFuIGNsYXNzPSdwdW5jdCc+Lzwvc3Bhbj5cIlxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee