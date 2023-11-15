import React, { useState, useEffect } from 'react';
import { withOrientationChange } from 'react-device-detect';
import MobileEnginesList from './MobileEnginesList';
import Variations from './Variations';
import VariationActions from './VariationActions';
import Toolbar from './Toolbar';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MoveReference from './MoveReference';
import BoardReference from './BoardReference';
import VariationOptionsModal from './VariationOptionsModal';
import Uploads from './Uploads';
import { IoMdFolder } from 'react-icons/io';
import { RiFile3Fill } from 'react-icons/ri';
import { GoGraph } from 'react-icons/go';
import { GiChessKing } from 'react-icons/gi';
import { SlGraph } from 'react-icons/sl';
import AnalysisArea from './AnalysisArea';
import { connect } from 'react-redux';
import {
  uploadFiles,
  setCurrentDirectory,
  setLoader,
  setGameReference,
  setMoveLoader,
  setReference,
  setUserUploads,
  setAnalyzingFenTabIndx,
} from '../../actions/board';
import VideosArea from './VideosArea';
import UploadsLimitModal from './UploadsLimitModal';
import { FaVideo, FaRegFilePdf } from 'react-icons/fa';
import MultiTabNotations from './MultiTabNotations';
import PdfScanner from './PdfScanner';
import DecodeChess from '../common/DecodeChess';
import FullGameAnalysis from './FullGameAnalysis';
import ActiveVarOptionsModal from './ActiveVarOptionsModal';
import CreateNewFolderModal from './CreateNewFolderModal';

const SYMBOL_MODE_LS_OPTION = 'dashboard:symbolMode';
const ACTIVE_NOTATION = require('../../../public/assets/images/pgn-viewer/notation-active.svg');
const INACTIVE_NOTATION = require('../../../public/assets/images/pgn-viewer/notation-inactive.svg');
const ACTIVE_REFERENCE = require('../../../public/assets/images/pgn-viewer/reference-active.svg');
const INACTIVE_REFERENCE = require('../../../public/assets/images/pgn-viewer/reference-inactive.svg');

const mapStateToProps = (state) => {
  return {
    variationOpt: state.board.variationOpt,
    pgnStr: state.board.pgnStr,
    pgn: state.board.pgn,
    userFullInfo: state.cloud.userFullInfo,
    activeFileInfo: state.board.activeFileInfo,
    fen: state.board.fen,
    searchParams: state.board.searchParams,
    uploadFilterByPos: state.board.uploadFilterByPos,
    loader: state.board.loader,
    allPgnArr: state.board.allPgnArr,
    activePgnTab: state.board.activePgnTab,
    analyzingFenTabIndx: state.board.analyzingFenTabIndx,
    featureTab: state.board.featureTab,
  };
};

const MobilePGNViewer = (props) => {
  const {
    variationOpt,
    activeFileInfo,
    pgnStr,
    userFullInfo,
    handleAnalyze,
    fenToAnalyze,
    setFenToAnalyze,
    uploadFiles,
    setCurrentDirectory,
    activeTab,
    setActiveTab,
    fen,
    setLoader,
    setGameReference,
    setMoveLoader,
    setReference,
    setUserUploads,
    searchParams,
    uploadFilterByPos,
    tourType,
    tourStepNumber,
    setTourNextStep,
    loader,
    allPgnArr,
    activePgnTab,
    analyzingFenTabIndx,
    setScannerImg,
    setAnalyzingFenTabIndx,
    pgn,
    featureTab,
  } = props;
  const [symbolMode, setSymbolMode] = useState('');
  const [commentField, setCommentField] = useState(false);
  const [videoLimit, setVideoLimit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    message: '',
    percent: null,
  });
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [enginesOptionsList, setEnginesOptionsList] = useState({});
  const [availableServers, setAvailableServers] = useState([]);
  const [activeVarOpt, setActiveVarOpt] = useState(false);
  const [nextMove, setNextMove] = useState(null);
  const [explanationsContainer, setExplanationsContainer] = useState(false);
  const [editComment, setEditComment] = useState({});
  const [sortByName, setSortByName] = useState(false);

  useEffect(() => {
    if (featureTab !== null) {
      setActiveTab(+featureTab);
    }
  }, [featureTab]);

  const updateReferences = () => {
    setMoveLoader(true);
    setLoader('gameRefLoader');
    setGameReference(false, searchParams);
    setReference(fen, searchParams ? searchParams : '');
  };

  useEffect(() => {
    updateReferences();
    if (tourType === 'study' && tourStepNumber === 1) {
      setTourNextStep();
    }
  }, [fen]);

  useEffect(() => {
    updateReferences();
  }, []);

  useEffect(() => {
    if (!loader.length && createFolderModal) {
      setCreateFolderModal(false);
    }
  }, [loader]);

  useEffect(() => {
    if (uploadFilterByPos) {
      setLoader('fileLoader');
      setUserUploads('/', userFullInfo);
    }
  }, [fen]);

  useEffect(() => {
    setLoader('fileLoader');
    setUserUploads('/', userFullInfo);
  }, [uploadFilterByPos]);

  const updateSymbolMode = (mode) => {
    setSymbolMode(mode);
    window.localStorage.setItem(SYMBOL_MODE_LS_OPTION, mode);
  };

  const regex = /(\d)+\s/g;
  useEffect(() => {
    var socket = new WebSocket(
      `wss://chessify.me/ws/upload_progress/${userFullInfo.username}/`
    );

    socket.onmessage = function (event) {
      var { data } = JSON.parse(event.data);
      if (data.progress) {
        const progressDetails = data.progress.match(regex);
        const progressPercent = Math.round(
          (progressDetails[0] / progressDetails[1]) * 100
        );
        if (progressPercent === 100) {
          setUploadProgress({
            message: '',
            percent: null,
          });
          setLoader('fileLoader');
          setUserUploads('/', userFullInfo);
        } else {
          setUploadProgress({
            message: data.progress,
            percent: progressPercent,
          });
        }
      }
    };
    socket.onerror = function (event, error) {
      console.log('FAILED', event);
    };
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem(SYMBOL_MODE_LS_OPTION) === 'symbol') {
      updateSymbolMode('symbol');
    } else {
      updateSymbolMode('notation');
    }
  });

  const toggleSymbolChange = () =>
    updateSymbolMode(symbolMode === 'symbol' ? 'notation' : 'symbol');

  const getFileList = () => {
    let file = new File([pgnStr], activeFileInfo.file.key.split('/')[2], {
      type: 'application/vnd.chess-pgn',
    });

    let transfer = new DataTransfer();
    transfer.items.add(file);
    let fileList = transfer.files;
    return fileList;
  };

  const saveFileContentHandler = () => {
    setIsLoading(true);
    let fileList = getFileList();

    const path = '/' + activeFileInfo.path + '/';
    uploadFiles(path, fileList, userFullInfo).then(() => {
      setCurrentDirectory('/');
      setIsLoading(false);
    });
  };

  const switchAnalysisTabHandler = () => {
    setAnalyzingFenTabIndx(activePgnTab);
    handleAnalyze(activePgnTab);
  };

  return (
    <div className="mb-pgn-viewer">
      <div className="pgn-viewer-body">
        <Tabs className="analysis-sec">
          <TabList className="tab-style--1 mt--10 ml-3">
            <Tab>
              <SlGraph /> Analysis
            </Tab>
            <Tab>
              <GoGraph /> Full Game Analysis
            </Tab>
            <Tab>
              <GiChessKing /> Decode Chess
            </Tab>
          </TabList>
          <TabPanel>
            {analyzingFenTabIndx === null ||
            analyzingFenTabIndx === activePgnTab ? (
              <div
                id="analysisAreaEngines"
                className="mt--10 ml-3 analysis-area-engines"
              >
                <AnalysisArea
                  handleAnalyze={handleAnalyze}
                  fenToAnalyze={fenToAnalyze}
                  setFenToAnalyze={setFenToAnalyze}
                  enginesOptionsList={enginesOptionsList}
                />
                <MobileEnginesList
                  handleAnalyze={handleAnalyze}
                  fenToAnalyze={fenToAnalyze}
                  setFenToAnalyze={setFenToAnalyze}
                  enginesOptionsList={enginesOptionsList}
                  setEnginesOptionsList={setEnginesOptionsList}
                  availableServers={availableServers}
                  setAvailableServers={setAvailableServers}
                />
              </div>
            ) : (
              <div className="switch-analysis-area">
                <button
                  className="apply-btn switch-analysis-btn"
                  onClick={() => switchAnalysisTabHandler()}
                >
                  Bring Analysis Here
                </button>
              </div>
            )}
          </TabPanel>
          <TabPanel>
            <FullGameAnalysis
              availableServers={availableServers}
              enginesOptionsList={enginesOptionsList}
            />
          </TabPanel>
          <TabPanel>
            <DecodeChess
              explanationsContainer={explanationsContainer}
              setExplanationsContainer={setExplanationsContainer}
            />
          </TabPanel>
        </Tabs>
        <div className="mb-pgn-wrapper">
          <div className="pgn-regulation">
            <div className="pgn-viewer-header mt-4">
              <TabList className="tab-style-mb">
                <Tab onClick={() => setActiveTab(0)}>
                  <img
                    src={activeTab === 0 ? ACTIVE_NOTATION : INACTIVE_NOTATION}
                    height={15}
                    width={15}
                    alt=""
                  />
                  <span
                    style={{ color: activeTab === 0 ? '#358C65' : '#959D99' }}
                  >
                    Notation
                  </span>
                </Tab>
                <Tab
                  onClick={() => {
                    setActiveTab(1);
                    if (
                      (tourType === 'study' || tourType === 'prepare') &&
                      (tourStepNumber === 0 || tourStepNumber === -1)
                    ) {
                      setTourNextStep();
                    }
                  }}
                >
                  <div id="referenceTab">
                    <img
                      src={
                        activeTab === 1 ? ACTIVE_REFERENCE : INACTIVE_REFERENCE
                      }
                      height={15}
                      width={15}
                      alt=""
                    />
                    <span
                      style={{
                        color: activeTab === 1 ? '#358C65' : '#959D99',
                      }}
                    >
                      Reference
                    </span>
                  </div>
                </Tab>
                <Tab
                  className="uploads-tab"
                  onClick={() => {
                    setActiveTab(2);
                  }}
                >
                  <div id="uploadsTab">
                    <IoMdFolder
                      height={15}
                      width={15}
                      className="uploads"
                      style={{
                        color: activeTab === 2 ? '#358C65' : '#959D99',
                      }}
                    />
                    <span
                      style={{
                        color: activeTab === 2 ? '#358C65' : '#959D99',
                      }}
                    >
                      Uploads
                    </span>
                  </div>
                </Tab>
                <Tab
                  className="uploads-tab"
                  onClick={() => {
                    setActiveTab(3);
                  }}
                >
                  <FaVideo
                    height={15}
                    width={15}
                    className="uploads"
                    style={{ color: activeTab === 3 ? '#358C65' : '#959D99' }}
                  />
                  <span
                    style={{ color: activeTab === 3 ? '#358C65' : '#959D99' }}
                  >
                    Video Search
                  </span>
                </Tab>
                <Tab
                  onClick={() => {
                    setActiveTab(4);
                  }}
                >
                  <FaRegFilePdf
                    height={20}
                    width={20}
                    className="uploads"
                    style={{ color: activeTab === 4 ? '#358C65' : '#959D99' }}
                  />
                  <span>
                    PDF Scanner <sup>beta</sup>
                  </span>
                </Tab>
              </TabList>
            </div>
          </div>
          <Tabs
            selectedIndex={activeTab}
            onSelect={(index) => setActiveTab(index)}
          >
            <div className="pgn-viewer-body">
              <TabPanel>
                <MultiTabNotations
                  handleAnalyze={handleAnalyze}
                  toggleSymbolChange={toggleSymbolChange}
                  symbolMode={symbolMode}
                />
                <div>
                  {Object.keys(activeFileInfo).length !== 0 &&
                  activeFileInfo.file &&
                  activeFileInfo.file.key &&
                  allPgnArr[activePgnTab] &&
                  allPgnArr[activePgnTab].tabFile &&
                  allPgnArr[activePgnTab].tabFile.key ? (
                    <div className="d-flex flex-column justify-content-center">
                      <div className="uploaded-folder-title">
                        <RiFile3Fill className="uploaded-icons-file" />
                        <span>
                          {activeFileInfo.file.key.split('/')[1] +
                            '/' +
                            activeFileInfo.file.key.split('/')[2]}
                        </span>
                      </div>

                      <div className="d-flex flex-row ml-1 uploaded-folder-func">
                        <button
                          className="apply-btn file-save-btn"
                          variant="primary"
                          type="button"
                          onClick={() => saveFileContentHandler()}
                        >
                          {isLoading ? (
                            <div className="circle-loader"></div>
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <></>
                  )}
                  <Variations
                    symbolModeEnabled={symbolMode === 'symbol'}
                    setCommentField={setCommentField}
                    editComment={editComment}
                    setEditComment={setEditComment}
                  />
                  <div>
                    <Toolbar
                      isCommentField={commentField}
                      setCommentField={setCommentField}
                    />
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <div className="d-flex flex-column">
                  {pgn && pgn.moves && pgn.moves.length ? (
                    <Variations
                      symbolModeEnabled={symbolMode === 'symbol'}
                      fromRef={true}
                    />
                  ) : (
                    <></>
                  )}
                  <div>
                    <div className="reference-divider"></div>
                    <div className="reference-content">
                      <MoveReference />
                    </div>
                    <div className="reference-divider"></div>
                    <div className="reference-content">
                      <BoardReference setActiveTab={setActiveTab} />
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <Uploads
                  setActiveTab={setActiveTab}
                  uploadProgress={uploadProgress}
                  setCreateFolderModal={setCreateFolderModal}
                  sortByName={sortByName}
                  setSortByName={setSortByName}
                />
              </TabPanel>
              <TabPanel>
                <VideosArea
                  fen={fen}
                  tabIsOpen={activeTab === 3}
                  setVideoLimit={setVideoLimit}
                />
              </TabPanel>
              <TabPanel>
                <PdfScanner setScannerImg={setScannerImg} />
              </TabPanel>
            </div>
          </Tabs>
          {variationOpt ? (
            <VariationOptionsModal isOpen={variationOpt} />
          ) : (
            <></>
          )}
          {activeVarOpt ? (
            <ActiveVarOptionsModal
              isOpen={activeVarOpt}
              setIsOpen={setActiveVarOpt}
              nextMove={nextMove}
            />
          ) : (
            <></>
          )}
        </div>
        <div>
          <VariationActions
            activeTab={activeTab}
            activeVarOpt={activeVarOpt}
            isCommentField={commentField}
            editComment={editComment}
            setActiveVarOpt={setActiveVarOpt}
            setNextMove={setNextMove}
          />
        </div>
      </div>
      <CreateNewFolderModal
        isOpen={createFolderModal}
        setIsOpen={setCreateFolderModal}
      />
      <UploadsLimitModal
        showModal={videoLimit}
        setShowModal={setVideoLimit}
        limitType="videoSearch"
      />
    </div>
  );
};

export default connect(mapStateToProps, {
  uploadFiles,
  setCurrentDirectory,
  setLoader,
  setGameReference,
  setMoveLoader,
  setReference,
  setUserUploads,
  setAnalyzingFenTabIndx,
})(withOrientationChange(MobilePGNViewer));
