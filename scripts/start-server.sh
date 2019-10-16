#! /bin/bash

clear

echo ""
echo "###########################"
echo "## OPA APP Starting ##"
echo "###########################"
echo ""

APP_PATH="/var2/opaone/opa-app"

echo "APP Path: $APP_PATH"

cd $APP_PATH
nohup yarn serve > /dev/null 2> error.log &

echo "OPAONE started"