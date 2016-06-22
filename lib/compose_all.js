import React from 'react';
import { getDisableMode, getStubbingMode } from './';
import { DummyComponent } from './common_components';
import { inheritStatics } from './utils';

// utility function to compose multiple composers at once.
export default function composeAll(...composers) {
  return function (BaseComponent) {
    if (getDisableMode()) {
      return DummyComponent;
    }

    if (BaseComponent === null || BaseComponent === undefined) {
      throw new Error('Curry function of composeAll needs an input.');
    }

    let FinalComponent = BaseComponent;
    composers.forEach(composer => {
      if (typeof composer !== 'function') {
        throw new Error('Composer should be a function.');
      }

      FinalComponent = composer(FinalComponent);

      if (FinalComponent === null || FinalComponent === undefined) {
        throw new Error('Composer function should return a value.');
      }
    });

    FinalComponent.__OriginalBaseComponent =
      BaseComponent.__OriginalBaseComponent || BaseComponent;

    const stubbingMode = getStubbingMode();

    if (!stubbingMode) {
      return FinalComponent;
    }

    // return the stubbing mode.
    const ResultContainer = props => {
      // If there's an stub use it.
      if (ResultContainer.__composerStub) {
        const data = ResultContainer.__composerStub(props);
        const finalProps = {
          ...props,
          ...data,
        };

        return (<FinalComponent.__OriginalBaseComponent {...finalProps} />);
      }

      // if there's no stub, just use the FinalComponent.
      const displayName = FinalComponent.displayName || FinalComponent.name;
      return (<span>{`<${displayName} />`}</span>);
    };

    inheritStatics(ResultContainer, FinalComponent);

    return ResultContainer;
  };
}
