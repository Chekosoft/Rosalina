/** Defines a request redirection mapping. */
class Mapping {

  constructor() {
    this._to = null;
    this.actions = {
      get: null,
      post: null,
      put: null,
      head: null,
      options: null,
      trace: null,
      patch: null,
      delete: null,
      connect: null
    };

    for(let action in this.actions) {
      this[action] = (parameters={}, querystrings={}) => {
        this.actions[action] = {
          parameters, querystrings
        }
        return this;
      }
    }
  }

  to(path) {
    this._to = path;
    return this;
  }
}

module.exports = Mapping;
