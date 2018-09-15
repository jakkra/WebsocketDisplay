import React from 'react';
import PropTypes from 'prop-types';

import { Col, Row, Button, FormControl, OverlayTrigger, Popover } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faStop, faSpinner, faEraser, faPalette, faSync, faPen, faImage } from '@fortawesome/free-solid-svg-icons'


import { ChromePicker } from 'react-color';

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    padding: '5px 0',
    borderTop: '1px solid #777E87',
    background: '#424242',
    color: '#777E87',
    boxShadow: '0px 0px 5px 0px rgba(25, 25, 25, 0.75)',
    textAlign: 'left'
  },
  toolbarColumn: {
    borderColor: 'yellow',
    borderWidth: 5,
    borderRadius: 2
  },
  toolbarRow: {
    paddingTop: 3,
  },
  toolbarIcon: {
    color: 'white',
    fontSize: '1em',
  },
  colorPickerButton: {
    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
    borderRadius: '5px',
  },
  popover: {
    position: 'absolute',
    bottom: 50,
    right: 0,
    zIndex: '9999',
  },
  cover: {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  },
};

export default class Toolbar extends React.Component {
  static propTypes = {
    isConnected: PropTypes.bool.isRequired,
    isConnecting: PropTypes.bool.isRequired,
    onConnectDisconnect: PropTypes.func,
    onModeSwitch: PropTypes.func,
    onColorChange: PropTypes.func.isRequired,
    onDrawWidthChange: PropTypes.func.isRequired,
    onImageUrlProvided: PropTypes.func.isRequired,
    onDisplayText: PropTypes.func.isRequired,
    onErase: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isConnected: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      ipAddress: '192.168.1.38:81',
      displayColorPicker: false,
      color: {
        r: '41',
        g: '68',
        b: '89',
        a: '1',
        hex: "#284257"
      },
      drawWidth: 1,
      imageUrl: '',
      drawText: '',
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleOpenColorpicker = this.handleOpenColorpicker.bind(this);
    this.handleCloseColorpicker = this.handleCloseColorpicker.bind(this);
    this.handleOnColorChange = this.handleOnColorChange.bind(this);
    this.handleChangeDrawWidth = this.handleChangeDrawWidth.bind(this);
    this.renderDrawTools = this.renderDrawTools.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleDrawTextChange = this.handleDrawTextChange.bind(this);
  }

  componentDidMount() {
    this.props.onColorChange(this.state.color);
  }

  handleChange(e) {
    this.setState({ ipAddress: e.target.value });
  }

  handleUrlChange(e) {
    this.setState({ imageUrl: e.target.value });
  }

  handleDrawTextChange(e) {
    this.setState({ drawText: e.target.value });
  }

  renderConnectButton() {
    let icon = null;
    const buttonStyle = this.props.isConnected ? "danger" : "success";

    if (this.props.isConnecting) {
      icon = (<FontAwesomeIcon icon={faSpinner} spin style={styles.toolbarIcon} />);
    } else if (this.props.isConnected) {
      icon = (<FontAwesomeIcon icon={faStop} style={styles.toolbarIcon} />);
    } else {
      icon = (<FontAwesomeIcon icon={faPlay} style={styles.toolbarIcon} />);
    }

    return (
      <Button
        bsStyle={ buttonStyle }
        onClick={() => this.props.onConnectDisconnect(this.state.ipAddress)}
        >
        {icon}
      </Button>
    );
  }

  handleOpenColorpicker() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleCloseColorpicker() {
    this.setState({ displayColorPicker: false })
  };

  handleOnColorChange(color) {
    this.setState({ color: color.rgb })
    this.props.onColorChange(color);
  };

  handleChangeDrawWidth() {
    const drawWidth = (this.state.drawWidth % 5) + 1;
    this.setState({
      drawWidth: drawWidth,
    })
    this.props.onDrawWidthChange(drawWidth);
  }

  renderColorpicker() {
    if (this.state.displayColorPicker) {
      return (
        <div style={ styles.popover }>
          <div style={ styles.cover } onClick={ this.handleCloseColorpicker }/>
          <ChromePicker color={ this.state.color } onChange={ this.handleOnColorChange } />
        </div>
      )
    } else {
      return null;
    }
  }

  renderDrawTools() {
    return  (
      <Popover id="popover-trigger-click-root-close" title="Drawing Tools">
        <Row xs={12}>
          <Col xs={7}>
            <Button
              bsStyle='primary'
              onClick={this.handleChangeDrawWidth}
              >
              {"Change Width: " + this.state.drawWidth}
            </Button>
          </Col>
          <Col xs={5}>
            <Button 
              onClick={ this.props.onErase }
              bsStyle='danger'
              >
              {"Erase "} <FontAwesomeIcon icon={faEraser} style={styles.toolbarIcon} />
            </Button>
          </Col>
        </Row>
        <Row xs={12}>
          <Col xs={7}>
            <FormControl
              type="text"
              value={this.state.imageUrl}
              placeholder="Paste image url"
              onChange={this.handleUrlChange}
            />
          </Col>
          <Col xs={5}>
            <Button 
              onClick={ () => this.props.onImageUrlProvided(this.state.imageUrl) }
              bsStyle='primary'
              >
              {"Show "} <FontAwesomeIcon icon={faImage} style={styles.toolbarIcon} />
            </Button>
          </Col>
        </Row>
        <Row xs={12}>
          <Col xs={7}>
            <FormControl
              type="text"
              value={this.state.drawText}
              placeholder="Draw text"
              onChange={this.handleDrawTextChange}
            />
          </Col>
          <Col xs={5}>
            <Button 
              onClick={ () => this.props.onDisplayText(this.state.drawText) }
              bsStyle='primary'
              >
              {"Show "} <FontAwesomeIcon icon={faImage} style={styles.toolbarIcon} />
            </Button>
          </Col>
        </Row>
      </Popover>
    );
  }

  render() {
    const background = `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`;

    return (
      <div style={{...styles.container, background: background}}>
        <Col mdHidden styles={styles.toolbarColumn} md={12} >
          <Row xs={12}>
            <Col xs={2}>
              {this.renderConnectButton()}
            </Col>
            <Col xs={3}>
              <FormControl
                type="text"
                value={this.state.ipAddress}
                placeholder="Enter IP Address"
                onChange={this.handleChange}
                disabled={this.props.isConnected}
              />
            </Col>
            <Col xs={3}>
              <Button
                bsStyle='primary'
                onClick={this.props.onModeSwitch}
                >
                <FontAwesomeIcon icon={faSync} style={styles.toolbarIcon} />
              </Button>
            </Col>
            <Col xs={2}>
              <Button
                bsStyle='info'
                onClick={ this.handleOpenColorpicker }
                >
                <FontAwesomeIcon icon= {faPalette} style={styles.toolbarIcon} />
              </Button>
              {this.renderColorpicker()}
            </Col>
            <Col xs={2}>
              <OverlayTrigger
                trigger="click"
                rootClose
                placement="top"
                overlay={this.renderDrawTools()}
              >
                <Button bsStyle='warning' >
                  <FontAwesomeIcon icon={faPen} style={styles.toolbarIcon} />
                </Button>
              </OverlayTrigger>
            </Col>
          </Row>
        </Col>
      </div>
    );
  }
}
