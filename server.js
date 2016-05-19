/**
 * The Elastrix Parse Server
 * Copyright 2016 Elastrix, all rights reserved
 **/
var express = require('express'),
    ParseServer = require('parse-server').ParseServer,
    ParseDashboard = require('parse-dashboard'),
    app = express();

/**
 * Edit these values to match your configuration
 * then run sudo service parse restart on your
 * elastrix parse server
 */
var port = process.env.port || 1337,
    appId = 'elastrix',
    appName = 'elastrix-parse',
    masterKey = 'elastrix-parse',
    fileKey = 'optionalFileKey',
    serverURL = 'http://localhost:'+port+'/parse',
    mongoURL = 'mongodb://localhost:27017/dev',
    cloud = '/home/ubuntu/parse/cloud/main.js',
    allowInsecureHTTP = 1;  
/**
 * The API server just uses the values from above,
 * you shouldn't need to modify this
 */ 
var api = new ParseServer({
    databaseURI: mongoURL,
    cloud: cloud,
    appId: appId,
    masterKey: masterKey,
    fileKey: fileKey,
    serverURL: serverURL
});

/** 
 * You can add more apps here if you want to
 * support more apps on your server. This uses
 * the same configuration values from above
 */
var dashboard = new ParseDashboard({
    apps: [
        {
	  serverURL: serverURL,
	  appId: appId,
	  masterKey: masterKey,
	  appName: appName
	}
    ]
});

app.use('/parse', api);
app.use('/dashboard',dashboard);
var httpServer = require('http').createServer(app);
httpServer.listen(port);
