/* eslint max-len: 0 */
import React from 'react';
import { expect } from 'chai';
import { composeAll, disable, setStubbingMode, setComposerStub } from '../';
import { render } from 'enzyme';
const { describe, it, before, after } = global;

describe('composeAll', () => {
  it('should compose multiple composers together', () => {
    const composerFn1 = Comp => {
      return () => {
        return (<one><Comp /></one>);
      };
    };

    const composerFn2 = Comp => {
      return () => {
        return (<two><Comp /></two>);
      };
    };

    const Comp = () => (<p>Hello</p>);

    const Result = composeAll(
      composerFn1,
      composerFn2
    )(Comp);

    const el = render(<Result />);
    expect(el.html()).to.be.equal('<two><one><p>Hello</p></one></two>');
  });

  it('should throw an error if composer is not a function', () => {
    const composerFn = 'invalidComposer';
    const run = () => composeAll(composerFn)('input');
    expect(run).to.throw(/Composer should be a function/);
  });

  it('should throw an error if composer return nothing', () => {
    const composerFn = () => null;
    const run = () => composeAll(composerFn)('input');
    expect(run).to.throw(/Composer function should return a value/);
  });

  it('should throw an error if composer return nothing', () => {
    const composerFn = () => 'abc';
    const run = () => composeAll(composerFn)();
    expect(run).to.throw(/Curry function of composeAll needs an input/);
  });

  describe('disableMode in on', () => {
    it('should render the DummyComponent', () => {
      disable();
      const composerFn1 = a => (a + '-one');
      const composerFn2 = a => (a + '-two');

      const Container = composeAll(
        composerFn1,
        composerFn2
      )('input');

      const el = render(<Container />);

      // after disabled, it will give us a noscript element.
      expect(el.html()).to.equal('');
      disable(false);
    });
  });

  describe('stubbingMode is on', () => {
    before(() => {
      setStubbingMode(true);
    });

    after(() => {
      setStubbingMode(false);
    });

    const composer = Comp => {
      const Container = () => (
        <Comp data="inside-composer"/>
      );
      Container.displayName = 'ComposedContainer';
      return Container;
    };
    const Component = ({data}) => (<p>{data}</p>);

    it('should render the displayName, if there is no stub is set', () => {
      const Container = composeAll(composer)(Component);
      const el = render(<Container />);
      expect(el.html()).to.match(/ComposedContainer/);
    });

    it('should use the stub, if provided', () => {
      const Container = composeAll(composer)(Component);
      setComposerStub(Container, () => ({
        data: 'stubbed',
      }));

      const el = render(<Container />);
      expect(el.html()).to.be.equal('<p>stubbed</p>');
    });

    it('should pass props to the stub', () => {
      const Container = composeAll(composer)(Component);
      setComposerStub(Container, ({data}) => ({
        data: `${data}(stubbed)`,
      }));

      const el = render(<Container data="via-props"/>);
      expect(el.html()).to.be.equal('<p>via-props(stubbed)</p>');
    });

    it('should pass props to the original component even if stubbed', () => {
      const Container = composeAll(composer)(Component);
      setComposerStub(Container, () => ({}));

      const el = render(<Container data="via-props"/>);
      expect(el.html()).to.be.equal('<p>via-props</p>');
    });

    it('should use original component, even a container used for the composer', () => {
      const PreContainer = composeAll(composer)(Component);
      const Container = composeAll(composer)(PreContainer);
      setComposerStub(Container, () => ({
        data: 'stubbed',
      }));

      const el = render(<Container />);
      expect(el.html()).to.be.equal('<p>stubbed</p>');
    });
  });
});
