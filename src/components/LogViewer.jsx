import { useEffect, useState, createRef } from "react";
import PropTypes from "prop-types";

import { IoReloadOutline, IoDownload, IoSave } from "react-icons/io5";
import { RiDeleteBin6Line, RiUpload2Fill } from "react-icons/ri";
import lodash from 'lodash';

import { TabView, TabPanel } from "primereact/tabview";
// import { classNames } from "primereact/utils";

import CbaFrame from "./CbaFrame";

function LogViewer({
    //   traceLogs,
    //   scoringResults,
    //   taskStates,
    cbaFrame,
    className,
}) {

    const [autoscroll, setAutoscroll] = useState(true);
    const [traceLogs, setTraceLogs] = useState([]);
    const [scoringResults, setScoringResults] = useState(new Map());
    const [taskStates, setTaskStates] = useState([]);
    const [uploadedState, setUploadedState] = useState(null);

    const logScroller = createRef();
    const endOfLog = createRef();
    const uploadFileState = createRef();

    useEffect(() => {
        window.addEventListener("message", receive);
        return () => {
            window.removeEventListener("message", receive);
        };
    });

    useEffect(() => {
        if (autoscroll && endOfLog.current)
            endOfLog.current?.scrollIntoView({ behavior: "smooth" });
    });


    const parseScoringResult = (results) => {
        let classes = [];
        let hits = [];
        let _scoringResults = new Map(scoringResults);

        for (let i of Object.keys(results)) {
            if (i.indexOf("hit.") >= 0 && results[i] == true)
                hits.push(i.split(".")[1]);
        }

        for (let i of Object.keys(results)) {
            if (i.indexOf("hitClass.") >= 0) {
                let hit = hits.indexOf(i.split(".")[1]);
                if (hit >= 0) {
                    let text = "";
                    if (typeof results["hitText." + hits[hit]] == "string")
                        text = results["hitText." + hits[hit]];
                    classes.push({ class: results[i], hit: hits[hit], text: text });
                    _scoringResults.set(results[i] + ".hit", hits[hit]);
                    if (text.length > 0)
                        // this.response.set(identifier + "." + results[i] + ".hitText", text);
                        _scoringResults.set(results[i] + ".hitText", text);
                }
            }
        }

        setScoringResults(_scoringResults);
    };

    const receive = (event) => {
        if (typeof event.data != "string") return;
        if (!cbaFrame?.current?.iframeRef) return;
        if (event.source !== cbaFrame.current.iframeRef.current.contentWindow) return;

        try {
            const data = JSON.parse(event.data);
            const type = data.eventType;

            if (type == "traceLogTransmission") {
                setTraceLogs([...traceLogs, ...data.traceLogData.logEntriesList]);
            } else if (type == "getScoringResultReturn" && data.result) {
                parseScoringResult(data.result);
            } else if (type == "getTasksStateReturn" && !!data.state && !lodash.isEmpty(data?.state.taskNavigatorState)) {
                console.log(data.state);
                setTaskStates([
                    ...taskStates,
                    { timestamp: Date.now(), state: data.state },
                ]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAutoscroll = () => {
        setAutoscroll(!autoscroll);
    };


    const sendGetState = (e) => {
        if (!!cbaFrame) cbaFrame.current.sendGetState();
    };

    const downloadState = async (state) => {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(state)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "state.json";
        link.click();
    };


    const onFileChange = event => {
        // this.setUploadedState({ selectedFile: event.target.files[0] });
        if(!event?.target?.files || !event?.target?.files[0])
            return false;

        try {
            const fileReader = new FileReader()
    
            fileReader.onload = event => {
                if (event.target) {
                    sendPreloadState(JSON.parse(event.target.result));
                }
            }
    
            fileReader.onerror = error => reject(error)
            fileReader.readAsText(event.target.files[0])
            
        } catch (error) {
            console.error(error);
        }
    };
    const uploadState = () => {

    }

    const sendPreloadState = (state) => {
        if (!!cbaFrame) cbaFrame.current.sendPreloadState(state);
    };

    const renderTracelog = ({ entryId, type, timestamp }) => {
        return (
            <div className="flex flex-col">
                <div>
                    <b>entryId: </b>
                    {entryId}
                </div>
                <div>
                    <b>type: </b>
                    {type}
                </div>
                <div>
                    <b>timestamp: </b>
                    {timestamp}
                </div>
            </div>
        );
    };

    const StateTemplate = ({ item, className }) => {
        const time = new Date(item.timestamp);
        const timeString = `${(time.getHours() + '').padStart(2, '0')}:${(time.getMinutes() + '').padStart(2, '0')}:${(time.getSeconds() + '').padStart(2, '0')}`;

        return (
            <div className={`${className} w-full`}>
                <div className="flex w-full items-center gap-x-2">
                    <div>{timeString}</div>
                    <div className="grow flex gap-x-2 justify-end">
                        <button
                            className="text-lg p-1"
                            onClick={(e) => sendPreloadState(item.state)}
                        >
                            <IoReloadOutline />
                        </button>
                        <button
                            className="text-lg p-1"
                            onClick={(e) => downloadState(item.state)}
                        >
                            <IoDownload />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <TabView panelContainerClassName="p-0 pr-2">
                <TabPanel header="Trace">
                    <div className={`flex flex-col gap-y-2 ${className}`}>
                        <div className="flex gap-x-4">
                            <label>
                                <input
                                    type="checkbox"
                                    name="autoscroll"
                                    id="autoscroll"
                                    checked={autoscroll}
                                    onChange={handleAutoscroll}
                                    className="mr-2"
                                ></input>
                                autoscroll
                            </label>
                            <div className="grow flex justify-end">
                                <button
                                    className="text-lg p-1"
                                    onClick={(e) => setTraceLogs([])}
                                >
                                    <RiDeleteBin6Line />
                                </button>
                            </div>
                        </div>
                        <div
                            className="flex flex-col gap-4 text-sm overflow-auto flex-grow max-h-[calc(100vh-150px)]"
                            ref={logScroller}
                            id="logscroller"
                        >
                            {traceLogs.map((v, i) => <div key={i}>{renderTracelog(v)}</div>)}
                            <a key="end-of-log" id="end-of-log" ref={endOfLog} />
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Scoring">
                    <div className={`text-sm flex flex-col gap-y-2 ${className}`}>
                        {scoringResults.size > 0 ? (
                            Array.from(scoringResults.keys()).map((key, i) => {
                                return (
                                    <p key={i} className="">
                                        <b>{key}: </b> {scoringResults.get(key)} <br />
                                    </p>
                                );
                            })
                        ) : (
                            <p>Noch keine Ergebnisse</p>
                        )}
                    </div>
                </TabPanel>
                <TabPanel header="State">
                    <div className={`text-sm flex flex-col gap-y-4 ${className}`}>
                        <div className="flex gap-x-4">
                            <button className="btn grow flex items-center justify-center gap-x-2" type="button" onClick={sendGetState}>
                                <IoSave />
                                <span>getState</span>
                            </button>
                            <button className="btn grow flex items-center justify-center gap-x-2" onClick={e => uploadFileState?.current?.click()} type="button">
                                <RiUpload2Fill />
                                <span>upload</span>
                            </button>
                            <input type="file" hidden ref={uploadFileState} onChange={onFileChange} />
                        </div>
                        {!!taskStates && taskStates.length > 0 && (
                            <div className="flex flex-col text-sm overflow-auto flex-grow max-h-[calc(100vh-150px)]">
                                {taskStates.map((s, i) => (
                                    <StateTemplate
                                        className={`odd:bg-slate-100 p-2`}
                                        key={i}
                                        item={s}
                                    />
                                ))}
                            </div>
                        )}
                        {(!taskStates || taskStates.length == 0) && (
                            <div>no states yet</div>
                        )}
                    </div>
                </TabPanel>
            </TabView>
        </>
    );
}

LogViewer.propTypes = {
    //   traceLogs: PropTypes.arrayOf(
    //     PropTypes.shape({
    //       details: PropTypes.object,
    //       entryId: PropTypes.string,
    //       timestamp: PropTypes.string,
    //       type: PropTypes.string,
    //     })
    //   ),
    //   scoringResults: PropTypes.instanceOf(Map),
    //   taskStates: PropTypes.arrayOf(
    //     PropTypes.shape({
    //       timestamp: PropTypes.number,
    //       state: PropTypes.object,
    //     })
    //   ),
    cbaFrame: PropTypes.oneOfType([
        // Either a function
        PropTypes.func,
        // Or the instance of a DOM native element (see the note about SSR)
        PropTypes.shape({ current: PropTypes.instanceOf(CbaFrame) }),
    ]),
};

export default LogViewer;
