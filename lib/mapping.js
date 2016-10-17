class Mapping {

  constructor() {
    this._from = null;
    this._to = null;
    this.actions = {
      get: null,
      post: null,
      put: null
    };
    this.map = {};
  }

  from(value) {
    this._from = value;
    return this;
  }

  to(value) {
    this._to = value;
    return this;
  }

  get(querystrings={}) {
    this.actions.get = {
      querystrings
    };
    return this;
  }

  post(parameters, querystrings={}) {
    this.actions.post = {
      parameters, querystrings
    };
    return this;
  }

  put(parameters, querystrings={}) {
    this.actions.put = {
      parameters, querystrings
    };
    return this;
  }

  patch(parameters, querystrings={}) {
    this.actions.patch = {
      parameters, querystrings
    };
  }

  getMapping() {
    return {
      from: this._from,
      to: this._to
    }
  }
}

module.exports = Mapping;
