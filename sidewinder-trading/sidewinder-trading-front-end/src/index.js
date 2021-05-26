import React from 'react';
import ReactDOM from 'react-dom';
//CSS
import 'typeface-roboto';
import './assets/css/style.css';
import Login from './pages/Login'
import CoreTradingService from "./services/CoreTradingService";

const coreTradingService = new CoreTradingService();

ReactDOM.render(
    <Login coreTradingService={coreTradingService}/> , document.getElementById('root'));
