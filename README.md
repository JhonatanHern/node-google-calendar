#googlec-node
Node.js simple API for google calendar

###Note:

Make sure you have the latest node.js & npm versions in your computer. Older versions can crash the installation or the program itself.

###Installation:

- clone or download this repo
- go to the repo's folder
- write:

```

npm install
```

###Usage:

- write:

```

node index.js
```

- check 'localhost:6060'
- it will return an object like this:

```
{
	error : true,
	authUrl : example.google.com/path
}
```

- open a new tab with that url
- authorize the app
- you will get a code, use that code and go to:

```
localhost:6060?code=<INSERT_CODE_HERE>
```

- once this is done you can go to 'localhost:6060/events'
- you should get a list of the upcoming events
