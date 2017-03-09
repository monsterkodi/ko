#!/usr/bin/env bash
cd `dirname $0`/..

npm rebuild
rm -f ko-*.dmg

VERSION=`sds -rp version`

./node_modules/.bin/appdmg ./bin/dmg.json ko-$VERSION.dmg

open ko-$VERSION.dmg