const _ = require('lodash');

class Router {

  constructor() {
    this.base = {};
  }

  path(path) {
    let portions = path.split(/(?=\/)/g);
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
    currentStep.parameters = currentStep.parameters || parameters;
    currentStep.end = true;
    return currentStep;
  }

  match(path) {
    let portions = path.split(/(?=\/)/g);
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

    return (!currentStep.end) ? null : {
      endpoint: currentStep,
      parameters: params
    };
  }
}

module.exports = Router;
