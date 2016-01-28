import { expect } from 'chai';
import { compose } from '../';
import { shallow } from 'enzyme';
import React from 'react';
const { describe, it } = global;

describe('shouldComponentUpdate', () => {
  const Comp = class extends React.Component {
    render() {
      const {name} = this.props;
      return (<p>{name}</p>);
    }
  };

  describe('by default', () => {
    describe('at start', () => {
      it('should be true', () => {
        const Container = compose(() => null)(Comp);
        const i = shallow(<Container />).instance();
        expect(i.shouldComponentUpdate()).to.be.equal(true);
      });
    });

    describe('with props', () => {
      it('should be true if props are different', () => {
        const Container = compose(() => null)(Comp);
        const i = shallow(<Container p1="10"/>).instance();

        expect(i.shouldComponentUpdate({p1: '11'}, {})).to.be.equal(true);
        i.props = {p1: '11'};

        expect(i.shouldComponentUpdate({p1: '11', p2: 10}, {}))
          .to.be.equal(true);
      });

      it('should be false if props are the same', () => {
        const Container = compose(() => null)(Comp);
        const i = shallow(<Container p1="10"/>).instance();

        expect(i.shouldComponentUpdate({p1: '10'}, {})).to.be.equal(false);
      });
    });

    describe('with error', () => {
      it('should be true if errors are different', () => {
        const Container = compose(() => null)(Comp);
        const i = shallow(<Container/>).instance();

        const error = new Error('hello');
        expect(i.shouldComponentUpdate(i.props, {error})).to.be.equal(true);
        i.state = {error};

        const newError = new Error('hello');
        expect(i.shouldComponentUpdate(i.props, {error: newError}))
          .to.be.equal(true);
      });

      it('should be false if errors are the same', () => {
        const Container = compose(() => null)(Comp);
        const i = shallow(<Container/>).instance();

        const error = new Error('hello');
        expect(i.shouldComponentUpdate(i.props, {error})).to.be.equal(true);
        i.state = {error};

        expect(i.shouldComponentUpdate(i.props, {error})).to.be.equal(false);
      });
    });

    describe('with payload', () => {
      it('should be true if payload are different', () => {
        const Container = compose(() => null)(Comp);
        const i = shallow(<Container/>).instance();

        const payload = {aa: 10};
        expect(i.shouldComponentUpdate(i.props, {payload})).to.be.equal(true);
        i.state = {payload};

        const samePayload = {aa: 10};
        expect(i.shouldComponentUpdate(i.props, {payload: samePayload}))
          .to.be.equal(false);
      });

      it('should be false if data are the same', () => {
        const Container = compose(() => null)(Comp);
        const i = shallow(<Container/>).instance();

        const payload = {aa: 10};
        expect(i.shouldComponentUpdate(i.props, {payload})).to.be.equal(true);
        i.state = {payload};

        const samePayload = {aa: 10};
        expect(i.shouldComponentUpdate(i.props, {payload: samePayload}))
          .to.be.equal(false);
      });
    });
  });

  describe('disabled', () => {
    it('should be true always', () => {
      const Container = compose(() => null, null, null, {pure: false})(Comp);
      const i = shallow(<Container/>).instance();
      expect(i.shouldComponentUpdate(i.props, i.state)).to.be.equal(true);
    });
  });
});
