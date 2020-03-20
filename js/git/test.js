// koffee 1.12.0
var diff, expect, info, ref, root, rootDir, should, slash, status;

slash = require('kxk').slash;

ref = require('chai'), expect = ref.expect, should = ref.should;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZ2l0Iiwic291cmNlcyI6WyJ0ZXN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsSUFBQTs7QUFBRSxRQUFVLE9BQUEsQ0FBUSxLQUFSOztBQUNaLE1BQXFCLE9BQUEsQ0FBUSxNQUFSLENBQXJCLEVBQUUsbUJBQUYsRUFBVTs7QUFFVixJQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRVQsT0FBQSxHQUFVLEtBQUssQ0FBQyxHQUFOLENBQVUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFWLENBQVY7O0FBQ1YsT0FBTyxDQUFDLEtBQVIsQ0FBYyxTQUFkOztBQUVBLE1BQUEsQ0FBQTs7QUFFQSxRQUFBLENBQVMsS0FBVCxFQUFlLFNBQUE7SUFFWCxRQUFBLENBQVMsTUFBVCxFQUFnQixTQUFBO1FBRVosRUFBQSxDQUFHLFdBQUgsRUFBZSxTQUFBO21CQUFJLE1BQUEsQ0FBTyxJQUFBLENBQUssT0FBTCxDQUFQLENBQW9CLENBQUMsRUFBRSxDQUFDLE9BQXhCLENBQWdDO2dCQUFBLE1BQUEsRUFBTyxPQUFQO2FBQWhDO1FBQUosQ0FBZjtRQUNBLEVBQUEsQ0FBRyxVQUFILEVBQWUsU0FBQTttQkFBSSxNQUFBLENBQU8sSUFBQSxDQUFLLFNBQUwsQ0FBUCxDQUFzQixDQUFDLEVBQUUsQ0FBQyxPQUExQixDQUFrQztnQkFBQSxNQUFBLEVBQU8sU0FBUDthQUFsQztRQUFKLENBQWY7UUFDQSxFQUFBLENBQUcsUUFBSCxFQUFlLFNBQUE7bUJBQUksTUFBQSxDQUFPLElBQUEsQ0FBSyxHQUFMLENBQVAsQ0FBZ0IsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQTNCLENBQWY7UUFFQSxFQUFBLENBQUcsY0FBSCxFQUFr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UUFDQSxFQUFBLENBQUcsVUFBSCxFQUFzQixTQUFBO21CQUFHLE1BQUEsQ0FBTyxJQUFBLENBQUssU0FBTCxDQUFQLENBQXNCLENBQUMsRUFBRSxDQUFDLEdBQTFCLENBQThCLEVBQTlCO1FBQUgsQ0FBdEI7UUFDQSxFQUFBLENBQUcsWUFBSCxFQUFvQixTQUFDLElBQUQ7bUJBQVUsSUFBQSxDQUFLLFVBQUwsRUFBaUIsU0FBQyxDQUFEO2dCQUFPLE1BQUEsQ0FBTyxDQUFQLENBQVMsQ0FBQyxFQUFFLENBQUMsT0FBYixDQUFxQjtvQkFBQSxJQUFBLEVBQUssS0FBSyxDQUFDLE9BQU4sQ0FBYyxVQUFkLENBQUw7aUJBQXJCO3VCQUF1RCxJQUFBLENBQUE7WUFBOUQsQ0FBakI7UUFBVixDQUFwQjtlQUNBLEVBQUEsQ0FBRyxnQkFBSCxFQUFvQixTQUFDLElBQUQ7bUJBQVUsSUFBQSxDQUFLLFNBQUwsRUFBaUIsU0FBQyxDQUFEO2dCQUFPLE1BQUEsQ0FBTyxDQUFQLENBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO3VCQUFRLElBQUEsQ0FBQTtZQUEvQixDQUFqQjtRQUFWLENBQXBCO0lBTFksQ0FBaEI7QUE5Q1csQ0FBZiIsInNvdXJjZXNDb250ZW50IjpbInsgc2xhc2ggfSA9IHJlcXVpcmUgJ2t4aydcbnsgZXhwZWN0LCBzaG91bGQgfSA9IHJlcXVpcmUgJ2NoYWknXG5cbnJvb3QgICA9IHJlcXVpcmUgJy4vcm9vdCdcbmRpZmYgICA9IHJlcXVpcmUgJy4vZGlmZidcbmluZm8gICA9IHJlcXVpcmUgJy4vaW5mbydcbnN0YXR1cyA9IHJlcXVpcmUgJy4vc3RhdHVzJ1xuXG5yb290RGlyID0gc2xhc2guZGlyIHNsYXNoLmRpciBfX2Rpcm5hbWVcbnByb2Nlc3MuY2hkaXIgX19kaXJuYW1lXG5cbnNob3VsZCgpXG5cbmRlc2NyaWJlICdnaXQnIC0+XG5cbiAgICBkZXNjcmliZSAnaW5mbycgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ICdpbmZvIGZpbGUnIC0+ICBleHBlY3QoaW5mbyByb290RGlyKS50by5pbmNsdWRlIGdpdERpcjpyb290RGlyXG4gICAgICAgIGl0ICdpbmZvIGRpcicgIC0+ICBleHBlY3QoaW5mbyBfX2Rpcm5hbWUpLnRvLmluY2x1ZGUgZ2l0RGlyOl9fZGlybmFtZVxuICAgICAgICBpdCAnaW5mbyAvJyAgICAtPiAgZXhwZWN0KGluZm8gJy8nKS50by5iZS5lbXB0eVxuXG4gICAgICAgIGl0ICdpbmZvIGNiIGZpbGUnIChkb25lKSAtPiAgaW5mbyByb290RGlyLCAgIChyKSAtPiBleHBlY3QocikudG8uaW5jbHVkZSBnaXREaXI6cm9vdERpciAgIDsgZG9uZSgpXG4gICAgICAgIGl0ICdpbmZvIGNiIGRpcicgIChkb25lKSAtPiAgaW5mbyBfX2Rpcm5hbWUsIChyKSAtPiBleHBlY3QocikudG8uaW5jbHVkZSBnaXREaXI6X19kaXJuYW1lIDsgZG9uZSgpXG4gICAgICAgIGl0ICdpbmZvIGNiIC8nICAgIChkb25lKSAtPiAgaW5mbyAnLycgICAgICAgIChyKSAtPiBleHBlY3QocikudG8uYmUuZW1wdHkgICAgICAgICAgICAgICAgIDsgZG9uZSgpXG4gICAgXG4gICAgZGVzY3JpYmUgJ3N0YXR1cycgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ICdzdGF0dXMgZGlyJyAgLT4gIGV4cGVjdChzdGF0dXMgcm9vdERpcikudG8uaW5jbHVkZSBnaXREaXI6cm9vdERpclxuICAgICAgICBpdCAnc3RhdHVzIGRpcicgIC0+ICBleHBlY3Qoc3RhdHVzIF9fZGlybmFtZSkudG8uaW5jbHVkZSBnaXREaXI6X19kaXJuYW1lXG4gICAgICAgIGl0ICdzdGF0dXMgZmlsZScgLT4gIGV4cGVjdChzdGF0dXMgX19maWxlbmFtZSkudG8uYmUuZW1wdHlcbiAgICAgICAgaXQgJ3N0YXR1cyAvJyAgICAtPiAgZXhwZWN0KHN0YXR1cyAnLycpLnRvLmJlLmVtcHR5XG5cbiAgICAgICAgaXQgJ3N0YXR1cyBjYiBmaWxlJyAoZG9uZSkgLT4gIHN0YXR1cyByb290RGlyLCAgICAocikgLT4gZXhwZWN0KHIpLnRvLmluY2x1ZGUgZ2l0RGlyOnJvb3REaXIgICA7IGRvbmUoKVxuICAgICAgICBpdCAnc3RhdHVzIGNiIGRpcicgIChkb25lKSAtPiAgc3RhdHVzIF9fZGlybmFtZSwgIChyKSAtPiBleHBlY3QocikudG8uaW5jbHVkZSBnaXREaXI6X19kaXJuYW1lIDsgZG9uZSgpXG4gICAgICAgIGl0ICdzdGF0dXMgY2IgLycgICAgKGRvbmUpIC0+ICBzdGF0dXMgX19maWxlbmFtZSwgKHIpIC0+IGV4cGVjdChyKS50by5iZS5lbXB0eSAgICAgICAgICAgICAgICAgOyBkb25lKClcbiAgICAgICAgaXQgJ3N0YXR1cyBjYiAvJyAgICAoZG9uZSkgLT4gIHN0YXR1cyAnLycgICAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmJlLmVtcHR5ICAgICAgICAgICAgICAgICA7IGRvbmUoKVxuICAgICAgICBcbiAgICBkZXNjcmliZSAncm9vdCcgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ICdyb290IC4nICAgICAgICAgIC0+IGV4cGVjdChyb290ICcuJykgICAgICAgICAgICAgICAgICAgICAgICAudG8uZXFsIHJvb3REaXIgXG4gICAgICAgIGl0ICdyb290IC4uJyAgICAgICAgIC0+IGV4cGVjdChyb290ICcuLicpICAgICAgICAgICAgICAgICAgICAgICAudG8uZXFsIHJvb3REaXIgXG4gICAgICAgIGl0ICdyb290IF9fZmlsZW5hbWUnIC0+IGV4cGVjdChyb290IF9fZmlsZW5hbWUpICAgICAgICAgICAgICAgICAudG8uZXFsIHJvb3REaXIgXG4gICAgICAgIGl0ICdyb290IHJvb3QnICAgICAgIC0+IGV4cGVjdChyb290IHJvb3REaXIpICAgICAgICAgICAgICAgICAgICAudG8uZXFsIHJvb3REaXIgXG4gICAgICAgIGl0ICdyb290IGludmFsaWQnICAgIC0+IGV4cGVjdChyb290IF9fZmlsZW5hbWUgKyAnYmxhcmsnKSAgICAgICAudG8uZXFsIHJvb3REaXIgXG4gICAgICAgIGl0ICdyb290IC8nICAgICAgICAgIC0+IGV4cGVjdChyb290ICcvJykgICAgICAgICAgICAgICAgICAgICAgICAudG8uZXFsICcnIFxuICAgICAgICBpdCAncm9vdCBmYW50YXN5JyAgICAtPiBleHBlY3Qocm9vdCAnL2JsYXJrL2Zhc2VsJykgICAgICAgICAgICAgLnRvLmVxbCAnJ1xuICAgICAgICBpdCAncm9vdCByb290Ly5naXQnICAtPiBleHBlY3Qocm9vdCBzbGFzaC5qb2luIHJvb3REaXIsICcuZ2l0JykgLnRvLmVxbCAnJyBcbiAgICAgICAgXG4gICAgZGVzY3JpYmUgJ3Jvb3QgY2InIC0+IFxuICAgICAgICBcbiAgICAgICAgaXQgJ3Jvb3QgY2IgLicgICAgICAgICAgKGRvbmUpIC0+IHJvb3QgJy4nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmVxbCByb290RGlyIDsgZG9uZSgpXG4gICAgICAgIGl0ICdyb290IGNiIC4uJyAgICAgICAgIChkb25lKSAtPiByb290ICcuLicgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiBfX2ZpbGVuYW1lJyAoZG9uZSkgLT4gcm9vdCBfX2ZpbGVuYW1lLCAgICAgICAgICAgICAgICAgICAgIChyKSAtPiBleHBlY3QocikudG8uZXFsIHJvb3REaXIgOyBkb25lKClcbiAgICAgICAgaXQgJ3Jvb3QgY2Igcm9vdCcgICAgICAgKGRvbmUpIC0+IHJvb3Qgcm9vdERpciwgICAgICAgICAgICAgICAgICAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmVxbCByb290RGlyIDsgZG9uZSgpXG4gICAgICAgIGl0ICdyb290IGNiIGludmFsaWQnICAgIChkb25lKSAtPiByb290IHNsYXNoLmpvaW4oX19kaXJuYW1lLCAnYmxhcmsnKSwgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiAvJyAgICAgICAgICAoZG9uZSkgLT4gcm9vdCAnLycgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyKSAtPiBleHBlY3QocikudG8uZXFsICcnICAgICAgOyBkb25lKClcbiAgICAgICAgaXQgJ3Jvb3QgY2IgZmFudGFzeScgICAgKGRvbmUpIC0+IHJvb3QgJy9ibGFyay9mYXNlbCcgICAgICAgICAgICAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmVxbCAnJyAgICAgIDsgZG9uZSgpXG4gICAgICAgIGl0ICdyb290IGNiIHJvb3QvLmdpdCcgIChkb25lKSAtPiByb290IHNsYXNoLmpvaW4ocm9vdERpciwgJy5naXQnKSwgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgJycgICAgICA7IGRvbmUoKVxuICAgICAgICBcbiAgICBkZXNjcmliZSAnZGlmZicgLT5cblxuICAgICAgICBpdCAnZGlmZiBzeW5jJyAgICAgICAgLT4gZXhwZWN0KGRpZmYgX19maWxlbmFtZSkudG8uaW5jbHVkZSBmaWxlOnNsYXNoLnJlc29sdmUgX19maWxlbmFtZVxuICAgICAgICBpdCAnZGlmZiBkaXInICAgICAgICAgLT4gZXhwZWN0KGRpZmYgX19kaXJuYW1lKS50by5lcWwge31cbiAgICAgICAgaXQgJ2RpZmYgYXN5bmMnICAgICAoZG9uZSkgLT4gZGlmZiBfX2ZpbGVuYW1lLCAocikgLT4gZXhwZWN0KHIpLnRvLmluY2x1ZGUoZmlsZTpzbGFzaC5yZXNvbHZlKF9fZmlsZW5hbWUpKSA7IGRvbmUoKVxuICAgICAgICBpdCAnZGlmZiBhc3luYyBkaXInIChkb25lKSAtPiBkaWZmIF9fZGlybmFtZSwgIChyKSAtPiBleHBlY3QocikudG8uYmUuZW1wdHkgOyBkb25lKClcbiAgICAgICAgXG4gICAgICAgICJdfQ==
//# sourceURL=../../coffee/git/test.coffee