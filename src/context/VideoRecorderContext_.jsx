import React, { Component, createContext } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

// const ffmpeg = createFFmpeg({ log: true });

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
        // const ffmpegRef = useRef(new FFmpeg());
        // const videoRef = useRef<HTMLVideoElement | null>(null)
        // const messageRef = useRef<HTMLParagraphElement | null>(null)
        // this.ffmpegRef = React.createRef(new FFmpeg());
        this.ffmpegRef = React.createRef();
        this.ffmpeg = new FFmpeg();
    }

    // codec = 'video/webm; codecs="vp9,opus"';
    codec = 'video/webm; codecs="vp8,opus';

    componentDidMount() {
        console.log("VideoRecorderProvider mounted");
        this.setState({ isSupported: MediaRecorder.isTypeSupported(this.codec) });
        this.ffmpegRef.current = new FFmpeg();
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

    download = () => {
        const blob = new Blob(this.state.recordedBlobs, { type: 'video/webm' });
        // const url = window.URL.createObjectURL(blob);
        this.setState({ isProcessing: true });
        this.processVideo(blob)
        .then((url) => {            
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "test.webm";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        })
        .finally(() => {
            this.setState({ isProcessing: false });
        });
    };

    
    loadFFmpeg = async () => {
        this.setState({ isFFMPEGLoading: true });
        const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
        const ffmpeg = this.ffmpegRef.current;
        // const ffmpeg = this.ffmpeg;
        ffmpeg.on("log", ({ message }) => {
        //   if (this.messageRef.current) this.messageRef.current.innerHTML = message;
            console.log(message);
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        // await ffmpeg.load();
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
          ),
          workerURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.worker.js`,
            "text/javascript"
          ),
        });
        this.setState({ isFFMPEGLoading: false });
    };

    processVideo = async (blob) => {
        // Load the FFmpeg core
        await this.loadFFmpeg();
      
        // Convert the Blob to a Uint8Array
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
      
        // Write the file to FFmpeg's filesystem
        this.ffmpeg.writeFile('input.webm', uint8Array);
      
        // Run the FFmpeg command to fix the indexing
        await this.ffmpeg.exec(['-i', 'input.webm', 'output.webm']);
      
        // Read the result from FFmpeg's filesystem and create a Blob URL
        const outputUint8Array = await this.ffmpeg.readFile('output.webm');
        const outputBlob = new Blob([outputUint8Array], { type: 'video/webm' });
        const outputUrl = URL.createObjectURL(outputBlob);
      
        // Return the Blob URL
        return outputUrl;
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
                    download: this.download,
                }}
            >
                {this.props.children}
            </VideoRecorderContext.Provider>
        );
    }
}

export default VideoRecorderProvider;


/*

const initialState = {
    recordedBlobs: [],
    time: 0,
    timerId: null,
    mediaRecorder: null,
    stream: null,
    tsStart: null,
    tsEnd: null,
    isSupported: false,
};

const reducer = (state, action) => {
    switch (action.type) {
        case "SET_RECORDED_BLOBS":
            return { ...state, recordedBlobs: action.payload };
        case "INCREMENT_TIME":
            return { ...state, time: state.time + 1};
        case "RESET_TIME":
            return { ...state, time: 0 };
        case "SET_TIMER_ID":
            return { ...state, timerId: action.payload };
        case "SET_MEDIA_RECORDER":
            return { ...state, mediaRecorder: action.payload };
        case "SET_STREAM":
            return { ...state, stream: action.payload };
        case "SET_TS_START":
            return { ...state, tsStart: action.payload };
        case "SET_TS_END":
            return { ...state, tsEnd: action.payload };
        case "RESET":
            return initialState;
        default:
            return state;
    }
};

const VideoRecorderProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const handleDataAvailable = (event) => {
        if (event.data && event.data.size > 0) {
            console.log("data available", event.data.size);
            dispatch({
                type: "SET_RECORDED_BLOBS",
                payload: [...state.recordedBlobs, event.data],
            });
        }
    };

    const handleStop = () => {
        console.log("recording stopped");
        window.clearInterval(state.timerId);
        state.stream.getTracks().forEach((track) => track.stop());        
        // dispatch({ type: "RESET_TIME" });
        dispatch({ type: "SET_TS_END", payload: new Date() });
    };

    const handleStart = () => {
        console.log("recording started");
        const timerId = window.setInterval(() => {
            dispatch({ type: "INCREMENT_TIME"});
        }, 1000);
        console.log("timerId", timerId);
        dispatch({ type: "SET_TIMER_ID", payload: timerId });
        dispatch({ type: "SET_TS_START", payload: new Date() });
    };

    useEffect(() => {
        console.log("useEffect:", state.mediaRecorder, state.timerId)
        if (state.mediaRecorder) {
            state.mediaRecorder.ondataavailable = handleDataAvailable;
            state.mediaRecorder.onstart = handleStart;
            state.mediaRecorder.onstop = handleStop;

            return () => {
                console.log("cleanup");
                state.mediaRecorder.ondataavailable = null;
                state.mediaRecorder.onstart = null;
                state.mediaRecorder.onstop = null;
            };            
        }
    }, [state.mediaRecorder, state.timerId]);

    const startRecording = async () => {
        if (state.mediaRecorder?.state !== "recording") {
            dispatch({ type: "RESET"});
            try {
                let stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                let _mediaRecorder = new MediaRecorder(stream);
                _mediaRecorder.start();
                dispatch({ type: "SET_STREAM", payload: stream });
                dispatch({ type: "SET_MEDIA_RECORDER", payload: _mediaRecorder });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const stopRecording = () => {
        if (
            state.mediaRecorder &&
            state.mediaRecorder.state === "recording"
        ) {
            dispatch({ type: "SET_TS_END", payload: new Date() });
            state.mediaRecorder.stop();
        }
    };

    const download = () => {
        const blob = new Blob(state.recordedBlobs, { type: "video/webm" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "test.webm";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    const { recordedBlobs, time, mediaRecorder, tsStart, tsEnd } = state;
    const recorderState = mediaRecorder ? mediaRecorder.state : null;

    return (
        <VideoRecorderContext.Provider
            value={{
                tsStart,
                tsEnd,
                recordedBlobs,
                time,
                state: recorderState,
                startRecording,
                stopRecording,
                download,
            }}
        >
            {children}
        </VideoRecorderContext.Provider>
    );
};
*/

// export default VideoRecorderProvider;

// const VideoRecorderProvider = ({ children }) => {
//     const [recordedBlobs, setRecordedBlobs] = useState([]);
//     const [time, setTime] = useState(0);
//     const [timerId, setTimerId] = useState(null);
//     const [mediaRecorder, setMediaRecorder] = useState(null);
//     const [tsStart, setTsStart] = useState(null);
//     const [tsEnd, setTsEnd] = useState(null);

//     const handleDataAvailable = (event) => {
//         if (event.data && event.data.size > 0) {
//             console.log("data available", event.data.size);
//             setRecordedBlobs([...recordedBlobs, event.data]);
//         }
//     };

//     const handleStop = () => {
//         console.log('recording stopped');
//         window.clearInterval(timerId);
//         setTime(0);
//         // setTimer(null);
//         setTsEnd(new Date());
//     }

//     const handleStart = () => {
//         console.log('recording started');
//         const _timer = window.setInterval(() => {
//             setTime(t => t + 1);
//         }, 1000);
//         setTimerId(_timer);
//         setTsStart(new Date());
//     }

//     useEffect(() => {
//         if(mediaRecorder) {
//             mediaRecorder.ondataavailable = handleDataAvailable;
//             mediaRecorder.onstart = handleStart;
//             mediaRecorder.onstop = handleStop;
//         }
//     }, [mediaRecorder]);



//     const startRecording = async () => {
//         setTime(0);    
//         setRecordedBlobs([]);
//         let stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//         let _mediaRecorder = new MediaRecorder(stream);
//         _mediaRecorder.start();
//         setMediaRecorder(_mediaRecorder);
//     }

//     const stopRecording = () => {
//         if(mediaRecorder && mediaRecorder.state === 'recording'){
//             mediaRecorder.stop();
//             setTsEnd(new Date());
//         }
//         // setMediaRecorder(null);        
//     }

//     const download = () => {
//         const blob = new Blob(recordedBlobs, { type: 'video/webm' });
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.style.display = 'none';
//         a.href = url;
//         a.download = 'test.webm';
//         document.body.appendChild(a);
//         a.click();
//         setTimeout(() => {
//             document.body.removeChild(a);
//             window.URL.revokeObjectURL(url);
//         }, 100);
//     }

//     const state = mediaRecorder ? mediaRecorder.state : null;

//     return (


//         <VideoRecorderContext.Provider
//             value={{
//                 tsStart,
//                 tsEnd,
//                 recordedBlobs,
//                 time,
//                 state,
//                 startRecording,
//                 stopRecording,
//                 download
//             }}
//         >
//             {children}
//         </VideoRecorderContext.Provider>
//     );
// };

// export default VideoRecorderProvider;