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
	export class CoachLog {
	    id: string;
	    type: string;
	    content: string;
	    createdAt: string;
	    dismissed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CoachLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.content = source["content"];
	        this.createdAt = source["createdAt"];
	        this.dismissed = source["dismissed"];
	    }
	}
	export class NudgeMessage {
	    id: string;
	    message: string;
	    daysSince: number;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new NudgeMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.message = source["message"];
	        this.daysSince = source["daysSince"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class TagStat {
	    name: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new TagStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.count = source["count"];
	    }
	}
	export class TopicSuggestion {
	    title: string;
	    description: string;
	    relatedMemoIds: string[];
	
	    static createFrom(source: any = {}) {
	        return new TopicSuggestion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.description = source["description"];
	        this.relatedMemoIds = source["relatedMemoIds"];
	    }
	}
	export class WeeklyReport {
	    id: string;
	    memoCount: number;
	    wordCount: number;
	    tagDistribution: TagStat[];
	    insights: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new WeeklyReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.memoCount = source["memoCount"];
	        this.wordCount = source["wordCount"];
	        this.tagDistribution = this.convertValues(source["tagDistribution"], TagStat);
	        this.insights = source["insights"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace memo {
	
	export class Memo {
	    id: string;
	    title?: string;
	    content: string;
	    pinned: boolean;
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
	        this.pinned = source["pinned"];
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
	    pinned: boolean;
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
	        this.pinned = source["pinned"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}

}

export namespace tag {
	
	export class Tag {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Tag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class TagWithCount {
	    id: string;
	    name: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new TagWithCount(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.count = source["count"];
	    }
	}

}

export namespace wiki {
	
	export class BacklinkInfo {
	    memoId: string;
	    title?: string;
	    preview: string;
	
	    static createFrom(source: any = {}) {
	        return new BacklinkInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.memoId = source["memoId"];
	        this.title = source["title"];
	        this.preview = source["preview"];
	    }
	}
	export class ResolvedLink {
	    title: string;
	    memoId?: string;
	    exists: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ResolvedLink(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.memoId = source["memoId"];
	        this.exists = source["exists"];
	    }
	}

}

