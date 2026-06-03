import { Role } from "../enums/Role";
import { Username } from "../valueObjects/Username";

export class User {
    private readonly _username: Username;
    private readonly _id: string;
    private _currentRoomName: string | null = null;
    private _isMuted: boolean = false;
    private _role = Role.USER;


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
    get isMuted(): boolean {
        return this._isMuted;
    }
    get role(): Role {
        return this._role;
    }


    public enterRoom(roomName: string): void {
        this._currentRoomName = roomName;
    }
    public returnToLobby(): void {
        this._currentRoomName = null;
    }
    public changeRole(newRole: Role): void {
        this._role = newRole;
    }
    public applyMute(): void {
        this._isMuted = true;
    }
    public removeMute(): void {
        this._isMuted = false;
    }

}