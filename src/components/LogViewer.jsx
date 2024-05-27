import { useEffect, useState, createRef, useContext } from "react";
import PropTypes from "prop-types";

import { IoReloadOutline, IoDownload, IoSave } from "react-icons/io5";
import { RiDeleteBin6Line, RiUpload2Fill } from "react-icons/ri";
// import lodash from 'lodash';

import { TabView, TabPanel } from "primereact/tabview";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
// import { classNames } from "primereact/utils";

import CbaFrame from "./CbaFrame";
import { IBContext } from "./EeWrapper/IBContext";
import ReactJson from "@microlink/react-json-view";

function LogViewer({
    cbaFrame,
    traceLogs,
    scoringResults,
    taskStates,
    onClearLogs,
    className,
}) {

    // const IbState = useContext(IBContext);
    // const { traceLogs, scoringResults, taskStates } = IbState.IBState;

    const [autoscroll, setAutoscroll] = useState(true);
    // const [traceLogs, setTraceLogs] = useState([]);
    // const [scoringResults, setScoringResults] = useState(new Map());
    // const [taskStates, setTaskStates] = useState([]);
    const [uploadedState, setUploadedState] = useState(null);

    const [selectedPayload, setSelectedPayload] = useState({});
    const [selectedRow, setSelectedRow] = useState(-1);
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const currentLog = createRef();
    const selectedLog = createRef();
    const uploadFileState = createRef();

    // console.log("1");

    useEffect(() => {
        if (autoscroll && currentLog.current)
            currentLog.current.scrollIntoView(false, { behavior: "smooth", block: "end"});
        else if(!autoscroll && selectedLog.current)
            selectedLog.current.scrollIntoView(false, { behavior: "smooth", block: "start"});
    }, [autoscroll, selectedLog, currentLog]);

    const setSelected = (i) => {
        setSelectedRow(i);
        setSelectedPayload(traceLogs[i].details);
    }


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

    const sendPreloadState = (state) => {
        if (!!cbaFrame) cbaFrame.current.sendPreloadState(state);
    };

    const renderTracelog = ({ entryId, type, timestamp }, i) => {

        const classIsSelected = selectedRow == i ? "bg-green-400 font-bold" : "hover:bg-blue-200";
        let currentRef =  null;
        // if(autoscroll && i == traceLogs.length-1)
        //     currentRef = currentLog;
        if(!autoscroll && i == selectedRow)
            currentRef = selectedLog;

        return (
                <tr ref={currentRef} onClick={(e) => {setSelected(i); setAutoscroll(false)}} key={i} className={`cursor-pointer transition-colors ${classIsSelected}`}>
                    <td className={`px-3 py-1 text-center`}>
                        {i}
                    </td>
                    <td className={`px-3 py-1 text-center`}>
                        {entryId}
                    </td>
                    <td className={`px-3 py-1 text-center`}>
                        {type}
                    </td>
                    <td className={`px-3 py-1 text-center`}>
                        {timestamp}
                    </td>
                </tr>
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


    const JsonViewer = function ({ payload, dimensions }) {
        return (
            <div className={`flex flex-col gap-2`}>
                <div className="h-7 px-2 bg-black text-white text-sm font-bold flex items-center">
                    {(selectedRow && traceLogs[selectedRow] && traceLogs[selectedRow].type) ? <span>#{selectedRow} - {traceLogs[selectedRow].type}</span>: <span>no event selected</span>}
                    {/* {dimensions && <span className="ml-auto">{dimensions.width} x {dimensions.height}</span>} */}
                </div>
                <div style={{maxHeight: `${Math.floor(dimensions.height)-30}px`}} className={`overflow-y-scroll overflow-x-hidden w-full`}>
                    <ReactJson src={payload} />
                </div>
            </div>
        );
    }


    const ReflexElementWrapperTabview = function ({ dimensions, className }) {

        const tabHeaderITemplate = (options) => {
            return (
                <div onClick={options.onClick} className={options.className}>
                    {/* <i className="pi pi-prime" /> */}
                    {options.titleElement}
                </div>
            );
        };

        return (
            <div style={{maxHeight: `${Math.floor(dimensions.height)}px`}} className={`overflow-y-hidden overflow-x-hidden w-full`}>
                <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)} panelContainerClassName="p-0">
                    <TabPanel header="Trace" headerTemplate={tabHeaderITemplate} >
                        <div className={`flex flex-col ${className}`}>
                            <div className="flex gap-x-4 px-2 py-2 bg-gray-400 items-center">
                                <label className="text-white text-sm font-bold">
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
                                        onClick={(e) => {if(typeof onClearLogs === 'function') onClearLogs();}}
                                    >
                                        <RiDeleteBin6Line />
                                    </button>
                                </div>
                            </div>
                            <div
                                className="flex flex-col gap-4 text-sm overflow-y-auto flex-grow"
                                style={{maxHeight: `${Math.floor(dimensions.height)-75}px`}}
                                id="logscroller"
                            >
                                <table className="relative w-full border text-sm">
                                        <thead className="">
                                            <tr className="border-b border-white">
                                                <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">#</th>
                                                <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">EntryId</th>                                            
                                                <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">Type</th>
                                                <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y bg-slate-100">
                                            {!!traceLogs && traceLogs.map((v, i) => {return renderTracelog(v, i)})}
                                        </tbody>
                                </table>
                                <a ref={currentLog} />
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel header="Scoring" headerTemplate={tabHeaderITemplate} >
                        <div className={`text-sm flex flex-col gap-y-2 p-2 ${className}`}>
                            {scoringResults && scoringResults.size > 0 ? (
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
                    <TabPanel header="State" headerTemplate={tabHeaderITemplate} >
                        <div className={`text-sm flex flex-col gap-y-4 p-2 ${className}`}>
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
            </div>
        );
    }

    return (
        <>
            <ReflexContainer orientation="horizontal" className="max-h-screen">
                <ReflexElement
                        propagateDimensions={true}
                        propagateDimensionsRate={500}
                        flex={0.6}
                        className="upper-pane"
                        style={{ overflow: "clip" }}
                >                
                    <ReflexElementWrapperTabview>
   
                    </ReflexElementWrapperTabview>
                </ReflexElement>

                <ReflexSplitter
                    className="flex items-center"
                    style={{ height: "10px" }}
                ></ReflexSplitter>
                <ReflexElement style={{overflowY: "hidden"}} className="lower-pane" propagateDimensionsRate={200} propagateDimensions={true}>
                    <JsonViewer payload={selectedPayload} />
                </ReflexElement>                

            </ReflexContainer>
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
