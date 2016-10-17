const axios = require('axios');
const URL = require('url');
const Koa = require('koa');
const Router = require('koa-trie-router');
const BodyParser = require('koa-better-body');
const _ = require('lodash');

const Mapping = require('./mapping');

class Rosalina {
  static get version() { return '0.0.1'; }

  constructor(remote, local='/', settings={}) {
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

  from(route) {
    let mapping = new Mapping();
    this.mappings.push(mapping)
    return mapping.from(route);
  }

  map_headers(headers={}) {
    this.headers = Object.assign({}, this.headers, headers);
  }

  ready() {
    this.mappings.forEach(mapping => {
      let remoteBase = this.config.remoteBase
      let route = this.app.route(mapping._from);

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
              headers: headers
            };

            if(verb != 'get') {
              requestConfiguration.data = fields;
            }

            let remoteResponse = yield axios(requestConfiguration);

            this.response.status = remoteResponse.status;
            this.response.set(remoteResponse.headers);
            this.response.body = response.data;
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
