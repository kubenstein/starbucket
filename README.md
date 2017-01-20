Starbucket [![Build Status](https://travis-ci.org/kubenstein/starbucket.png?branch=master)](https://travis-ci.org/kubenstein/starbucket)
=============

Quickly create a dynamic, distributed and auto-syncing git server in a local network.


### Reasoning

Starbucket was created to reintroduce “distributed” aspect of the GIT source control system. With centralised codebases at Github, Bitbucket or any other custom configuration, it happens too often, that due to a platform unavailability, teams can't make ANY progress.


### Installation

```
npm install -g starbucket
```


### Usage

To start a starbucket node on your computer type:

```
starbucket
```

and then point your git remote to localhost. For example:

`git remote add starbucket http://localhost:7070/awesome-project`

Notice that we comunicate ONLY with a server on a localhost.


You can provide custom ports for both network (default: `7070`) and git server (default: `7000`), as well as temp Starbucket folder with repositories (default: `.tmp/repos`)

```
GIT_SERVER_PORT=9999 GATEWAY_PORT=8888 STORAGE_PATH=/tmp/starbucket/ starbucket
```


### Session Example:

```
$ starbucket


|
| Starting Starbucket...
| Configure your git remote as (we assume the repo name is "awesome-project"):
|   git remote add starbucket http://localhost:7070/awesome-project
|


[2017-01-15T14:12:23.187Z]  git - git server started at http://localhost:7000
[2017-01-15T14:12:23.670Z]  net - new node discovered: 172.20.10.4
[2017-01-15T14:12:23.671Z]  net - other node is a MASTER: 172.20.10.4
[2017-01-15T14:12:23.672Z] prxy - starting proxy server, entry address: http://localhost:7070 (pointing at: http://172.20.10.4:9999)
[2017-01-15T14:17:44.405Z]  net - update available for: awesome-project
[2017-01-15T14:17:44.500Z]  git - mirroring http://172.20.10.4:9999/awesome-project -> .tmp/repos/awesome-project.git/
```


### Technical Details

After a few tries I ended up with a following architecture:

Each node starts 3 services:

- Network Discovery - discovers nodes in a network and setups simple event-based communication.

- Git server - a local git server. If a node is a master, it will inform the  Network about any new changes, so other nodes can pull from this server. If a node is a slave, it will fetch to this server from currently chosen master server based on Network events.

- Proxy server - proxy server will proxy all traffic from localhost to currently chosen master. If a node is a master, proxy will proxy traffic back to same machine. Proxy will reconfigure itself automatically when a new master is announced.

In short we keep a master-slaves network architecture but with an ability to reconfigure node roles at any given time.


### License
MIT
