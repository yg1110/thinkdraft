export namespace ai {
	
	export class BlogDraft {
	    id: string;
	    memoIds: string;
	    template: string;
	    title: string;
	    content: string;
	    status: string;
	    publishedAt?: string;
	    publishedUrl?: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new BlogDraft(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.memoIds = source["memoIds"];
	        this.template = source["template"];
	        this.title = source["title"];
	        this.content = source["content"];
	        this.status = source["status"];
	        this.publishedAt = source["publishedAt"];
	        this.publishedUrl = source["publishedUrl"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class BlogDraftSummary {
	    id: string;
	    template: string;
	    title: string;
	    status: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new BlogDraftSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.template = source["template"];
	        this.title = source["title"];
	        this.status = source["status"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}

}

export namespace memo {
	
	export class Memo {
	    id: string;
	    title?: string;
	    content: string;
	    createdAt: string;
	    updatedAt: string;
	    deletedAt?: string;
	    syncStatus: string;
	
	    static createFrom(source: any = {}) {
	        return new Memo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.content = source["content"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	        this.deletedAt = source["deletedAt"];
	        this.syncStatus = source["syncStatus"];
	    }
	}
	export class MemoSummary {
	    id: string;
	    title?: string;
	    preview: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new MemoSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.preview = source["preview"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}

}

