import React from 'react';
import ReactDOM from 'react-dom';
//CSS
import 'typeface-roboto';
import './assets/css/style.css';
import Login from './pages/Login'
import CoreTradingService from "./services/CoreTradingService";
import TokenService from "./services/TokenService";

const tokenService = new TokenService();
const coreTradingService = new CoreTradingService( tokenService );

ReactDOM.render(
    <Login coreTradingService={coreTradingService}/> , document.getElementById('root'));
