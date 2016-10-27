const url = require('url');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const _ = require('lodash');
const boom = require('boom');

const Router = require('./router');
const Mapping = require('./mapping');
const Parser = require('./parser');


/** A request redirection handler. */
class Rosalina {
  static get version() { return '0.1.0'; }

  static writeResponse(res, statusCode, headers, body) {
    res.writeHead(statusCode, headers);
    if(_.isObject(body)) {
      body = JSON.stringify(body);
    }
    res.end(body);
  }

  /**
   * Creates a new Rosalina instance
   * @param {string} remote - the base url where requests will be redirected to.
                              must be an absolute URL.
   */

  constructor(remote) {
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
      route.mapping = new Mapping;
    }
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
       let writeResponse = Rosalina.writeResponse.bind(null, res);
       let responseHeaders = {
         'X-Powered-By': `Rosalina ${Rosalina.version}`
       }

       let pathinfo = url.parse(req.url);
       let method = req.method.toLowerCase();
       let route = router.match(pathinfo.pathname);

       if(!route) {
         let error = boom.notFound().output;
         writeResponse(error.statusCode, responseHeaders, error.payload.error);
         return;
       }

       let {endpoint, parameters} = route;

       if(!(method in endpoint.mapping.actions)) {
         let error = boom.methodNotAllowed().output;
         writeResponse(error.statusCode, responseHeaders, error.payload.error);
         return;
       }

       let action = endpoint.mapping.actions[method];

       Parser.parse(req).then((form) => {
         let sendingFields = _.transform(action.parameters,
           (result, value, key) => {
             if(!(key in form.fields) || !(key in form.files)) { return; }
             if(!(value in result)) {
               if(key in form.fields) {
                 result[value] = form.fields[key];
               } else {
                 result[value] = fs.createReadStream(form.files[key].path);
               }
             }
           });

         let sendingHeaders = _.transform(headers,
           (result, value, key) => {
             if(!(key in req.headers)) { return; }
             if(_.isFunction(value)) {
               _.assign(result, value(req.headers[key]));
             } else {
               result[value] = req.headers[key];
             }
           });

         return axios({
           method: method,
           data: sendingFields,
           headers: sendingHeaders,
           baseURL: remote,
           url: endpoint.mapping._to
         });

       }).then((remote) => {
         responseHeaders = _.assign({}, responseHeaders, remote.headers);
         writeResponse(remote.status, responseHeaders, remote.data);
       }).catch((err) => {
         if(!err.response) {
           let internalError = boom.badImplementation(
             'Rosalina found an internal error while processing your request.',
             {
               ROSALINA_ERROR_INTERNAL: true,
               ROSALINA_ERROR_CODE: err.code,
               ROSALINA_ERROR_TRACEBACK: err.stack
            });
          console.log(internalError);
           writeResponse(internalError.output.statusCode,
             responseHeaders,
             internalError.output.message);
         } else {
           let remote = err.response;
           responseHeaders = _.assign({}, responseHeaders, remote.headers);
           writeResponse(remote.status, responseHeaders, remote.data);
         }
       });
     });
   }


   listen(port, hostname='127.0.0.1') {
     let server = http.createServer(this.logic());
     server.listen(port, hostname);
     return server;
   }
}

module.exports = Rosalina;
