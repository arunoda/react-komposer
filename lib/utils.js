import hoistStatics from 'hoist-non-react-statics';

export function inheritStatics(Container, ChildComponent) {
  const childDisplayName =
      // Get the display name if it's set.
      ChildComponent.displayName ||
      // Get the display name from the function name.
      ChildComponent.name ||
      // If not, just add a default one.
      'ChildComponent';

  Container.displayName = `Container(${childDisplayName})`;
  return hoistStatics(Container, ChildComponent);
}

export function isReactNative() {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true;
  }

  return false;
}
