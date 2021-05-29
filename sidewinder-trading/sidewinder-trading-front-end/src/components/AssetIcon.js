import React from 'react';
import uuid4 from "uuid4/browser.mjs";
export default class AssetIcon extends React.Component {
    constructor( props ) {
        super(props);

        this.noSymbols = [

        ]
    }

    assetType = function ( currency ) {
        if (currency === 'USD' || currency === 'GBP' || currency === 'EUR') {
            return 'FIAT';
        }
        else {
            return 'CRYPTO';
        }
    }

    render() {
        const asset = this.props.asset;
        if (asset === 'null') {
            alert('asset is null');
        }
        const assetType = this.assetType( asset );
        const classes = typeof this.props.classes !== 'undefined' ? ' ' + this.props.classes : ' ';
        const size = typeof this.props.size !== 'undefined' ? this.props.size : 'medium';
        const style = typeof this.props.style !== 'undefined' ? this.props.style : {}
        if (assetType === 'FIAT') {
            return <i style={style} className={'fiat-icon-' + size + ' fa fa-' + asset.toLowerCase() + ' currency-icon-' + size + classes }></i>
        }
        else if (this.noSymbols.indexOf(asset) > -1) {
            return <i style={style} className={'fiat-icon-' + size + ' fa fa-' + asset.toLowerCase() + ' currency-icon-' + size + classes}></i>
        }
        else {
            let height = '30px';
            if (size === 'large') {
                height = '48px';
            }
            else if (size === 'small') {
                height = '22px';
            }
            return <img id={uuid4()} draggable={typeof this.props.draggable !== 'undefined' ? this.props.draggable : false} style={style} height={height} src={'/resources/icons/128/color/' + ( asset !== null ?  asset.toLowerCase() : '' ) + '.png'} className={classes}/>
        }
    }
}