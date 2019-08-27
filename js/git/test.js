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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUE7O0FBQUEsTUFBZSxPQUFBLENBQVEsS0FBUixDQUFmLEVBQUUsaUJBQUYsRUFBUzs7QUFDVCxPQUFxQixPQUFBLENBQVEsTUFBUixDQUFyQixFQUFFLG9CQUFGLEVBQVU7O0FBRVYsSUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBQ1QsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUVULE9BQUEsR0FBVSxLQUFLLENBQUMsR0FBTixDQUFVLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBVixDQUFWOztBQUNWLE9BQU8sQ0FBQyxLQUFSLENBQWMsU0FBZDs7QUFFQSxNQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFTLEtBQVQsRUFBZ0IsU0FBQTtJQUVaLFFBQUEsQ0FBUyxNQUFULEVBQWlCLFNBQUE7UUFFYixFQUFBLENBQUcsV0FBSCxFQUFnQixTQUFBO21CQUFJLE1BQUEsQ0FBTyxJQUFBLENBQUssT0FBTCxDQUFQLENBQW9CLENBQUMsRUFBRSxDQUFDLE9BQXhCLENBQWdDO2dCQUFBLE1BQUEsRUFBTyxPQUFQO2FBQWhDO1FBQUosQ0FBaEI7UUFDQSxFQUFBLENBQUcsVUFBSCxFQUFnQixTQUFBO21CQUFJLE1BQUEsQ0FBTyxJQUFBLENBQUssU0FBTCxDQUFQLENBQXNCLENBQUMsRUFBRSxDQUFDLE9BQTFCLENBQWtDO2dCQUFBLE1BQUEsRUFBTyxTQUFQO2FBQWxDO1FBQUosQ0FBaEI7UUFDQSxFQUFBLENBQUcsUUFBSCxFQUFnQixTQUFBO21CQUFJLE1BQUEsQ0FBTyxJQUFBLENBQUssR0FBTCxDQUFQLENBQWdCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUEzQixDQUFoQjtRQUVBLEVBQUEsQ0FBRyxjQUFILEVB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QXZCO1FBQ0EsRUFBQSxDQUFHLFVBQUgsRUFBdUIsU0FBQTttQkFBRyxNQUFBLENBQU8sSUFBQSxDQUFLLFNBQUwsQ0FBUCxDQUFzQixDQUFDLEVBQUUsQ0FBQyxHQUExQixDQUE4QixFQUE5QjtRQUFILENBQXZCO1FBQ0EsRUFBQSxDQUFHLFlBQUgsRUFBcUIsU0FBQyxJQUFEO21CQUFVLElBQUEsQ0FBSyxVQUFMLEVBQWlCLFNBQUMsQ0FBRDtnQkFBTyxNQUFBLENBQU8sQ0FBUCxDQUFTLENBQUMsRUFBRSxDQUFDLE9BQWIsQ0FBcUI7b0JBQUEsSUFBQSxFQUFLLEtBQUssQ0FBQyxPQUFOLENBQWMsVUFBZCxDQUFMO2lCQUFyQjt1QkFBdUQsSUFBQSxDQUFBO1lBQTlELENBQWpCO1FBQVYsQ0FBckI7ZUFDQSxFQUFBLENBQUcsZ0JBQUgsRUFBcUIsU0FBQyxJQUFEO21CQUFVLElBQUEsQ0FBSyxTQUFMLEVBQWlCLFNBQUMsQ0FBRDtnQkFBTyxNQUFBLENBQU8sQ0FBUCxDQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQzt1QkFBUSxJQUFBLENBQUE7WUFBL0IsQ0FBakI7UUFBVixDQUFyQjtJQUxhLENBQWpCO0FBOUNZLENBQWhCIiwic291cmNlc0NvbnRlbnQiOlsieyBzbGFzaCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xueyBleHBlY3QsIHNob3VsZCB9ID0gcmVxdWlyZSAnY2hhaSdcblxucm9vdCAgID0gcmVxdWlyZSAnLi9yb290J1xuZGlmZiAgID0gcmVxdWlyZSAnLi9kaWZmJ1xuaW5mbyAgID0gcmVxdWlyZSAnLi9pbmZvJ1xuc3RhdHVzID0gcmVxdWlyZSAnLi9zdGF0dXMnXG5cbnJvb3REaXIgPSBzbGFzaC5kaXIgc2xhc2guZGlyIF9fZGlybmFtZVxucHJvY2Vzcy5jaGRpciBfX2Rpcm5hbWVcblxuc2hvdWxkKClcblxuZGVzY3JpYmUgJ2dpdCcsIC0+XG5cbiAgICBkZXNjcmliZSAnaW5mbycsIC0+XG4gICAgICAgIFxuICAgICAgICBpdCAnaW5mbyBmaWxlJywgLT4gIGV4cGVjdChpbmZvIHJvb3REaXIpLnRvLmluY2x1ZGUgZ2l0RGlyOnJvb3REaXJcbiAgICAgICAgaXQgJ2luZm8gZGlyJywgIC0+ICBleHBlY3QoaW5mbyBfX2Rpcm5hbWUpLnRvLmluY2x1ZGUgZ2l0RGlyOl9fZGlybmFtZVxuICAgICAgICBpdCAnaW5mbyAvJywgICAgLT4gIGV4cGVjdChpbmZvICcvJykudG8uYmUuZW1wdHlcblxuICAgICAgICBpdCAnaW5mbyBjYiBmaWxlJywgKGRvbmUpIC0+ICBpbmZvIHJvb3REaXIsICAgKHIpIC0+IGV4cGVjdChyKS50by5pbmNsdWRlIGdpdERpcjpyb290RGlyICAgOyBkb25lKClcbiAgICAgICAgaXQgJ2luZm8gY2IgZGlyJywgIChkb25lKSAtPiAgaW5mbyBfX2Rpcm5hbWUsIChyKSAtPiBleHBlY3QocikudG8uaW5jbHVkZSBnaXREaXI6X19kaXJuYW1lIDsgZG9uZSgpXG4gICAgICAgIGl0ICdpbmZvIGNiIC8nLCAgICAoZG9uZSkgLT4gIGluZm8gJy8nLCAgICAgICAocikgLT4gZXhwZWN0KHIpLnRvLmJlLmVtcHR5ICAgICAgICAgICAgICAgICA7IGRvbmUoKVxuICAgIFxuICAgIGRlc2NyaWJlICdzdGF0dXMnLCAtPlxuICAgICAgICBcbiAgICAgICAgaXQgJ3N0YXR1cyBkaXInLCAgLT4gIGV4cGVjdChzdGF0dXMgcm9vdERpcikudG8uaW5jbHVkZSBnaXREaXI6cm9vdERpclxuICAgICAgICBpdCAnc3RhdHVzIGRpcicsICAtPiAgZXhwZWN0KHN0YXR1cyBfX2Rpcm5hbWUpLnRvLmluY2x1ZGUgZ2l0RGlyOl9fZGlybmFtZVxuICAgICAgICBpdCAnc3RhdHVzIGZpbGUnLCAtPiAgZXhwZWN0KHN0YXR1cyBfX2ZpbGVuYW1lKS50by5iZS5lbXB0eVxuICAgICAgICBpdCAnc3RhdHVzIC8nLCAgICAtPiAgZXhwZWN0KHN0YXR1cyAnLycpLnRvLmJlLmVtcHR5XG5cbiAgICAgICAgaXQgJ3N0YXR1cyBjYiBmaWxlJywgKGRvbmUpIC0+ICBzdGF0dXMgcm9vdERpciwgICAgKHIpIC0+IGV4cGVjdChyKS50by5pbmNsdWRlIGdpdERpcjpyb290RGlyICAgOyBkb25lKClcbiAgICAgICAgaXQgJ3N0YXR1cyBjYiBkaXInLCAgKGRvbmUpIC0+ICBzdGF0dXMgX19kaXJuYW1lLCAgKHIpIC0+IGV4cGVjdChyKS50by5pbmNsdWRlIGdpdERpcjpfX2Rpcm5hbWUgOyBkb25lKClcbiAgICAgICAgaXQgJ3N0YXR1cyBjYiAvJywgICAgKGRvbmUpIC0+ICBzdGF0dXMgX19maWxlbmFtZSwgKHIpIC0+IGV4cGVjdChyKS50by5iZS5lbXB0eSAgICAgICAgICAgICAgICAgOyBkb25lKClcbiAgICAgICAgaXQgJ3N0YXR1cyBjYiAvJywgICAgKGRvbmUpIC0+ICBzdGF0dXMgJy8nLCAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5iZS5lbXB0eSAgICAgICAgICAgICAgICAgOyBkb25lKClcbiAgICAgICAgXG4gICAgZGVzY3JpYmUgJ3Jvb3QnLCAtPlxuICAgICAgICBcbiAgICAgICAgaXQgJ3Jvb3QgLicsICAgICAgICAgIC0+IGV4cGVjdChyb290ICcuJykgICAgICAgICAgICAgICAgICAgICAgICAudG8uZXFsIHJvb3REaXIgXG4gICAgICAgIGl0ICdyb290IC4uJywgICAgICAgICAtPiBleHBlY3Qocm9vdCAnLi4nKSAgICAgICAgICAgICAgICAgICAgICAgLnRvLmVxbCByb290RGlyIFxuICAgICAgICBpdCAncm9vdCBfX2ZpbGVuYW1lJywgLT4gZXhwZWN0KHJvb3QgX19maWxlbmFtZSkgICAgICAgICAgICAgICAgIC50by5lcWwgcm9vdERpciBcbiAgICAgICAgaXQgJ3Jvb3Qgcm9vdCcsICAgICAgIC0+IGV4cGVjdChyb290IHJvb3REaXIpICAgICAgICAgICAgICAgICAgICAudG8uZXFsIHJvb3REaXIgXG4gICAgICAgIGl0ICdyb290IGludmFsaWQnLCAgICAtPiBleHBlY3Qocm9vdCBfX2ZpbGVuYW1lICsgJ2JsYXJrJykgICAgICAgLnRvLmVxbCByb290RGlyIFxuICAgICAgICBpdCAncm9vdCAvJywgICAgICAgICAgLT4gZXhwZWN0KHJvb3QgJy8nKSAgICAgICAgICAgICAgICAgICAgICAgIC50by5lcWwgJycgXG4gICAgICAgIGl0ICdyb290IGZhbnRhc3knLCAgICAtPiBleHBlY3Qocm9vdCAnL2JsYXJrL2Zhc2VsJykgICAgICAgICAgICAgLnRvLmVxbCAnJ1xuICAgICAgICBpdCAncm9vdCByb290Ly5naXQnLCAgLT4gZXhwZWN0KHJvb3Qgc2xhc2guam9pbiByb290RGlyLCAnLmdpdCcpIC50by5lcWwgJycgXG4gICAgICAgIFxuICAgIGRlc2NyaWJlICdyb290IGNiJywgLT4gXG4gICAgICAgIFxuICAgICAgICBpdCAncm9vdCBjYiAuJywgICAgICAgICAgKGRvbmUpIC0+IHJvb3QgJy4nLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiAuLicsICAgICAgICAgKGRvbmUpIC0+IHJvb3QgJy4uJywgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiBfX2ZpbGVuYW1lJywgKGRvbmUpIC0+IHJvb3QgX19maWxlbmFtZSwgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiByb290JywgICAgICAgKGRvbmUpIC0+IHJvb3Qgcm9vdERpciwgICAgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiBpbnZhbGlkJywgICAgKGRvbmUpIC0+IHJvb3Qgc2xhc2guam9pbihfX2Rpcm5hbWUsICdibGFyaycpLCAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgcm9vdERpciA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiAvJywgICAgICAgICAgKGRvbmUpIC0+IHJvb3QgJy8nLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgJycgICAgICA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiBmYW50YXN5JywgICAgKGRvbmUpIC0+IHJvb3QgJy9ibGFyay9mYXNlbCcsICAgICAgICAgICAgICAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgJycgICAgICA7IGRvbmUoKVxuICAgICAgICBpdCAncm9vdCBjYiByb290Ly5naXQnLCAgKGRvbmUpIC0+IHJvb3Qgc2xhc2guam9pbihyb290RGlyLCAnLmdpdCcpLCAgICAgKHIpIC0+IGV4cGVjdChyKS50by5lcWwgJycgICAgICA7IGRvbmUoKVxuICAgICAgICBcbiAgICBkZXNjcmliZSAnZGlmZicsIC0+XG5cbiAgICAgICAgaXQgJ2RpZmYgc3luYycsICAgICAgICAtPiBleHBlY3QoZGlmZiBfX2ZpbGVuYW1lKS50by5pbmNsdWRlIGZpbGU6c2xhc2gucmVzb2x2ZSBfX2ZpbGVuYW1lXG4gICAgICAgIGl0ICdkaWZmIGRpcicsICAgICAgICAgLT4gZXhwZWN0KGRpZmYgX19kaXJuYW1lKS50by5lcWwge31cbiAgICAgICAgaXQgJ2RpZmYgYXN5bmMnLCAgICAgKGRvbmUpIC0+IGRpZmYgX19maWxlbmFtZSwgKHIpIC0+IGV4cGVjdChyKS50by5pbmNsdWRlKGZpbGU6c2xhc2gucmVzb2x2ZShfX2ZpbGVuYW1lKSkgOyBkb25lKClcbiAgICAgICAgaXQgJ2RpZmYgYXN5bmMgZGlyJywgKGRvbmUpIC0+IGRpZmYgX19kaXJuYW1lLCAgKHIpIC0+IGV4cGVjdChyKS50by5iZS5lbXB0eSA7IGRvbmUoKVxuICAgICAgICBcbiAgICAgICAgIl19
//# sourceURL=../../coffee/git/test.coffee