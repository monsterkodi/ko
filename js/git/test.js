// koffee 1.4.0
var _, diff, expect, info, ref, ref1, root, rootDir, should, slash, status;

ref = require('kxk'), slash = ref.slash, _ = ref._;

ref1 = require('chai'), expect = ref1.expect, should = ref1.should;

root = require('./root');

diff = require('./diff');

info = require('./info');

status = require('./status');

rootDir = slash.dir(slash.dir(__dirname));

process.chdir(__dirname);

should();

describe('git', function() {
    describe('info', function() {
        it('info file', function() {
            return expect(info(rootDir)).to.include({
                gitDir: rootDir
            });
        });
        it('info dir', function() {
            return expect(info(__dirname)).to.include({
                gitDir: __dirname
            });
        });
        it('info /', function() {
            return expect(info('/')).to.be.empty;
        });
        it('info cb file', function(done) {
            return info(rootDir, function(r) {
                expect(r).to.include({
                    gitDir: rootDir
                });
                return done();
            });
        });
        it('info cb dir', function(done) {
            return info(__dirname, function(r) {
                expect(r).to.include({
                    gitDir: __dirname
                });
                return done();
            });
        });
        return it('info cb /', function(done) {
            return info('/', function(r) {
                expect(r).to.be.empty;
                return done();
            });
        });
    });
    describe('status', function() {
        it('status dir', function() {
            return expect(status(rootDir)).to.include({
                gitDir: rootDir
            });
        });
        it('status dir', function() {
            return expect(status(__dirname)).to.include({
                gitDir: __dirname
            });
        });
        it('status file', function() {
            return expect(status(__filename)).to.be.empty;
        });
        it('status /', function() {
            return expect(status('/')).to.be.empty;
        });
        it('status cb file', function(done) {
            return status(rootDir, function(r) {
                expect(r).to.include({
                    gitDir: rootDir
                });
                return done();
            });
        });
        it('status cb dir', function(done) {
            return status(__dirname, function(r) {
                expect(r).to.include({
                    gitDir: __dirname
                });
                return done();
            });
        });
        it('status cb /', function(done) {
            return status(__filename, function(r) {
                expect(r).to.be.empty;
                return done();
            });
        });
        return it('status cb /', function(done) {
            return status('/', function(r) {
                expect(r).to.be.empty;
                return done();
            });
        });
    });
    describe('root', function() {
        it('root .', function() {
            return expect(root('.')).to.eql(rootDir);
        });
        it('root ..', function() {
            return expect(root('..')).to.eql(rootDir);
        });
        it('root __filename', function() {
            return expect(root(__filename)).to.eql(rootDir);
        });
        it('root root', function() {
            return expect(root(rootDir)).to.eql(rootDir);
        });
        it('root invalid', function() {
            return expect(root(__filename + 'blark')).to.eql(rootDir);
        });
        it('root /', function() {
            return expect(root('/')).to.eql('');
        });
        it('root fantasy', function() {
            return expect(root('/blark/fasel')).to.eql('');
        });
        return it('root root/.git', function() {
            return expect(root(slash.join(rootDir, '.git'))).to.eql('');
        });
    });
    describe('root cb', function() {
        it('root cb .', function(done) {
            return root('.', function(r) {
                expect(r).to.eql(rootDir);
                return done();
            });
        });
        it('root cb ..', function(done) {
            return root('..', function(r) {
                expect(r).to.eql(rootDir);
                return done();
            });
        });
        it('root cb __filename', function(done) {
            return root(__filename, function(r) {
                expect(r).to.eql(rootDir);
                return done();
            });
        });
        it('root cb root', function(done) {
            return root(rootDir, function(r) {
                expect(r).to.eql(rootDir);
                return done();
            });
        });
        it('root cb invalid', function(done) {
            return root(slash.join(__dirname, 'blark'), function(r) {
                expect(r).to.eql(rootDir);
                return done();
            });
        });
        it('root cb /', function(done) {
            return root('/', function(r) {
                expect(r).to.eql('');
                return done();
            });
        });
        it('root cb fantasy', function(done) {
            return root('/blark/fasel', function(r) {
                expect(r).to.eql('');
                return done();
            });
        });
        return it('root cb root/.git', function(done) {
            return root(slash.join(rootDir, '.git'), function(r) {
                expect(r).to.eql('');
                return done();
            });
        });
    });
    return describe('diff', function() {
        it('diff sync', function() {
            return expect(diff(__filename)).to.include({
                file: slash.resolve(__filename)
            });
        });
        it('diff dir', function() {
            return expect(diff(__dirname)).to.eql({});
        });
        it('diff async', function(done) {
            return diff(__filename, function(r) {
                expect(r).to.include({
                    file: slash.resolve(__filename)
                });
                return done();
            });
        });
        return it('diff async dir', function(done) {
            return diff(__dirname, function(r) {
                expect(r).to.be.empty;
                return done();
            });
        });
    });
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUE7O0FBQUEsTUFBZSxPQUFBLENBQVEsS0FBUixDQUFmLEVBQUUsaUJBQUYsRUFBUzs7QUFDVCxPQUFxQixPQUFBLENBQVEsTUFBUixDQUFyQixFQUFFLG9CQUFGLEVBQVU7O0FBRVYsSUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBQ1QsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUVULE9BQUEsR0FBVSxLQUFLLENBQUMsR0FBTixDQUFVLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBVixDQUFWOztBQUNWLE9BQU8sQ0FBQyxLQUFSLENBQWMsU0FBZDs7QUFFQSxNQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFTLEtBQVQsRUFBZSxTQUFBO0lBRVgsUUFBQSxDQUFTLE1BQVQsRUFBZ0IsU0FBQTtRQUVaLEVBQUEsQ0FBRyxXQUFILEVBQWUsU0FBQTttQkFBSSxNQUFBLENBQU8sSUFBQSxDQUFLLE9BQUwsQ0FBUCxDQUFvQixDQUFDLEVBQUUsQ0FBQyxPQUF4QixDQUFnQztnQkFBQSxNQUFBLEVBQU8sT0FBUDthQUFoQztRQUFKLENBQWY7UUFDQSxFQUFBLENBQUcsVUFBSCxFQUFlLFNBQUE7bUJBQUksTUFBQSxDQUFPLElBQUEsQ0FBSyxTQUFMLENBQVAsQ0FBc0IsQ0FBQyxFQUFFLENBQUMsT0FBMUIsQ0FBa0M7Z0JBQUEsTUFBQSxFQUFPLFNBQVA7YUFBbEM7UUFBSixDQUFmO1FBQ0EsRUFBQSxDQUFHLFFBQUgsRUFBZSxTQUFBO21CQUFJLE1BQUEsQ0FBTyxJQUFBLENBQUssR0FBTCxDQUFQLENBQWdCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUEzQixDQUFmO1FBRUEsRUFBQSxDQUFHLGNBQUgsRUFBa0IsU0FB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RUFBQSxDQUFHLFVBQUgsRUFBc0IsU0FBQTttQkFBRyxNQUFBLENBQU8sSUFBQSxDQUFLLFNBQUwsQ0FBUCxDQUFzQixDQUFDLEVBQUUsQ0FBQyxHQUExQixDQUE4QixFQUE5QjtRQUFILENBQXRCO1FBQ0EsRUFBQSxDQUFHLFlBQUgsRUFBb0IsU0FBQyxJQUFEO21CQUFVLElBQUEsQ0FBSyxVQUFMLEVBQWlCLFNBQUMsQ0FBRDtnQkFBTyxNQUFBLENBQU8sQ0FBUCxDQUFTLENBQUMsRUFBRSxDQUFDLE9BQWIsQ0FBcUI7b0JBQUEsSUFBQSxFQUFLLEtBQUssQ0FBQyxPQUFOLENBQWMsVUFBZCxDQUFMO2lCQUFyQjt1QkFBdUQsSUFBQSxDQUFBO1lBQTlELENBQWpCO1FBQVYsQ0FBcEI7ZUFDQSxFQUFBLENBQUcsZ0JBQUgsRUFBb0IsU0FBQyxJQUFEO21CQUFVLElBQUEsQ0FBSyxTQUFMLEVBQWlCLFNBQUMsQ0FBRDtnQkFBTyxNQUFBLENBQU8sQ0FBUCxDQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQzt1QkFBUSxJQUFBLENBQUE7WUFBL0IsQ0FBakI7UUFBVixDQUFwQjtJQUxZLENBQWhCO0FBOUNXLENBQWYiLCJzb3VyY2VzQ29udGVudCI6WyJ7IHNsYXNoLCBfIH0gPSByZXF1aXJlICdreGsnXG57IGV4cGVjdCwgc2hvdWxkIH0gPSByZXF1aXJlICdjaGFpJ1xuXG5yb290ICAgPSByZXF1aXJlICcuL3Jvb3QnXG5kaWZmICAgPSByZXF1aXJlICcuL2RpZmYnXG5pbmZvICAgPSByZXF1aXJlICcuL2luZm8nXG5zdGF0dXMgPSByZXF1aXJlICcuL3N0YXR1cydcblxucm9vdERpciA9IHNsYXNoLmRpciBzbGFzaC5kaXIgX19kaXJuYW1lXG5wcm9jZXNzLmNoZGlyIF9fZGlybmFtZVxuXG5zaG91bGQoKVxuXG5kZXNjcmliZSAnZ2l0JyAtPlxuXG4gICAgZGVzY3JpYmUgJ2luZm8nIC0+XG4gICAgICAgIFxuICAgICAgICBpdCAnaW5mbyBmaWxlJyAtPiAgZXhwZWN0KGluZm8gcm9vdERpcikudG8uaW5jbHVkZSBnaXREaXI6cm9vdERpclxuICAgICAgICBpdCAnaW5mbyBkaXInICAtPiAgZXhwZWN0KGluZm8gX19kaXJuYW1lKS50by5pbmNsdWRlIGdpdERpcjpfX2Rpcm5hbWVcbiAgICAgICAgaXQgJ2luZm8gLycgICAgLT4gIGV4cGVjdChpbmZvICcvJykudG8uYmUuZW1wdHlcblxuICAgICAgICBpdCAnaW5mbyBjYiBmaWxlJyAoZG9uZSkgLT4gIGluZm8gcm9vdERpciwgICAocikgLT4gZXhwZWN0KHIpLnRvLmluY2x1ZGUgZ2l0RGlyOnJvb3REaXIgICA7IGRvbmUoKVxuICAgICAgICBpdCAnaW5mbyBjYiBkaXInICAoZG9uZSkgLT4gIGluZm8gX19kaXJuYW1lLCAocikgLT4gZXhwZWN0KHIpLnRvLmluY2x1ZGUgZ2l0RGlyOl9fZGlybmFtZSA7IGRvbmUoKVxuICAgICAgICBpdCAnaW5mbyBjYiAvJyAgICAoZG9uZSkgLT4gIGluZm8gJy8nICAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmJlLmVtcHR5ICAgICAgICAgICAgICAgICA7IGRvbmUoKVxuICAgIFxuICAgIGRlc2NyaWJlICdzdGF0dXMnIC0+XG4gICAgICAgIFxuICAgICAgICBpdCAnc3RhdHVzIGRpcicgIC0+ICBleHBlY3Qoc3RhdHVzIHJvb3REaXIpLnRvLmluY2x1ZGUgZ2l0RGlyOnJvb3REaXJcbiAgICAgICAgaXQgJ3N0YXR1cyBkaXInICAtPiAgZXhwZWN0KHN0YXR1cyBfX2Rpcm5hbWUpLnRvLmluY2x1ZGUgZ2l0RGlyOl9fZGlybmFtZVxuICAgICAgICBpdCAnc3RhdHVzIGZpbGUnIC0+ICBleHBlY3Qoc3RhdHVzIF9fZmlsZW5hbWUpLnRvLmJlLmVtcHR5XG4gICAgICAgIGl0ICdzdGF0dXMgLycgICAgLT4gIGV4cGVjdChzdGF0dXMgJy8nKS50by5iZS5lbXB0eVxuXG4gICAgICAgIGl0ICdzdGF0dXMgY2IgZmlsZScgKGRvbmUpIC0+ICBzdGF0dXMgcm9vdERpciwgICAgKHIpIC0+IGV4cGVjdChyKS50by5pbmNsdWRlIGdpdERpcjpyb290RGlyICAgOyBkb25lKClcbiAgICAgICAgaXQgJ3N0YXR1cyBjYiBkaXInICAoZG9uZSkgLT4gIHN0YXR1cyBfX2Rpcm5hbWUsICAocikgLT4gZXhwZWN0KHIpLnRvLmluY2x1ZGUgZ2l0RGlyOl9fZGlybmFtZSA7IGRvbmUoKVxuICAgICAgICBpdCAnc3RhdHVzIGNiIC8nICAgIChkb25lKSAtPiAgc3RhdHVzIF9fZmlsZW5hbWUsIChyKSAtPiBleHBlY3QocikudG8uYmUuZW1wdHkgICAgICAgICAgICAgICAgIDsgZG9uZSgpXG4gICAgICAgIGl0ICdzdGF0dXMgY2IgLycgICAgKGRvbmUpIC0+ICBzdGF0dXMgJy8nICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5iZS5lbXB0eSAgICAgICAgICAgICAgICAgOyBkb25lKClcbiAgICAgICAgXG4gICAgZGVzY3JpYmUgJ3Jvb3QnIC0+XG4gICAgICAgIFxuICAgICAgICBpdCAncm9vdCAuJyAgICAgICAgICAtPiBleHBlY3Qocm9vdCAnLicpICAgICAgICAgICAgICAgICAgICAgICAgLnRvLmVxbCByb290RGlyIFxuICAgICAgICBpdCAncm9vdCAuLicgICAgICAgICAtPiBleHBlY3Qocm9vdCAnLi4nKSAgICAgICAgICAgICAgICAgICAgICAgLnRvLmVxbCByb290RGlyIFxuICAgICAgICBpdCAncm9vdCBfX2ZpbGVuYW1lJyAtPiBleHBlY3Qocm9vdCBfX2ZpbGVuYW1lKSAgICAgICAgICAgICAgICAgLnRvLmVxbCByb290RGlyIFxuICAgICAgICBpdCAncm9vdCByb290JyAgICAgICAtPiBleHBlY3Qocm9vdCByb290RGlyKSAgICAgICAgICAgICAgICAgICAgLnRvLmVxbCByb290RGlyIFxuICAgICAgICBpdCAncm9vdCBpbnZhbGlkJyAgICAtPiBleHBlY3Qocm9vdCBfX2ZpbGVuYW1lICsgJ2JsYXJrJykgICAgICAgLnRvLmVxbCByb290RGlyIFxuICAgICAgICBpdCAncm9vdCAvJyAgICAgICAgICAtPiBleHBlY3Qocm9vdCAnLycpICAgICAgICAgICAgICAgICAgICAgICAgLnRvLmVxbCAnJyBcbiAgICAgICAgaXQgJ3Jvb3QgZmFudGFzeScgICAgLT4gZXhwZWN0KHJvb3QgJy9ibGFyay9mYXNlbCcpICAgICAgICAgICAgIC50by5lcWwgJydcbiAgICAgICAgaXQgJ3Jvb3Qgcm9vdC8uZ2l0JyAgLT4gZXhwZWN0KHJvb3Qgc2xhc2guam9pbiByb290RGlyLCAnLmdpdCcpIC50by5lcWwgJycgXG4gICAgICAgIFxuICAgIGRlc2NyaWJlICdyb290IGNiJyAtPiBcbiAgICAgICAgXG4gICAgICAgIGl0ICdyb290IGNiIC4nICAgICAgICAgIChkb25lKSAtPiByb290ICcuJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiAuLicgICAgICAgICAoZG9uZSkgLT4gcm9vdCAnLi4nICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyKSAtPiBleHBlY3QocikudG8uZXFsIHJvb3REaXIgOyBkb25lKClcbiAgICAgICAgaXQgJ3Jvb3QgY2IgX19maWxlbmFtZScgKGRvbmUpIC0+IHJvb3QgX19maWxlbmFtZSwgICAgICAgICAgICAgICAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmVxbCByb290RGlyIDsgZG9uZSgpXG4gICAgICAgIGl0ICdyb290IGNiIHJvb3QnICAgICAgIChkb25lKSAtPiByb290IHJvb3REaXIsICAgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiBpbnZhbGlkJyAgICAoZG9uZSkgLT4gcm9vdCBzbGFzaC5qb2luKF9fZGlybmFtZSwgJ2JsYXJrJyksIChyKSAtPiBleHBlY3QocikudG8uZXFsIHJvb3REaXIgOyBkb25lKClcbiAgICAgICAgaXQgJ3Jvb3QgY2IgLycgICAgICAgICAgKGRvbmUpIC0+IHJvb3QgJy8nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmVxbCAnJyAgICAgIDsgZG9uZSgpXG4gICAgICAgIGl0ICdyb290IGNiIGZhbnRhc3knICAgIChkb25lKSAtPiByb290ICcvYmxhcmsvZmFzZWwnICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgJycgICAgICA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiByb290Ly5naXQnICAoZG9uZSkgLT4gcm9vdCBzbGFzaC5qb2luKHJvb3REaXIsICcuZ2l0JyksICAgIChyKSAtPiBleHBlY3QocikudG8uZXFsICcnICAgICAgOyBkb25lKClcbiAgICAgICAgXG4gICAgZGVzY3JpYmUgJ2RpZmYnIC0+XG5cbiAgICAgICAgaXQgJ2RpZmYgc3luYycgICAgICAgIC0+IGV4cGVjdChkaWZmIF9fZmlsZW5hbWUpLnRvLmluY2x1ZGUgZmlsZTpzbGFzaC5yZXNvbHZlIF9fZmlsZW5hbWVcbiAgICAgICAgaXQgJ2RpZmYgZGlyJyAgICAgICAgIC0+IGV4cGVjdChkaWZmIF9fZGlybmFtZSkudG8uZXFsIHt9XG4gICAgICAgIGl0ICdkaWZmIGFzeW5jJyAgICAgKGRvbmUpIC0+IGRpZmYgX19maWxlbmFtZSwgKHIpIC0+IGV4cGVjdChyKS50by5pbmNsdWRlKGZpbGU6c2xhc2gucmVzb2x2ZShfX2ZpbGVuYW1lKSkgOyBkb25lKClcbiAgICAgICAgaXQgJ2RpZmYgYXN5bmMgZGlyJyAoZG9uZSkgLT4gZGlmZiBfX2Rpcm5hbWUsICAocikgLT4gZXhwZWN0KHIpLnRvLmJlLmVtcHR5IDsgZG9uZSgpXG4gICAgICAgIFxuICAgICAgICAiXX0=
//# sourceURL=../../coffee/git/test.coffee