#!/bin/sh
set -x
RG_NAME=vandewberry
APP_NAME=vandewberry

npm i
zip -r package.zip . -x "*.git*" -x "*node_modules*"
az webapp stop --resource-group $RG_NAME --name $APP_NAME
az webapp deployment source config-zip --resource-group $RG_NAME --name $APP_NAME --src package.zip
az webapp start --resource-group $RG_NAME --name $APP_NAME
