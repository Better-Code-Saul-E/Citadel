import { User } from "./User";

export class Room {
    public readonly id: string;
    public readonly name: string;
    public readonly limit: number;
    
    private _members: Map<string, User> = new Map();

    public get isEmpty(): boolean {
        return this._members.size === 0;
    }
    public get members(): User[] {
        return Array.from(this._members.values());
    }
    public get memberCount(): number {
        return this._members.size;
    }

    constructor(id: string, name: string, limit: number = 10) {
        this.id = id;
        this.name = name;
        this.limit = limit;
    }

    public join(user: User): void {
        if (this._members.size >= this.limit) {
            throw new Error(`Room ${this.name} is full.`);
        }
        this._members.set(user.id, user);
    }

    public leave(userId: string): boolean {
        return this._members.delete(userId);
    }

    public hasUser(userId: string): boolean {
        return this._members.has(userId);
    }
}