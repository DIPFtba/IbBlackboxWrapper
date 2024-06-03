import React, { Component, createContext } from "react";

export const VideoRecorderContext = createContext();


class VideoRecorderProvider extends Component {

    constructor(props) {
        super(props);
        this.state = {
            recordedBlobs: [],
            time: 0,
            timerId: null,
            mediaRecorder: null,
            stream: null,
            tsStart: null,
            tsEnd: null,
            isSupported: false,
            isProcessing: false,
            isFFMPEGLoading: false,
        };
    }

    // codec = 'video/webm; codecs="vp9,opus"';
    codec = 'video/webm; codecs="vp8,opus';

    componentDidMount() {
        console.log("VideoRecorderProvider mounted");
        this.setState({ isSupported: MediaRecorder.isTypeSupported(this.codec) });
    }

    handleDataAvailable = (event) => {
        if (event.data && event.data.size > 0) {
            console.log("data available", event.data.size);
            this.setState((prevState) => ({
                recordedBlobs: [...prevState.recordedBlobs, event.data],
            }));
        }
    };

    handleStop = () => {
        console.log("recording stopped");
        window.clearInterval(this.state.timerId);
        this.state.stream.getTracks().forEach((track) => track.stop());
        this.setState({ tsEnd: new Date() });
    };

    handleStart = () => {
        console.log("recording started");
        const timerId = window.setInterval(() => {
            this.setState((prevState) => ({ time: prevState.time + 1 }));
        }, 1000);
        console.log("timerId", timerId);
        this.setState({ timerId, tsStart: new Date() });
    };

    startRecording = async () => {
        if (this.state.mediaRecorder?.state !== "recording") {
            if (!this.state.isSupported)  {
                console.error(this.codec+" is not supported");
                return;
            }
            this.setState({
                recordedBlobs: [],
                time: 0,
                tsStart: null,
                tsEnd: null,
            });
            try {
                let stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                });
                // let _mediaRecorder = new MediaRecorder(stream, { mimeType: this.codec });
                let _mediaRecorder = new MediaRecorder(stream);
                _mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
                _mediaRecorder.onstart = this.handleStart.bind(this);
                _mediaRecorder.onstop = this.handleStop.bind(this);           
                _mediaRecorder.start();
                this.setState({ stream, mediaRecorder: _mediaRecorder });
            } catch (error) {
                console.error(error);
            }
        }
    };

    stopRecording = () => {
        if (
            this.state.mediaRecorder &&
            this.state.mediaRecorder.state === "recording"
        ) {
            this.setState({ tsEnd: new Date() });
            this.state.mediaRecorder.stop();
        }
    };

    getBlob = () => {
        return new Blob(this.state.recordedBlobs, { type: 'video/webm' });
    }

    render() {
        const { recordedBlobs, time, mediaRecorder, tsStart, tsEnd, isSupported, isFFMPEGLoading, isProcessing} = this.state;
        const recorderState = mediaRecorder ? mediaRecorder.state : null;

        return (
            <VideoRecorderContext.Provider
                value={{
                    isSupported,
                    tsStart,
                    tsEnd,
                    recordedBlobs,
                    time,
                    state: recorderState,
                    isFFMPEGLoading,
                    isProcessing,
                    startRecording: this.startRecording,
                    stopRecording: this.stopRecording,
                    getBlob: this.getBlob
                }}
            >
                {this.props.children}
            </VideoRecorderContext.Provider>
        );
    }
}

export default VideoRecorderProvider;
