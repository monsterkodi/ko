#!/usr/bin/env bash

DIR=`dirname $0`
BIN=$DIR/../node_modules/.bin
SDS=$BIN/sds
cd $DIR/..

APP=`$SDS -rp name`
VERSION=`$SDS version`
VVERSION=v$VERSION
USER=`$SDS author`
DMG=$APP-$VERSION.dmg

if $BIN/konrad --commit $VVERSION; then

    source ~/.tokens
    echo 'using token' $GH_TOKEN
    
    konrad -m
    ./bin/dmg.sh
    
    echo 'creating release ...'
    github-release release -s $GH_TOKEN --user $USER --repo $APP --tag $VVERSION-mac --name "$VVERSION macOS" --pre-release
    
    echo 'uploading dmg ...'
    github-release upload  -s $GH_TOKEN --user $USER --repo $APP --tag $VVERSION-mac --name $DMG --file $DMG
    
fi
