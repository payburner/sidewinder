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

}