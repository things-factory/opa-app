#! /bin/bash

clear

echo ""
echo "###########################"
echo "## OPA APP Stopping ##"
echo "###########################"
echo ""

PROCESS_NAME="things-factory"

echo "Process Name: $PROCESS_NAME"

PID=`/bin/ps -ef | grep $PROCESS_NAME | grep -v grep | awk '{print $2}'`
#if [ -z "$PID"]; then
#	echo "empty pid"
#fi
#echo $PID

while [[ ! -z "$PID" ]]
do
	kill -TERM $PID
	PID=`/bin/ps -ef | grep $PROCESS_NAME | grep -v grep | awk '{print $2}'`
done

echo "Done!"