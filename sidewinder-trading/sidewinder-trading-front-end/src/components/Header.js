import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown'
import {Toast} from "react-bootstrap";

export default class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            notification: null
        }
    }

    componentDidMount() {
        this.props.notifierService.subscribe((notification) => {
           this.setState({notification: notification})
        });
    }

    render() {
        return <div className="header">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-xl-12">
                        <nav
                            className="navbar navbar-expand-lg navbar-light px-0 justify-content-between">
                            <a className="navbar-brand" href="index.html"><img
                                src="../assets/images/w_logo.png" alt=""/>
                                <span>Sidewinder Trading</span></a>


                            <div className="dashboard_log my-2">
                                <div className="d-flex align-items-center">
                                    <div className="account_money">
                                        <ul>
                                            <li className="usd"
                                                style={{
                                                    borderRadius: '30px 30px 30px 30px',
                                                    border: '1px solid #423A6F',
                                                    transition: 'all 0.3s ease-in-out',
                                                    padding: '8px 20px 8px 20px'
                                                }}>
                                                <span>19.93 USD</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <Dropdown className="profile_log dropdown">
                                        <Dropdown.Toggle>
                                            <span className="thumb"><i
                                                className="fa fa-user"></i></span>
                                            <span className="name" style={{marginLeft: '12px',marginRight: '12px'}}>Demo User</span>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item><a href="accounts.html"
                                                              className="dropdown-item">
                                                <i className="fa fa-user"></i> Account
                                            </a>
                                            </Dropdown.Item>
                                            <Dropdown.Item><a href="history.html"
                                                              className="dropdown-item">
                                                <i className="fa fa-book"></i> History
                                            </a>
                                            </Dropdown.Item>
                                            <Dropdown.Item><a href="settings-account.html"
                                                              className="dropdown-item">
                                                <i className="fa fa-cog"></i> Settings
                                            </a>
                                            </Dropdown.Item>
                                            <Dropdown.Item><a href="lock.html"
                                                              className="dropdown-item">
                                                <i className="fa fa-lock"></i> Disconnect
                                            </a>
                                            </Dropdown.Item>

                                        </Dropdown.Menu>
                                    </Dropdown>

                                        {this.state.notification !== null ? (
                                            <Toast style={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                zIndex: '999',
                                                position: 'absolute',
                                                left: '0',
                                                top: '0',
                                                width: '100%'
                                            }} show={true} onClose={()=>this.setState({notification: null})} delay={2000} autohide>
                                                <Toast.Body>{this.state.notification}</Toast.Body>
                                            </Toast>) : ('')}

                            </div>
                    </div>
                </nav>
            </div>
        </div>
    </div>
    </div>
    }
}