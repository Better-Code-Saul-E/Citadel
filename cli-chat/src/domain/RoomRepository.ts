import { Room } from "./entities/Room";

export interface RoomRepository {
    add(room: Room): void;
    remove(roomId: string): void;   
    getById(roomId: string): Room | undefined;
    getByName(name: string): Room | undefined;
    getAll(): Room[];
}