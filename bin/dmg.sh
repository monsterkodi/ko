#!/usr/bin/env bash
cd `dirname $0`/..

npm rebuild
rm ko.dmg

./node_modules/.bin/appdmg ./bin/dmg.json ko.dmg

open ko.dmg