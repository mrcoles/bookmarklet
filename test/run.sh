#!/usr/bin/env bash

set -e

mkdir -p test/actual/

EXIT_STATUS=0

for f in `ls test/bookmarklets/*.bookmarklet.js`; do
    filename=$(basename "$f")
    actual="test/actual/$filename"
    expected="test/expected/$filename"
    ./bin/cli.js "$f" "$actual"
    diff "$expected" "$actual"
    status=$?
    if [ $? = 0 ]; then
        printf "\033[0;32m✓ \033[0mPASSED ${filename}\n";
    else
        printf "\033[0;31m✗ \033[0mFAILED ${filename}"
        EXIT_STATUS=1
    fi
done

exit $EXIT_STATUS
