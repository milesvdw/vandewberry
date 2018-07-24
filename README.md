This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Below you will find some information on how to perform common tasks.<br>
You can find the most recent version of this guide [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

## Table of Contents

- [Deploying to Production](#deploying-to-production)

## Deploying To Production

1. Merge master into dev:
git checkout master
git pull master
git checkout dev
git pull dev
git merge master
*** resolve conflicts ***
npm run build
git add *
git commit -m "ran build"
heroku git:remote -a project
git push heroku master