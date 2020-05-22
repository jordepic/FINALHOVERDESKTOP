import React, { useState, useContext, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import  { ipcRenderer } from 'electron';
import fs from 'fs';
import chokidar from 'chokidar';
import { AuthContext } from '../Contexts/authcontext';
import { ClipContext } from '../Contexts/clipcontext';
import styles from '../Styles/merggstyle.module.css';
import cloud from '../Assets/uploadcloud.svg';
import ffmpeg from 'fluent-ffmpeg';

export const AddClip = () => {
  const { auth, refreshToken } = useContext(AuthContext);
  const { uploadClip, fetchHook, setFetchHook, currentUploads, setCurrentUploads } = useContext(ClipContext);

  const [clipsToUpload, setClipsToUpload] = useState<string[] | []>([]);
  const [currentClip, setCurrentClip] = useState("");

  const [chokidarClip, setChokidarClip] = useState("");
  const [chokidarClipQueue, setChokidarClipQueue] = useState<string[] | []>([]);

  const [ffMpegPath, setffMpegPath] = useState("");
  const [ffProbePath, setFFProbePath] = useState("");

  const [showCancelUpload, setShowCancelUpload] = useState(false);

  let watcher : null | chokidar.FSWatcher = null;

  const getThumbnail = async (path : string, file: File) => {
    if (ffMpegPath !== "" && ffProbePath !== "") {
      ffmpeg.setFfmpegPath(ffMpegPath);
      ffmpeg.setFfprobePath(ffProbePath);
      ffmpeg(path)
        .on('start', () => {
          let upload = {name: path.replace(/^.*[\\\/]/, ''), stage: "Getting Thumbnail", loaded: 0, total: 0};
          if (currentClip != "") {
            setCurrentUploads([upload]);
          }
        })
        .on('error', (err,stdout,stderr) => {
          
        })
        .on('end', function() {
          fs.readFile('/tmp/tn.png', (_, data) => {
            let thumb = new File([data], "thumbnail.png");
            setShowCancelUpload(false);
            uploadFile(file, thumb);
          })
        })
        .screenshots({
        // Will take screens at 20%, 40%, 60% and 80% of the video
          count: 1,
          size: '320x320',
          folder: '/tmp',
          filename: 'tn.png'
        });
    }
  }

  const compressClip = async path => {
    if (ffMpegPath !== "") {
      ffmpeg.setFfmpegPath(ffMpegPath);
      ffmpeg(path)
      .audioCodec('aac')
      .videoCodec('libx264')
      .videoBitrate(8192) // 8 MB = 1024 * 8 KB
      .outputOptions([
        '-y',
        '-movflags','faststart'
      ])
      .output('/tmp/temp.mp4')
      .on('start', () => {
        let upload = {name: path.replace(/^.*[\\\/]/, ''), stage: "Compressing", loaded: 0, total: 100};
        if (currentClip != "") {
          setCurrentUploads([upload]);
        }
      })
      .on('error', (err,stdout,stderr) => {
        
      })
      .on('progress', progress => {
        console.log(progress.percent);
        let upload = {name: path.replace(/^.*[\\\/]/, ''), stage: "Compressing", loaded: progress.percent, total: 100};
        if (currentClip != "") {
          setCurrentUploads([upload]);
        }
      })
      .on('end', (stdout, stderr) => {
        fs.readFile('/tmp/temp.mp4', (error, data) => {
            const filename = path.replace(/^.*[\\\/]/, '');
            let file = new File([data], filename)
            getThumbnail(path, file);
          });
      })
      .run();
    }
  }

  const handlePath = (path : string) => {
    fs.readFile(path, (_, data) => {
      const filename = path.replace(/^.*[\\\/]/, '');
      let newUpload = {stage: "Upload Initialized", loaded: 0, total: 0, name: filename};
      setCurrentUploads([newUpload]);
      let file = new File([data], filename);
      if (file.size > 50000000) {
        compressClip(path);
      }
      else {
        getThumbnail(path, file);
      }
    })
  }

  const uploadFile = (clip : File, thumbnail: File) => {
    if (currentClip != "") {
      refreshToken(auth.refresh_token)
      .then((accessToken : string) => {
        uploadClip(accessToken, auth.userId, clip, thumbnail)
          .then(() => {
            setFetchHook(fetchHook + 1);
            setCurrentClip("");
          });
        })      
      }
    } 

  const startWatcher = (path : string, uploadExisting : boolean) => {
    let ready = false;
    watcher = chokidar.watch(path, {
        ignored: /[\/\\]\./,
        persistent: true
    });
    const onWatcherReady = () => {
      ready = true;
    }
    watcher
    .on('add', (path) => {
      if (ready || uploadExisting) {
          if (path.slice(-4) === ".mp4") {
            setChokidarClip(path);
          }
      }
    })
    .on('addDir', (path) => {
      if (watcher !== null) {
        watcher.add(path);
      }
    })
    .on('ready', onWatcherReady)
  }

  useEffect(() => {
    ipcRenderer.on('ffmpeg-path-reply', (_, arg) => {
      setffMpegPath(arg.ffmpeg);
      setFFProbePath(arg.ffprobe);
    })
    ipcRenderer.send('ffmpeg-path-fetch');
  }, [])

  // useEffect(() => {
  //   ipcRenderer.on('start-watcher', (_, arg) => {
  //     const path = arg.path;
  //     const uploadExisting = arg.uploadExisting;
  //     watcher = null;
  //     startWatcher(path, uploadExisting);
  //   })
  // }, [])

  useEffect(() => {
    if (chokidarClip !== ""){
      let temp : string[] = []
      temp.concat(clipsToUpload);
      temp.push(chokidarClip);
      setChokidarClipQueue(temp);
    }
  }, [chokidarClip])

  useEffect(() => {
    if (chokidarClipQueue.length !== 0) {
      setTimeout(() => {
        let temp : string[] = []
        temp.concat(clipsToUpload);
        temp.push(chokidarClipQueue[0]);
        setClipsToUpload(temp);
        let temp2 : string[] = []
        temp2.concat(chokidarClipQueue);
        temp2.splice(0,1);
        setChokidarClipQueue(temp2);
      }, 2000)
    }
  }, [chokidarClipQueue])

  useEffect(() => {
    if (currentClip === "" && clipsToUpload.length !== 0) {
      setCurrentClip(clipsToUpload[0]);
      let temp : string[] = []
      temp.concat(clipsToUpload);
      temp.splice(0,1);
      setClipsToUpload(temp);
    }
    else if (currentClip !== "") {
      handlePath(currentClip);
    }
  }, [currentClip])

  useEffect(() => {
    if (currentClip === "" && clipsToUpload.length !== 0) {
      setCurrentClip(clipsToUpload[0]);
      let temp : string[] = []
      temp.concat(clipsToUpload);
      temp.splice(0,1);
      setClipsToUpload(temp);
    }
  }, [clipsToUpload])

  const cancelUpload = () => {
    setCurrentClip("");
    setCurrentUploads([]);
  }

  return (<div id={styles.uploadButton}>

    {
      showCancelUpload ?
      <div style={{ marginBottom: 0, outline: "none" }} onClick={cancelUpload}>
          <div id={styles.uploadButtonHelper}>
            <p id={styles.uploadVideoText}>Cancel Upload</p>
          </div>
      </div>
      :
      <Dropzone accept="video/mp4,video/x-m4v,video/*"
      onDrop={acceptedFile => {
        let temp : string[] = []
        temp.concat(clipsToUpload);
        temp.push(acceptedFile[0].path);
        setClipsToUpload(temp);
      }}>
      {({ getRootProps, getInputProps }) => (
        <section>
          <div {...getRootProps()} style={{ marginBottom: 0, outline: "none" }}>
            <input {...getInputProps()} />
              <div id={styles.uploadButtonHelper}>
                <img src={cloud}/>
                <p id={styles.uploadVideoText}>Upload Clip</p>
              </div>
          </div>
        </section>
      )}
      </Dropzone>
    }
  </div >)
}
