import React, { createContext, useState } from 'react';
import { API_URL, AUTH } from '../Constants/constants';
import { encode } from 'base-64';

export const AuthContext = createContext();

type AuthContextProps = {
  children: React.FC
}

export const AuthContextProvider = (props : AuthContextProps) => {
  const [auth, setAuth] = useState({
    access_token: "",
    refresh_token: "",
    userId: -1,
    loggedIn: false,
    username: "",
    profPic: ""
  })

  const getCurrentUser = async (access_token : string) => {
    var myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", `Bearer ${access_token}`);

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    let response = await fetch(`${API_URL}/user/current`, requestOptions as RequestInit)
    let result = await response.json()

    setAuth({
      ...auth, userId: result.id, access_token: access_token, username: result.username,
      profPic: result.profile.profilePicUrl
    });
  }

  const refreshToken = async (refresh_token : string) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", `Basic ${encode(`${AUTH.username}:${AUTH.password}`)}`);

    var urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "refresh_token");

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    let response = await fetch(`${API_URL}/oauth/token?grant_type=refresh_token&refresh_token=${refresh_token}`, requestOptions as RequestInit)
    let result = await response.json()
    if (result.refresh_token === undefined) {
      throw "Invalid refresh token"
    }

    setAuth({
      ...auth, access_token: result.access_token, refresh_token:
        result.refresh_token, loggedIn: true
    })

    return result.access_token
  }

  async function logIn(username : string, password : string) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", `Basic ${encode(`${AUTH.username}:${AUTH.password}`)}`);

    var urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "password");
    urlencoded.append("username", username);
    urlencoded.append("password", password);

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    let response = await fetch(`${API_URL}/oauth/token`, requestOptions as RequestInit)
    let result = await response.json()
    if (result.refresh_token === undefined) {
      return ""
    }
    else {
      return result.refresh_token
    }
  }


  return (
    <AuthContext.Provider value={{ auth, setAuth, getCurrentUser, refreshToken, logIn }}>
      {props.children}
    </AuthContext.Provider>
  )
}
