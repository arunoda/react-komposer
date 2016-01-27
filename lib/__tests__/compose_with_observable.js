import { expect } from 'chai';
import { composeWithObservable } from '../';
import { shallow } from 'enzyme';
import { Observable } from 'rx';
import React from 'react';
const { describe, it } = global;

describe('composeWithObservable', () => {
  it('should throw an error return object is not an observable', () => {
    class Comp extends React.Component {
      render() {
        const {name} = this.props;
        return (<div>{name}</div>);
      }
    }

    const Container = composeWithObservable(() => {
      return {};
    })(Comp);

    const run = () => shallow(<Container />);
    expect(run).to.throw(/Should return an observable/);
  });

  it('should subscribe data and render it', () => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithObservable(() => {
      return Observable.of({name: 'arunoda'});
    })(Comp);

    const el = shallow(<Container />);
    expect(el.html()).to.be.match(/arunoda/);
  });

  it('should get props', () => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithObservable(({name}) => {
      return Observable.of({name});
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);
    expect(el.html()).to.match(/arunoda/);
  });

  it('should completed the subscription when unmounting', done => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithObservable(() => {
      return {
        subscribe: () => ({completed: done})
      };
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);
    el.instance().componentWillUnmount();
  });

  it('should handle errors', () => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithObservable(() => {
      return Observable
          .of(42)
          .selectMany(Observable.throw(new Error('aiyo')));
    })(Comp);

    const el = shallow(<Container />);
    expect(el.html()).to.match(/aiyo/);
  });
});
