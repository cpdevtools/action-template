import { getInput } from '@actions/core';
import { initializeFork } from './actions/init-fork';


enum ACTIONS {
  INIT_FORK = 'init-fork'
}


(async () => {
  const action = getInput('action', { trimWhitespace: true }) as ACTIONS;
  switch (action) {
    case ACTIONS.INIT_FORK:
      await initializeFork();
      break;
    default:
      throw new Error(`Unrecognized action '${action}'.`)
  }

})();
