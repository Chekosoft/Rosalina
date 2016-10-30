const url = require('url');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const _ = require('lodash');
const boom = require('boom');

const Router = require('./router');
const Mapping = require('./mapping');
const Parser = require('./parser');
const debug = require('debug')('rosalina:app');


/** A request redirection handler. */
class Rosalina {
  static get version() { return '0.1.0'; }

  static writeResponse(res, statusCode, headers, body) {
    res.writeHead(statusCode, headers);
    debug('sending %o', body);
    if(headers['content-type'].includes('application/json')) {
      body = JSON.stringify(body);
    }
    res.write(body);
    res.end();
  }

  static writeError(res, headers, error) {
    res.writeHead(error.output.statusCode, headers);
    if(error.isServer) {
      res.write(`${error.output.statusCode} ${error.output.payload.error} \n`);
      res.write(error.stack);
      res.write("\n- Rosalina");
    } else {
      res.write(`${error.output.statusCode} ${error.output.payload.error}`);
    }
    res.end();
  }

  /**
  * Creates a new Rosalina instance
  * @param {string} remote - the base url where requests will be redirected to, must be an absolute URL.
  */

  constructor(remote) {
    debug('new Rosalina instance with remote host %s', remote);
    this.router = new Router;
    this.headerMappings = {};
    this.remote = remote;
  }

  /**
  * Returns a mapping based on the path defined. If a mapping with
  * the defined path doesn't exists, then a new mapping is created.
  * @see Mapping
  * @param {string} path - the path where the application will listen to requests.
  * @returns The Mapping object instance.
  */
  from(path) {
    let route = this.router.path(path);
    if(!route.mapping) {
      debug('mapping not defined, creating new one');
      route.mapping = new Mapping;
    }
    debug('returning related mapping');
    return route.mapping;
  }

  /**
  * Assigns which headers will be put on all remote requests
  * @param {object} headers - an object which represents a from-to assignation.
  */

  map_headers(headers={}) {
    this.headerMappings = _.assign({}, this.headerMappings, headers);
  }

  /**
  * Builds the request redirection logic.
  */


  logic() {
    let {router, headers, remote} = this;

    return (function (req, res) {
      debug('received %s request with URL %s', req.method, req.url);
      let responseHeaders = {
        'X-Powered-By': `Rosalina ${Rosalina.version}`
      };

      let writeResponse = Rosalina.writeResponse.bind(null, res);
      let writeError = Rosalina.writeError.bind(null, res, responseHeaders);

      let pathinfo = url.parse(req.url);
      let method = req.method.toLowerCase();
      let route = router.match(pathinfo.pathname);

      if(!route) {
        debug('path not found, sending error');
        writeError(boom.notFound());
        return;
      }

      let {endpoint, parameters} = route;
      let action = endpoint.mapping.actions[method];

      if(!action) {
        debug('method not allowed, sending error');
        writeError(boom.methodNotAllowed());
        return;
      }


      Parser.parse(req).then((form) => {
        debug('fields after parsing: %o', form.fields);
        debug('files after parsing: %o', _.keys(form.files));

        let sendingFields = _.transform(action.parameters,
          (result, value, key) => {
            if(!(key in form.fields) && !(key in form.files)) { return; }
            if(!(value in result)) {
              if(key in form.fields) {
                result[value] = form.fields[key];
              } else {
                result[value] = fs.createReadStream(form.files[key].path);
              }
            }
        });

        debug('retrieved fields: %o', sendingFields);

        let sendingHeaders = _.transform(headers, (result, value, key) => {
          if(!(key in req.headers)) { return; }
          if(_.isFunction(value)) {
            _.assign(result, value(req.headers[key]));
          } else {
            result[value] = req.headers[key];
          }
        });

        debug('retrieved headers: %o', sendingHeaders);
        debug('sending request');
        return axios({
          method: method,
          data: sendingFields,
          headers: sendingHeaders,
          baseURL: remote,
          url: endpoint.mapping._to
        });

      }).then((remote) => {
        debug('received response %o, %o, %o',
          remote.data,
          remote.headers,
          remote.status);

        responseHeaders = _.assign({}, responseHeaders, remote.headers);
        writeResponse(remote.status, responseHeaders, remote.data);
      }).catch((err) => {
        debug('found error on execution');
        if(!err.response) {
          debug('assuming internal error since no response was retrieved from request');
          writeError(boom.wrap(err, 500));
        } else {
          debug('connection problem error: %d %o',
            err.response.status, err.response);

          let remote = err.response;
          responseHeaders = _.assign({}, responseHeaders, remote.headers);
          writeError(boom.wrap(err, remote.status));
        }
      });
    });
  }


  listen(port, hostname='127.0.0.1') {
    let server = http.createServer(this.logic());
    server.listen(port, hostname);
    debug('HTTP server with Rosalina running at %s:%d', hostname, port);
    return server;
  }
}

module.exports = Rosalina;
