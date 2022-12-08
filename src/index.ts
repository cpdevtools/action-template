import { getInput } from '@actions/core';
import { initializeTemplateInstance } from './actions/init-tpl';

enum ACTIONS {
  INITIALIZE_TEMPLATE_INSTANCE = 'init-tpl'
}

(async () => {
  const action = getInput('action', { trimWhitespace: true }) as ACTIONS;
  switch (action) {
    case ACTIONS.INITIALIZE_TEMPLATE_INSTANCE:
      await initializeTemplateInstance();
      break;
    default:
      throw new Error(`Unrecognized action '${action}'.`)
  }

})();
