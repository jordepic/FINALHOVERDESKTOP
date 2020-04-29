import React, { createContext, useState } from 'react';
import { API_URL } from '../Constants/constants';
import axios from 'axios';

export const ClipContext = createContext();

export const ClipContextProvider = props => {

  const [video, setVideo] = useState("");
  const [fetchHook, setFetchHook] = useState(0);
  const [currentUploads, setCurrentUploads] = useState([]);

  async function getClips(access_token, userId) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${access_token}`);

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    var videos = [];

    let response = await fetch(`${API_URL}/clipCloud/user/${userId}/`, requestOptions)
    let result = await response.json()
    result.forEach(video => {
      videos.push({
        url: video.mediaURL, id: video.id, selected: false, entered: false,
        name: (video.name === null ? "Unnamed Clip" : video.name),
        uploaded: video.createdOn,
        size: (video.sizeInBytes === null ? "Unknown" : video.sizeInBytes),
        editing: false, 
        rename: (video.name === null ? "Unnamed Clip" : video.name),
        thumbnail: (video.thumbnailURL === null ? "" : video.thumbnailURL)
      });
    })
    return videos.reverse();
  }

  async function uploadClip(access_token, userId, clip, thumbnail) {
    let url = `${API_URL}/clipCloud`;

    let blob = new Blob([JSON.stringify({ name: clip.name, userId })], { type: "application/json" })
    let data = new FormData();
    data.append("dto", blob);
    data.append("media", clip);
    data.append("thumbnail", thumbnail);

    let config = {
      headers: {
        "Authorization": `Bearer ${access_token}`
      },
      onUploadProgress: (progressEvent) => {
        let init = [];
        let temp = init.concat(currentUploads);
        let toChange = temp.findIndex(element => element.name === clip.name);
        if (progressEvent.loaded === progressEvent.total) {
          if (toChange !== -1) {
            temp[toChange].loaded = progressEvent.loaded;
            temp[toChange].stage = "Upload Complete";
            setCurrentUploads(temp);
            temp = init.concat(temp.splice(toChange, 1))
            setTimeout(() => { setCurrentUploads(temp) }, 5000);
          }
          else {
            temp.push({ name: clip.name, loaded: progressEvent.loaded, total: progressEvent.total, stage: "Upload Complete" })
            setCurrentUploads(temp);
            let temp2 = init.concat(currentUploads);
            setTimeout(() => {
              temp2.splice(toChange, 1);
              setCurrentUploads(temp2);
             }, 5000);
          }
        }
        else {
          if (toChange !== -1) {
            temp[toChange].loaded = progressEvent.loaded;
          }
          else {
            temp.push({ name: clip.name, loaded: progressEvent.loaded, total: progressEvent.total, stage: "Upload In Progress" })
          }
        }
        setCurrentUploads(temp);
      }
    }

    await axios.post(url, data, config)
  }

  async function deleteClip(access_token, clipId) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${access_token}`);

    var requestOptions = {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow'
    };

    await fetch(`${API_URL}/clipCloud/${clipId}`, requestOptions)
  }

  async function updateClip(access_token, userId, clipId, name) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${access_token}`);
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      body: JSON.stringify({ name, userId, clipCloudEntryId: clipId })
    };

    await fetch(`${API_URL}/clipCloud/`, requestOptions)
  }

  return (
    <ClipContext.Provider value={{
      getClips, uploadClip, deleteClip, video,
      setVideo, fetchHook, setFetchHook, updateClip, currentUploads, setCurrentUploads
    }}>
      {props.children}
    </ClipContext.Provider>
  )
}
