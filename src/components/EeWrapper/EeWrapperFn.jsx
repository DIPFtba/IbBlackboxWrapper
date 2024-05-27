import { useEffect, useState, createRef, useReducer, PureComponent } from "react";
import PropTypes from "prop-types";
import urlPropType from "url-prop-type";
import lodash, { set } from 'lodash';

import useWindowDimensions from "src/hooks/useWindowDimensions";

// import { Splitter, SplitterPanel } from "primereact/splitter";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import { IBContext } from './IBContext.jsx';

import "react-reflex/styles.css";
import LogViewer from "../LogViewer";
// import Cbaframe from "../CbaFrame";
import CbaFrame from "../CbaFrame";

const initialState = {
  traceLogs: [],
  scoringResults: new Map(),
  taskStates: []
};

const IbReducer = (state, action) => {
  switch (action.type) {
    case "traceLogTransmission":
      return { ...state, traceLogs: [...state.traceLogs, ...action.traceLogData.logEntriesList] };
    case "clearTraceLogs":
      return { ...state, traceLogs: [] };
    case "getScoringResultReturn":
      return { ...state, scoringResults: action.result };
    case "getTasksStateReturn":
      return { ...state, taskStates: [...state.taskStates, { timestamp: Date.now(), state: action.state }] };
    default:
      return state;
  }
}


function EeWrapper({ url }) {

    const windowDimensions = useWindowDimensions();

    // const [IBState, dispatch] = useReducer(
    //   IbReducer,
    //   initialState
    // );

    const [traceLogs, setTraceLogs] = useState([]);
    const [scoringResults, setScoringResults] = useState(new Map());
    const [taskStates, setTaskStates] = useState([]);

    const CbaFrameRef = createRef();

    const itemWidth = 1024;
    const itemHeight = 768;

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

        // dispatch({ type: "getScoringResultReturn", result: _scoringResults });
        setScoringResults(_scoringResults);
    };


    const receive = (event) => {
        console.log(CbaFrameRef?.current);
        if (typeof event.data != "string") return;
        if (!CbaFrameRef?.current?.iframeRef) return;
        if (event.source !== CbaFrameRef.current.iframeRef.current.contentWindow) return;

        try {
            const data = JSON.parse(event.data);
            const type = data.eventType;

            console.log(type);

            if (type == "traceLogTransmission") {
                // dispatch({ type: "traceLogTransmission", traceLogData: data.traceLogData });
                setTraceLogs([...traceLogs, ...data.traceLogData.logEntriesList]);
            } else if (type == "getScoringResultReturn" && data.result) {
                // parseScoringResult(data.result);
            } else if (type == "getTasksStateReturn" && !!data.state && !lodash.isEmpty(data?.state.taskNavigatorState)) {
                console.log(data.state);
                // dispatch({ type: "getTasksStateReturn", state: data.state });
                // setTaskStates([...taskStates, { timestamp: Date.now(), state: data.state }]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {

        console.log("EeWrapper mounted");
        window.addEventListener("message", receive);
        return () => {
            console.log("EeWrapper unmounted");
            window.removeEventListener("message", receive);
        };
    }, []);

    return (
        <>
            {/* <IBContext.Provider value={{ IBState }}> */}
            <div
                id="item-wrapper"
                className="overflow-hidden w-full h-full"
                style={{
                    height: windowDimensions.height + "px",
                    width: windowDimensions.width + "px",
                }}
            >
                <ReflexContainer orientation="vertical">
                    <ReflexElement
                        propagateDimensions={true}
                        propagateDimensionsRate={500}
                        flex={0.8}
                        className="left-pane max-h-screen"
                        style={{ overflow: "hidden" }}
                    >
                        <CbaFrame url={url} itemDimensions={{ width: itemWidth, height: itemHeight }} ref={CbaFrameRef} />
                    </ReflexElement>

                    <ReflexSplitter
                        className="flex items-center mx-2"
                        style={{ width: "10px" }}
                    ></ReflexSplitter>

                    <ReflexElement className="right-pane">
                        <LogViewer className={`py-2`} traceLogs={traceLogs} scoringResults={scoringResults} taskStates={taskStates} cbaFrame={CbaFrameRef} />
                        {/* <LogViewer className={`py-2`} cbaFrame={CbaFrameRef} /> */}
                    </ReflexElement>
                </ReflexContainer>
            </div>
            {/* </IBContext.Provider> */}
        </>
    );
}

EeWrapper.propTypes = {
    url: urlPropType.isRequired,
};


export default EeWrapper;