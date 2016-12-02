/* eslint import/prefer-default-export: 0 */

import hoistStatics from 'hoist-non-react-statics';

export function inheritStatics(Container, ChildComponent, displayName = 'Container') {
  const childDisplayName =
      // Get the display name if it's set.
      ChildComponent.displayName ||
      // Get the display name from the function name.
      ChildComponent.name ||
      // If not, just add a default one.
      'ChildComponent';

  Container.displayName = `${displayName}(${childDisplayName})`; // eslint-disable-line
  return hoistStatics(Container, ChildComponent);
}
