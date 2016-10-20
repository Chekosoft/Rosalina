const URL = require('url');
const Koa = require('koa');
const axios = require('axios');
const BodyParser = require('koa-better-body');
const Router = require('koa-trie-router');
const _ = require('lodash');

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
    this.app = new Koa();
    this.app.use(BodyParser());
    this.app.use(Router(this.app));

    this.headers = {};
    this.mappings = [];
    this.config = {
      remoteBase: remote,
      localBase: local
    };
  }

  /**
   * Creates a new Mapping and adds it to the current instance.
   * @see Mapping
   * @param {string} route - the path where the application will listen to requests.
   * @returns The Mapping object instance.
   */
  from(route) {
    let mapping = new Mapping();
    this.mappings.push(mapping)
    return mapping.from(route);
  }

  /**
   * Assigns which headers will be put on all remote requests
   * @param {object} headers - an object which represents a from-to assignation.
   */

  map_headers(headers={}) {
    this.headers = Object.assign({}, this.headers, headers);
  }

  /**
   * Builds all the request redirection logic from the defined mappings
   * @returns The underlying Koa instance.
   */

  ready() {
    this.mappings.forEach(mapping => {
      let remoteBase = this.config.remoteBase
      let route = this.app.route(mapping._from);
      let headerMappings = this.headers;

      let actions = mapping.actions;
      let verbs = Object.keys(mapping.actions);

      for(let i = 0, size = verbs.length; i < size; ++i) {
        let verb = verbs[i];
        let action = actions[verb];

        if(action == null) { continue; }

        route[verb](function* (next) {
          let fields = this.request.body || this.request.fields;
          let headers = this.request.headers;
          let qs = this.request.query;

          this.response.set('X-Powered-By', `Rosalina ${Rosalina.version}`);

          try {
            //FIXME: add querystrings and filter data.
            let requestConfiguration = {
              method: verb,
              baseURL: remoteBase,
              url: mapping._to
            };

            requestConfiguration.headers = _.chain(headerMappings)
            .map((to, from) => {
              let value = this.request.headers[from.toLowerCase()];
              if(!value) { return [null, null]; }
              if(_.isFunction(to)) {
                return _.toPairs(to(value))[0];
              } else {
                let mappedHeader = {};
                return [to, value];
              }
            }).fromPairs()
            .omitBy((value) => { return _.isNil(value); }).value();

            if(verb != 'get') {
              requestConfiguration.data = _.chain(action.parameters)
              .map((to, from) => {
                return [to, fields[from]]
              }).fromPairs()
              .omitBy((value) => { return _.isNil(value); }).value();
            }

            console.log(requestConfiguration);
            let remoteResponse = yield axios(requestConfiguration);

            this.response.status = remoteResponse.status;
            this.response.set(remoteResponse.headers);
            this.response.body = remoteResponse.data;
          } catch (error) {
            if(!error.response) {
              this.response.status = 500;
              this.response.body = {
                ROSALINA_ERROR_INTERNAL: true,
                ROSALINA_ERROR_CODE: error.code,
                ROSALINA_ERROR_TRACEBACK: error.stack
              };
            } else {
              this.response.status = error.response.status;
              this.response.set(error.response.headers);
              this.response.body = error.response.data;
            }
          } finally {
            yield next;
          }
        });
      }
    });

    this.app.use(this.app.router);
    return this.app;
  }
}

module.exports = Rosalina;
