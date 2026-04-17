import { Username } from "../valueObjects/Username";

export class User {
    private readonly _username: Username;
    private readonly _id: string;
    private _currentRoomName: string | null = null;

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
    
    get currentRoomName(): string | null {
        return this._currentRoomName;
    }
    public enterRoom(roomName: string): void {
        this._currentRoomName = roomName;
    }
    public returnToLobby(): void {
        this._currentRoomName = null;
    }
}