import { expect } from 'chai';
import { compose } from '../';
import { shallow } from 'enzyme';
import React from 'react';
const { describe, it } = global;

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
});
