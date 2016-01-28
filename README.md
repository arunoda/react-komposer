# react-komposer

Let's compose React containers and feed data into components.

## TOC

* [Why](#why)
* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [API](#api)
* [Using with XXX](#using-with-xxx)
    - [Using with Promises](#using-with-promises)
    - [Using with Meteor](#using-with-meteor)
    - [Using with Rx.js Observables](#using-with-rxjs-observables)
    - [Using with Redux](#using-with-redux)
* [Extending](#extending)
* [Caveats](#caveats)

## Why?

Lately, in React we tried to avoid states as possible we can and use props to pass data and actions. So, we call these components **Dumb Components** or **UI components.**

And there is another layer of components, which knows how to **fetch data**. We call them as **Containers**. Containers usually do things like this:

* Request for data (invoke a subscription or just fetch it).
* Show a loading screen while the data is fetching.
* Once data arrives, pass it to the UI component.
* If there is an error, show it to the user.
* It may need to refetch or re-subscribe when props changed.
* It needs to cleanup resources (like subscriptions) when the container is unmounting.

If you want to do these your self, you have to do a lot of **repetitive tasks**. And this is good place for **human errors**.

**Meet React Komposer**

That's what we are going to fix with this project. You simply tell it how to get data and clean up resources. Then it'll do the hard work you. This is a universal project and work with **any kind of data source**, whether it's based Promises, Rx.JS observables or even Meteor's Tracker.

## Installation

```
npm i --save react-komposer
```

## Basic Usage

Let's say we need to build a clock. First let's create a component to show the time.

```js
const Time = ({time}) => (<div>Time is: {time}</div>);
```

Now let's define how to fetch data for this:

```js
const onPropsChange = (props, onData) => {
  const handle = setInterval(() => {
    const time = (new Date()).toString();
    onData(null, {time});
  }, 1000);

  const cleanup = () => clearInterval(handle);
  return cleanup;
};
```

On the above function, we get data for every seconds and send it via `onData`. Additionally, we return a cleanup function from the function to cleanup it's resources.

Okay. Now it's time to create the clock:

```js
import { compose } from 'react-komposer';
const Clock = compose(onPropsChange)(Time);
```

That's it. Now render the clock to the DOM.

```js
import ReactDOM from 'react-dom';
ReactDOM.render(<Clock />, document.body);
```

See this in live: <https://jsfiddle.net/arunoda/jxse2yw8>

### Additional Benefits

Other than main benefits, now it's super easy to test our UI code. We can easily do it via a set of unit tests.

* For that UI, simply test the plain react component. In this case, `Time` (You can use [enzyme](https://github.com/airbnb/enzyme) for that).
* Then test `onPropsChange` for different scenarios.

## API

You can customize the higher order component created by `compose` in few ways. Let's discuss.

### Handling Errors

Rather than showing the data, something you need to deal with error. Here's how to use `compose` for that:

```js
const onPropsChange = (props, onData) => {
  // oops some error.
  onData(new Error('Oops'));
};
```

Then error will be rendered to the screen (in the place where component is rendered). You must provide a JavaScript error object.

You can clear it by passing a some data again like this:

```js
const onPropsChange = (props, onData) => {
  // oops some error.
  onData(new Error('Oops'));

  setTimeout(() => {
    onData(null, {time: Date.now()});
  }, 5000);
};
```

### Detect props changes

Some times can use the props to custom our data fetching logic. Here's how to do it.

```js
const onPropsChange = (props, onData) => {
  const handle = setInterval(() => {
    const time = (props.timestamp)? Date.now() : (new Date()).toString();
    onData(null, {time});
  }, 1000);

  const cleanup = () => clearInterval(handle);
  return cleanup;
};
```

Here we are asking to make the Clock to display timestamp instead of a the Date string. See:

```js
ReactDOM.render((
  <div>
    <Clock timestamp={true}/>
    <Clock />
  </div>
), document.body);
```

See this in live: <https://jsfiddle.net/arunoda/7qy1mxc7/2>

### Change the Loading Component

```js
const MyLoading = () => (<div>Hmm...</div>);
const Clock = compose(onPropsChange, MyLoading)(Time);
```

### Change the Error Component

```js
const MyError = ({error}) => (<div>Error: {error.message}</div>);
const Clock = compose(onPropsChange, null, MyError)(Time);
```

### Compose Multiple Containers

Sometimes, we need to compose multiple containers at once, in order to use different data sources. Checkout following examples:

```js
const Clock = composeWithObservable(composerFn1)(Time);
const MeteorClock = composeWithTracker(composerFn2)(Clock);

export default MeteorClock;
```

For the above case, we've a utility called `composeAll` to make our life easier. See how to use it:

```js
export default composeAll(
  composeWithObservable(composerFn1)
  composeWithTracker(composerFn2)
)(Time)
```

### Pure Containers

`react-komposer` checks the purity of payload, error and props and avoid unnecessary render function calls. That means we've implemented `shouldComponentUpdate` lifecycle hook and follows something similar to React's [shallowCompare](https://facebook.github.io/react/docs/shallow-compare.html).

If you need to turn this functionality you can turn it off like this:

```js
// You can use `composeWithPromise` or any other compose APIs
// instead of `compose`.
const Clock = compose(onPropsChange, null, null, {pure: false})(Time);
```

## Using with XXX

### Using with Promises

For this, you can use the `composeWithPromise` instead of `compose`.

```js
import {composeWithPromise} from 'react-komposer'

// Create a component to display Time
const Time = ({time}) => (<div>{time}</div>);

// Assume this get's the time from the Server
const getServerTime = () => {
  return new Promise((resolve) => {
    const time = new Date().toString();
    setTimeout(() => resolve({time}), 2000);
  });
};

// Create the composer function and tell how to fetch data
const composerFunction = (props) => {
  return getServerTime();
};

// Compose the container
const Clock = composeWithPromise(composerFunction)(Time, Loading);

// Render the container
ReactDOM.render(<Clock />, document.getElementById('react-root'));
```

See this live: <https://jsfiddle.net/arunoda/8wgeLexy/3/>

### Using with Meteor

For that you need to use `composeWithTracker` method instead of `compose`. Then you can watch any Reactive data inside that.

```js
const Time = ({time}) => (<div>Time is: {time}</div>);
const composerFunction = (props, onData) => {
  const handler = Meteor.subscribe('serverTime');
  if(handler.ready()) {
    const {time} = ServerTimeCollection.findOne();
    onData(null, {time});
  } else {
    onData(null, null);
  }
};

// Note the use of composeWithTracker
const Clock = composeWithTracker(composerFunction)(Time);
```

In addition to above, you can also return a cleanup function from the composer function. See following example:

```js
const Time = ({time}) => (<div>Time is: {time}</div>);
const composerFunction = (props, onData) => {
  // tracker related code
  return () => {console.log('Container disposed!');}
};

// Note the use of composeWithTracker
const Clock = composeWithTracker(composerFunction)(Time);
```

See Example: <https://github.com/zvictor/komposer-meteor-example>


### Using with Rx.js Observables

```js
import {composeWithObservable} from 'react-komposer'

// Create a component to display Time
const Time = ({time}) => (<div>{time}</div>);

const now = Rx.Observable.interval(1000)
  .map(() => ({time: new Date().toString()}));

// Create the composer function and tell how to fetch data
const composerFunction = (props) => now;

// Compose the container
const Clock = composeWithObservable(composerFunction)(Time);

// Render the container
ReactDOM.render(<Clock />, document.getElementById('react-root'));
```

Try this live: <https://jsfiddle.net/arunoda/Lsdekh4y/2/>

### Using with Redux

```js

const defaultState = {time: new Date().toString()};
const store = Redux.createStore((state = defaultState, action) => {
  switch(action.type) {
    case 'UPDATE_TIME':
      return {
        ...state,
        time: action.time
      };
    default:
      return state;
  }
});

setInterval(() => {
  store.dispatch({
    type: 'UPDATE_TIME',
    time: new Date().toString()
  });
}, 1000);


const Time = ({time}) => (<div><b>Time is</b>: {time}</div>);

const onPropsChange = (props, onData) => {
  return store.subscribe(() => {
    const {time} = store.getState();
    onData(null, {time})
  });
};

const Clock = compose(onPropsChange)(Time);

ReactDOM.render(<Clock />, document.getElementById('react'))
```

Try this live: <https://jsfiddle.net/arunoda/wm6romh4/>

## Extending

Containers built by React Komposer are, still, technically just React components. It means that they can be extended in the same way you would extend any other component. Checkout following examples:


```js
const Tick = compose(onPropsChange)(Time);
class Clock extends Tick {
  componentDidMount() {
    console.log('Clock started');

    return super();
  }
  componentWillUnmount() {
    console.log('Clock stopped');

    return super();
  }
};
Clock.displayName = 'ClockContainer';

export default Clock;
```

Remember to call `super` when overriding methods already defined in the container.


## Caveats

**SSR**

In the server, we won't be able to cleanup resources even if you return the cleanup function. That's because, there is no functionality to detect component unmount in the server. So, make sure to handle the cleanup logic by yourself in the **server**.

**Composer Rerun on any prop change**

Right now, composer function is running again for any prop change. We can fix this by watching props and decide which prop has been changed. See: [#4](https://github.com/kadirahq/react-komposer/issues/4)
