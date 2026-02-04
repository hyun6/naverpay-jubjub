#!/bin/bash

if [ -z "$1" ]; then
    echo "사용법: ./run.sh <url>"
    exit 1
fi

cd "$(dirname "$0")"
npm start -- "$1"
