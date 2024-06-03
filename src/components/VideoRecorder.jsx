import React, { useState, useContext } from 'react';
import { VideoRecorderContext } from 'src/context/VideoRecorderContext';
import ClipLoader from "react-spinners/ClipLoader";
import {
    BlobReader,
    BlobWriter,
    TextReader,
    TextWriter,
    ZipReader,
    ZipWriter,
  } from "@zip.js/zip.js";
import { get } from 'lodash';


const VideoRecorder = (props) => {

    const { startRecording, stopRecording, time, tsStart, tsEnd, state, recordedBlobs, isSupported, isFFMPEGLoading, getBlob} = useContext(VideoRecorderContext);

    const [isProcessing, setIsProcessing] = useState(false);

    const loader = <ClipLoader
        loading={isProcessing}
        size={15}
        aria-label="Loading Spinner"
        data-testid="loader"
    />

    const downloadHelper = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    const downloadWebm = () => {
        try {
            const blob = getBlob();
            downloadHelper(blob, "recording.webm");               
        } catch (error) {
            console.error(error);
        }
    };

    const downloadPackage = async () => {

        if(!isSupported || !tsStart || !tsEnd) return;

        try {
            setIsProcessing(true);
            const data = {tsStart, tsEnd, time};
            if(props.traceLogs) data.traceLogs = props.traceLogs;
            const zipFileWriter = new BlobWriter();

            // Creates a TextReader object storing the text of the entry to add in the zip
            const helloWorldReader = new TextReader(JSON.stringify(data));

            const blobReader = new BlobReader(getBlob());
            
            // Creates a ZipWriter object writing data via `zipFileWriter`, adds the entry
            // "hello.txt" containing the text "Hello world!" via `helloWorldReader`, and
            // closes the writer.
            const zipWriter = new ZipWriter(zipFileWriter);
            await zipWriter.add("meta.json", helloWorldReader);
            await zipWriter.add("recording.webm", blobReader);
            await zipWriter.close();
            // Retrieves the Blob object containing the zip content into `zipFileBlob`. It
            // is also returned by zipWriter.close() for more convenience.
            const zipFileBlob = await zipFileWriter.getData();

            downloadHelper(zipFileBlob, "recording.zip");

        } catch (error) {
            console.error(error);
        }
        finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            {isFFMPEGLoading && <div className='bg-yellow-700 text-white font-bold px-2 text-xs mb-2'>FFMPEG is loading</div>}
            {!isSupported && <div className='bg-red-700 text-white font-bold px-2 text-xs mb-2'>Browser not supported</div>}
            {isSupported && <>
                    <div className='flex gap-2'>
                        {(isSupported && state!="recording") && <button onClick={startRecording}>Start Recording</button>}
                        {(isSupported && state=="recording") && <button onClick={stopRecording}>Stop Recording</button>}
                        <button disabled={!isSupported || state=="recording" || !recordedBlobs?.length } onClick={downloadWebm}> Download (webm)</button>
                        <button disabled={!isSupported || state=="recording" || !recordedBlobs?.length } onClick={downloadPackage}>{isProcessing && loader} Download (zip)</button>

                    </div>
                    <div>
                        <span>Length: {time}s</span><br/>
                        {tsStart && <><span>Start: {tsStart.toLocaleString()}</span><br/></>}
                        {tsEnd && <><span>End: {tsEnd.toLocaleString()}</span><br/></>}
                        <span>State: {state}</span>
                    </div>
                </>
            }
        </div>
    );
};

export default VideoRecorder;