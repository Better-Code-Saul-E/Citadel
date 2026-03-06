import { Username } from "../valueObjects/Username";

export class User {
    private readonly _username: Username;
    private readonly _id: string;

    constructor(username: Username, id: string) {
        this._username = username;
        this._id = id;
    }
    
    get username(): Username {
        return this._username;
    }

    get id(): string {
        return this._id;
    }
}