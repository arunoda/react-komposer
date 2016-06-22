import { getDisableMode } from './';
import { DummyComponent } from './common_components';

// utility function to compose multiple composers at once.
export default function composeAll(...composers) {
  return function (BaseComponent) {
    if (getDisableMode()) {
      return DummyComponent;
    }

    if (BaseComponent === null || BaseComponent === undefined) {
      throw new Error('Curry function of composeAll needs an input.');
    }

    let finalComponent = BaseComponent;
    composers.forEach(composer => {
      if (typeof composer !== 'function') {
        throw new Error('Composer should be a function.');
      }

      finalComponent = composer(finalComponent);

      if (finalComponent === null || finalComponent === undefined) {
        throw new Error('Composer function should return a value.');
      }
    });

    return finalComponent;
  };
}
