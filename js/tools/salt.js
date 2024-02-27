// monsterkodi/kode 0.256.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var font, salt, _

_ = require('kxk')._
noon = require('kxk').noon

font = noon.parse(`0   
    | 000000 |
    |000  000|
    |00    00|
    |000  000|
    | 000000 |
1   
    |   000
    | 00000
    |000000
    |   000
    |   000
2   
    |00000 |
    |   000|
    |  000 |
    | 000  |
    |000000|
3   
    |000000 |
    |    000|
    |  0000 |
    |    000|
    |000000 |
4   
    |000  000
    |000  000
    |00000000
    |     000
    |     000
5   
    |0000000 |
    |000     |
    |0000000 |
    |     000|
    |0000000 |
6   
    |  000   |
    | 000    |
    |0000000 |
    |000  000|
    | 000000 |
7   
    |0000000|
    |   000 |
    |  000  |
    | 000   |
    |000    |
8   
    | 000000 |
    |000  000|
    |  0000  |
    |000  000|
    | 000000 |
9   
    | 000000 |
    |000  000|
    | 000000 |
    |   000  |
    |  000   |
!   
    |000|
    |000|
    |000|
    |   |
    |000|
?   
    |00000 |
    |   000|
    | 000  |
    |      |
    | 000  |
-   
    |      |
    |      |
    |000000|
    |      |
    |      |
+   
    |      |
    |  00  |
    |000000|
    |  00  |
    |      |
_   
    |      |
    |      |
    |      |
    |      |
    |000000|
=   
    |      |
    |000000|
    |      |
    |000000|
    |      |
/   
    |    000|
    |   000 |
    |  000  |
    | 000   |
    |000    |
\   
    |000    |
    | 000   |
    |  000  |
    |   000 |
    |    000|    
>   
    |000    |
    |  000  |
    |    000|
    |  000  |
    |000    |
<   
    |    000|
    |  000  |
    |000    |
    |  000  |
    |    000|    
^   
    |  000  |
    | 00 00 |
    |00   00|
    |       |
    |       |    
[
    |00000|
    |000  |
    |000  |
    |000  |
    |00000|
]   
    |00000|
    |  000|
    |  000|
    |  000|
    |00000|    
(
    | 0000|
    |000  |
    |00   |
    |000  |
    | 0000|
)   
    |0000 |
    |  000|
    |   00|
    |  000|
    |0000 |    
{
    |  0000|
    |  00  |
    |000   |
    |  00  |
    |  0000|
}   
    |0000  |
    |  00  |
    |   000|
    |  00  |
    |0000  |    
"
    |000  000|
    |000  000|
    |        |
    |        |
    |        |
'
    |000|
    |000|
    |   |
    |   |
    |   |
|#|  
    | 00  00 |
    |00000000|
    | 00  00 |
    |00000000|
    | 00  00 |
*  
    | 0 00 0 |
    |00000000|
    | 000000 |
    |00000000|
    | 0 00 0 |
$  
    | 000000 |
    |00 00   |
    |0000000 |
    |   00 00|
    | 000000 |
@  
    | 000000 |
    |00000000|
    |000  000|
    |00000000|
    | 000000 |
:   
    |000|
    |000|
    |   |
    |000|
    |000|
;   
    |000|
    |000|
    |   |
    |000|
    |  0|
.   
    |   |
    |   |
    |   |
    |000|
    |000|
,   
    |   |
    |   |
    |   |
    |000|
    |  0|
| |  
    |    |
    |    |
    |    |
    |    |
    |    |
a   
    | 0000000 |
    |000   000|
    |000000000|
    |000   000|
    |000   000|
b   
    |0000000  |
    |000   000|
    |0000000  |
    |000   000|
    |0000000  |
c   
    | 0000000|
    |000     |
    |000     |
    |000     |
    | 0000000|
d   
    |0000000  |
    |000   000|
    |000   000|
    |000   000|
    |0000000  |
e   
    |00000000|
    |000     |
    |0000000 |
    |000     |
    |00000000|
f   
    |00000000|
    |000     |
    |000000  |
    |000     |
    |000     |
g   
    | 0000000 |
    |000      |
    |000  0000|
    |000   000|
    | 0000000 |
h   
    |000   000
    |000   000
    |000000000
    |000   000
    |000   000
i   
    |000
    |000
    |000
    |000
    |000
j   
    |      000|
    |      000|
    |      000|
    |000   000|
    | 0000000 |
k   
    |000   000|
    |000  000 |
    |0000000  |
    |000  000 |
    |000   000|
l   
    |000    |
    |000    |
    |000    |
    |000    |
    |0000000|
m   
    |00     00
    |000   000
    |000000000
    |000 0 000
    |000   000
n   
    |000   000
    |0000  000
    |000 0 000
    |000  0000
    |000   000
o   
    | 0000000 |
    |000   000|
    |000   000|
    |000   000|
    | 0000000 |
p   
    |00000000 |
    |000   000|
    |00000000 |
    |000      |
    |000      |
q   
    | 0000000 |
    |000   000|
    |000 00 00|
    |000 0000 |
    | 00000 00|
r   
    |00000000 |
    |000   000|
    |0000000  |
    |000   000|
    |000   000|
s   
    | 0000000|
    |000     |
    |0000000 |
    |     000|
    |0000000 |
t   
    |000000000|
    |   000   |
    |   000   |
    |   000   |
    |   000   |
u   
    |000   000|
    |000   000|
    |000   000|
    |000   000|
    | 0000000 |
v   
    |000   000|
    |000   000|
    | 000 000 |
    |   000   |
    |    0    |
w   
    |000   000
    |000 0 000
    |000000000
    |000   000
    |00     00
x   
    |000   000|
    | 000 000 |
    |  00000  |
    | 000 000 |
    |000   000|
y   
    |000   000|
    | 000 000 |
    |  00000  |
    |   000   |
    |   000   |
z   
    |0000000|
    |   000 |
    |  000  |
    | 000   |
    |0000000|`)

salt = function (text)
{
    var c, cs, rs, s, zs

    s = text.toLowerCase().trim()
    cs = []
    var list = _k_.list(s)
    for (var _403_10_ = 0; _403_10_ < list.length; _403_10_++)
    {
        c = list[_403_10_]
        if ((font[c] != null))
        {
            cs.push(font[c])
        }
    }
    zs = _.zip.apply(null,cs)
    rs = _.map(zs,function (j)
    {
        return j.join('  ')
    })
    return rs.join('\n')
}
module.exports = salt