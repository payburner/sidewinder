import React from 'react';
import mLogo from '../assets/images/m_logo.png'
export default class Authentication extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            password: null
        }
    }

    handlePasswordChange( password ) {
        this.setState({password: password });
    }

    async doSubmit( ) {
        if (this.state.password !== null) {
            await this.props.tokenService.convertToToken( this.state.password );
        }
    }

    render() {
        const comp = this;
        return <div className="authincation section-padding">
            <div className="container h-100">
                <div className="row justify-content-center h-100 align-items-center">
                    <div className="col-xl-5 col-md-6">
                        <div className="mini-logo text-center my-5">
                            <img src={mLogo} alt=""/>
                        </div>
                        <div className="auth-form card">
                            <div className="card-header justify-content-center">
                                <h4 className="card-title">Connect to Sidewinder Trading Demo</h4>
                            </div>

                            <div className="card-body">
                                <form action="index.html">
                                    <div className="form-group mb-4">
                                        <label htmlFor="">Enter Demo Password</label>
                                        <input type="password" onChange={(e)=>comp.handlePasswordChange( e.target.value.trim() )}
                                               className="form-control bg-transparent rounded-0"
                                               placeholder="Password"/>
                                    </div>
                                    <button onClick={(e)=>comp.doSubmit(e)} className="btn-success btn-block btn-lg border-0"
                                            type="submit">Unlock
                                    </button>
                                </form>

                            </div>
                        </div>
                    </div>
                </div>
            </div></div>;
    }
}