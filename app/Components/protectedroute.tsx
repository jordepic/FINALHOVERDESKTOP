import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthContext } from '../Contexts/authcontext';

export const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { auth } = useContext(AuthContext);
  return (
    <Route {...rest} render={props => {
      if (auth.loggedIn) {
        return <Component {...props} />
      }
      else {
        return <Redirect to={{
          pathname: '/'
        }
        } />
      }
    }
    }
    />
  )
}
