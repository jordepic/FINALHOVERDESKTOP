import React, { useContext } from 'react'
import { ClipContext } from '../Contexts/clipcontext';
import styles from '../Styles/merggstyle.module.css';
import x from '../Assets/x.svg'

export const VideoPlayer = () => {

  const { video, setVideo } = useContext(ClipContext);

  return (
    <div style={(video === "") ? { display: "none" } : {position: "fixed"}} id={styles.videoPlayerWrapper}>
      <video src={video} controls id={styles.videoPlayer}>
      </video>
      <div id={styles.exitWrapper}>
        <img src={x} onClick={() => setVideo("")} style={{ cursor: "pointer", width: "100%" }} />
      </div>
    </div >
  )
}