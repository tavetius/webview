import React from 'react';
import { connect } from 'react-redux';
import { ThemeContext, themes } from '../../contexts/ThemeContext';
import { setDashboardSettings } from '../../../src/utils/api';
import Toggle from '../Toggle';

const mapStateToProps = (state) => {
  return {
    userFullInfo: state.cloud.userFullInfo,
  };
};

const RootToggle = ({ userFullInfo }) => (
  <ThemeContext.Consumer>
    {({ theme, setTheme }) => (
      <Toggle
        onChange={() => {
          if (theme === themes.light) {
            setDashboardSettings(userFullInfo.token, userFullInfo.userProfileId, true, userFullInfo. arrows_enabled, userFullInfo.board_theme, userFullInfo.pieces_theme);
            setTheme(themes.dark);
          }
          if (theme === themes.dark) {
            setDashboardSettings(userFullInfo.token, userFullInfo.userProfileId, false, userFullInfo. arrows_enabled, userFullInfo.board_theme, userFullInfo.pieces_theme);
            setTheme(themes.light);
          }
        }}
        value={theme === themes.dark}
      />
    )}
  </ThemeContext.Consumer>
);
export default connect(mapStateToProps, null)(RootToggle);