## Table of Contents


- [Development](#development-best-practices)
- [Deploying to Production](#deploying-to-production)
- [Running Locally](#running-locally)


## Development Best Practices
This is something of a passion project
of mine, but now folks are maybe taking
an interest, and we've got a few 
collaborators. So, with that in mind,
feel free to push minor modifications 
directly to master for now, using
your best judgement as to risk.
For larger changes or feature additions,
I request that you simply put up a PR
for a few days just so that folks
can see what's going in and 
get a handle on things.

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
