#!/bin/bash


FOLDER=$1
FOLDER=$2

cd /home/ubuntu/covid-19/covid19-mlia-server/repos/$FOLDER
git config --local user.email "m.garcia@pangeanic.com"
git config --local user.name 'm.garcia'
git config --local user.password 'Pangeanic2020!'
git remote set-url origin https://m.garcia:Pangeanic2020!@$REPO
git add .
git commit -a -m "commit"
git push





