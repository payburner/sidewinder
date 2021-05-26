import React from 'react';

export default class PageTitle extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
        return <div className="page_title">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-xl-12">
                        <div className="page_title-content">
                            <p>Welcome Back,
                                <span> Demo User</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}