import React, { useContext, useState, useEffect, ChangeEvent } from 'react';
import { AuthContext } from '../Contexts/authcontext';
import astro from '../Assets/astronaut.svg';
import hover from '../Assets/HOVER.svg';
import styles from '../Styles/merggstyle.module.css';
import uicon from '../Assets/usernameicon.svg';
import picon from '../Assets/passwordicon.svg';
import spicon from '../Assets/showpasswordicon.svg';
import { ipcRenderer } from 'electron';
import { RouteComponentProps } from 'react-router-dom';


export const LandingPage : React.SFC<RouteComponentProps> = props => {
  const { logIn, refreshToken } = useContext(AuthContext);

  const [userInfo, setUserInfo] = useState({ username: "", password: "", invalid_credentials: false, show_password: false });

  const changeUserInfo = (event : ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (target != null) {
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;
      setUserInfo({ ...userInfo, [name]: value })
    }
  }

  const toggleShowPassword = () => {
    setUserInfo({ ...userInfo, show_password: !userInfo.show_password });
  }

  const logInButtonClick = () => {
    logIn(userInfo.username, userInfo.password).then((refresh_token : string) => {
      if (refresh_token === "") {
        setUserInfo({ ...userInfo, invalid_credentials: true })
      }
      else {
        ipcRenderer.send('auth-token-store', refresh_token);
        refreshToken(refresh_token).then(() => { props.history.push("/app") })
      }
    })
  }

  const enterPress = (event : React.KeyboardEvent<HTMLInputElement>) => {
    if(event.key === 'Enter'){
      logInButtonClick();
    }
  }

  useEffect(() => {
    ipcRenderer.on('auth-token-fetch-reply', (_, refresh_token) => {
      if (refresh_token !== undefined) {
        refreshToken(refresh_token).then(() => { props.history.push("/app") })
          .catch((e : string) => console.log(e))
      }
    })
    ipcRenderer.send('auth-token-fetch');
    return () => { ipcRenderer.removeAllListeners('auth-token-fetch-reply')}
  }, [])

  return (
    <div className={styles.flexContainerHorizontal}>
      <div className={styles.flexContainerVertical}>
        <div id={styles.astronautWrapper}>
          <img src={astro} id={styles.astronaut} />
          <img src={hover} id={styles.astronaut} />
        </div>
        <div id={styles.welcomeWrapper}>
          <p id={styles.welcome}>Welcome to Hover video storage. Upload your clips here to use
              them in the app!
          </p>
        </div>
        <div id={styles.usernameWrapper}>
          <div className={styles.textboxWrapper}>
            <img src={uicon} className={styles.tbLeftIcon} />
            <input type="text"
              className={styles.textBox} placeholder="Username" name="username" onChange={changeUserInfo}
              style={{ border: (userInfo.invalid_credentials ? "1px solid #FF3623" : "1px solid #8C90A8")}}
              onKeyPress={enterPress}>
            </input>
          </div>
          <div className={styles.textboxWrapper}>
            <img src={picon} className={styles.tbLeftIcon} />
            <input type={userInfo.show_password ? "text" : "password"}
              className={styles.textBox} placeholder="Password" name="password" onChange={changeUserInfo}
              style={{ border: (userInfo.invalid_credentials ? "1px solid #FF3623" : "1px solid #8C90A8") }}
              onKeyPress={enterPress}>
            </input>
            <img src={spicon} onClick={toggleShowPassword} className={styles.tbRightIcon} />
          </div>
          <p id={styles.errorMessage} style={{ color: (userInfo.invalid_credentials ? "#FF3623" : "#181A28") }}>
            Please make sure your email and/or password is correct.
          </p>
          <button id={styles.signIn} onClick={logInButtonClick}>
            LOGIN
          </button>
        </div>
      </div >
    </div>
  )
}
