import _compose from './compose';
import _composeAll from './compose_all';
import _composeWithTracker from './composers/with_tracker';
import _composeWithPromise from './composers/with_promise';
import _composeWithObservable from './composers/with_observable';
import _composeWithMobx from './composers/with_mobx';
import {
  DefaultErrorComponent,
  DefaultLoadingComponent
} from './common_components';

export const compose = _compose;
export const composeAll = _composeAll;
export const composeWithTracker = _composeWithTracker;
export const composeWithPromise = _composeWithPromise;
export const composeWithObservable = _composeWithObservable;
export const composeWithMobx = _composeWithMobx;

let disableMode = false;
let stubbingMode = false;
let defaultErrorComponent = null;
let defaultLoadingComponent = null;

// A way to disable the functionality of react-komposer and always show the
// loading component.
// This is very useful in testing where we can ignore React kompser's behaviour.
export function disable(value = true) {
  disableMode = value;
}

export function getDisableMode() {
  return disableMode;
}

// stubbing

export function setStubbingMode(value = true) {
  stubbingMode = value;
}

export function getStubbingMode() {
  return stubbingMode;
}

export function setComposerStub(Container, composerStub) {
  Container.__composerStub = composerStub;
}

// default components
export function setDefaultLoadingComponent(comp) {
  defaultLoadingComponent = comp;
}

export function setDefaultErrorComponent(comp) {
  defaultErrorComponent = comp;
}

export function _getDefaultLoadingComponent() {
  return defaultLoadingComponent || DefaultLoadingComponent;
}

export function _getDefaultErrorComponent() {
  return defaultErrorComponent || DefaultErrorComponent;
}
