# ez-rtmp-receiver
[![!](https://img.shields.io/github/package-json/v/ThaCheeseBun/ez-rtmp-server)](https://github.com/ThaCheeseBun/ez-rtmp-server/releases)
[![!](https://img.shields.io/github/license/ThaCheeseBun/ez-rtmp-server)](LICENSE)
[![!](https://img.shields.io/github/repo-size/ThaCheeseBun/ez-rtmp-server)](http://hetasinglar.shop)

A NodeJS implementation of RTMP/HTTP-FLV Media Server  

# Node-Media-Server
This project is a fork from [Node-Media-Server](https://github.com/illuspas/Node-Media-Server) by illuspas.
This is just a smaller and more local streaming focused fork for use with OBS.

# Features
 - Cross platform support Windows/Linux/Unix
 - Support for H.264/H.265/AAC/MP3/SPEEX/NELLYMOSER/G.711
 - Support for remux to LIVE-HTTP-FLV, support for playback with [flv.js](https://github.com/Bilibili/flv.js)

# Usage

## packaged binary
// windows guide only right now, binaries for linux/unix exists

**NOTICE:** Binaries are only 64 bit.

- Download latest release from the releases tab
- When it's done, just run it™

## source code
```bash
git clone https://github.com/ThaCheeseBun/ez-rtmp-server.git
npm install
node .
```

# Publishing live streams
## From FFmpeg
If you have a video file with H.264 video and AAC audio:
```bash
ffmpeg -re -i INPUT_FILE_NAME -c copy -f flv rtmp://localhost/live/STREAM_NAME
```

Or if you have a video file that is encoded in other audio/video format:
```bash
ffmpeg -re -i INPUT_FILE_NAME -c:v libx264 -preset superfast -tune zerolatency -c:a aac -ar 44100 -f flv rtmp://localhost/live/STREAM_NAME
```

## From OBS
Settings -> Stream

Stream Type: Custom Streaming Server

URL: rtmp://localhost/live

Stream key: <STREAM_NAME>

# Accessing the live stream
## RTMP
```
rtmp://localhost/live/STREAM_NAME
```

## http-flv
Direct playback
```
http://localhost:8000/live/STREAM_NAME.flv
```

Or if you want to watch from a website
```
http://localhost:8000/watch/STREAM_NAME
```
