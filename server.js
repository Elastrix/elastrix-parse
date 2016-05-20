/**
 * The Elastrix Parse Server
 * Copyright 2016 Elastrix, all rights reserved
 **/
require('shelljs/global');
var instanceId = exec('ec2metadata --instance-id',{silent:true}).stdout;
var ip = exec('ec2metadata --public-ipv4',{silent:true}).stdout;
var host = exec('ec2metadata --public-hostname',{silent:true}).stdout;
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    ParseServer = require('parse-server').ParseServer,
    ParseDashboard = require('parse-dashboard'),
    app = express(),
    options = {},
    certsPath = path.join(__dirname, 'certs', 'server'),
    caCertsPath = path.join(__dirname, 'certs', 'ca');


var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
    databaseUri = "mongodb://localhost:27017/dev";
}

/**
 * Edit these values to match your configuration
 * then run sudo service parse restart on your
 * elastrix parse server
 */
var port = process.env.port || 1337,
    appId = process.env.APP_ID || 'elastrix',
    appName = process.env.APP_NAME || 'elastrix',
    masterKey = process.env.MASTER_KEY || 'elastrix',
    fileKey = process.env.FILE_KEY || '',
    serverURL = process.env.SERVER_URL || 'https://'+ip+':'+port+'/parse',
    mongoURL = databaseUri,
    cloud = process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    allowInsecureHTTP = process.env.ALLOW_INSECURE_HTTP || 0;  

/**
 * This is the basic authentication for the parse dashboard
 * You should update these after you launch your server.
 */
var dashboardUsers = [
        {
            user: "elastrix",
            pass: "elastrix"
	}
];
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
    serverURL: serverURL,
    liveQuery: {
        classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
    }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

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
	  appName: appName,
	  production: true
	}
    ],
    users: dashboardUsers
});

app.use('/parse', api);
app.use('/dashboard',dashboard);

/**
 * This is a simple route for the monitoring service
 * to test. If this fails, monit will try and 
 * restore the server.
 */
app.get('/elx', function(req, res) {
  res.status(200).send('Elastrix Parse Server');
});

options = {
  hostname: host,
  key: fs.readFileSync(path.join(certsPath, 'my-server.key.pem'))
  // This certificate should be a bundle containing your server certificate and any intermediates
  // cat certs/cert.pem certs/chain.pem > certs/server-bundle.pem
, cert: fs.readFileSync(path.join(certsPath, 'my-server.crt.pem'))
  // ca only needs to be specified for peer-certificates
//, ca: [ fs.readFileSync(path.join(caCertsPath, 'my-root-ca.crt.pem')) ]
, requestCert: false
, rejectUnauthorized: true
};

/**
 * Serving HTTPS for dashboard (required) and secure application server
 */
var httpsServer = require('https').createServer(options,app).listen(port, function() {
    console.log('elastrix-parse Dashboard availble at https://' + ip + ':' + port + '/dashboard');
    console.log('elastrix-parse App available at https://' + ip + ':' + port + '/parse');
});

/**
 * Also serving an HTTP server for non-ssl connections
 * the dashboard will not work over https unless you set
 * the allowUnsecureHttp flag in dashboard options i.e. if
 * you want to terminate SSL on a load balancer
 */
var httpServer = require('http').createServer(app).listen(port);

ParseServer.createLiveQueryServer(httpsServer);
