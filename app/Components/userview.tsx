import React, { useContext, useState, useEffect, ChangeEvent } from 'react';
import { AuthContext } from '../Contexts/authcontext';
import { ClipContext } from '../Contexts/clipcontext';
import { AddClip } from './addclip';
import styles from '../Styles/merggstyle.module.css';
import profile from '../Assets/profile.png'
import tv from '../Assets/tv.svg'
import dropdown from '../Assets/dropdown.svg'
import play from '../Assets/play.svg'
import hover from '../Assets/HOVER.svg'
import { VideoPlayer } from './videoplayer'
import sorter from '../Assets/sorter.svg'
import edit from '../Assets/rename.svg'
import download from '../Assets/save.svg'
import trash from '../Assets/delete.svg'
import search from '../Assets/search.svg'
import filesize from 'filesize'
import general from '../Assets/general.svg'
import x from '../Assets/x.svg'
import check from '../Assets/check.svg'
import { UploadProgress } from './uploadprogress';
import { ipcRenderer } from 'electron';
import { RouteComponentProps } from 'react-router-dom';

type Clip = {
  name: string;
  url: string;
  id: number;
  uploaded: number;
  size: number;
  entered: boolean;
  editing: boolean;
  selected: boolean;
  rename: string;
  thumbnail: string;
}

type Up = {
  stage: string,
  loaded: number;
  total: number;
  name: string;
}

export const UserView : React.SFC<RouteComponentProps> = props => {
  const { auth, setAuth, getCurrentUser, refreshToken } = useContext(AuthContext);
  const { getClips, deleteClip, setVideo, video, fetchHook, updateClip, currentUploads } = useContext(ClipContext);

  const [clips, setClips] = useState<Clip [] | []>([]);
  const [clipSize, setClipSize] = useState(0);
  const [tempClips, setTempClips] = useState<Clip [] | []>([]);
  const [loading, setLoading] = useState(false);
  const [force, setForce] = useState(false);
  const [clipPath, setClipPath] = useState('');

  const options = { year: 'numeric', month: 'short', day: 'numeric' };

  const logOut = () => {
    ipcRenderer.send('auth-token-remove')
  }

  const getClipSize = (clips : Clip[]) => {
    let total = 0;
    clips.forEach(clip => { total += clip.size });
    setClipSize(total);
  }

  const fetchClips = () => {
    if (auth.userId !== -1) {
      setLoading(true);
      getClips(auth.access_token, auth.userId).then((videos : Clip[] | []) => {
        setClips(videos);
        setForce(!force);
        setTempClips(videos);
        setLoading(false);
        getClipSize(videos);
        })
    }
  }

  const removeClip = (clipId : number) => {
    setLoading(true);
    refreshToken(auth.refresh_token).then((access_token: string) =>
      deleteClip(access_token, clipId).then(() => {
        getClips(access_token, auth.userId).then((videos : Clip[] | []) => {
          setClips(videos);
          setForce(!force);
          setTempClips(videos);
          setLoading(false);
          getClipSize(videos);
        })
      }))
  }

  const editClip = (clipId : number) => {
    setLoading(true);
    refreshToken(auth.refresh_token).then((access_token : string) => {
      let clip = clips.find(element => (element.id === clipId));
      if (clip !== undefined) {
        let name = clip.rename;
        updateClip(access_token, auth.userId, clipId, name).then(() => {
        getClips(access_token, auth.userId).then((videos : Clip[] | []) => {
          stopEditing(clipId);
          setClips(videos);
          setForce(!force);
          setTempClips(videos);
          setLoading(false);
        })
      })
      }
    })
  }

  const searchChange = (event : ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === "") {
      setTempClips(clips);
    }
    else {
      setTempClips(tempClips.filter(clip => clip.name.toLowerCase().includes(event.target.value.toLowerCase())))
    }
  }

  const renameClip = (e : ChangeEvent<HTMLInputElement>, clipId : number) => {
    let tempC = clips;
    let indexC = clips.findIndex(clip => clip.id === clipId);
    tempC[indexC] = { ...(tempC[indexC]), rename: e.target.value };
    let tempTC = tempClips;
    let indexTC = tempClips.findIndex(clip => clip.id === clipId);
    tempTC[indexTC] = { ...(tempTC[indexTC]), rename: e.target.value };
    setClips(tempC);
    setTempClips(tempTC);
    setForce(!force);
  }

  const startEditing = (clipId : number) => {
    let tempC = clips;
    let indexC = clips.findIndex(clip => clip.id === clipId);
    tempC[indexC] = { ...(tempC[indexC]), editing: true };
    let tempTC = tempClips;
    let indexTC = tempClips.findIndex(clip => clip.id === clipId);
    tempTC[indexTC] = { ...(tempTC[indexTC]), editing: true }
    setClips(tempC);
    setTempClips(tempTC);
    setForce(!force);
  }

  const stopEditing = (clipId : number) => {
    let tempC = clips;
    let indexC = clips.findIndex(clip => clip.id === clipId);
    tempC[indexC] = { ...(tempC[indexC]), editing: false };
    let tempTC = tempClips;
    let indexTC = tempClips.findIndex(clip => clip.id === clipId);
    tempTC[indexTC] = { ...(tempTC[indexTC]), editing: false }
    setClips(tempC);
    setTempClips(tempTC);
    setForce(!force);
  }

  const showButtons = (clipId : number) => {
    let tempC = clips;
    let indexC = clips.findIndex(clip => clip.id === clipId);
    tempC[indexC] = { ...(tempC[indexC]), entered: true };
    let tempTC = tempClips;
    let indexTC = tempClips.findIndex(clip => clip.id === clipId);
    tempTC[indexTC] = { ...(tempTC[indexTC]), entered: true }
    setClips(tempC);
    setTempClips(tempTC);
    setForce(!force);
  }

  const hideButtons = (clipId : number) => {
    let tempC = clips;
    let indexC = clips.findIndex(clip => clip.id === clipId);
    tempC[indexC] = { ...(tempC[indexC]), entered: false };
    let tempTC = tempClips;
    let indexTC = tempClips.findIndex(clip => clip.id === clipId);
    tempTC[indexTC] = { ...(tempTC[indexTC]), entered: false }
    setClips(tempC);
    setTempClips(tempTC);
    setForce(!force);
  }

  const changeDirectory = () => {
    ipcRenderer.send('open-directory-chooser');
  }

  useEffect(() => {
    ipcRenderer.on('clip-path-fetch-reply', (_, arg) => {
      setClipPath(arg);
    })

    ipcRenderer.on('open-directory-chooser-reply', (_, arg) => {
      ipcRenderer.send('clip-path-fetch', arg);
    })

    //Handle logout cookie
    ipcRenderer.on('auth-token-remove-reply', () => {
      setAuth({
        access_token: "",
        refresh_token: "",
        userId: -1,
        loggedIn: false,
        username: "",
        profPic: ""
      })
      props.history.push("/");
    })

    getCurrentUser(auth.access_token);
    ipcRenderer.send('clip-path-fetch', false);

    return () => {
      ipcRenderer.removeAllListeners('clip-path-fetch-reply');
      ipcRenderer.removeAllListeners('open-directory-chooser-reply');
      ipcRenderer.removeAllListeners('auth-token-remove-reply');
    }
  }, [])

  useEffect(() => {
    fetchClips()
  }, [auth.userId, fetchHook])

  return (
    <div style={{ width: "100%", height: "100%", position: "relative"}}>
      {loading ? <div></div> : <VideoPlayer />}
      <div className={styles.flexContainerHorizontal} style={(video === "") ? {} : { opacity: .7 }}>
      <div id={styles.clipUploaderView}></div>
        <div id={styles.clipUploaderView} style={{position: "fixed", left:0, top: "30px"}}>
          <div className={styles.uploadContainerVertical}>
            <div className={styles.upperLeftContainer}>
              <img src={hover} id={styles.leftLogo} />
            </div>
            <hr id={styles.leftHR} />
            <div id={styles.leftProfileContainer}>
              <img id={styles.leftProfileImage}
                src={auth.profPic === null ? profile : auth.profPic} />
              <p id={styles.usernameText}>{auth.username}</p>
              <div id={styles.progressBar}>
                <div id={styles.innerProgressBar}
                  style={(clipSize * 100 / (5 * Math.pow(10, 10)) > 5 ||  clipSize * 100 / (5 * Math.pow(10, 10)) === 0)? { width: `${clipSize * 100 / (5 * Math.pow(10, 10))}%` } : {width: "5%"}}>
                </div>
              </div>
              <p id={styles.storageText}>Used {filesize(clipSize)} of 50 GB</p>
              <AddClip />
              <br/>
              <p id={styles.storageText}>Current clip uploader file path:</p>
              <p id={styles.storageText} style={clipPath === '' ? {color: "red"} : {}}>{clipPath === '' ? "Not Set" : clipPath}</p>
              {clipPath === '' ? 
              <p id={styles.storageText}>You can change your clip path with the menu in the top right corner.  Note that if you choose a directory, we will also
              detect new video clips in the sub folders!</p>
              :
              <div></div>
              }
            </div>
          </div>
        </div>
        <div id={styles.clipView}>
          <div className={styles.uploadProgressContainer}>
            {
              currentUploads.map((upload : Up)=> {
                return (
                  <UploadProgress upload={upload} />
                )
              })
            }
          </div>
          <div className={styles.uploadContainerVertical}>
          <div className={styles.upperContainer}></div>
            <div className={styles.upperContainer} style={{position: "fixed", top: "30px", left: "15%", width: "85%", background: "#26293B", zIndex: 50}}>
              <div id={styles.searchBarWrapper}>
                <img src={search} id={styles.searchBarIcon} />
                <input onChange={searchChange} type="text" placeholder="Search" id={styles.searchBar}></input>
              </div>
              <div id={styles.rightProfileWrapper}>
                <img src={auth.profPic === null ? profile : auth.profPic}
                  id={styles.rightProfileImage} />
                <div className={styles.dropdown}>
                  <img src={dropdown} />
                  <div className={styles.dropdownContent}>
                    <div className={styles.dropdownMenu}>
                      <a id={styles.contact} href="mailto:support@hover.gg">Contact Us</a>
                    </div>
                    <div className={styles.dropdownMenu} onClick={logOut}
                    > Log out</div>
                    <div className={styles.dropdownMenu} onClick={changeDirectory}>
                      Choose Clip Folder
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <hr id={styles.rightHR} />
            <div id={styles.yourVidsWrapper}>
              <h3 id={styles.yourVidsText}>Your videos</h3>
            </div>
            <div id={styles.tableHeadWrapper}>
              <div className={styles.firstColumn}>
                <h3 className={styles.tableHeader}>Video</h3>
                <div style={{ marginLeft: "2px" }}>
                  <img src={sorter} />
                </div>
              </div>
              <div className={styles.secondColumn}><h3 className={styles.tableHeader}>Size</h3>
                <div style={{ marginLeft: "2px" }}>
                  <img src={sorter} />
                </div>
              </div>
              <div className={styles.thirdColumn}>
                <h3 className={styles.tableHeader}>Uploaded</h3>
                <div style={{ marginLeft: "2px" }}>
                  <img src={sorter} />
                </div>
              </div>
            </div>
            <div id={styles.clipWrapper}>
              {tempClips.length === 0 ?
                <div id={styles.noClipWrapper}>
                  <img src={tv} id={styles.tv} />
                  <h3 id={styles.noClipText}>You don't have any clips uploaded.</h3>
                </div>
                :
                <div id={styles.flexibleClipWrapper}
                  style={{ marginBottom: `${currentUploads.length * 76}px` }}
                >
                  {tempClips.map((clip : Clip) => {
                    return (
                      <div key={clip.id} className={styles.tableRowWrapper}
                        style={{ background: "#2F3143", borderRadius: "4px", marginBottom: "4px" }}
                        onMouseOver={() => showButtons(clip.id)} onMouseLeave={() => hideButtons(clip.id)}>
                        <div className={styles.firstColumn}>
                          <div className={styles.rowWrapper} style={{ width: "100%" }}>
                            <div onClick={() => setVideo(clip.url)} className={styles.thumbnailWrapper}>
                              <div className={styles.playBackground}>
                              </div>
                              <img src={play} className={styles.playButton} />
                              <img className={styles.videoThumbnail} src={clip.thumbnail === "" ? (auth.profPic === null ? profile : auth.profPic) : clip.thumbnail} />
                            </div>
                            <div className={styles.nameTimeWrapper}>
                              {clip.editing ?
                                <input type="text"
                                  defaultValue={clip.name}
                                  onChange={event => renameClip(event, clip.id)}
                                  onKeyPress={event => {
                                    if(event.key === 'Enter'){
                                      editClip(clip.id);
                                    }
                                  }}
                                  className={styles.editTextBox}></input>
                                :
                                <h3 className={styles.nameText}>
                                  {clip.name}
                                </h3>}
                              {/* <p className={styles.timeText}>00:15:00</p> */}
                            </div>
                          </div>
                        </div>
                        <div className={styles.secondColumn}>
                          <div className={styles.rowWrapper}>
                            <p className={styles.tableRowText}>{filesize(clip.size)}</p>
                          </div>
                        </div>
                        <div className={styles.thirdColumn}>
                          <div className={styles.rowWrapper}>
                            <p className={styles.tableRowText}>{(new Date(clip.uploaded)).toLocaleDateString("en-US", options)}</p>
                          </div>
                        </div>
                        <div className={styles.fourthColumn}>
                          {
                            clip.editing ?
                              <div className={styles.rowWrapper} style={(clip.entered ? {} : { display: "none" })}>
                                <div className={styles.editButtonWrapper} onClick={() => editClip(clip.id)}>
                                  <img src={general} className={styles.editButtonImage}></img>
                                  <img src={check} className={styles.editButtonIcon} />
                                </div>
                                <div className={styles.editButtonWrapper} onClick={() => stopEditing(clip.id)}>
                                  <img src={general} className={styles.editButtonImage}></img>
                                  <img src={x} className={styles.editButtonIcon} />
                                </div>
                              </div>
                              :
                              <div className={styles.rowWrapper} style={(clip.entered ? {} : { display: "none" })}>
                                <img src={edit} onClick={() => startEditing(clip.id)} className={styles.buttonImage}></img>
                                <a href={clip.url} style={{ height: "100%" }}>
                                  <div className={styles.rowWrapper}>
                                    <img src={download} className={styles.buttonImage}></img>
                                  </div>
                                </a>
                                <img src={trash} className={styles.buttonImage} onClick={() => removeClip(clip.id)}></img>
                              </div>
                          }
                        </div>
                      </div>
                    )
                  })
                  }</div>
              }
            </div>
          </div>
        </div>
      </div >
    </div >
  )
}
