#! /bin/bash

clear

echo ""
echo "##################################"
echo "## OPA APP Upgrade & Restarting ##"
echo "##################################"
echo ""

APP_PATH="/var2/opaone/opa-app"
SCRIPTS_PATH="/var2/opaone/scripts"

echo "APP Path: $APP_PATH"
echo "SCRIPTS Path: $SCRIPTS_PATH"

cd $APP_PATH
git pull
rm -rf node_modules
yarn install
yarn upgrade
yarn build

$SCRIPTS_PATH/stop-server.sh
$SCRIPTS_PATH/start-server.sh