import React from 'react';
import './App.css';
import { LandingPage } from './Components/landingpage';
import { Route, Switch } from 'react-router-dom';
import { UserView } from './Components/userview';
import { AuthContextProvider } from './Contexts/authcontext';
import { ClipContextProvider } from './Contexts/clipcontext';
import { ProtectedRoute } from './Components/protectedroute';
import { Titlebar, Color } from 'custom-electron-titlebar';

// new Titlebar({
//     backgroundColor: Color.fromHex('#181A28'),
//     titleHorizontalAlignment: 'left',
//     icon: './Assets/tray.png'
// });

const App = () => {
  return (
    <div className="App" style={{ height: "100%" }}>
      <AuthContextProvider>
        <Switch>
          <Route exact path='/' component={LandingPage} />
          <ClipContextProvider>
            <ProtectedRoute exact path='/app' component={UserView} />
          </ClipContextProvider>
          <Route path='*' component={() => <p>"404 page not found"</p>} />
        </Switch>
      </AuthContextProvider>
    </div>
  );
}

export default App;
