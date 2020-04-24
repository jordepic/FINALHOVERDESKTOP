import React from 'react';
import styles from '../Styles/merggstyle.module.css';
import filesize from "filesize";

type Up = {
  stage : string,
  loaded: number;
  total: number;
  name: string;
}

type Upload = {
  upload: Up
}

//Stages are "Upload Initialized", "Getting Thumbnail", "Compressing", "Upload In Progress", "Upload Complete"

export const UploadProgress = (props : Upload) => {
  switch (props.upload.stage) {
    case "Upload Initialized":
      return (
        <div className={styles.uploadProgressWrapper}>
          <div className={styles.innerUploadProgressWrapper}>
            <div className={styles.leftUploadTextWrapper}>
              <p className={styles.topUploadText}>{props.upload.stage}</p>
              <p className={styles.bottomUploadText}>{props.upload.name}</p>
            </div> 
          </div>
        </div>
      )
    case "Getting Thumbnail":
      return (
        <div className={styles.uploadProgressWrapper}>
          <div className={styles.innerUploadProgressWrapper}>
            <div className={styles.leftUploadTextWrapper}>
              <p className={styles.topUploadText}>{props.upload.stage}</p>
              <p className={styles.bottomUploadText}>{props.upload.name}</p>
            </div> 
          </div>
        </div>
      )
    case "Compressing":
      return (
        <div className={styles.uploadProgressWrapper}>
          <div className={styles.innerUploadProgressWrapper}>
            <div className={styles.leftUploadTextWrapper}>
              <p className={styles.topUploadText}>{props.upload.stage}</p>
              <p className={styles.bottomUploadText}>{props.upload.name}</p>
            </div>
            <div className={styles.middleUploadTextWrapper}>
              <p className={styles.topUploadText}>Takes a few minutes</p>
              <p className={styles.bottomUploadText}>
                {/* {`${(props.upload.loaded)}% / ${props.upload.total}%`} */}
              </p>
            </div>
          </div>
          <div className={styles.uploadProgressBar}>
            <div className={styles.innerUploadProgressBar}
              style={{ width: `${(props.upload.loaded) / props.upload.total * 100}%` }}></div>
          </div>
        </div>
      )
    case "Upload In Progress":
      return (
        <div className={styles.uploadProgressWrapper}>
          <div className={styles.innerUploadProgressWrapper}>
            <div className={styles.leftUploadTextWrapper}>
              <p className={styles.topUploadText}>{props.upload.stage}</p>
              <p className={styles.bottomUploadText}>{props.upload.name}</p>
            </div>
            <div className={styles.middleUploadTextWrapper}>
              <p className={styles.topUploadText}>Almost There!</p>
              <p className={styles.bottomUploadText}>{filesize(props.upload.loaded)} / {filesize(props.upload.total)}</p>
            </div>
          </div>
          <div className={styles.uploadProgressBar}>
            <div className={styles.innerUploadProgressBar}
              style={{ width: `${props.upload.loaded / props.upload.total * 100}%` }}></div>
          </div>
        </div>
      )
    case "Upload Complete":
      return (
        <div className={styles.uploadProgressWrapperComplete}>
          <div className={styles.innerUploadProgressWrapper}>
            <div className={styles.leftUploadTextWrapper}>
              <p className={styles.topUploadText}>{props.upload.stage}</p>
              <p className={styles.bottomUploadText}>{props.upload.name}</p>
            </div>
            <div className={styles.middleUploadTextWrapper}>
              <p className={styles.topUploadText}>Done! Absolute Ripper!</p>
              <p className={styles.bottomUploadText}>{filesize(props.upload.loaded)} / {filesize(props.upload.total)}</p>
            </div>
          </div>
          <div className={styles.uploadProgressBar}>
            <div className={styles.innerUploadProgressBar}
              style={{ width: `${props.upload.loaded / props.upload.total * 100}%` }}></div>
          </div>
        </div>
      )
    default:
      return (<div></div>)
  }
}
