var toExport = {}
var rgs

import util from "./util.js"
let ranges = util.ranges
let inc = util.inc
let lang = util.lang

lang('kode')
toExport["regex"] = function ()
{
    section("regexp", function ()
    {
        rgs = ranges("r=/a/")
        compare(inc(rgs,2,'/'),'punct regexp start')
        compare(inc(rgs,3,'a'),'text regexp')
        compare(inc(rgs,4,'/'),'punct regexp end')
        rgs = ranges("/(a|.*|\s\d\w\S\W$|^\s+)/")
        compare(inc(rgs,0,'/'),'punct regexp start')
        compare(inc(rgs,2,'a'),'text regexp')
        rgs = ranges("/^#include/")
        compare(inc(rgs,0,'/'),'punct regexp start')
        compare(inc(rgs,2,"#"),'punct regexp')
        compare(inc(rgs,3,"include"),'text regexp')
        rgs = ranges("/\\'hello\\'/ ")
        compare(inc(rgs,0,'/'),'punct regexp start')
        compare(inc(rgs,1,"\\"),'punct escape regexp')
        compare(inc(rgs,2,"'"),'punct regexp')
        compare(inc(rgs,3,"hello"),'text regexp')
        rgs = ranges("f a /b - c/gi")
        compare(inc(rgs,4,'/'),'punct regexp start')
        compare(inc(rgs,5,'b'),'text regexp')
        compare(inc(rgs,10,'/'),'punct regexp end')
        rgs = ranges("w=l.split /[\\s\\/]/ ; bla")
        compare(inc(rgs,10,'/'),'punct regexp start')
        compare(inc(rgs,14,'\\'),'punct escape regexp')
        compare(inc(rgs,17,'/'),'punct regexp end')
        compare(inc(rgs,19,';'),'punct minor')
        rgs = ranges("a = 1 / 2")
        compare(inc(rgs,6,'/'),'punct')
        compare(inc(rgs,8,'2'),'number')
        rgs = ranges("(1+1) / 2")
        compare(inc(rgs,6,'/'),'punct')
        compare(inc(rgs,8,'2'),'number')
        rgs = ranges("a[10] / 2")
        compare(inc(rgs,6,'/'),'punct')
        compare(inc(rgs,8,'2'),'number')
        rgs = ranges("if / aa /.test s")
        compare(inc(rgs,3,'/'),'punct regexp start')
        compare(inc(rgs,8,'/'),'punct regexp end')
        compare(inc(rgs,9,'.'),'punct property')
        compare(inc(rgs,10,'test'),'function call')
        compare(inc(rgs,15,'s'),'text')
        rgs = ranges("if / 😡 /.test s")
        compare(inc(rgs,3,'/'),'punct regexp start')
        compare(inc(rgs,8,'/'),'punct regexp end')
        compare(inc(rgs,9,'.'),'punct property')
        compare(inc(rgs,10,'test'),'function call')
        compare(inc(rgs,15,'s'),'text')
    })
    section("no regexp", function ()
    {
        rgs = ranges('a / b - c / d')
        compare(inc(rgs,2,'/'),'punct')
        rgs = ranges('f a/b, c/d')
        compare(inc(rgs,3,'/'),'punct')
        rgs = ranges("m = '/'")
        compare(inc(rgs,5,'/'),'string single')
        rgs = ranges("m a, '/''/'")
        compare(inc(rgs,6,'/'),'string single')
        rgs = ranges("s = '/some\\path/file.txt:12'")
        compare(inc(rgs,5,'/'),'string single')
        compare(inc(rgs,15,'/'),'string single')
        rgs = ranges("num /= 10")
        compare(inc(rgs,4,'/'),'punct')
        compare(inc(rgs,7,'10'),'number')
        rgs = ranges("4 / 2 / 1")
        compare(inc(rgs,2,'/'),'punct')
        compare(inc(rgs,6,'/'),'punct')
        rgs = ranges("4/2/1")
        compare(inc(rgs,1,'/'),'punct')
        compare(inc(rgs,3,'/'),'punct')
        rgs = ranges("4/ 2 / 1")
        compare(inc(rgs,1,'/'),'punct')
        compare(inc(rgs,5,'/'),'punct')
        rgs = ranges("4 /2 / 1")
        compare(inc(rgs,2,'/'),'punct')
        compare(inc(rgs,5,'/'),'punct')
        rgs = ranges("4 / 2/ 1")
        compare(inc(rgs,2,'/'),'punct')
        compare(inc(rgs,5,'/'),'punct')
        rgs = ranges("4 / 2 /1")
        compare(inc(rgs,2,'/'),'punct')
        compare(inc(rgs,6,'/'),'punct')
        rgs = ranges("4 /2/ 1")
        compare(inc(rgs,2,'/'),'punct')
        compare(inc(rgs,4,'/'),'punct')
    })
}
toExport["regex"]._section_ = true
toExport._test_ = true
export default toExport
