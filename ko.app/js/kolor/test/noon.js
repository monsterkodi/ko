var toExport = {}
var _k_

var rgs

import util from "./util.js"
let inc = util.inc
let ranges = util.ranges
let lang = util.lang

lang('noon')
toExport["noon"] = function ()
{
    rgs = ranges("    property  value")
    compare(inc(rgs,4,'property'),'property')
    compare(inc(rgs,14,'value'),'text')
    rgs = ranges("top",'noon')
    compare(inc(rgs,0,'top'),'obj')
    rgs = ranges("tip top")
    compare(inc(rgs,0,'tip'),'obj')
    compare(inc(rgs,4,'top'),'obj')
    rgs = ranges("top  prop")
    compare(inc(rgs,0,'top'),'obj')
    compare(inc(rgs,5,'prop'),'text')
    rgs = ranges("version  ^0.1.2")
    compare(inc(rgs,0,'version'),'obj')
    compare(inc(rgs,9,'^'),'punct semver')
    compare(inc(rgs,10,'0'),'semver')
    rgs = ranges("    some-package-name  1")
    compare(inc(rgs,4,'some'),'property')
    compare(inc(rgs,9,'package'),'property')
    compare(inc(rgs,17,'name'),'property')
    rgs = ranges("    some-package-name  ^1.2.3")
    compare(inc(rgs,4,'some'),'property')
    compare(inc(rgs,9,'package'),'property')
    compare(inc(rgs,17,'name'),'property')
    rgs = ranges("top  prop  value")
    compare(inc(rgs,0,'top'),'obj')
    compare(inc(rgs,5,'prop'),'property')
    compare(inc(rgs,11,'value'),'text')
    rgs = ranges("    http://domain.com")
    compare(inc(rgs,4,'http'),'url protocol')
    compare(inc(rgs,8,':'),'punct url')
    compare(inc(rgs,9,'/'),'punct url')
    compare(inc(rgs,10,'/'),'punct url')
    compare(inc(rgs,11,'domain'),'url domain')
    compare(inc(rgs,17,'.'),'punct url tld')
    compare(inc(rgs,18,'com'),'url tld')
    rgs = ranges("    http://domain.com/dir/page.html")
    compare(inc(rgs,4,'http'),'url protocol')
    compare(inc(rgs,8,':'),'punct url')
    compare(inc(rgs,9,'/'),'punct url')
    compare(inc(rgs,10,'/'),'punct url')
    compare(inc(rgs,11,'domain'),'url domain')
    compare(inc(rgs,17,'.'),'punct url tld')
    compare(inc(rgs,18,'com'),'url tld')
    compare(inc(rgs,21,'/'),'punct dir')
    rgs = ranges("    file.coffee")
    compare(inc(rgs,4,'file'),'coffee file')
    compare(inc(rgs,8,'.'),'punct coffee')
    compare(inc(rgs,9,'coffee'),'coffee ext')
    rgs = ranges("    /some/path")
    compare(inc(rgs,5,'some'),'text dir')
    compare(inc(rgs,9,'/'),'punct dir')
    compare(inc(rgs,10,'path'),'text file')
    rgs = ranges('    /some\\path/file.txt:10')
    compare(inc(rgs,4,'/'),'punct dir')
    compare(inc(rgs,5,'some'),'text dir')
    compare(inc(rgs,9,'\\'),'punct dir')
    compare(inc(rgs,19,'.'),'punct txt')
    compare(inc(rgs,23,':'),'punct')
    rgs = ranges("    test  ./node_modules/.bin/mocha")
    compare(inc(rgs,4,'test'),'property')
    compare(inc(rgs,10,'.'),'punct dir')
    compare(inc(rgs,11,'/'),'punct dir')
    compare(inc(rgs,12,'node_modules'),'text dir')
    compare(inc(rgs,24,'/'),'punct dir')
    compare(inc(rgs,25,'.'),'punct dir')
    compare(inc(rgs,26,'bin'),'text dir')
    compare(inc(rgs,29,'/'),'punct dir')
    compare(inc(rgs,30,'mocha'),'text file')
    section("comments", function ()
    {
        rgs = ranges("   # bla blub")
        compare(inc(rgs,3,"#"),'punct comment')
        compare(inc(rgs,5,"bla"),'comment')
        compare(inc(rgs,9,"blub"),'comment')
    })
}
toExport["noon"]._section_ = true
toExport._test_ = true
export default toExport
