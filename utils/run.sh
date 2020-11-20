#!/bin/bash


FOLDER=$1

cd /home/ubuntu/covid-19/covid19-mlia-server/repos/$FOLDER
git add .
git commit -a -m "commit" (do not need commit message either)
git push


