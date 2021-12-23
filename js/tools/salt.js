// koffee 1.20.0

/*
 0000000   0000000   000      000000000
000       000   000  000         000   
0000000   000000000  000         000   
     000  000   000  000         000   
0000000   000   000  0000000     000
 */
var _, font, noon, ref, salt;

ref = require('kxk'), _ = ref._, noon = ref.noon;

font = noon.parse("0   \n    | 000000 |\n    |000  000|\n    |00    00|\n    |000  000|\n    | 000000 |\n1   \n    |   000\n    | 00000\n    |000000\n    |   000\n    |   000\n2   \n    |00000 |\n    |   000|\n    |  000 |\n    | 000  |\n    |000000|\n3   \n    |000000 |\n    |    000|\n    |  0000 |\n    |    000|\n    |000000 |\n4   \n    |000  000\n    |000  000\n    |00000000\n    |     000\n    |     000\n5   \n    |0000000 |\n    |000     |\n    |0000000 |\n    |     000|\n    |0000000 |\n6   \n    |  000   |\n    | 000    |\n    |0000000 |\n    |000  000|\n    | 000000 |\n7   \n    |0000000|\n    |   000 |\n    |  000  |\n    | 000   |\n    |000    |\n8   \n    | 000000 |\n    |000  000|\n    |  0000  |\n    |000  000|\n    | 000000 |\n9   \n    | 000000 |\n    |000  000|\n    | 000000 |\n    |   000  |\n    |  000   |\n!   \n    |000|\n    |000|\n    |000|\n    |   |\n    |000|\n?   \n    |00000 |\n    |   000|\n    | 000  |\n    |      |\n    | 000  |\n-   \n    |      |\n    |      |\n    |000000|\n    |      |\n    |      |\n+   \n    |      |\n    |  00  |\n    |000000|\n    |  00  |\n    |      |\n_   \n    |      |\n    |      |\n    |      |\n    |      |\n    |000000|\n=   \n    |      |\n    |000000|\n    |      |\n    |000000|\n    |      |\n/   \n    |    000|\n    |   000 |\n    |  000  |\n    | 000   |\n    |000    |\n|000    |\n    | 000   |\n    |  000  |\n    |   000 |\n    |    000|    \n>   \n    |000    |\n    |  000  |\n    |    000|\n    |  000  |\n    |000    |\n<   \n    |    000|\n    |  000  |\n    |000    |\n    |  000  |\n    |    000|    \n^   \n    |  000  |\n    | 00 00 |\n    |00   00|\n    |       |\n    |       |    \n[\n    |00000|\n    |000  |\n    |000  |\n    |000  |\n    |00000|\n]   \n    |00000|\n    |  000|\n    |  000|\n    |  000|\n    |00000|    \n(\n    | 0000|\n    |000  |\n    |00   |\n    |000  |\n    | 0000|\n)   \n    |0000 |\n    |  000|\n    |   00|\n    |  000|\n    |0000 |    \n{\n    |  0000|\n    |  00  |\n    |000   |\n    |  00  |\n    |  0000|\n}   \n    |0000  |\n    |  00  |\n    |   000|\n    |  00  |\n    |0000  |    \n\"\n    |000  000|\n    |000  000|\n    |        |\n    |        |\n    |        |\n'\n    |000|\n    |000|\n    |   |\n    |   |\n    |   |\n|#|  \n    | 00  00 |\n    |00000000|\n    | 00  00 |\n    |00000000|\n    | 00  00 |\n*  \n    | 0 00 0 |\n    |00000000|\n    | 000000 |\n    |00000000|\n    | 0 00 0 |\n$  \n    | 000000 |\n    |00 00   |\n    |0000000 |\n    |   00 00|\n    | 000000 |\n@  \n    | 000000 |\n    |00000000|\n    |000  000|\n    |00000000|\n    | 000000 |\n:   \n    |000|\n    |000|\n    |   |\n    |000|\n    |000|\n;   \n    |000|\n    |000|\n    |   |\n    |000|\n    |  0|\n.   \n    |   |\n    |   |\n    |   |\n    |000|\n    |000|\n,   \n    |   |\n    |   |\n    |   |\n    |000|\n    |  0|\n| |  \n    |    |\n    |    |\n    |    |\n    |    |\n    |    |\na   \n    | 0000000 |\n    |000   000|\n    |000000000|\n    |000   000|\n    |000   000|\nb   \n    |0000000  |\n    |000   000|\n    |0000000  |\n    |000   000|\n    |0000000  |\nc   \n    | 0000000|\n    |000     |\n    |000     |\n    |000     |\n    | 0000000|\nd   \n    |0000000  |\n    |000   000|\n    |000   000|\n    |000   000|\n    |0000000  |\ne   \n    |00000000|\n    |000     |\n    |0000000 |\n    |000     |\n    |00000000|\nf   \n    |00000000|\n    |000     |\n    |000000  |\n    |000     |\n    |000     |\ng   \n    | 0000000 |\n    |000      |\n    |000  0000|\n    |000   000|\n    | 0000000 |\nh   \n    |000   000\n    |000   000\n    |000000000\n    |000   000\n    |000   000\ni   \n    |000\n    |000\n    |000\n    |000\n    |000\nj   \n    |      000|\n    |      000|\n    |      000|\n    |000   000|\n    | 0000000 |\nk   \n    |000   000|\n    |000  000 |\n    |0000000  |\n    |000  000 |\n    |000   000|\nl   \n    |000    |\n    |000    |\n    |000    |\n    |000    |\n    |0000000|\nm   \n    |00     00\n    |000   000\n    |000000000\n    |000 0 000\n    |000   000\nn   \n    |000   000\n    |0000  000\n    |000 0 000\n    |000  0000\n    |000   000\no   \n    | 0000000 |\n    |000   000|\n    |000   000|\n    |000   000|\n    | 0000000 |\np   \n    |00000000 |\n    |000   000|\n    |00000000 |\n    |000      |\n    |000      |\nq   \n    | 0000000 |\n    |000   000|\n    |000 00 00|\n    |000 0000 |\n    | 00000 00|\nr   \n    |00000000 |\n    |000   000|\n    |0000000  |\n    |000   000|\n    |000   000|\ns   \n    | 0000000|\n    |000     |\n    |0000000 |\n    |     000|\n    |0000000 |\nt   \n    |000000000|\n    |   000   |\n    |   000   |\n    |   000   |\n    |   000   |\nu   \n    |000   000|\n    |000   000|\n    |000   000|\n    |000   000|\n    | 0000000 |\nv   \n    |000   000|\n    |000   000|\n    | 000 000 |\n    |   000   |\n    |    0    |\nw   \n    |000   000\n    |000 0 000\n    |000000000\n    |000   000\n    |00     00\nx   \n    |000   000|\n    | 000 000 |\n    |  00000  |\n    | 000 000 |\n    |000   000|\ny   \n    |000   000|\n    | 000 000 |\n    |  00000  |\n    |   000   |\n    |   000   |\nz   \n    |0000000|\n    |   000 |\n    |  000  |\n    | 000   |\n    |0000000|");

salt = function(text) {
    var c, cs, i, len, rs, s, zs;
    s = text.toLowerCase().trim();
    cs = [];
    for (i = 0, len = s.length; i < len; i++) {
        c = s[i];
        if (font[c] != null) {
            cs.push(font[c]);
        }
    }
    zs = _.zip.apply(null, cs);
    rs = _.map(zs, function(j) {
        return j.join('  ');
    });
    return rs.join('\n');
};

module.exports = salt;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FsdC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvdG9vbHMiLCJzb3VyY2VzIjpbInNhbHQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQWMsT0FBQSxDQUFRLEtBQVIsQ0FBZCxFQUFFLFNBQUYsRUFBSzs7QUFFTCxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxxaktBQVg7O0FBbVlQLElBQUEsR0FBTyxTQUFDLElBQUQ7QUFFSCxRQUFBO0lBQUEsQ0FBQSxHQUFJLElBQUksQ0FBQyxXQUFMLENBQUEsQ0FBa0IsQ0FBQyxJQUFuQixDQUFBO0lBRUosRUFBQSxHQUFLO0FBQ0wsU0FBQSxtQ0FBQTs7UUFDSSxJQUFHLGVBQUg7WUFDSSxFQUFFLENBQUMsSUFBSCxDQUFRLElBQUssQ0FBQSxDQUFBLENBQWIsRUFESjs7QUFESjtJQUlBLEVBQUEsR0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQU4sQ0FBWSxJQUFaLEVBQWtCLEVBQWxCO0lBQ0wsRUFBQSxHQUFLLENBQUMsQ0FBQyxHQUFGLENBQU0sRUFBTixFQUFVLFNBQUMsQ0FBRDtlQUFPLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBUDtJQUFQLENBQVY7V0FFTCxFQUFFLENBQUMsSUFBSCxDQUFRLElBQVI7QUFaRzs7QUFjUCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgIDAwMCAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAgICBcbiMjI1xuXG57IF8sIG5vb24gfSA9IHJlcXVpcmUgJ2t4aydcblxuZm9udCA9IG5vb24ucGFyc2UgXCJcIlwiXG4wICAgXG4gICAgfCAwMDAwMDAgfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8MDAgICAgMDB8XG4gICAgfDAwMCAgMDAwfFxuICAgIHwgMDAwMDAwIHxcbjEgICBcbiAgICB8ICAgMDAwXG4gICAgfCAwMDAwMFxuICAgIHwwMDAwMDBcbiAgICB8ICAgMDAwXG4gICAgfCAgIDAwMFxuMiAgIFxuICAgIHwwMDAwMCB8XG4gICAgfCAgIDAwMHxcbiAgICB8ICAwMDAgfFxuICAgIHwgMDAwICB8XG4gICAgfDAwMDAwMHxcbjMgICBcbiAgICB8MDAwMDAwIHxcbiAgICB8ICAgIDAwMHxcbiAgICB8ICAwMDAwIHxcbiAgICB8ICAgIDAwMHxcbiAgICB8MDAwMDAwIHxcbjQgICBcbiAgICB8MDAwICAwMDBcbiAgICB8MDAwICAwMDBcbiAgICB8MDAwMDAwMDBcbiAgICB8ICAgICAwMDBcbiAgICB8ICAgICAwMDBcbjUgICBcbiAgICB8MDAwMDAwMCB8XG4gICAgfDAwMCAgICAgfFxuICAgIHwwMDAwMDAwIHxcbiAgICB8ICAgICAwMDB8XG4gICAgfDAwMDAwMDAgfFxuNiAgIFxuICAgIHwgIDAwMCAgIHxcbiAgICB8IDAwMCAgICB8XG4gICAgfDAwMDAwMDAgfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8IDAwMDAwMCB8XG43ICAgXG4gICAgfDAwMDAwMDB8XG4gICAgfCAgIDAwMCB8XG4gICAgfCAgMDAwICB8XG4gICAgfCAwMDAgICB8XG4gICAgfDAwMCAgICB8XG44ICAgXG4gICAgfCAwMDAwMDAgfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8ICAwMDAwICB8XG4gICAgfDAwMCAgMDAwfFxuICAgIHwgMDAwMDAwIHxcbjkgICBcbiAgICB8IDAwMDAwMCB8XG4gICAgfDAwMCAgMDAwfFxuICAgIHwgMDAwMDAwIHxcbiAgICB8ICAgMDAwICB8XG4gICAgfCAgMDAwICAgfFxuISAgIFxuICAgIHwwMDB8XG4gICAgfDAwMHxcbiAgICB8MDAwfFxuICAgIHwgICB8XG4gICAgfDAwMHxcbj8gICBcbiAgICB8MDAwMDAgfFxuICAgIHwgICAwMDB8XG4gICAgfCAwMDAgIHxcbiAgICB8ICAgICAgfFxuICAgIHwgMDAwICB8XG4tICAgXG4gICAgfCAgICAgIHxcbiAgICB8ICAgICAgfFxuICAgIHwwMDAwMDB8XG4gICAgfCAgICAgIHxcbiAgICB8ICAgICAgfFxuKyAgIFxuICAgIHwgICAgICB8XG4gICAgfCAgMDAgIHxcbiAgICB8MDAwMDAwfFxuICAgIHwgIDAwICB8XG4gICAgfCAgICAgIHxcbl8gICBcbiAgICB8ICAgICAgfFxuICAgIHwgICAgICB8XG4gICAgfCAgICAgIHxcbiAgICB8ICAgICAgfFxuICAgIHwwMDAwMDB8XG49ICAgXG4gICAgfCAgICAgIHxcbiAgICB8MDAwMDAwfFxuICAgIHwgICAgICB8XG4gICAgfDAwMDAwMHxcbiAgICB8ICAgICAgfFxuLyAgIFxuICAgIHwgICAgMDAwfFxuICAgIHwgICAwMDAgfFxuICAgIHwgIDAwMCAgfFxuICAgIHwgMDAwICAgfFxuICAgIHwwMDAgICAgfFxuXFwgICBcbiAgICB8MDAwICAgIHxcbiAgICB8IDAwMCAgIHxcbiAgICB8ICAwMDAgIHxcbiAgICB8ICAgMDAwIHxcbiAgICB8ICAgIDAwMHwgICAgXG4+ICAgXG4gICAgfDAwMCAgICB8XG4gICAgfCAgMDAwICB8XG4gICAgfCAgICAwMDB8XG4gICAgfCAgMDAwICB8XG4gICAgfDAwMCAgICB8XG48ICAgXG4gICAgfCAgICAwMDB8XG4gICAgfCAgMDAwICB8XG4gICAgfDAwMCAgICB8XG4gICAgfCAgMDAwICB8XG4gICAgfCAgICAwMDB8ICAgIFxuXiAgIFxuICAgIHwgIDAwMCAgfFxuICAgIHwgMDAgMDAgfFxuICAgIHwwMCAgIDAwfFxuICAgIHwgICAgICAgfFxuICAgIHwgICAgICAgfCAgICBcbltcbiAgICB8MDAwMDB8XG4gICAgfDAwMCAgfFxuICAgIHwwMDAgIHxcbiAgICB8MDAwICB8XG4gICAgfDAwMDAwfFxuXSAgIFxuICAgIHwwMDAwMHxcbiAgICB8ICAwMDB8XG4gICAgfCAgMDAwfFxuICAgIHwgIDAwMHxcbiAgICB8MDAwMDB8ICAgIFxuKFxuICAgIHwgMDAwMHxcbiAgICB8MDAwICB8XG4gICAgfDAwICAgfFxuICAgIHwwMDAgIHxcbiAgICB8IDAwMDB8XG4pICAgXG4gICAgfDAwMDAgfFxuICAgIHwgIDAwMHxcbiAgICB8ICAgMDB8XG4gICAgfCAgMDAwfFxuICAgIHwwMDAwIHwgICAgXG57XG4gICAgfCAgMDAwMHxcbiAgICB8ICAwMCAgfFxuICAgIHwwMDAgICB8XG4gICAgfCAgMDAgIHxcbiAgICB8ICAwMDAwfFxufSAgIFxuICAgIHwwMDAwICB8XG4gICAgfCAgMDAgIHxcbiAgICB8ICAgMDAwfFxuICAgIHwgIDAwICB8XG4gICAgfDAwMDAgIHwgICAgXG5cIlxuICAgIHwwMDAgIDAwMHxcbiAgICB8MDAwICAwMDB8XG4gICAgfCAgICAgICAgfFxuICAgIHwgICAgICAgIHxcbiAgICB8ICAgICAgICB8XG4nXG4gICAgfDAwMHxcbiAgICB8MDAwfFxuICAgIHwgICB8XG4gICAgfCAgIHxcbiAgICB8ICAgfFxufCN8ICBcbiAgICB8IDAwICAwMCB8XG4gICAgfDAwMDAwMDAwfFxuICAgIHwgMDAgIDAwIHxcbiAgICB8MDAwMDAwMDB8XG4gICAgfCAwMCAgMDAgfFxuKiAgXG4gICAgfCAwIDAwIDAgfFxuICAgIHwwMDAwMDAwMHxcbiAgICB8IDAwMDAwMCB8XG4gICAgfDAwMDAwMDAwfFxuICAgIHwgMCAwMCAwIHxcbiQgIFxuICAgIHwgMDAwMDAwIHxcbiAgICB8MDAgMDAgICB8XG4gICAgfDAwMDAwMDAgfFxuICAgIHwgICAwMCAwMHxcbiAgICB8IDAwMDAwMCB8XG5AICBcbiAgICB8IDAwMDAwMCB8XG4gICAgfDAwMDAwMDAwfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8MDAwMDAwMDB8XG4gICAgfCAwMDAwMDAgfFxuOiAgIFxuICAgIHwwMDB8XG4gICAgfDAwMHxcbiAgICB8ICAgfFxuICAgIHwwMDB8XG4gICAgfDAwMHxcbjsgICBcbiAgICB8MDAwfFxuICAgIHwwMDB8XG4gICAgfCAgIHxcbiAgICB8MDAwfFxuICAgIHwgIDB8XG4uICAgXG4gICAgfCAgIHxcbiAgICB8ICAgfFxuICAgIHwgICB8XG4gICAgfDAwMHxcbiAgICB8MDAwfFxuLCAgIFxuICAgIHwgICB8XG4gICAgfCAgIHxcbiAgICB8ICAgfFxuICAgIHwwMDB8XG4gICAgfCAgMHxcbnwgfCAgXG4gICAgfCAgICB8XG4gICAgfCAgICB8XG4gICAgfCAgICB8XG4gICAgfCAgICB8XG4gICAgfCAgICB8XG5hICAgXG4gICAgfCAwMDAwMDAwIHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAwMDAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuYiAgIFxuICAgIHwwMDAwMDAwICB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwMDAwMCAgfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMDAwMDAgIHxcbmMgICBcbiAgICB8IDAwMDAwMDB8XG4gICAgfDAwMCAgICAgfFxuICAgIHwwMDAgICAgIHxcbiAgICB8MDAwICAgICB8XG4gICAgfCAwMDAwMDAwfFxuZCAgIFxuICAgIHwwMDAwMDAwICB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMDAwMDAgIHxcbmUgICBcbiAgICB8MDAwMDAwMDB8XG4gICAgfDAwMCAgICAgfFxuICAgIHwwMDAwMDAwIHxcbiAgICB8MDAwICAgICB8XG4gICAgfDAwMDAwMDAwfFxuZiAgIFxuICAgIHwwMDAwMDAwMHxcbiAgICB8MDAwICAgICB8XG4gICAgfDAwMDAwMCAgfFxuICAgIHwwMDAgICAgIHxcbiAgICB8MDAwICAgICB8XG5nICAgXG4gICAgfCAwMDAwMDAwIHxcbiAgICB8MDAwICAgICAgfFxuICAgIHwwMDAgIDAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8IDAwMDAwMDAgfFxuaCAgIFxuICAgIHwwMDAgICAwMDBcbiAgICB8MDAwICAgMDAwXG4gICAgfDAwMDAwMDAwMFxuICAgIHwwMDAgICAwMDBcbiAgICB8MDAwICAgMDAwXG5pICAgXG4gICAgfDAwMFxuICAgIHwwMDBcbiAgICB8MDAwXG4gICAgfDAwMFxuICAgIHwwMDBcbmogICBcbiAgICB8ICAgICAgMDAwfFxuICAgIHwgICAgICAwMDB8XG4gICAgfCAgICAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwgMDAwMDAwMCB8XG5rICAgXG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAwMDAgfFxuICAgIHwwMDAwMDAwICB8XG4gICAgfDAwMCAgMDAwIHxcbiAgICB8MDAwICAgMDAwfFxubCAgIFxuICAgIHwwMDAgICAgfFxuICAgIHwwMDAgICAgfFxuICAgIHwwMDAgICAgfFxuICAgIHwwMDAgICAgfFxuICAgIHwwMDAwMDAwfFxubSAgIFxuICAgIHwwMCAgICAgMDBcbiAgICB8MDAwICAgMDAwXG4gICAgfDAwMDAwMDAwMFxuICAgIHwwMDAgMCAwMDBcbiAgICB8MDAwICAgMDAwXG5uICAgXG4gICAgfDAwMCAgIDAwMFxuICAgIHwwMDAwICAwMDBcbiAgICB8MDAwIDAgMDAwXG4gICAgfDAwMCAgMDAwMFxuICAgIHwwMDAgICAwMDBcbm8gICBcbiAgICB8IDAwMDAwMDAgfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwgMDAwMDAwMCB8XG5wICAgXG4gICAgfDAwMDAwMDAwIHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAwMDAwMCB8XG4gICAgfDAwMCAgICAgIHxcbiAgICB8MDAwICAgICAgfFxucSAgIFxuICAgIHwgMDAwMDAwMCB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwIDAwIDAwfFxuICAgIHwwMDAgMDAwMCB8XG4gICAgfCAwMDAwMCAwMHxcbnIgICBcbiAgICB8MDAwMDAwMDAgfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMDAwMDAgIHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG5zICAgXG4gICAgfCAwMDAwMDAwfFxuICAgIHwwMDAgICAgIHxcbiAgICB8MDAwMDAwMCB8XG4gICAgfCAgICAgMDAwfFxuICAgIHwwMDAwMDAwIHxcbnQgICBcbiAgICB8MDAwMDAwMDAwfFxuICAgIHwgICAwMDAgICB8XG4gICAgfCAgIDAwMCAgIHxcbiAgICB8ICAgMDAwICAgfFxuICAgIHwgICAwMDAgICB8XG51ICAgXG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8IDAwMDAwMDAgfFxudiAgIFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8IDAwMCAwMDAgfFxuICAgIHwgICAwMDAgICB8XG4gICAgfCAgICAwICAgIHxcbncgICBcbiAgICB8MDAwICAgMDAwXG4gICAgfDAwMCAwIDAwMFxuICAgIHwwMDAwMDAwMDBcbiAgICB8MDAwICAgMDAwXG4gICAgfDAwICAgICAwMFxueCAgIFxuICAgIHwwMDAgICAwMDB8XG4gICAgfCAwMDAgMDAwIHxcbiAgICB8ICAwMDAwMCAgfFxuICAgIHwgMDAwIDAwMCB8XG4gICAgfDAwMCAgIDAwMHxcbnkgICBcbiAgICB8MDAwICAgMDAwfFxuICAgIHwgMDAwIDAwMCB8XG4gICAgfCAgMDAwMDAgIHxcbiAgICB8ICAgMDAwICAgfFxuICAgIHwgICAwMDAgICB8XG56ICAgXG4gICAgfDAwMDAwMDB8XG4gICAgfCAgIDAwMCB8XG4gICAgfCAgMDAwICB8XG4gICAgfCAwMDAgICB8XG4gICAgfDAwMDAwMDB8XG5cIlwiXCJcblxuc2FsdCA9ICh0ZXh0KSAtPlxuICAgIFxuICAgIHMgPSB0ZXh0LnRvTG93ZXJDYXNlKCkudHJpbSgpXG4gICAgXG4gICAgY3MgPSBbXVxuICAgIGZvciBjIGluIHNcbiAgICAgICAgaWYgZm9udFtjXT9cbiAgICAgICAgICAgIGNzLnB1c2ggZm9udFtjXVxuXG4gICAgenMgPSBfLnppcC5hcHBseSBudWxsLCBjcyBcbiAgICBycyA9IF8ubWFwKHpzLCAoaikgLT4gai5qb2luKCcgICcpKVxuICAgIFxuICAgIHJzLmpvaW4gJ1xcbidcblxubW9kdWxlLmV4cG9ydHMgPSBzYWx0Il19
//# sourceURL=../../coffee/tools/salt.coffee