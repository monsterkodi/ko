#  0000000   0000000     0000000   000   000  000000000
# 000   000  000   000  000   000  000   000     000   
# 000000000  0000000    000   000  000   000     000   
# 000   000  000   000  000   000  000   000     000   
# 000   000  0000000     0000000    0000000      000   

{$} = require './js/tools/tools'
pkg = require "#{__dirname}/package.json"

window.openRepoURL = () -> 
    url = pkg.repository.url
    url = url.slice 4 if url.startsWith("git+")
    url = url.slice 0, url.length-4 if url.endsWith(".git")
    require("opener")(url)

$('version').innerHTML = pkg.version