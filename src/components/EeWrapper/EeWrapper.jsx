import { useEffect, useState, createRef } from "react";
import PropTypes from "prop-types";
import urlPropType from "url-prop-type";
import useWindowDimensions from "src/hooks/useWindowDimensions";
// import { Splitter, SplitterPanel } from "primereact/splitter";

import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import "react-reflex/styles.css";
import LogViewer from "../LogViewer";
// import Cbaframe from "../CbaFrame";
import CbaFrame from "../CbaFrame";

function EeWrapper({ url }) {

  const windowDimensions = useWindowDimensions();

  const CbaFrameRef = createRef();

  const itemWidth = 1024;
  const itemHeight = 768;

  return (
    <>
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
            style={{overflow: "hidden"}}
          >
            <CbaFrame url={url} itemDimensions={{width: itemWidth, height: itemHeight}} ref={CbaFrameRef} />
          </ReflexElement>

          <ReflexSplitter
            className="flex items-center mx-2"
            style={{ width: "10px" }}
          ></ReflexSplitter>

          <ReflexElement className="right-pane">
              {/* <LogViewer className={`py-2`} traceLogs={traceLogs} scoringResults={scoringResults} taskStates={taskStates} cbaFrame={CbaFrameRef} /> */}
              <LogViewer className={`py-2`}  cbaFrame={CbaFrameRef} />
          </ReflexElement>
        </ReflexContainer>
      </div>
    </>
  );
}

EeWrapper.propTypes = {
  url: urlPropType.isRequired,
};

export default EeWrapper;
