# Elastrix Parse Server

The Elastrix Parse Server is a express-based Node.js server configured and optimized to run on the Elastrix Parse App in the AWS Cloud. 
It is fully configured to work with the [Elastrix CLI](https://elastrix.io/elastrix-cli) tool. This server will not run outside of the
Elastrix Parse EC2 server since it utilizes ec2metadata for various host information and the elastrix-cli for configuration variables.

This server utilizes the [Open Source Parse Server](https://github.com/ParsePlatform/parse-server) and the [Parse Dashboard](https://github.com/ParsePlatform/parse-dashboard).
Both are run via Node.js https and can utilize your own custom domain and certificates. There are utility scripts in `bin/` that will help
generate scripts on the server.

Coupled with the elastrix cli on the Elastrix Parse EC2 app it is a powerful, fault tolerant, self healing production ready parse server.

The server is run as a deamon and monitored via the Linux system with Monit.

#### Interacting with the Service
On the Elastrix Parse Server, you can interact with the service via Ubuntu Upstart:

    $ sudo service parse start|stop|restart|status

 The configuration is mostly done with environment variables that are managed and configurable via the Elastrix CLI.

 #### Debugging
 To view the server output:

     $ tail /var/log/parse-upstart.log -f

 To view the monitoring system output:

     $ tail /var/log/monit.log -f

 These logs can be streamed to CloudWatch via a winston module as well.