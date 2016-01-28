import { expect } from 'chai';
import { composeWithTracker } from '../';
import { shallow } from 'enzyme';
import React from 'react';
const { describe, it } = global;

describe('composeWithTracker', () => {
  it('should render with initial data', () => {
    global.Tracker = {
      autorun: fn => {
        fn();
        return {stop: () => {}};
      }
    };
    const Comp = class extends React.Component {
      render() {
        const {name} = this.props;
        return (<div>{name}</div>);
      }
    };
    const Container = composeWithTracker((props, onData) => {
      onData(null, {name: 'arunoda'});
    })(Comp);

    const el = shallow(<Container/>);
    expect(el.html()).to.match(/arunoda/);
  });

  it('should render with reactive data', () => {
    let runAgain;

    global.Tracker = {
      autorun: fn => {
        fn();
        runAgain = fn;
        return {stop: () => {}};
      }
    };

    const names = [ 'aa', 'bb' ];

    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithTracker((props, onData) => {
      const name = names.shift();
      onData(null, {name});
    })(Comp);

    const el = shallow(<Container />);
    expect(el.html()).to.match(/aa/);

    runAgain();
    expect(el.state('payload').name).to.equal('bb');
  });

  it('should stop the tracker when component unmounting', done => {
    global.Tracker = {
      autorun: fn => {
        fn();
        return {stop: done};
      }
    };
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithTracker((props, onData) => {
      onData(null, {name: props.name});
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);
    el.instance().componentWillUnmount();
  });

  it('should call the cleanup function when component unmounting', done => {
    global.Tracker = {
      autorun: fn => {
        fn();
        return {stop: () => null};
      }
    };
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithTracker((props, onData) => {
      onData(null, {name: props.name});
      return done();
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);
    el.instance().componentWillUnmount();
  });

  it('should recieve props', () => {
    global.Tracker = {
      autorun: fn => {
        fn();
        return {stop: () => {}};
      }
    };
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithTracker((props, onData) => {
      onData(null, {name: props.name});
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);
    expect(el.html()).to.match(/arunoda/);
  });
});
