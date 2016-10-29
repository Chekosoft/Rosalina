const debug = require('debug')('rosalina:router');

class Router {

  constructor() {
    this.base = {};
  }

  path(path) {
    debug('defining path %s', path);
    let portions = path.split(/(?=\/)/g);
    debug('splitted as %o', portions);
    let parameters = [];
    let currentStep = this.base;
    for(let i = 0, size = portions.length; i < size; ++i) {
      let portion = portions[i];
      if(portion[1] == ':') {
        parameters.push(portion.substring(2));
        portion = '__parse';
      }

      if(!(portion in currentStep)) {
        currentStep[portion] = {};
      }
      currentStep = currentStep[portion];
    }

    debug('path already exists? %o', !!currentStep.parameters);
    currentStep.parameters = currentStep.parameters || parameters;
    currentStep.end = true;
    debug('defined endpoint %s with parameters %o', path, currentStep.parameters);
    return currentStep;
  }

  match(path) {
    debug('matching path %s', path);
    let portions = path.split(/(?=\/)/g);
    debug('splitted path %o', portions);
    let portion = null;
    let currentStep = this.base;
    let values = [];
    let params = {};

    do {
      portion = portions.shift();
      if(portion in currentStep) {
        currentStep = currentStep[portion];
      } else if('__parse' in currentStep){
        currentStep = currentStep['__parse'];
        values.push(portion.substring(1));
      } else {
        return null;
      }
    } while(portions.length);

    if(currentStep.parameters) {
      for(let i = 0, size = values.length; i < size; ++i) {
        params[currentStep.parameters[i]] = values[i];
      }
    }

    debug('route found? %o', !!currentStep.end);
    debug('parameters %o', params);

    return (!currentStep.end) ? null : {
      endpoint: currentStep,
      parameters: params
    };
  }
}

module.exports = Router;
