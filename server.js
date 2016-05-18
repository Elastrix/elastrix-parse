/**
 * The Elastrix Parse Server
 * Copyright 2016 Elastrix, all rights reserved
 **/
var express = require('express'),
    ParseServer = require('parse-server').ParseServer,
    app = express();

var port = process.env.port || 1337;

var api = new ParseServer({
    databaseURI: 'mongodb://localhost:27017/dev',
    cloud: '/home/ubuntu/parse/cloud/main.js',
    appId: 'elastrix',
    masterKey: 'elastrix-parse',
    fileKey: 'optionalFileKey',
    serverURL: 'http://localhost:'+port+'/parse'
});

app.use('/parse', api);
app.listen(1337, function() {
    console.log('elastrix-parse running on port '+port+'.');
});
