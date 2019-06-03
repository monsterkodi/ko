#!/usr/bin/env bash
cd `dirname $0`/..

APP=`sds -rp name`
VERSION=`sds -rp version`
VVERSION=v$VERSION
USER=`sds -rp author`
DMG=$APP-$VERSION.dmg

echo 'tag and push ...'
# git tag $VVERSION && git push --tags

echo 'creating release ...'
github-release release --user $USER --repo $APP --tag $VVERSION --name $VVERSION --pre-release

echo 'uploading dmg ...'
github-release upload  --user $USER --repo $APP --tag $VVERSION --name $DMG --file $DMG

