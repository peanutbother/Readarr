import PropTypes from 'prop-types';
import React, { Component } from 'react';
import IconButton from 'Components/Link/IconButton';
import { icons } from 'Helpers/Props';
import styles from './SwipeHeader.css';

function cursorPosition(event) {
  return event.touches ? event.touches[0].clientX : event.clientX;
}

class SwipeHeader extends Component {

  //
  // Lifecycle

  constructor(props) {
    super(props);

    this.state = {
      touching: null,
      translate: 0,
      stage: null,
      url: null
    };
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  //
  // Listeners

  onMouseDown = (e) => {
    if (!this.props.isSmallScreen || this.state.touching) {
      return;
    }

    this.startTouchPosition = cursorPosition(e);
    this.initTranslate = this.state.translate;

    this.setState({ touching: true }, () => {
      this.addEventListeners();
    });
  };

  addEventListeners = () => {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchend', this.onMouseUp);
  }

  removeEventListeners = () => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchend', this.onMouseUp);
  }

  onMouseMove = (e) => {
    if (!this.state.touching) {
      return;
    }

    this.setState({ translate: cursorPosition(e) - this.startTouchPosition + this.initTranslate });
  };

  onMouseUp = () => {
    this.startTouchPosition = null;
    const {
      navWidth,
      nextLink,
      prevLink
    } = this.props;
    const {
      translate
    } = this.state;
    const newState = {
      touching: false
    };
    const acceptableMove = navWidth * 0.7;
    const showNav = Math.abs(translate) >= acceptableMove;
    const navWithoutConfirm = Math.abs(translate) >= this.deleteWithoutConfirmThreshold;

    if (navWithoutConfirm) {
      newState.translate = Math.sign(translate) * this.containerWidth;
    }

    if (!showNav) {
      newState.translate = 0;
      newState.stage = null;
    }

    if (showNav && !navWithoutConfirm) {
      newState.translate = Math.sign(translate) * navWidth;
      newState.stage = 'showNav';
    }

    this.setState(newState, () => {
      if (navWithoutConfirm) {
        this.onNavClick(translate < 0 ? nextLink : prevLink);
      }
    });

    this.removeEventListeners();
  }

  onNavClick = (url) => {
    this.setState({
      stage: 'deleting',
      translate: Math.sign(this.state.translate) * this.containerWidth,
      url
    });
  }

  onTransitionEnd = (e) => {
    const {
      stage,
      url
    } = this.state;

    if (stage === 'deleting') {
      this.setState({
        stage: 'deleted',
        translate: -1 * Math.sign(this.state.translate) * this.containerWidth,
        url: null
      }, () => {
        this.props.onGoTo(url);
        this.onTransitionEnd();
      });
    }

    if (stage === 'deleted') {
      this.setState({ stage: null, translate: 0 });
    }
  }

  onNext = () => {
    this.onNavClick(this.props.nextLink);
  }

  onPrev = () => {
    this.onNavClick(this.props.prevLink);
  }

  //
  // Render

  render() {
    const {
      navWidth,
      transitionDuration,
      nextTitle,
      prevTitle,
      className,
      children
    } = this.props;

    const {
      translate,
      touching,
      stage
    } = this.state;

    const useTransition = !touching && stage !== 'deleted';

    const contentStyle = {
      '--translate': `${translate}px`,
      '--transition': useTransition ? `transform ${transitionDuration}ms ease-out` : undefined
    };

    const buttonStyle = {
      '--button-width': `${navWidth}px`
    };

    return (
      <div
        className={className}
        ref={(c) => {
          if (c) {
            this.container = c;
            this.containerWidth = c.getBoundingClientRect().width;
            this.deleteWithoutConfirmThreshold = this.containerWidth * 0.5;
          }
        }}
      >
        {
          stage === 'showNav' &&
            <div
              className={styles.delete}
            >
              {
                translate < 0 ?
                  <div
                    className={styles.right}
                    style={buttonStyle}
                  >
                    <IconButton
                      className={styles.navigationButton}
                      name={icons.ARROW_RIGHT}
                      size={30}
                      title={nextTitle}
                      onPress={this.onNext}
                    />
                  </div> :
                  <div
                    className={styles.left}
                    style={buttonStyle}
                  >
                    <IconButton
                      className={styles.navigationButton}
                      name={icons.ARROW_LEFT}
                      size={30}
                      title={prevTitle}
                      onPress={this.onPrev}
                    />
                  </div>
              }
            </div>
        }
        <div
          className={styles.content}
          style={contentStyle}
          onMouseDown={this.onMouseDown}
          onTouchStart={this.onMouseDown}
          onTransitionEnd={this.onTransitionEnd}
        >
          {children}
        </div>
      </div>
    );
  }
}

SwipeHeader.propTypes = {
  transitionDuration: PropTypes.number.isRequired,
  navWidth: PropTypes.number.isRequired,
  nextTitle: PropTypes.string,
  nextLink: PropTypes.string,
  prevTitle: PropTypes.string,
  prevLink: PropTypes.string,
  isSmallScreen: PropTypes.bool.isRequired,
  className: PropTypes.string,
  onGoTo: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};

SwipeHeader.defaultProps = {
  transitionDuration: 250,
  navWidth: 75
};

export default SwipeHeader;
