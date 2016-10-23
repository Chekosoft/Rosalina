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
    this.map = {};
  }

  /** Defines which path the received requests in the listening path will
      be redirected to. */
  to(value) {
    this._to = value;
    return this;
  }

  /** Defines which querystrings will be redirected on a GET request */
  get(querystrings={}) {
    this.actions.get = {
      querystrings
    };
    return this;
  }

  /** Defines which parameters and querystrings
      will be redirected on a POST request */
  post(parameters, querystrings={}) {
    this.actions.post = {
      parameters, querystrings
    };
    return this;
  }

  /** Defines which parameters and querystrings
    will be redirected on a PUT request */
  put(parameters, querystrings={}) {
    this.actions.put = {
      parameters, querystrings
    };
    return this;
  }

  /** Defines which parameters and querystrings will be
      redirected on a PATCH request */
  patch(parameters, querystrings={}) {
    this.actions.patch = {
      parameters, querystrings
    };
  }
}

module.exports = Mapping;
