import React from 'react';
import { render } from 'react-dom';
import { HashRouter } from 'react-router-dom';
import App from './App';

document.addEventListener('DOMContentLoaded', () =>
  render(
      <HashRouter>
        <App />
      </HashRouter>,
    document.getElementById('root')
  )
);
