import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import genericComposer from '../generic_composer';

const { describe, it } = global;
class Comp extends React.Component {
  render() {
    return (<p>{this.props.name}</p>);
  }
}

describe('genericComposer', () => {
  describe('basic features', () => {
    it('should pass props to the Child', () => {
      const Container = genericComposer((props, onData) => {
        onData(null, {});
      })(Comp);
      const el = shallow(<Container name="arunoda"/>);
      expect(el.html()).to.match(/arunoda/);
    });

    it('should pass data to the Child', () => {
      const Container = genericComposer((props, onData) => {
        onData(null, { name: 'arunoda' });
      })(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/arunoda/);
    });

    it('should pass both data and props to the Child', () => {
      const Container = genericComposer((props, onData) => {
        onData(null, { name: 'arunoda' });
      })(({ name, age }) => (<p>{name}={age}</p>));

      const el = shallow(<Container age={20}/>);
      expect(el.html()).to.match(/arunoda=20/);
    });

    it('should run with the env', (done) => {
      const env = { name: 'arunoda' };
      const options = { env };
      const Container = genericComposer((props, onData, context) => {
        expect(context.name).to.be.equal('arunoda');
        done();
      }, options)(Comp);
      const el = shallow(<Container />);
    });

    it('should show the given loading handler when there is no data', () => {
      const options = {
        loadingHandler: () => (<p>loading</p>)
      };
      const Container = genericComposer((props, onData) => {
        onData();
      }, options)(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/loading/);
    });

    it('should show the given error handler when there is an error', () => {
      const options = {
        errorHandler: (e) => (<p>{e.message}</p>)
      };
      const Container = genericComposer((props, onData) => {
        onData(new Error('Aiyo'));
      }, options)(Comp);
      const el = shallow(<Container />);
      expect(el.html()).to.match(/Aiyo/);
    });

    it('should set the child ref', () => {
      const Container = genericComposer((props, onData) => {
        onData(null, {name: 'arunoda'});
      })(Comp);
      const el = mount(<Container name="arunoda"/>);
      expect(el.instance().child.props.name).to.be.equal('arunoda');
    });
  });

  describe('dataLoader features', () => {
    it('should allow to pass data multiple times', () => {
      let onData;
      const Container = genericComposer((props, _onData) => {
        onData = _onData;
      })(Comp);

      const el = mount(<Container />);
      // First run
      onData(null, { name: 'arunoda' });
      expect(el.instance().state.data.name).to.be.equal('arunoda');

      // Second run
      onData(null, { name: 'kamal' });
      expect(el.instance().state.data.name).to.be.equal('kamal');
    });

    it('should unsubscribe when unmounted', (done) => {
      const Container = genericComposer((props, onData) => {
        onData(null, {});
        return done;
      })(Comp);

      const el = mount(<Container name="arunoda"/>);
      el.instance().componentWillUnmount();
    });

    it('should unsubscribe when subscribing again', (done) => {
      let onData;
      const Container = genericComposer((props, _onData) => {
        onData = _onData;
        onData(null, {});
        return done;
      })(Comp);

      const el = mount(<Container name="arunoda"/>);
      el.instance()._subscribe({ aa: 10 });
    });

    it('should throw an error when sending data when unmounted', () => {
      let onData;
      const Container = genericComposer((props, _onData) => {
        onData = _onData;
        onData(null, {});
      })(Comp);

      const el = mount(<Container name="arunoda"/>);
      el.instance().componentWillUnmount();

      const run = () => onData(null, {aa: 10});
      expect(run).to.throw(/Tyring set data after/);
    });
  });
});
