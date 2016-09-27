/* eslint import/prefer-default-export: 0 */

import genericComposer from './generic_composer';

export function makeComposer(mainOptions = {}) {
  return function (dataLoader, otherOptions = {}) {
    const options = {
      ...mainOptions,
      ...otherOptions,
    };

    return genericComposer(dataLoader, options);
  };
}
