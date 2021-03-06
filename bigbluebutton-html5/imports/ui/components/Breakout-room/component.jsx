import React, { Component } from 'react';

import { defineMessages, injectIntl } from 'react-intl';
import _ from 'lodash';
import Button from '/imports/ui/components/button/component';
import { styles } from './styles';
import Icon from '../icon/component';
import BreakoutRoomContainer from './breakout-remaining-time/container';

const intlMessages = defineMessages({
  breakoutTitle: {
    id: 'app.createBreakoutRoom.title',
    description: 'breakout title',
  },
  breakoutDuration: {
    id: 'app.createBreakoutRoom.duration',
    description: 'breakout duration time',
  },
  breakoutRoom: {
    id: 'app.createBreakoutRoom.room',
    description: 'breakout duration time',
  },
  breakoutJoin: {
    id: 'app.createBreakoutRoom.join',
    description: 'breakout duration time',
  },
  breakoutJoinAudio: {
    id: 'app.createBreakoutRoom.joinAudio',
    description: 'breakout duration time',
  },
  breakoutReturnAudio: {
    id: 'app.createBreakoutRoom.returnAudio',
    description: 'breakout duration time',
  },
  generatingURL: {
    id: 'app.createBreakoutRoom.generatingURL',
    description: 'breakout duration time',
  },
  generatedURL: {
    id: 'app.createBreakoutRoom.generatedURL',
    description: 'breakout duration time',
  },
  endAllBreakouts: {
    id: 'app.createBreakoutRoom.endAllBreakouts',
    description: 'breakout duration time',
  },
});

class BreakoutRoom extends Component {
  constructor(props) {
    super(props);
    this.renderBreakoutRooms = this.renderBreakoutRooms.bind(this);
    this.getBreakoutURL = this.getBreakoutURL.bind(this);
    this.renderDuration = this.renderDuration.bind(this);
    this.transferUserToBreakoutRoom = this.transferUserToBreakoutRoom.bind(this);
    this.renderUserActions = this.renderUserActions.bind(this);
    this.returnBackToMeeeting = this.returnBackToMeeeting.bind(this);
    this.state = {
      requestedBreakoutId: '',
      waiting: false,
      generated: false,
      joinedAudioOnly: false,
      breakoutId: '',
    };
  }

  componentDidUpdate() {
    const { breakoutRoomUser } = this.props;
    if (this.state.waiting && !this.state.generated) {
      const breakoutUser = breakoutRoomUser(this.state.requestedBreakoutId);
      if (!breakoutUser) return;
      if (breakoutUser.redirectToHtml5JoinURL !== '') {
        _.delay(() => this.setState({ generated: true, waiting: false }), 1000);
      }
    }
  }
  getBreakoutURL(breakoutId) {
    const { requestJoinURL, breakoutRoomUser } = this.props;
    const hasUser = breakoutRoomUser(breakoutId);
    if (!hasUser && !this.state.waiting) {
      this.setState(
        { waiting: true, requestedBreakoutId: breakoutId },
        () => requestJoinURL(breakoutId),
      );
    }

    if (hasUser) {
      window.open(hasUser.redirectToHtml5JoinURL);
      this.setState({ waiting: false, generated: false });
    }
    return null;
  }

  transferUserToBreakoutRoom(breakoutId) {
    const { transferToBreakout, meetingId } = this.props;
    transferToBreakout(meetingId, breakoutId);
    this.setState({ joinedAudioOnly: true, breakoutId });
  }
  returnBackToMeeeting(breakoutId) {
    const { transferUserToMeeting, meetingId } = this.props;
    transferUserToMeeting(breakoutId, meetingId);
    this.setState({ joinedAudioOnly: false, breakoutId });
  }

  renderUserActions(breakoutId) {
    const {
      isMicrophoneUser,
      isPresenter,
      intl,
    } = this.props;

    const {
      joinedAudioOnly,
      breakoutId: stateBreakoutId,
      generated,
      requestedBreakoutId,
      waiting,
    } = this.state;

    const presenterJoinedAudio = isMicrophoneUser && isPresenter;
    const disable = waiting && requestedBreakoutId !== breakoutId;
    const audioAction = joinedAudioOnly ?
      () => this.returnBackToMeeeting(breakoutId) :
      () => this.transferUserToBreakoutRoom(breakoutId);
    return (
      <div className={styles.breakoutActions}>
        <Button
          label={generated && requestedBreakoutId === breakoutId
            ? intl.formatMessage(intlMessages.generatedURL)
            : intl.formatMessage(intlMessages.breakoutJoin)}
          onClick={() => this.getBreakoutURL(breakoutId)}
          disabled={disable}
          className={styles.joinButton}
        />
        {
          presenterJoinedAudio ?
            [
              ('|'),
              (
                <Button
                  label={
                    presenterJoinedAudio &&
                    stateBreakoutId === breakoutId &&
                    joinedAudioOnly
                      ?
                      intl.formatMessage(intlMessages.breakoutReturnAudio) :
                      intl.formatMessage(intlMessages.breakoutJoinAudio)
                  }
                  className={styles.button}
                  onClick={audioAction}
                />
              ),
            ]
            : null
        }
      </div>
    );
  }

  renderBreakoutRooms() {
    const {
      breakoutRooms,
      intl,
    } = this.props;

    const roomItems = breakoutRooms.map(item => (
      <div className={styles.content} key={`breakoutRoomList-${item.breakoutId}`}>
        <span>{intl.formatMessage(intlMessages.breakoutRoom, item.sequence.toString())}</span>
        {this.state.waiting && this.state.requestedBreakoutId === item.breakoutId ? (
          <span>
            {intl.formatMessage(intlMessages.generatingURL)}
            <span className={styles.connectingAnimation} />
          </span>
        ) : this.renderUserActions(item.breakoutId)}
      </div>
    ));

    return roomItems;
  }

  renderDuration() {
    const { breakoutRooms } = this.props;
    return (
      <span className={styles.duration}>
        <BreakoutRoomContainer
          messageDuration={intlMessages.breakoutDuration}
          breakoutRoom={breakoutRooms[0]}
        />
      </span>
    );
  }

  render() {
    const {
      intl, endAllBreakouts, breakoutRooms, isModerator, closeBreakoutPanel,
    } = this.props;
    if (breakoutRooms.length <= 0) return null;
    return (
      <div className={styles.panel}>
        <div className={styles.header} role="button" onClick={closeBreakoutPanel} >
          <span >
            <Icon iconName="left_arrow" />
            {intl.formatMessage(intlMessages.breakoutTitle)}
          </span>
        </div>
        {this.renderBreakoutRooms()}
        {this.renderDuration()}
        {
          isModerator ?
            (
              <Button
                color="primary"
                size="lg"
                label={intl.formatMessage(intlMessages.endAllBreakouts)}
                className={styles.endButton}
                onClick={endAllBreakouts}
              />
            ) : null
        }
      </div>
    );
  }
}

export default injectIntl(BreakoutRoom);
