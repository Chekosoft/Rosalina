const URL = require('url');
const HTTP = require('http');
const HTTPS = require('https');
const axios = require('axios');
const _ = require('lodash');

const Router = require('./router');
const Mapping = require('./mapping');


/** A Koa wrapper for request redirection. */
class Rosalina {
  static get version() { return '0.0.1'; }

  /**
   * Creates a new Rosalina instance
   * @param {string} remote - the base url where requests will be redirected to.
                              must be an absolute URL.
   * @param {string} local - the local base path where requests will arrive.
   */

  constructor(remote, local='/') {
    this.router = new Router;
    this.headers = {};
    this.mappings = {};
    this.config = {
      remoteBase: remote,
      localBase: local
    };
  }

  /**
   * Returns a mapping based on the path defined. If a mapping with
   * the defined path doesn't exists, then a new mapping is created.
   * @see Mapping
   * @param {string} path - the path where the application will listen to requests.
   * @returns The Mapping object instance.
   */
  from(path) {
    let endpoint = this.router.path(path);
    if(!endpoint.mapping) {
      endpoint.mapping = new Mapping;
    }
    return endpoint.mapping;
  }

  /**
   * Assigns which headers will be put on all remote requests
   * @param {object} headers - an object which represents a from-to assignation.
   */

  map_headers(headers={}) {
    this.headers = Object.assign({}, this.headers, headers);
  }

  /**
   * Returns a Koa middleware which includes the request redirection logic
   * @returns A generator function
   */

   build() {
     let config = this.config;
     let version = this.version;
     let headerMappings = this.headers;
     let router = this.router;

     return this.app;
   }
}

module.exports = Rosalina;
