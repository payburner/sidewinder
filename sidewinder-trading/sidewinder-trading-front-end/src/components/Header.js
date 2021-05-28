import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown'
import {Toast} from "react-bootstrap";
import mLogo from '../assets/images/m_logo.png'
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

    handleDropDownSelect(e) {
        console.log('KEY:' + e );
        this.props.tokenService.removeToken();
    }

    render() {
        const comp = this;
        return <div className="header">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-xl-12">
                        <nav
                            className="navbar navbar-expand-lg navbar-light px-0 justify-content-between">
                            <a className="navbar-brand" href="#"><img
                                src={mLogo} alt=""/>
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
                                                <span>equiv-todo USD</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <Dropdown className="profile_log dropdown" onSelect={(e) => comp.handleDropDownSelect(e )}>
                                        <Dropdown.Toggle>
                                            <span className="thumb"><i
                                                className="fa fa-user"></i></span>
                                            <span className="name" style={{marginLeft: '12px',marginRight: '12px'}}>Demo User</span>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item eventKey={'accounts'}>
                                                <i className="fa fa-user"></i> Accounts

                                            </Dropdown.Item>
                                            <Dropdown.Item eventKey={'history'}>
                                                <i className="fa fa-book"></i> History

                                            </Dropdown.Item>
                                            <Dropdown.Item eventKey={'settings'}>
                                                <i className="fa fa-cog"></i> Settings

                                            </Dropdown.Item>
                                            <Dropdown.Item eventKey={'disconnect'}>
                                                <i className="fa fa-lock"></i> Disconnect
                                            </Dropdown.Item>

                                        </Dropdown.Menu>
                                    </Dropdown>

                                        {this.state.notification !== null ? (
                                            <div style={{ zIndex: '999', minHeight: '200px',

                                                position: 'absolute',
                                                right: '20px',
                                                top: '20px' }}>
                                            <Toast style={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            }} show={true} onClose={()=>this.setState({notification: null})} delay={2000} autohide>

                                                <Toast.Body>{this.state.notification}</Toast.Body>
                                            </Toast></div>) : ('')}

                            </div>
                    </div>
                </nav>
            </div>
        </div>
    </div>
    </div>
    }
}