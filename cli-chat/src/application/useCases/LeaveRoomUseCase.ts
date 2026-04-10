import { RoomRepository } from "../../domain/RoomRepository";

export class LeaveRoomUseCase {
    private _roomRepository: RoomRepository

    constructor(roomRepository: RoomRepository) {
        this._roomRepository = roomRepository;
    }

    public execute(userId: string, roomName: string): void {
        const room = this._roomRepository.getByName(roomName);

        if (!room) {
            throw new Error(`Room ${roomName} does not exist.`);
        }

        room.leave(userId);

        if (room.isEmpty) {
            this._roomRepository.remove(room.id);
        }
    }
}