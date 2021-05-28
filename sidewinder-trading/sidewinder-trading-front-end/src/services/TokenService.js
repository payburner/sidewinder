
export default class TokenService {
    constructor() {
        this.subscribers = null;
        this.token = null;
    }

    subscribe( fn ) {
        this.subscribers = fn;
    }

    getToken() {
        return this.token;
    }

    removeToken() {
        this.token = null;
        this.subscribers(this.token);
    }

    convertToToken( password ) {
        if (password === 'billy') {
            this.token = 'jimmy';
            this.subscribers(this.token);
        }
    }

}