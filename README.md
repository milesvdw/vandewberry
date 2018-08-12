## Table of Contents

- [Deploying to Production](#deploying-to-production)
- [Running Locally](#running-locally)

## Deploying To Production

1. Merge master into prod:
git checkout master
git pull master
git checkout prod
git pull prod
git merge master
*** resolve conflicts ***
heroku git:remote -a project
git push heroku prod:master

## Running Locally
you'll need two command windows

in one, run:
npm run local-start

in the other, run:
heroku local web

One will start the create-react-app fanciness for local development of the client; the other will
start nodemon for local development of the server. In production, only the server is run and it
serves a statically generated build of the client. Locally, package.json defines a proxy for port 5001
that goes to the server, while all main requests are routed through the create-react-app system.