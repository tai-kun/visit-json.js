#!/usr/bin/env bash

set -e

function cleanup() {
    if [ -f tsconfig.build.json ]; then
        rm tsconfig.build.json
    fi
}

trap cleanup EXIT

if [ -d dist ]; then
    rm -rf dist
fi

node ./scripts/build.js
