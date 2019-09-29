#!/bin/bash
source /environment
cd /appcivist-pb-client/app
if [ -e env.js ]
then
    echo "Using existing env.js"
else
    echo "Using sample env.sample.js"
    cp env.test.js env.js
fi

sed -i -e "s/SENTRY_SECRET/$SENTRY_SECRET/g" env.js
sed -i -e "s/SENTRY_PROJECT_ID/$SENTRY_PROJECT_ID/g" env.js

cd /appcivist-pb-client
bower install --allow-root
npm install
grunt build
cp -rf dist/* /var/www/html/appcivist-pb


