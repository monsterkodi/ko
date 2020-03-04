// koffee 1.11.0

/*
 0000000   0000000   000      000000000
000       000   000  000         000   
0000000   000000000  000         000   
     000  000   000  000         000   
0000000   000   000  0000000     000
 */
var _, font, noon, ref, salt;

ref = require('kxk'), noon = ref.noon, _ = ref._;

font = noon.parse("0   \n    | 000000 |\n    |000  000|\n    |00    00|\n    |000  000|\n    | 000000 |\n1   \n    |   000\n    | 00000\n    |000000\n    |   000\n    |   000\n2   \n    |00000 |\n    |   000|\n    |  000 |\n    | 000  |\n    |000000|\n3   \n    |000000 |\n    |    000|\n    |  0000 |\n    |    000|\n    |000000 |\n4   \n    |000  000\n    |000  000\n    |00000000\n    |     000\n    |     000\n5   \n    |0000000 |\n    |000     |\n    |0000000 |\n    |     000|\n    |0000000 |\n6   \n    |  000   |\n    | 000    |\n    |0000000 |\n    |000  000|\n    | 000000 |\n7   \n    |0000000|\n    |   000 |\n    |  000  |\n    | 000   |\n    |000    |\n8   \n    | 000000 |\n    |000  000|\n    |  0000  |\n    |000  000|\n    | 000000 |\n9   \n    | 000000 |\n    |000  000|\n    | 000000 |\n    |   000  |\n    |  000   |\n!   \n    |000|\n    |000|\n    |000|\n    |   |\n    |000|\n?   \n    |00000 |\n    |   000|\n    | 000  |\n    |      |\n    | 000  |\n-   \n    |      |\n    |      |\n    |000000|\n    |      |\n    |      |\n+   \n    |      |\n    |  00  |\n    |000000|\n    |  00  |\n    |      |\n_   \n    |      |\n    |      |\n    |      |\n    |      |\n    |000000|\n/   \n    |    000|\n    |   000 |\n    |  000  |\n    | 000   |\n    |000    |\n|000    |\n    | 000   |\n    |  000  |\n    |   000 |\n    |    000|    \n>   \n    |000    |\n    |  000  |\n    |    000|\n    |  000  |\n    |000    |\n<   \n    |    000|\n    |  000  |\n    |000    |\n    |  000  |\n    |    000|    \n^   \n    |  000  |\n    | 00 00 |\n    |00   00|\n    |       |\n    |       |    \n[\n    |00000|\n    |000  |\n    |000  |\n    |000  |\n    |00000|\n]   \n    |00000|\n    |  000|\n    |  000|\n    |  000|\n    |00000|    \n(\n    | 0000|\n    |000  |\n    |00   |\n    |000  |\n    | 0000|\n)   \n    |0000 |\n    |  000|\n    |   00|\n    |  000|\n    |0000 |    \n{\n    |  0000|\n    |  00  |\n    |000   |\n    |  00  |\n    |  0000|\n}   \n    |0000  |\n    |  00  |\n    |   000|\n    |  00  |\n    |0000  |    \n\"\n    |000  000|\n    |000  000|\n    |        |\n    |        |\n    |        |\n'\n    |000|\n    |000|\n    |   |\n    |   |\n    |   |\n|#|  \n    | 00  00 |\n    |00000000|\n    | 00  00 |\n    |00000000|\n    | 00  00 |\n*  \n    | 0 00 0 |\n    |00000000|\n    | 000000 |\n    |00000000|\n    | 0 00 0 |\n$  \n    | 000000 |\n    |00 00   |\n    |0000000 |\n    |   00 00|\n    | 000000 |\n@  \n    | 000000 |\n    |00000000|\n    |000  000|\n    |00000000|\n    | 000000 |\n:   \n    |000|\n    |000|\n    |   |\n    |000|\n    |000|\n;   \n    |000|\n    |000|\n    |   |\n    |000|\n    |  0|\n.   \n    |   |\n    |   |\n    |   |\n    |000|\n    |000|\n,   \n    |   |\n    |   |\n    |   |\n    |000|\n    |  0|\n| |  \n    |    |\n    |    |\n    |    |\n    |    |\n    |    |\na   \n    | 0000000 |\n    |000   000|\n    |000000000|\n    |000   000|\n    |000   000|\nb   \n    |0000000  |\n    |000   000|\n    |0000000  |\n    |000   000|\n    |0000000  |\nc   \n    | 0000000|\n    |000     |\n    |000     |\n    |000     |\n    | 0000000|\nd   \n    |0000000  |\n    |000   000|\n    |000   000|\n    |000   000|\n    |0000000  |\ne   \n    |00000000|\n    |000     |\n    |0000000 |\n    |000     |\n    |00000000|\nf   \n    |00000000|\n    |000     |\n    |000000  |\n    |000     |\n    |000     |\ng   \n    | 0000000 |\n    |000      |\n    |000  0000|\n    |000   000|\n    | 0000000 |\nh   \n    |000   000\n    |000   000\n    |000000000\n    |000   000\n    |000   000\ni   \n    |000\n    |000\n    |000\n    |000\n    |000\nj   \n    |      000|\n    |      000|\n    |      000|\n    |000   000|\n    | 0000000 |\nk   \n    |000   000|\n    |000  000 |\n    |0000000  |\n    |000  000 |\n    |000   000|\nl   \n    |000    |\n    |000    |\n    |000    |\n    |000    |\n    |0000000|\nm   \n    |00     00\n    |000   000\n    |000000000\n    |000 0 000\n    |000   000\nn   \n    |000   000\n    |0000  000\n    |000 0 000\n    |000  0000\n    |000   000\no   \n    | 0000000 |\n    |000   000|\n    |000   000|\n    |000   000|\n    | 0000000 |\np   \n    |00000000 |\n    |000   000|\n    |00000000 |\n    |000      |\n    |000      |\nq   \n    | 0000000 |\n    |000   000|\n    |000 00 00|\n    |000 0000 |\n    | 00000 00|\nr   \n    |00000000 |\n    |000   000|\n    |0000000  |\n    |000   000|\n    |000   000|\ns   \n    | 0000000|\n    |000     |\n    |0000000 |\n    |     000|\n    |0000000 |\nt   \n    |000000000|\n    |   000   |\n    |   000   |\n    |   000   |\n    |   000   |\nu   \n    |000   000|\n    |000   000|\n    |000   000|\n    |000   000|\n    | 0000000 |\nv   \n    |000   000|\n    |000   000|\n    | 000 000 |\n    |   000   |\n    |    0    |\nw   \n    |000   000\n    |000 0 000\n    |000000000\n    |000   000\n    |00     00\nx   \n    |000   000|\n    | 000 000 |\n    |  00000  |\n    | 000 000 |\n    |000   000|\ny   \n    |000   000|\n    | 000 000 |\n    |  00000  |\n    |   000   |\n    |   000   |\nz   \n    |0000000|\n    |   000 |\n    |  000  |\n    | 000   |\n    |0000000|");

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FsdC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvdG9vbHMiLCJzb3VyY2VzIjpbInNhbHQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQWMsT0FBQSxDQUFRLEtBQVIsQ0FBZCxFQUFFLGVBQUYsRUFBUTs7QUFFUixJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyx5K0pBQVg7O0FBNlhQLElBQUEsR0FBTyxTQUFDLElBQUQ7QUFFSCxRQUFBO0lBQUEsQ0FBQSxHQUFJLElBQUksQ0FBQyxXQUFMLENBQUEsQ0FBa0IsQ0FBQyxJQUFuQixDQUFBO0lBRUosRUFBQSxHQUFLO0FBQ0wsU0FBQSxtQ0FBQTs7UUFDSSxJQUFHLGVBQUg7WUFDSSxFQUFFLENBQUMsSUFBSCxDQUFRLElBQUssQ0FBQSxDQUFBLENBQWIsRUFESjs7QUFESjtJQUlBLEVBQUEsR0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQU4sQ0FBWSxJQUFaLEVBQWtCLEVBQWxCO0lBQ0wsRUFBQSxHQUFLLENBQUMsQ0FBQyxHQUFGLENBQU0sRUFBTixFQUFVLFNBQUMsQ0FBRDtlQUFPLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBUDtJQUFQLENBQVY7V0FFTCxFQUFFLENBQUMsSUFBSCxDQUFRLElBQVI7QUFaRzs7QUFjUCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgIDAwMCAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAgICBcbiMjI1xuXG57IG5vb24sIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuZm9udCA9IG5vb24ucGFyc2UgXCJcIlwiXG4wICAgXG4gICAgfCAwMDAwMDAgfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8MDAgICAgMDB8XG4gICAgfDAwMCAgMDAwfFxuICAgIHwgMDAwMDAwIHxcbjEgICBcbiAgICB8ICAgMDAwXG4gICAgfCAwMDAwMFxuICAgIHwwMDAwMDBcbiAgICB8ICAgMDAwXG4gICAgfCAgIDAwMFxuMiAgIFxuICAgIHwwMDAwMCB8XG4gICAgfCAgIDAwMHxcbiAgICB8ICAwMDAgfFxuICAgIHwgMDAwICB8XG4gICAgfDAwMDAwMHxcbjMgICBcbiAgICB8MDAwMDAwIHxcbiAgICB8ICAgIDAwMHxcbiAgICB8ICAwMDAwIHxcbiAgICB8ICAgIDAwMHxcbiAgICB8MDAwMDAwIHxcbjQgICBcbiAgICB8MDAwICAwMDBcbiAgICB8MDAwICAwMDBcbiAgICB8MDAwMDAwMDBcbiAgICB8ICAgICAwMDBcbiAgICB8ICAgICAwMDBcbjUgICBcbiAgICB8MDAwMDAwMCB8XG4gICAgfDAwMCAgICAgfFxuICAgIHwwMDAwMDAwIHxcbiAgICB8ICAgICAwMDB8XG4gICAgfDAwMDAwMDAgfFxuNiAgIFxuICAgIHwgIDAwMCAgIHxcbiAgICB8IDAwMCAgICB8XG4gICAgfDAwMDAwMDAgfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8IDAwMDAwMCB8XG43ICAgXG4gICAgfDAwMDAwMDB8XG4gICAgfCAgIDAwMCB8XG4gICAgfCAgMDAwICB8XG4gICAgfCAwMDAgICB8XG4gICAgfDAwMCAgICB8XG44ICAgXG4gICAgfCAwMDAwMDAgfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8ICAwMDAwICB8XG4gICAgfDAwMCAgMDAwfFxuICAgIHwgMDAwMDAwIHxcbjkgICBcbiAgICB8IDAwMDAwMCB8XG4gICAgfDAwMCAgMDAwfFxuICAgIHwgMDAwMDAwIHxcbiAgICB8ICAgMDAwICB8XG4gICAgfCAgMDAwICAgfFxuISAgIFxuICAgIHwwMDB8XG4gICAgfDAwMHxcbiAgICB8MDAwfFxuICAgIHwgICB8XG4gICAgfDAwMHxcbj8gICBcbiAgICB8MDAwMDAgfFxuICAgIHwgICAwMDB8XG4gICAgfCAwMDAgIHxcbiAgICB8ICAgICAgfFxuICAgIHwgMDAwICB8XG4tICAgXG4gICAgfCAgICAgIHxcbiAgICB8ICAgICAgfFxuICAgIHwwMDAwMDB8XG4gICAgfCAgICAgIHxcbiAgICB8ICAgICAgfFxuKyAgIFxuICAgIHwgICAgICB8XG4gICAgfCAgMDAgIHxcbiAgICB8MDAwMDAwfFxuICAgIHwgIDAwICB8XG4gICAgfCAgICAgIHxcbl8gICBcbiAgICB8ICAgICAgfFxuICAgIHwgICAgICB8XG4gICAgfCAgICAgIHxcbiAgICB8ICAgICAgfFxuICAgIHwwMDAwMDB8XG4vICAgXG4gICAgfCAgICAwMDB8XG4gICAgfCAgIDAwMCB8XG4gICAgfCAgMDAwICB8XG4gICAgfCAwMDAgICB8XG4gICAgfDAwMCAgICB8XG5cXCAgIFxuICAgIHwwMDAgICAgfFxuICAgIHwgMDAwICAgfFxuICAgIHwgIDAwMCAgfFxuICAgIHwgICAwMDAgfFxuICAgIHwgICAgMDAwfCAgICBcbj4gICBcbiAgICB8MDAwICAgIHxcbiAgICB8ICAwMDAgIHxcbiAgICB8ICAgIDAwMHxcbiAgICB8ICAwMDAgIHxcbiAgICB8MDAwICAgIHxcbjwgICBcbiAgICB8ICAgIDAwMHxcbiAgICB8ICAwMDAgIHxcbiAgICB8MDAwICAgIHxcbiAgICB8ICAwMDAgIHxcbiAgICB8ICAgIDAwMHwgICAgXG5eICAgXG4gICAgfCAgMDAwICB8XG4gICAgfCAwMCAwMCB8XG4gICAgfDAwICAgMDB8XG4gICAgfCAgICAgICB8XG4gICAgfCAgICAgICB8ICAgIFxuW1xuICAgIHwwMDAwMHxcbiAgICB8MDAwICB8XG4gICAgfDAwMCAgfFxuICAgIHwwMDAgIHxcbiAgICB8MDAwMDB8XG5dICAgXG4gICAgfDAwMDAwfFxuICAgIHwgIDAwMHxcbiAgICB8ICAwMDB8XG4gICAgfCAgMDAwfFxuICAgIHwwMDAwMHwgICAgXG4oXG4gICAgfCAwMDAwfFxuICAgIHwwMDAgIHxcbiAgICB8MDAgICB8XG4gICAgfDAwMCAgfFxuICAgIHwgMDAwMHxcbikgICBcbiAgICB8MDAwMCB8XG4gICAgfCAgMDAwfFxuICAgIHwgICAwMHxcbiAgICB8ICAwMDB8XG4gICAgfDAwMDAgfCAgICBcbntcbiAgICB8ICAwMDAwfFxuICAgIHwgIDAwICB8XG4gICAgfDAwMCAgIHxcbiAgICB8ICAwMCAgfFxuICAgIHwgIDAwMDB8XG59ICAgXG4gICAgfDAwMDAgIHxcbiAgICB8ICAwMCAgfFxuICAgIHwgICAwMDB8XG4gICAgfCAgMDAgIHxcbiAgICB8MDAwMCAgfCAgICBcblwiXG4gICAgfDAwMCAgMDAwfFxuICAgIHwwMDAgIDAwMHxcbiAgICB8ICAgICAgICB8XG4gICAgfCAgICAgICAgfFxuICAgIHwgICAgICAgIHxcbidcbiAgICB8MDAwfFxuICAgIHwwMDB8XG4gICAgfCAgIHxcbiAgICB8ICAgfFxuICAgIHwgICB8XG58I3wgIFxuICAgIHwgMDAgIDAwIHxcbiAgICB8MDAwMDAwMDB8XG4gICAgfCAwMCAgMDAgfFxuICAgIHwwMDAwMDAwMHxcbiAgICB8IDAwICAwMCB8XG4qICBcbiAgICB8IDAgMDAgMCB8XG4gICAgfDAwMDAwMDAwfFxuICAgIHwgMDAwMDAwIHxcbiAgICB8MDAwMDAwMDB8XG4gICAgfCAwIDAwIDAgfFxuJCAgXG4gICAgfCAwMDAwMDAgfFxuICAgIHwwMCAwMCAgIHxcbiAgICB8MDAwMDAwMCB8XG4gICAgfCAgIDAwIDAwfFxuICAgIHwgMDAwMDAwIHxcbkAgIFxuICAgIHwgMDAwMDAwIHxcbiAgICB8MDAwMDAwMDB8XG4gICAgfDAwMCAgMDAwfFxuICAgIHwwMDAwMDAwMHxcbiAgICB8IDAwMDAwMCB8XG46ICAgXG4gICAgfDAwMHxcbiAgICB8MDAwfFxuICAgIHwgICB8XG4gICAgfDAwMHxcbiAgICB8MDAwfFxuOyAgIFxuICAgIHwwMDB8XG4gICAgfDAwMHxcbiAgICB8ICAgfFxuICAgIHwwMDB8XG4gICAgfCAgMHxcbi4gICBcbiAgICB8ICAgfFxuICAgIHwgICB8XG4gICAgfCAgIHxcbiAgICB8MDAwfFxuICAgIHwwMDB8XG4sICAgXG4gICAgfCAgIHxcbiAgICB8ICAgfFxuICAgIHwgICB8XG4gICAgfDAwMHxcbiAgICB8ICAwfFxufCB8ICBcbiAgICB8ICAgIHxcbiAgICB8ICAgIHxcbiAgICB8ICAgIHxcbiAgICB8ICAgIHxcbiAgICB8ICAgIHxcbmEgICBcbiAgICB8IDAwMDAwMDAgfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMDAwMDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG5iICAgXG4gICAgfDAwMDAwMDAgIHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAwMDAwICB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwMDAwMCAgfFxuYyAgIFxuICAgIHwgMDAwMDAwMHxcbiAgICB8MDAwICAgICB8XG4gICAgfDAwMCAgICAgfFxuICAgIHwwMDAgICAgIHxcbiAgICB8IDAwMDAwMDB8XG5kICAgXG4gICAgfDAwMDAwMDAgIHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwMDAwMCAgfFxuZSAgIFxuICAgIHwwMDAwMDAwMHxcbiAgICB8MDAwICAgICB8XG4gICAgfDAwMDAwMDAgfFxuICAgIHwwMDAgICAgIHxcbiAgICB8MDAwMDAwMDB8XG5mICAgXG4gICAgfDAwMDAwMDAwfFxuICAgIHwwMDAgICAgIHxcbiAgICB8MDAwMDAwICB8XG4gICAgfDAwMCAgICAgfFxuICAgIHwwMDAgICAgIHxcbmcgICBcbiAgICB8IDAwMDAwMDAgfFxuICAgIHwwMDAgICAgICB8XG4gICAgfDAwMCAgMDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwgMDAwMDAwMCB8XG5oICAgXG4gICAgfDAwMCAgIDAwMFxuICAgIHwwMDAgICAwMDBcbiAgICB8MDAwMDAwMDAwXG4gICAgfDAwMCAgIDAwMFxuICAgIHwwMDAgICAwMDBcbmkgICBcbiAgICB8MDAwXG4gICAgfDAwMFxuICAgIHwwMDBcbiAgICB8MDAwXG4gICAgfDAwMFxuaiAgIFxuICAgIHwgICAgICAwMDB8XG4gICAgfCAgICAgIDAwMHxcbiAgICB8ICAgICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfCAwMDAwMDAwIHxcbmsgICBcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgIDAwMCB8XG4gICAgfDAwMDAwMDAgIHxcbiAgICB8MDAwICAwMDAgfFxuICAgIHwwMDAgICAwMDB8XG5sICAgXG4gICAgfDAwMCAgICB8XG4gICAgfDAwMCAgICB8XG4gICAgfDAwMCAgICB8XG4gICAgfDAwMCAgICB8XG4gICAgfDAwMDAwMDB8XG5tICAgXG4gICAgfDAwICAgICAwMFxuICAgIHwwMDAgICAwMDBcbiAgICB8MDAwMDAwMDAwXG4gICAgfDAwMCAwIDAwMFxuICAgIHwwMDAgICAwMDBcbm4gICBcbiAgICB8MDAwICAgMDAwXG4gICAgfDAwMDAgIDAwMFxuICAgIHwwMDAgMCAwMDBcbiAgICB8MDAwICAwMDAwXG4gICAgfDAwMCAgIDAwMFxubyAgIFxuICAgIHwgMDAwMDAwMCB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfCAwMDAwMDAwIHxcbnAgICBcbiAgICB8MDAwMDAwMDAgfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMDAwMDAwIHxcbiAgICB8MDAwICAgICAgfFxuICAgIHwwMDAgICAgICB8XG5xICAgXG4gICAgfCAwMDAwMDAwIHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgMDAgMDB8XG4gICAgfDAwMCAwMDAwIHxcbiAgICB8IDAwMDAwIDAwfFxuciAgIFxuICAgIHwwMDAwMDAwMCB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwMDAwMCAgfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbnMgICBcbiAgICB8IDAwMDAwMDB8XG4gICAgfDAwMCAgICAgfFxuICAgIHwwMDAwMDAwIHxcbiAgICB8ICAgICAwMDB8XG4gICAgfDAwMDAwMDAgfFxudCAgIFxuICAgIHwwMDAwMDAwMDB8XG4gICAgfCAgIDAwMCAgIHxcbiAgICB8ICAgMDAwICAgfFxuICAgIHwgICAwMDAgICB8XG4gICAgfCAgIDAwMCAgIHxcbnUgICBcbiAgICB8MDAwICAgMDAwfFxuICAgIHwwMDAgICAwMDB8XG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwgMDAwMDAwMCB8XG52ICAgXG4gICAgfDAwMCAgIDAwMHxcbiAgICB8MDAwICAgMDAwfFxuICAgIHwgMDAwIDAwMCB8XG4gICAgfCAgIDAwMCAgIHxcbiAgICB8ICAgIDAgICAgfFxudyAgIFxuICAgIHwwMDAgICAwMDBcbiAgICB8MDAwIDAgMDAwXG4gICAgfDAwMDAwMDAwMFxuICAgIHwwMDAgICAwMDBcbiAgICB8MDAgICAgIDAwXG54ICAgXG4gICAgfDAwMCAgIDAwMHxcbiAgICB8IDAwMCAwMDAgfFxuICAgIHwgIDAwMDAwICB8XG4gICAgfCAwMDAgMDAwIHxcbiAgICB8MDAwICAgMDAwfFxueSAgIFxuICAgIHwwMDAgICAwMDB8XG4gICAgfCAwMDAgMDAwIHxcbiAgICB8ICAwMDAwMCAgfFxuICAgIHwgICAwMDAgICB8XG4gICAgfCAgIDAwMCAgIHxcbnogICBcbiAgICB8MDAwMDAwMHxcbiAgICB8ICAgMDAwIHxcbiAgICB8ICAwMDAgIHxcbiAgICB8IDAwMCAgIHxcbiAgICB8MDAwMDAwMHxcblwiXCJcIlxuXG5zYWx0ID0gKHRleHQpIC0+XG4gICAgXG4gICAgcyA9IHRleHQudG9Mb3dlckNhc2UoKS50cmltKClcbiAgICBcbiAgICBjcyA9IFtdXG4gICAgZm9yIGMgaW4gc1xuICAgICAgICBpZiBmb250W2NdP1xuICAgICAgICAgICAgY3MucHVzaCBmb250W2NdXG5cbiAgICB6cyA9IF8uemlwLmFwcGx5IG51bGwsIGNzIFxuICAgIHJzID0gXy5tYXAoenMsIChqKSAtPiBqLmpvaW4oJyAgJykpXG4gICAgXG4gICAgcnMuam9pbiAnXFxuJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNhbHQiXX0=
//# sourceURL=../../coffee/tools/salt.coffee