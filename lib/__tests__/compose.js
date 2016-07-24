import { expect } from 'chai';
import {
  compose,
  disable,
  setDefaultErrorComponent,
  setDefaultLoadingComponent,
} from '../';
import { shallow, render, mount } from 'enzyme';
import React, { PropTypes } from 'react';
const { describe, it, afterEach } = global;

describe('compose', () => {
  describe('basic features', () => {
    it('should pass exisiting props to the child component', () => {
      const Comp = ({name}) => (<p>{name}</p>);
      const Container = compose((props, onData) => {
        onData(null, {kk: 10});
      })(Comp);
      const el = shallow(<Container name="arunoda"/>);
      expect(el.html()).to.match(/arunoda/);
    });

    it('should copy exisiting static assests', () => {
      const Comp = class extends React.Component {
        render() {
          const {name} = this.props;
          return (<p>{name}</p>);
        }
      };

      Comp.nice = 100;
      const Container = compose(() => {})(Comp);
      expect(Container.nice).to.equal(100);
    });
  });

  describe('context', () => {
    it('should pass the context into the subscribe call', () => {
      const Comp = ({}) => (<p></p>);
      const onPropsChange = (props, onData, context) => {
        expect(context.c1).to.equal('test');
        onData(null, {});
      };
      const Container = compose(onPropsChange, null, null, {
        contextTypes: {c1: PropTypes.string}
      })(Comp);
      shallow(<Container/>, {context: {c1: 'test'}});
    });
  });

  describe('displayName', () => {
    it('should get it from displayName field', () => {
      const comp = () => (<p>hello</p>);
      comp.displayName = 'MyComponent';
      const container = compose(() => {})(comp);
      expect(container.displayName).to.equal('Container(MyComponent)');
    });

    it('should get it from the function name', () => {
      function Comp() {
        return (<p>aaa</p>);
      }
      const container = compose(() => {})(Comp);
      expect(container.displayName).to.equal('Container(Comp)');
    });

    it('should set it as ChildComponent if otherwise', () => {
      const comp = {};
      const container = compose(() => {})(comp);
      expect(container.displayName).to.equal('Container(ChildComponent)');
    });
  });

  describe('getWrappedInstance', () => {
    it('should throw by default', () => {
      const Comp = () => (<p>Hello</p>);
      const Container = compose(
        (props, onData) => {
          onData(null, {});
        },
        null,
        null,
      )(Comp);
      const el = shallow(<Container />);
      const instance = el.instance();
      expect(instance.getWrappedInstance).to
        .throw(/you need to specify { withRef: true }/);
    });

    it('should return the ChildComponent instance if withRef is true', () => {
      class Foo extends React.Component {
        getFoo() {
          return 'foo';
        }

        render() {
          return <p>Hello</p>;
        }
      }

      const Container = compose(
        (props, onData) => {
          onData(null, {});
        },
        null,
        null,
        {withRef: true}
      )(Foo);

      class TopLevel extends React.Component {
        render() {
          return (
            <Container
              ref='container'
              withRef={true}/>
          );
        }
      }

      const el = mount(<TopLevel />);
      const instance = el.instance();
      const container = instance.refs.container;
      const fooInstance = container.getWrappedInstance();
      expect(fooInstance.getFoo()).to.equal('foo');
    });
  });

  describe('data function', () => {
    it('should render loading initially', () => {
      const Comp = () => (<p>Hello</p>);
      const Container = compose(() => {})(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/Loading/);
    });

    it('should render loading component with props initially', () => {
      const loadingText = 'hasProps';
      const Comp = () => (<p>Hello</p>);
      const Container = compose(() => {}, ({test}) => (
        <div>{test}</div>
      ))(Comp);
      const el = shallow(<Container test={loadingText}/>);
      expect(el.html()).to.match(new RegExp(loadingText));
    });

    it('should render child component when data recieved', () => {
      const Comp = ({name}) => (<p>{name}</p>);
      const Container = compose((props, onData) => {
        onData(null, {name: 'arunoda'});
      })(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/arunoda/);
    });

    it('should render loading when data became null again', () => {
      const Comp = ({name}) => (<p>{name}</p>);
      let onData;
      const Container = compose((props, _onData) => {
        onData = _onData;
        _onData(null, {name: 'arunoda'});
      })(Comp);

      let el = shallow(<Container />);
      expect(el.html()).to.match(/arunoda/);

      onData(null, null);
      expect(el.instance()._isLoading()).to.equal(true);
    });

    it('should get props', () => {
      const Comp = ({name}) => (<p>{name}</p>);
      const Container = compose((props, onData) => {
        onData(null, {name: props.name});
      })(Comp);
      const el = shallow(<Container name={'arunoda'}/>);
      expect(el.html()).to.match(/arunoda/);
    });
  });

  describe('with error', () => {
    it('should show the error when there is an error', () => {
      const Comp = () => (<p></p>);
      const Container = compose((props, onData) => {
        onData(new Error('super error'));
      })(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/super error/);
    });

    it('should not render the child component', () => {
      const Comp = () => (<p>nice</p>);
      const Container = compose((props, onData) => {
        onData(new Error('super error'));
      })(Comp);
      const el = shallow(<Container />);
      expect(el.html()).not.to.match(/nice/);
    });

    it('should throw an error, if error is not an error object', () => {
      const Comp = () => (<p>nice</p>);
      const Container = compose((props, onData) => {
        onData('bad-error');
      })(Comp);

      const run = () => shallow(<Container />);
      expect(run).to.throw(/instance of an Error/);
    });
  });

  describe('subscription', () => {
    it('should stop the subscription when component unmounting', done => {
      const Comp = () => (<p>nice</p>);
      const Container = compose(() => {
        return done;
      })(Comp);
      const el = shallow(<Container />);
      el.instance().componentWillUnmount();
    });

    it('should stop the subscription when subscribing again', done => {
      const Comp = () => (<p>nice</p>);
      const Container = compose(() => {
        return done;
      })(Comp);
      const el = shallow(<Container />);
      el.instance()._subscribe();
    });
  });

  describe('resubscription (multiple calls to function)', () => {
    let updateIteration;
    let el;

    const fn = (props, onData) => {
      onData(null, { updateIteration });
    };

    beforeEach(() => {
      updateIteration = 1;
    });

    describe('prop changes', () => {

      const Comp = ({ name, updateIteration: sub }) =>
        <p>{`${name}-sub${sub}`}</p>;

      const whenPropsChange = newProps => {
        updateIteration++;
        el.setProps(newProps);
      };

      it('should resubscribe when props change', () => {
        const Container = compose(fn)(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'bar'});
        expect(el.html()).to.match(/bar-sub2/);
      });

      it('should not resubscribe when props change is shallow equal', () => {
        const Container = compose(fn)(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub1/);
      });

      it('should resubscribe when not pure', () => {
        const Container = compose(fn, null, null, { pure: false })(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should resubscribe when shouldResubscribe returns true', () => {
        const shouldResubscribe = () => true;
        const Container = compose(fn, null, null, { shouldResubscribe })(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should resubscribe when shouldResubscribe is boolean true', () => {
        const shouldResubscribe = true;
        const Container = compose(fn, null, null, { shouldResubscribe })(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should resubscribe when shouldResubscribe is truthy', () => {
        const shouldResubscribe = 'truthy';
        const Container = compose(fn, null, null, { shouldResubscribe })(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should not resubscribe when shouldResubscribe returns false', () => {
        const shouldResubscribe = () => false;
        const Container = compose(fn, null, null, { shouldResubscribe })(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'bar'});
        expect(el.html()).to.match(/bar-sub1/);
      });

      it('should not resubscribe when shouldResubscribe is false', () => {
        const shouldResubscribe = false;
        const Container = compose(fn, null, null, { shouldResubscribe })(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'bar'});
        expect(el.html()).to.match(/bar-sub1/);
      });

      it('should pass args to shouldResubscribe', done => {
        const shouldResubscribe = (currentProps, nextProps) => {
          expect(currentProps).to.deep.equal({name: 'foo'});
          expect(nextProps).to.deep.equal({name: 'bar'});
          done();
        };
        const Container = compose(fn, null, null, { shouldResubscribe })(Comp);
        el = mount(<Container name="foo"/>);
        whenPropsChange({name: 'bar'});
      });

    });

    describe('context changes', () => {

      const Comp = ({ updateIteration: sub }, { name }) =>
        <p>{`${name}-sub${sub}`}</p>;

      const contextTypes = {name: PropTypes.string};

      Comp.contextTypes = contextTypes;

      const whenContextChange = newContext => {
        updateIteration++;
        el.setContext(newContext);
      };

      it('should resubscribe when context changes', () => {
        const Container = compose(fn, null, null, { contextTypes })(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'bar'});
        expect(el.html()).to.match(/bar-sub2/);
      });

      it('should not resubscribe when context change is shallow equal', () => {
        const Container = compose(fn, null, null, { contextTypes })(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub1/);
      });

      it('should resubscribe when not pure', () => {
        const options = { contextTypes, pure: false };
        const Container = compose(fn, null, null, options)(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should resubscribe when shouldResubscribe returns true', () => {
        const shouldResubscribe = () => true;
        const options = { contextTypes, shouldResubscribe };
        const Container = compose(fn, null, null, options)(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should resubscribe when shouldResubscribe is boolean true', () => {
        const shouldResubscribe = true;
        const options = { contextTypes, shouldResubscribe };
        const Container = compose(fn, null, null, options)(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should resubscribe when shouldResubscribe is truthy', () => {
        const shouldResubscribe = 'truthy';
        const options = { contextTypes, shouldResubscribe };
        const Container = compose(fn, null, null, options)(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'foo'});
        expect(el.html()).to.match(/foo-sub2/);
      });

      it('should not resubscribe when shouldResubscribe returns false', () => {
        const shouldResubscribe = () => false;
        const options = { contextTypes, shouldResubscribe };
        const Container = compose(fn, null, null, options)(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'enzymeDoesNotChangeOnInnerComp'});
        expect(el.html()).to.match(/sub1/);
      });

      it('should not resubscribe when shouldResubscribe is false', () => {
        const shouldResubscribe = false;
        const options = { contextTypes, shouldResubscribe };
        const Container = compose(fn, null, null, options)(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'enzymeDoesNotChangeOnInnerComp'});
        expect(el.html()).to.match(/sub1/);
      });

      it('should pass args to shouldResubscribe', done => {
        const shouldResubscribe = (
          currentProps, nextProps,
          currentContext, nextContext
        ) => {
          expect(currentContext).to.deep.equal({ name: 'foo' });
          expect(nextContext).to.deep.equal({ name: 'bar' });
          done();
        };
        const options = { shouldResubscribe, contextTypes };
        const Container = compose(fn, null, null, options)(Comp);
        el = mount(<Container />, { context: { name: 'foo' } });
        whenContextChange({name: 'bar'});
      });

    });

  });

  describe('components', () => {
    it('should provide a child component', () => {
      const run = () => {
        compose(() => {})();
      };

      expect(run).to.throw(/Should provide a child component/);
    });

    it('deprecated: should use the custom loading component', () => {
      const Comp = () => (<p>Hello</p>);
      const SuperLoading = () => (<p>OOOO</p>);
      const Container = compose(() => {})(Comp, SuperLoading);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/OOOO/);
    });

    it('should use the custom loading component', () => {
      const Comp = () => (<p>Hello</p>);
      const SuperLoading = () => (<p>OOOO</p>);
      const Container = compose(() => {}, SuperLoading)(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/OOOO/);
    });

    it('deprecated: should use the custom error component', () => {
      const Comp = () => (<p></p>);
      const MyError = () => (<p>MYERROR</p>);
      const Container = compose((props, onData) => {
        onData(new Error('super error'));
      })(Comp, null, MyError);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/MYERROR/);
    });

    it('should use the custom error component', () => {
      const Comp = () => (<p></p>);
      const MyError = () => (<p>MYERROR</p>);
      const composerFn = (props, onData) => {
        onData(new Error('super error'));
      };
      const Container = compose(composerFn, null, MyError)(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/MYERROR/);
    });
  });

  describe('custom defaults', () => {
    afterEach(() => {
      setDefaultErrorComponent(null);
      setDefaultLoadingComponent(null);
    });

    it('should use the custom default loading component if set', () => {
      const Comp = () => (<p>Hello</p>);
      const CustomLoading = () => (<p>1234</p>);
      setDefaultLoadingComponent(CustomLoading);

      const Container = compose(() => {})(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/1234/);
    });

    it('should use the custom default error component if set', () => {
      const Comp = () => (<p></p>);
      const CustomError = () => (<p>CUSTOMERROR</p>);
      setDefaultErrorComponent(CustomError);

      const composerFn = (props, onData) => {
        onData(new Error('super error'));
      };

      const Container = compose(composerFn, null)(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/CUSTOMERROR/);
    });
  });

  describe('disableMode', () => {
    it('should render the DummyComponent', () => {
      disable();
      const Comp = ({name}) => (<p>{name}</p>);
      const composerFn = (props, onData) => {
        onData(null, { name: 'arunoda'} );
      };
      const Container = compose(composerFn)(Comp);
      const el = render(<Container />);

      // after disabled, it will give us a noscript element.
      expect(el.html()).to.equal('');
      disable(false);
    });
  });
});
