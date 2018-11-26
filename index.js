const fs = require('fs')
const url = require('url')

const express = require('express')
const {google} = require('googleapis')

let credentialsData = null
let token = null

const PORT = 6060
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
const TOKEN_PATH = 'token.json'

let client_secret, client_id, redirect_uris, oAuth2Client

const app = express()

fs.readFile('credentials.json', (err, content) => {
	if (err){
		console.log('Error loading client secret file:', err)
		process.exit()
	}
	credentialsData = JSON.parse(content)
	client_secret = credentialsData.installed.client_secret
	redirect_uris = credentialsData.installed.redirect_uris
	client_id = credentialsData.installed.client_id
	oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
	fs.readFile(TOKEN_PATH, (err, content) => {
		if (err){
			return
		}
		token = JSON.parse(content)
		oAuth2Client.setCredentials(token)
	})
})


//the next middleware function validates the existence of an access token
app.use(async (req, res, next) => {
	//first validate localhost
	if ( ![ '::1' , '127.0.0.1' ].includes( req.connection.remoteAddress ) ) {
		res.status( 403 )
		res.end( 'Status 403 Forbidden.' )
		return
	}
	res.setHeader('Content-Type', 'application/json')
	//code setting
	if (url.parse(req.url).pathname === '/setCode') {
		next()
		return
	}
	if (!token) {
		let result = await new Promise((succ,err)=>{
			fs.readFile(TOKEN_PATH, (err, readToken) => {
				if (err){
					const authUrl = oAuth2Client.generateAuthUrl({access_type: 'offline',scope: SCOPES})
					res.end(JSON.stringify({error:true,authUrl:authUrl}))
					succ(false)
					return
				}else{
					token = readToken
					oAuth2Client.setCredentials(token)
				}
				succ(true)
			})
		})
		if (!result) {
			return
		}
	}
	next()
})

app.get('/setCode', (req, res) => {
	const code = req.query.code
	oAuth2Client.getToken(code, (err, token) => {
		if (err){
			res.end('{"error":true,"message":"Error retrieving access token"}')
			return console.error('Error retrieving access token', err)
		}
		// Store the token to disk for later executions
		oAuth2Client.setCredentials(token)
		fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			if (err) console.error(err)
			console.log('Token stored to', TOKEN_PATH)
			res.end('{"error":false}')
		})
	})
})

app.get('/events',(req,res)=>{
	const calendar = google.calendar( { version: 'v3', auth : oAuth2Client } )
	calendar.events.list({
		calendarId: 'primary',
		timeMin: (new Date()).toISOString(),
		maxResults: Number( req.query.maxResults || '100'),
		singleEvents: true,
		orderBy: 'startTime',
	}, (err, googleResponse) => {
		if (err) {
			console.log('The API returned an error: ' + err)
			res.end(JSON.stringify({
				error:true,
				message:'The API returned an error: ' + err
			}))
			return
		}
		res.end(JSON.stringify(googleResponse.data.items))//return events
	})
})

app.listen(PORT, function () {
	console.log('Example app listening on port %d!',PORT)
})