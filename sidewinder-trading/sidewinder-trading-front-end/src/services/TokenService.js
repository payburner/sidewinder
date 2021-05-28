import uuid4 from "uuid4";
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

    convertToToken( password ) {
        if (password === 'billy') {
            this.token = uuid4();
            this.subscribers(this.token);
        }
    }

}