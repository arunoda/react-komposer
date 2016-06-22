import { expect } from 'chai';
import { composeWithPromise } from '../../';
import { shallow } from 'enzyme';
import React from 'react';
const { describe, it } = global;

describe('composeWithPromise', () => {
  it('should throw error when return something else than a promise', () => {
    const Comp = class extends React.Component {
      render() {
        const {name} = this.props;
        return (<div>{name}</div>);
      }
    };
    const Container = composeWithPromise(() => {
      return {};
    })(Comp);

    const run = () => shallow(<Container />);
    expect(run).to.throw(/Should return a promise/);
  });

  it('should get data and handle them', done => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithPromise(() => {
      return Promise.resolve({name: 'arunoda'});
    })(Comp);

    const el = shallow(<Container />);

    // Initially show loading
    expect(el.html()).to.match(/Loading/);

    // After promise resolved, it'll show the data.
    setTimeout(() => {
      expect(el.state('payload').name).to.be.equal('arunoda');
      done();
    }, 0);
  });

  it('should get props', done => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithPromise(({name}) => {
      return Promise.resolve({name});
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);

    // Initially show loading
    expect(el.html()).to.match(/Loading/);

    // After promise resolved, it'll show the data.
    setTimeout(() => {
      expect(el.state('payload').name).to.be.equal('arunoda');
      done();
    }, 0);
  });

  it('should throw an error if data is not an object', done => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithPromise(() => {
      return Promise.resolve('some string');
    })(Comp);

    const el = shallow(<Container name="arunoda"/>);

    // Initially show loading
    expect(el.html()).to.match(/Loading/);

    // After promise resolved, it'll show the data.
    setTimeout(() => {
      expect(el.state('payload')).to.be.equal(undefined);
      done();
    }, 0);
  });

  it('should handle errors', done => {
    const Comp = ({name}) => (<div>{name}</div>);
    const Container = composeWithPromise(() => {
      return new Promise((r, reject) => reject(new Error('aa')));
    })(Comp);

    const el = shallow(<Container />);

    // Initially show loading
    expect(el.html()).to.match(/Loading/);

    // After promise resolved, it'll show the error.
    setTimeout(() => {
      expect(el.state('error').message).to.be.equal('aa');
      done();
    }, 0);
  });
});
