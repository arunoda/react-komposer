import _compose from './compose';
import _composeAll from './compose_all';
import _composeWithTracker from './composers/with_tracker';
import _composeWithPromise from './composers/with_promise';
import _composeWithObservable from './composers/with_observable';

let disableMode = false;

export function getDisableMode() {
  return disableMode;
}

// A way to disable the functionality of react-komposer and always show the
// loading component.
// This is very useful in testing where we can ignore React kompser's behaviour.
export function disable(value = true) {
  disableMode = value;
}

export const compose = _compose;
export const composeAll = _composeAll;
export const composeWithTracker = _composeWithTracker;
export const composeWithPromise = _composeWithPromise;
export const composeWithObservable = _composeWithObservable;
