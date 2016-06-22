import React from 'react';

export class DummyComponent extends React.Component {
  render() {
    return null;
  }
}

export function DefaultErrorComponent({error}) {
  return (
    <pre style={{color: 'red'}}>
      {error.message} <br />
      {error.stack}
    </pre>
  );
}

export function DefaultLoadingComponent() {
  return (<p>Loading...</p>);
}
