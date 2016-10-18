/**
 * React Coverflow
 *
 * Author: andyyou
 */
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';
import styles from './stylesheets/coverflow';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

var TOUCH = {move: false,
  lastX: 0,
  sign: 0,
  lastMove: 0
};
var TRANSITIONS = [
  'transitionend',
  'oTransitionEnd',
  'otransitionend',
  'MSTransitionEnd',
  'webkitTransitionEnd'
];
var HandleAnimationState = function() {
  this._removePointerEvents();
};

@Radium
class Coverflow extends Component {
  /**
   * Life cycle events
   */
  constructor(props) {
    super(props);

    this.state = {
      current: this._center(),
      move: 0,
      width: this.props.width || 'auto',
      height: this.props.height || 'auto'
    };
  }

  componentDidMount() {
    this.updateDimensions();
    let length = React.Children.count(this.props.children);

    TRANSITIONS.forEach(event => {
      for (let i = 0; i < length; i++) {
        var figureID = `figure_${i}`;
        this.refs[figureID].addEventListener(event, HandleAnimationState.bind(this));
      }
    });
    window.addEventListener('resize', this.updateDimensions.bind(this));
    document.addEventListener('keypress', this._keypress.bind(this), false);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.active !== nextProps.active) {
      this.updateDimensions(nextProps.active);
    }
  }

  componentWillUnmount() {
    let length = React.Children.count(this.props.children);

    TRANSITIONS.forEach(event => {
      for (let i = 0; i < length; i++) {
        var figureID = `figure_${i}`;
        this.refs[figureID].removeEventListener(event, HandleAnimationState.bind(this));
      }
    });
    window.removeEventListener('resize', this.updateDimensions.bind(this));
    document.removeEventListener('keypress', this._keypress.bind(this));
  }

  updateDimensions(active) {
    const {displayQuantityOfSide} = this.props;
    let length = React.Children.count(this.props.children);
    let center = this._center();
    var state = {
      width: ReactDOM.findDOMNode(this).offsetWidth,
      height: ReactDOM.findDOMNode(this).offsetHeight
    };
    var baseWidth = state.width / (displayQuantityOfSide * 2 + 1);
    var active = active === 0 ? 0 : (active || this.props.active);
    if (typeof active === 'number' && ~~active < length) {
      active = ~~active;
      var move = 0;
      move = baseWidth * (center - active);

      state = Object.assign({}, state, {
        current: active,
        move: move
      });
    }
    this.setState(state);
  }

  render() {
    const {enableScroll} = this.props;
    const {width, height} = this.state;
    return (
        <div className={styles.container}
             style={[{width: `${width}px`, height: `${height}px`}, this.props.media]}
             onWheel={enableScroll ? this._handleWheel.bind(this) : null}
             onTouchStart={this._handleTouchStart.bind(this)}
             onTouchMove={this._handleTouchMove.bind(this)}
             >
          <div className={styles.coverflow}>
            <div className={styles.preloader}></div>
            <div className={styles.stage} ref="stage">
                {this._renderFigureNodes()}
            </div>
            {
              this.props.navigation &&
              (
                <div className={styles.actions}>
                  <button type="button" className={styles.button} onClick={ this._handlePrevFigure.bind(this) }>Previous</button>
                  <button type="button" className={styles.button} onClick={ this._handleNextFigure.bind(this) }>Next</button>
                </div>
              )
            }
          </div>
        </div>
    );
  }

  /**
   * Private methods
   */
  _center() {
    let length = React.Children.count(this.props.children);
    return length / 2;
  }

  _keypress(e) {
    if (e.keyCode === 39) {
      this._handlePrevFigure();
    } else if (e.keyCode === 37) {
      this._handleNextFigure();
    }
  }

  _handleFigureStyle(index, current) {
    const { displayQuantityOfSide, itemSize } = this.props;
    const {width} = this.state;
    let style = {};
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let length = React.Children.count(this.props.children);

    const tX = this.state.move - (baseWidth / 2);

    // Handle translateX
    if (index === current) {
      style['width'] = `${itemSize}`;
      style['transform'] = `translateX(${tX}px) scale(1.2)`;
    } else if (index < current) {
      // Left side
      style['width'] = `${itemSize}`;
      style['transform'] = `translateX(${tX}px) rotateY(40deg)`;
    } else if (index > current) {
      // Right side
      style['width'] = `${itemSize}`;
      style['transform'] = ` translateX(${tX}px) rotateY(-40deg)`;
    }
    return style;
  }

  _handleFigureMaskStyle(index, current) {
    const { maskClassName, itemSize } = this.props;
    let style = {};

    // Handle opacity
    let depth = Math.abs(current - index);
    let opacity;
    switch (depth) {
      case 0:
        opacity = 0;
        break;

      case 1:
        opacity = 0.2;
        break;

      case 2:
        opacity = 0.4;
        break;

      default:
        opacity = 0.6;
    }

    if (maskClassName) {
      style['opacity'] = opacity;

    } else {
      style['width'] = `${itemSize}`;
      style['height'] = `100%`;
      style['zIndex'] = `${10 - depth}`;
      style['background'] = `rgba(0,0,0,${opacity})`;
      style['position'] = `absolute`;
      style['top'] = `0`;
    }

    return style;
  }

  _handleFigureClick(index, action, e) {
    e.preventDefault();
    if (!this.props.clickable) {
      return;
    }

    this.refs.stage.style['pointerEvents'] = 'none';
    if (this.state.current === index) {
      this._removePointerEvents();

    } else {

      if (typeof action === 'string') {
        window.open(action, '_blank');
      } else if (typeof action === 'function') {
        action();
      }

      const {displayQuantityOfSide} = this.props;
      const {width} = this.state;
      let baseWidth = width / (displayQuantityOfSide * 2 + 1);
      let distance = this._center() - index;
      let move = distance * baseWidth;
      this.setState({current: index, move: move});
    }
  }

  _renderFigureNodes() {
    const {enableHeading, maskClassName} = this.props;

    let figureNodes = React.Children.map(this.props.children, (child, index) => {
      let figureElement = React.cloneElement(child, {className: styles.cover});
      let style = this._handleFigureStyle(index, this.state.current);
      let maskStyle = this._handleFigureMaskStyle(index, this.state.current);
      return (
        <figure className={styles.figure}
          key={index}
          style={style}
          onClick={ this._handleFigureClick.bind(this, index, figureElement.props['data-action']) }
          ref={`figure_${index}`}
          >
          {figureElement}
          {
            enableHeading &&
            <div className={styles.text}>{figureElement.props.alt}</div>
          }
          <div className={maskClassName} style={maskStyle} />
        </figure>
      );
    });
    return figureNodes;
  }

  _removePointerEvents() {
    this.refs.stage.style['pointerEvents'] = 'auto';
  }

  _handlePrevFigure() {
    const {displayQuantityOfSide} = this.props;
    const {width} = this.state;
    let current = this.state.current;
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let distance = this._center() - (current - 1);
    let move = distance * baseWidth;

    if (current - 1 >= 0) {
      this.setState({ current: current - 1, move: move });
      TOUCH.lastMove = move;
    }
  }

  _handleNextFigure() {
    const {displayQuantityOfSide} = this.props;
    const {width} = this.state;
    let current = this.state.current;
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let distance = this._center() - (current + 1);
    let move = distance * baseWidth;

    if (current + 1 < this.props.children.length) {
      this.setState({ current: current + 1, move: move });
      TOUCH.lastMove = move;
    }
  }

  _handleWheel(e) {
    e.preventDefault();

    let delta = e.deltaY * (-120);
    let count = Math.ceil(Math.abs(delta) / 120);

    if (count > 0) {
      const sign = Math.abs(delta) / delta;
      let func = null;

      if (sign > 0) {
        func = this._handlePrevFigure.bind(this);
      } else if (sign < 0) {
        func = this._handleNextFigure.bind(this);
      }

      if (typeof func === 'function') {
        for (let i = 0; i < count; i++) func();
      }
    }
  }

  _handleTouchStart(e) {
    TOUCH.lastX = e.nativeEvent.touches[0].clientX;
    TOUCH.lastMove = this.state.move;
  }

  _handleTouchMove(e) {
    e.preventDefault();
    const {displayQuantityOfSide} = this.props;
    const {width} = this.state;

    let clientX = e.nativeEvent.touches[0].clientX;
    let lastX = TOUCH.lastX;
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let move = clientX - lastX;
    let totalMove = TOUCH.lastMove - move;
    let sign = Math.abs(move) / move;

    if (Math.abs(totalMove) >= baseWidth) {
      let fn = null;
      if (sign > 0) {
        fn = this._handlePrevFigure.bind(this);
      } else if (sign < 0) {
        fn = this._handleNextFigure.bind(this);
      }
      if (typeof fn === 'function') {
        fn();
      }
    }
  }
};

Coverflow.propTypes = {
  displayQuantityOfSide: React.PropTypes.number.isRequired,
  navigation: React.PropTypes.bool,
  enableHeading: React.PropTypes.bool,
  enableScroll: React.PropTypes.bool,
  active: React.PropTypes.number,
  maskClassName: React.PropTypes.string,
  itemSize: React.PropTypes.string
};

Coverflow.defaultProps = {
  navigation: false,
  enableHeading: true,
  enableScroll: true,
  clickable: true
};

Coverflow.displayName = 'Coverflow';

export default Coverflow;
