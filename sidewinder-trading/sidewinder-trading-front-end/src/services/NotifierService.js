export default class NotifierService {
    constructor() {
        this.subscribers = null;
    }

    subscribe( fn ) {
        this.subscribers = fn;
    }

    notify( notification ) {
        if (this.subscribers !== null) {
            this.subscribers( notification );
        }
    }
}