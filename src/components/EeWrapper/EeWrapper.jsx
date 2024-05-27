import { useEffect, useState, createRef, useReducer, PureComponent } from "react";
import PropTypes from "prop-types";
import urlPropType from "url-prop-type";
import lodash, { set } from 'lodash';

import useWindowDimensions from "src/hooks/useWindowDimensions";

import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import "react-reflex/styles.css";
import LogViewer from "../LogViewer";
import CbaFrame from "../CbaFrame";


class EeWrapperClass extends PureComponent {

  constructor(props) {
    super(props);

    this.CbaFrameRef = createRef();

    this.state = {
      traceLogs: [],
      scoringResults: new Map(),
      taskStates: [],
      dimensions: this.getWindowDimensions()
    };
  }

  componentDidMount() {
    window.addEventListener("message", this.receive);
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("message", this.receive);
    window.removeEventListener('resize', this.handleResize);
  }

  getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }

  handleResize = () => {
    this.setState({dimensions: this.getWindowDimensions()});
  }

  clearLogs = () => { this.setState({ traceLogs: [] }); };

  parseScoringResult = (results) => {
    let classes = [];
    let hits = [];
    let _scoringResults = new Map(this.scoringResults);

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

    this.setState({ scoringResults: _scoringResults });
  };


  receive = (event) => {
    console.log(this.CbaFrameRef?.current);
    if (typeof event.data != "string") return;
    if (!this.CbaFrameRef?.current?.iframeRef) return;
    if (event.source !== this.CbaFrameRef.current.iframeRef.current.contentWindow) return;

    try {
      const data = JSON.parse(event.data);
      const type = data.eventType;

      console.log(type);

      if (type == "traceLogTransmission") {
        this.setState({ traceLogs: [...this.state.traceLogs, ...data.traceLogData.logEntriesList] });
      } else if (type == "getScoringResultReturn" && data.result) {
        this.parseScoringResult(data.result);
      } else if (type == "getTasksStateReturn" && !!data.state && !lodash.isEmpty(data?.state.taskNavigatorState)) {
        console.log(data.state);
        this.setState({ taskStates: [...this.state.taskStates, { timestamp: Date.now(), state: data.state }] });
      }
    } catch (error) {
      console.error(error);
    }
  };

  render() {

    const itemWidth = 1024;
    const itemHeight = 768;

    return (
      <>
        <div
          id="item-wrapper"
          className="overflow-hidden w-full h-full"
          style={{
            height: this.state.dimensions.height + "px",
            width: this.state.dimensions.width + "px",
          }}
        >
          <ReflexContainer orientation="vertical">
            <ReflexElement
              propagateDimensions={true}
              propagateDimensionsRate={500}
              flex={0.7}
              className="left-pane max-h-screen"
              style={{ overflow: "hidden" }}
            >
              <CbaFrame url={this.props.url} itemDimensions={{ width: itemWidth, height: itemHeight }} ref={this.CbaFrameRef} />
            </ReflexElement>

            <ReflexSplitter
              className="flex items-center"
              style={{ width: "10px" }}
            ></ReflexSplitter>

            <ReflexElement minSize={600} className="right-pane">
              <LogViewer className={`py-2`} traceLogs={this.state.traceLogs} scoringResults={this.state.scoringResults} taskStates={this.state.taskStates} cbaFrame={this.CbaFrameRef} onClearLogs={this.clearLogs} />
              {/* <LogViewer className={`py-2`} cbaFrame={CbaFrameRef} /> */}
            </ReflexElement>
          </ReflexContainer>
        </div>
      </>
    );
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

EeWrapperClass.propTypes = {
  url: urlPropType.isRequired,
};

export default EeWrapperClass;
