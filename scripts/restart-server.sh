#! /bin/bash

clear

echo ""
echo "#######################"
echo "## OPAONE Restarting ##"
echo "#######################"
echo ""

SCRIPTS_PATH="/var2/opaone/scripts"

echo "SCRIPTS Path: $SCRIPTS_PATH"

$SCRIPTS_PATH/stop-server.sh
$SCRIPTS_PATH/start-server.sh