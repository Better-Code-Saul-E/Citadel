import { RoomRepository } from "../../domain/RoomRepository";
import { Room } from "../../domain/entities/Room";

export class InMemoryRoomRepository implements RoomRepository {
    private roomById = new Map<string, Room>();
    private roomByName = new Map<string, Room>();

    add(room: Room): void {
        this.roomById.set(room.id, room);
        this.roomByName.set(room.name, room);
    }
    remove(roomId: string): void {
        const room = this.getById(roomId);

        if (!room) {
            return;
        }

        this.roomById.delete(roomId);
        this.roomByName.delete(room.name);
    }
    getById(roomId: string): Room | undefined {
        return this.roomById.get(roomId);
    }
    getByName(name: string): Room | undefined {
        return this.roomByName.get(name);
    }
    getAll(): Room[] {
        return Array.from(this.roomById.values());
    }

}