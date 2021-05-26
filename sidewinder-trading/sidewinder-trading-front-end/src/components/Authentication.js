import React from 'react';

export default class Authentication extends React.Component {
    constructor(props) {
        super(props);

    }

    doSubmit( e) {
        alert('hi')
    }

    render() {
        const comp = this;
        return <div className="authincation section-padding">
            <div className="container h-100">
                <div className="row justify-content-center h-100 align-items-center">
                    <div className="col-xl-5 col-md-6">
                        <div className="mini-logo text-center my-5">
                            <img src="../assets/images/m_logo.png" alt=""/>
                        </div>
                        <div className="auth-form card">
                            <div className="card-header justify-content-center">
                                <h4 className="card-title">Connect to Sidewinder Trading</h4>
                            </div>

                            <div className="card-body">
                                <form action="index.html">
                                    <div className="form-group mb-4">
                                        <label htmlFor="">Enter Secret</label>
                                        <input type="password"
                                               className="form-control bg-transparent rounded-0"
                                               placeholder="Secret"/>
                                    </div>
                                    <button onClick={(e)=>comp.doSubmit(e)} className="btn-success btn-block btn-lg border-0"
                                            type="submit">Unlock
                                    </button>
                                </form>
                                <div className="new-account text-center mt-3">
                                    <a className="text-primary" href="reset.html">
                                                                      </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div></div>;
    }
}