pivotal-to-zenhub
=================
[![npm downloads per month](https://img.shields.io/npm/dm/pivotal-to-zenhub.svg)](https://www.npmjs.com/package/pivotal-to-zenhub)
[![npm downloads total](https://img.shields.io/npm/dt/pivotal-to-zenhub.svg)](https://www.npmjs.com/package/pivotal-to-zenhub)
[![npm version](https://img.shields.io/npm/v/pivotal-to-zenhub.svg)](https://www.npmjs.com/package/pivotal-to-zenhub)
![license](https://img.shields.io/npm/l/pivotal-to-zenhub.svg)
[![Code Climate](https://codeclimate.com/github/yamadapc/pivotal-to-zenhub/badges/gpa.svg)](https://codeclimate.com/github/yamadapc/pivotal-to-zenhub)
- - -
Transfers issues from Pivotal to ZenHub.

## Installing
```
$ npm install -g pivotal-to-zenhub
```

## Interactive Usage
If required command-line flags are missing (see `pivotalToZenhub --help` for
the flags, you'll be prompted for the values - and we'll try our best to guess
them):
```
$ pivotalToZenhub
Github Token (load from ENV):
--> Using ************************************0123
GitHub repository (pivotalToZenhub):
--> Using pivotalToZenhub
GitHub user or organization (gaboesquivel):
--> Using gaboesquivel
Pivotal Project ID: 1234
Pivotal token (load from ENV):
--> Using ****************************0123
Fetching Pivotal tickets...
--> Fetching stories...
# Goes on with progress-bar and fancy stuff
```

## Usage
```
$ pivotalToZenhub --pivotal-token $PIVOTAL_API_TOKEN --github-token $GITHUB_API_TOKEN --github-user gaboesquivel --github-repo pivotal-to-zenhub --pivotal-id 1234 --zenhub-token $ZENHUB_API_TOKEN
```

## Features
- Imports Pivotal Tracker stories as Github issues
- Closes resolved stories
- Adds metadata to the issues (creator, created at, labels, etc.)
- Adds comments to the issues
- Adds tasks to the issues
- Adds estimates to the issues

## TO DO
- Update reference links in imported comments and descriptions
- Add dependency notes

## License
This code is published under the MIT license.

## Donations
Would you like to buy me a beer? Send bitcoin to 19f14qCCVk5JFEnfXdqUGMzRANzXCeTfR8

## Credits

This script is based on [yamadapc/pivotal-to-github](https://github.com/yamadapc/pivotal-to-github)
