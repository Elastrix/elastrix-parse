/**
 * The Elastrix Parse Server
 * Copyright 2016 Elastrix, all rights reserved
 * 
 * This application is configured to run on the Elastrix Parse Server
 * on AWS. You can launch the instance via the AWS Marketplace. 
 * See https://elastrix.io/parse for details and documentation.
 *
 * @author Elastrix <info@elastrix.io>
 * @copyright 2016
 **/

require('shelljs/global');

/**
 * Detecting Ec2 values based on instance metadata. The IP and HOST
 * are used for SSL configuration, you can change these if you update
 * to a custom domain name or elastic IP
 */
var instanceId = exec('ec2metadata --instance-id',{silent:true}).stdout,
    ip = exec('ec2metadata --public-ipv4',{silent:true}).stdout,
    host = exec('ec2metadata --public-hostname',{silent:true}).stdout;

/** System Requirements **/
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    ParseServer = require('parse-server').ParseServer,
    ParseDashboard = require('parse-dashboard'),
    app = express(),
    options = {},
    certsPath = path.join(__dirname, 'certs', 'server'),
    caCertsPath = path.join(__dirname, 'certs', 'ca');


/** Database configuration **/
var databaseUri = process.env.PARSE_DATABASE_URI || process.env.PARSE_MONGODB_URI;

/**
 * If a database environment variable is not set, we will use the local
 * mongodb database. If you are not using the local mongodb, you can 
 * sudo apt-get remove mongodb-org 
 */
if (!databaseUri) {
    console.log('PARSE_DATABASE_URI not specified, using local mongodb.');
    databaseUri = "mongodb://localhost:27017/dev";
}

/**
 * Edit these values to match your configuration
 * then run sudo service parse restart on your
 * elastrix parse server
 */
var port = process.env.PARSE_PORT || 443,
    appId = process.env.PARSE_APP_ID || 'elastrix',
    appName = process.env.PARSE_APP_NAME || 'elastrix',
    masterKey = process.env.PARSE_MASTER_KEY || 'elastrix',
    fileKey = process.env.PARSE_FILE_KEY || '',
    serverURL = process.env.PARSE_SERVER_URL || 'https://'+ip+':'+port+'/parse',
    mongoURL = databaseUri,
    cloud = process.env.PARSE_CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    allowInsecureHTTP = process.env.PARSE_ALLOW_INSECURE_HTTP || 0,
    appProduction = process.env.PARSE_APP_PRODUCTION || true;  

/**
 * This is the basic authentication for the parse dashboard
 * You should update these after you launch your server.
 */
var dashboardUsers = [
        {
            user: process.env.PARSE_DASH_USER || "elastrix",
            pass: process.env.PARSE_DASH_PASS || "elastrix"
	}
];

/**
 * List of classes to support for query subscriptions
 */
var liveQueryClassNames = [ "Posts", "Comments" ];

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
        classNames: liveQueryClassNames
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
	  production: appProduction
	}
    ],
    users: dashboardUsers
});

/** standard parse endpoints **/
app.use('/parse', api);
app.use('/dashboard',dashboard);

/**
 * use trust proxy to redirect insecure requests
 * If you are running behind a load balancer and want
 * to terminate SSL there instead, remove this and 
 * the function below
 */
app.enable('trust proxy');
app.use(function(req,res,next) {
    if (req.secure) {
	// request was via https
	next();
    } else {
	// request was via http, redirect
	res.redirect('https://' + req.headers.host + req.url);
    }    
});

/** public static assets **/
app.use('/', express.static(__dirname + '/public'));

/**
 * This is a simple route for the monitoring service
 * to test. If this fails, monit will try and 
 * restore the server.
 */
app.get('/elx', function(req, res) {
    res.status(200).send('Elastrix Parse Server');
});

/** 
 * Node.js's HTTPS configuration. This will use the detected
 * public hostname by default, usually ec2-x-x-x-x.amazonaws.etc
 */

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
    console.log('elastrix-parse Dashboard availble:');
    console.log('https://' + ip + '/dashboard');
    console.log('elastrix-parse App available:');
    console.log('https://' + ip + '/parse');
});

var httpServer = require('http').createServer(app).listen(80);


ParseServer.createLiveQueryServer(httpsServer);
