import React from 'react';

export default class AssetIcon extends React.Component {
    constructor( props ) {
        super(props);

        this.noSymbols = [
            'USDC','GUSD','PAX','DAI','MKR','LINK'
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
        const assetType = this.assetType( asset );
        const classes = typeof this.props.classes !== 'undefined' ? ' ' + this.props.classes : ' ';
        const size = typeof this.props.size !== 'undefined' ? this.props.size : 'medium';
        if (assetType === 'FIAT') {
            return <i className={'fiat-icon-' + size + ' fa fa-' + asset.toLowerCase() + ' currency-icon-' + size + classes }></i>
        }
        else if (this.noSymbols.indexOf(asset) > -1) {
            return <i className={'fiat-icon-' + size + ' fa fa-' + asset.toLowerCase() + ' currency-icon-' + size + classes}></i>
        }
        else {
            let height = '30px';
            if (size === 'large') {
                height = '48px';
            }
            else {
                height = '22px';
            }
            return <img height={height} src={'/resources/icons/128/color/' + asset.toLowerCase() + '.png'} className={classes}/>
        }
    }
}