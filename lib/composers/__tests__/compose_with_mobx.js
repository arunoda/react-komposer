import { expect } from 'chai';
import { composeWithMobx } from '../../';
import { shallow } from 'enzyme';
import { autorun, observable } from 'mobx';
import React from 'react';
const { describe, it } = global;

describe('composeWithMobx', () => {
  it('should render with initial data', () => {
    global.Tracker = {
      autorun: fn => {
        fn();
        return {
          stop: () => {
          }
        };
      },
      nonreactive: fn => {
        return fn();
      }
    };
    const Comp = class extends React.Component {
      render() {
        const { name } = this.props;
        return (<div>{name}</div>);
      }
    };
    const Container = composeWithMobx((props, onData) => {
      onData(null, { name: 'arunoda' });
    })(Comp);

    const el = shallow(<Container/>);
    expect(el.html()).to.match(/arunoda/);
  });

  it('should render with observable changes', () => {
    const Comp = ({name}) => (<div>{name}</div>);
    const store = observable({name: 'aa'});

    const Container = composeWithMobx((props, onData) => {
      const {name} = store;
      onData(null, {name});
    })(Comp);

    const el = shallow(<Container />);
    expect(el.html()).to.match(/aa/);

    store.name = 'bb';
    expect(el.state('payload').name).to.equal('bb');
  });

  it('should get props', () => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithMobx((props, onData) => {
      onData(null, { name: 'arunoda' });
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);
    expect(el.html()).to.match(/arunoda/);
  });

  it('should complete the autorun when unmounting', done => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithMobx((props, onData) => {
      onData(null, {name: props.name});
      return () => done();
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);
    el.instance().componentWillUnmount();
  });
});
