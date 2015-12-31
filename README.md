# react-data-binder

Simple way to bind data into React Components via props.

## TOC

* [Why](#why)
* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [API](#api)
* [Using with XXX](#using-with-xxx)
    - [Bind GraphQL queries via Lokka](#bind-graphql-queries-via-lokka)
    - [Using with Meteor](#using-with-meteor)
    - [Using with Rx.js Observables](#using-with-rxjs-observables)
    - [Using with Redux](#using-with-redux)
* [Caveats](#caveats)

## Why?

Normally, when you are rending a React component. This is the usual process you do:

* Start showing a loading screen.
* Fetch data and wait.
* Once data received, render those data

Then if something goes wrong, you need to show an error.

Additionally, if you create a subscription then you need to **clean up** those subscriptions when the component is dying.

So, you have to do a lot of stuff.

---

That's what we are going to fix with this project. You simply tell it how to get data and clean up resources. Then it'll do the hard work you. This is a universal project and work with any kind of data source, whether it's GraphQL, Meteor, Redux or Rx.js observable.

## Installation

```
npm i --save react-data-binder
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

  const cleanup = () => clearInteval(handle);
  return cleanup;
};
```

On the above function, we get data for every seconds and send it via `onData`. Additionally, we return a cleanup function from the function to cleanup it's resources.

Okay. Now it's time to create the clock:

```js
import { bindData } from 'react-data-binder';
const Clock = bindData(onPropsChange)(Time);
```

That's it. Now render the clock to the DOM. 

```js
import ReactDOM from 'react-dom';
ReactDOM.render(<Clock />, document.body);
```

See this in live: <https://jsbin.com/bejiqu/1/edit?js,output>

### Additional Benefits

Other than main benefits, now it's super easy to test our UI code. We can easily do it via a set of unit tests.

* For that UI, simply test the plain react component. In this case, `Time` (You can use [enzyme](https://github.com/airbnb/enzyme) for that).
* Then test `onPropsChange` for different scenarios.

Do this for all of your components. You can test your code pretty easily.

## API

You can customize the higher order component created by `bindData` in few ways. Let's discuss.

### Handling Errors

Rather than showing the data, something you need to deal with error. Here's how to use `bindData` for that:

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

  const cleanup = () => clearInteval(handle);
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

See this in live: <https://jsbin.com/nohuqa/edit?js,output>

### Change the Loading Component

```js
const MyLoading = () => (<div>Hmm...</div>);
const Clock = bindData(onPropsChange)(Time, MyLoading);
```

### Change the Error Component

```js
const MyError = ({error}) => (<div>Error: {error.message}</div>);
const Clock = bindData(onPropsChange)(Time, null, MyError);
```


## Using with XXX

You can use `react-bind-data` with a huge range of projects. Let me show you couple of them:

### Bind GraphQL queries via Lokka
```js
const Time = ({time}) => (<div>Time is: {time}</div>);
const client = new Lokka({...});
const query = `
    {
        time: serverTime
    }
`;

const onPropsChange = (props, onData) => {
  return client.watchQuery(query);
};
const Clock = bindData(onPropsChange)(Time);
```

Check here to it in action: <https://goo.gl/K1LhYk/>

### Using with Meteor

For that you need to use `bindTrackerData` method instead of `bindData`. Then you can watch any Reactive data inside that.

```js
const Time = ({time}) => (<div>Time is: {time}</div>);
const onPropsChange = (props, onData) => {
  const handler = Meteor.subscribe('serverTime');
  if(hander.ready()) {
    const {time} = ServerTimeCollection.findOne();
    onData(null, {time});
  } else {
    onData(null, null);
  }
};

// Note the use of bindTrackerData
const Clock = bindTrackerData(onPropsChange)(Time);
```

### Using with Rx.js Observables

```js
var source = Rx.Observable.interval(1000);

const Time = ({time}) => (<div><b>Time is</b>: {time}</div>);

const onPropsChange = (props, onData) => {
  const sub = source.subscribe(() => {
    const time = new Date().toString();
    onData(null, {time})
  });
  return sub.completed.bind(sub);
};

const Clock = bindData(onPropsChange)(Time);
```

Try this live: <https://jsbin.com/bofaxi/edit?js,output>

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

const Clock = bindData(onPropsChange)(Time);
                   
ReactDOM.render(<Clock />, document.getElementById('react'))
```

Try this live: <https://jsbin.com/xazuzo/2/edit?html,js,output>

## Caveats

* In the server, we won't be able to cleanup resources even if you return the cleanup function. That's because, there is no functionality called unmount in the server. So, make sure to handle the cleanup logic by yourself in the **server**.