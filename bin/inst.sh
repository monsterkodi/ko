#!/usr/bin/env bash
cd `dirname $0`/..

rm -rf /Applications/ko.app
cp -R ko-darwin-x64/ko.app /Applications

open /Applications/ko.app 
