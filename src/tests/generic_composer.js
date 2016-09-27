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

  describe('performance', () => {
    describe('with propsToWatch === []', () => {
      describe('dataLoader', () => {
        it('should run for the first time', () => {
          const options = {
            propsToWatch: [],
          };
          const Container = genericComposer((props, onData) => {
            onData(null, { name: 'arunoda' });
          }, options)(Comp);
          const el = shallow(<Container />);
          expect(el.html()).to.match(/arunoda/);
        });

        it('should not run again', () => {
          const options = {
            propsToWatch: [],
          };

          let callCount = 0;
          const Container = genericComposer((props, _onData) => {
            callCount += 1;
          }, options)(Comp);

          const el = mount(<Container />);
          el.instance()._subscribe({ aa: 10 });

          expect(callCount).to.be.equal(1);
        });
      });
    });

    describe('with propsToWatch == [some props]', () => {
      describe('dataLoader', () => {
        it('should not run if the watching props are the same', () => {
          const options = {
            propsToWatch: ['name'],
          };

          let callCount = 0;
          const Container = genericComposer((props, _onData) => {
            callCount += 1;
          }, options)(Comp);

          const el = mount(<Container name='arunoda'/>);
          el.instance()._subscribe({ name:'arunoda', age: 20 });

          expect(callCount).to.be.equal(1);
        });

        it('should not run if the watching props changed', () => {
          const options = {
            propsToWatch: ['name'],
          };

          let callCount = 0;
          const Container = genericComposer((props, _onData) => {
            callCount += 1;
          }, options)(Comp);

          const el = mount(<Container name='arunoda'/>);
          el.instance()._subscribe({ name:'kamal', age: 20 });

          expect(callCount).to.be.equal(2);
        });

        it('should do a shallow comparison', () => {
          const options = {
            propsToWatch: ['data'],
          };

          const data = {};
          let callCount = 0;
          const Container = genericComposer((props, _onData) => {
            callCount += 1;
          }, options)(Comp);

          const el = mount(<Container data={data}/>);

          // let's change the stuff inside the data
          data.foo = 100;

          el.instance()._subscribe({ data });

          expect(callCount).to.be.equal(1);
        });

        it('should watch multiple props', () => {
          const options = {
            propsToWatch: ['name', 'age'],
          };

          const data = {};
          let callCount = 0;
          const Container = genericComposer((props, _onData) => {
            callCount += 1;
          }, options)(Comp);

          const el = mount(<Container name="arunoda" age={20} />);

          // first run with same props
          el.instance()._subscribe({ name: 'arunoda', age: 20, kkr: 20 });
          expect(callCount).to.be.equal(1);

          // second run with changed props
          el.instance()._subscribe({ name: 'arunoda', age: 30 });
          expect(callCount).to.be.equal(2);
        })
      });
    });

    describe('with shouldSubscribe', () => {
      describe('dataLoader', () => {
        it('should run for the first time even shouldSubscribe give false', () => {
          const options = {
            shouldSubscribe: () => false,
          };
          const Container = genericComposer((props, onData) => {
            onData(null, { name: 'arunoda' });
          }, options)(Comp);
          const el = shallow(<Container />);
          expect(el.html()).to.match(/arunoda/);
        });

        it('should ignore propsToWatch', () => {
          const options = {
            shouldSubscribe: () => true,
            propsToWatch: [],
          };

          let callCount = 0;
          const Container = genericComposer((props, _onData) => {
            callCount += 1;
          }, options)(Comp);

          const el = mount(<Container />);
          el.instance()._subscribe({ aa: 10 });

          expect(callCount).to.be.equal(2);
        });
      })
    })
  });
});
