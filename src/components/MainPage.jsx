import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import ChessboardWebgl from './taxtak/index';
import { signInAnonymously } from '../firebase';
import { setToken, connectToFree } from '../actions/cloud';
import { restoreAllPgnArr, setFen, setFeatureTab } from '../actions/board';
import { recoverLastSession } from '../utils/utils';
import { useLocation, useNavigate } from 'react-router-dom';

const MainPage = ({
  setToken,
  connectToFree,
  restoreAllPgnArr,
  setFen,
  setFeatureTab,
}) => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (search.length && pathname === '/analysis') {
      navigate({ pathname: pathname, search: search });
    }
  }, [pathname, search]);

  useEffect(() => {
    signInAnonymously().then((idToken) => {
      recoverLastSession(restoreAllPgnArr, setFen, setFeatureTab);
    });
  }, []);

  useEffect(() => {
    signInAnonymously().then((idToken) => {
      setToken(idToken);
      // connectToFree();
    });
  });

  return <ChessboardWebgl />;
};

export default connect(null, {
  setToken,
  connectToFree,
  restoreAllPgnArr,
  setFen,
  setFeatureTab,
})(MainPage);
