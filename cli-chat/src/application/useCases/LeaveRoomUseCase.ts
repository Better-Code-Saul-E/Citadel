import { RoomRepository } from "../../domain/RoomRepository";
import { UserRepository } from "../../domain/UserRepository";

export class LeaveRoomUseCase {
    private _userRepository: UserRepository
    private _roomRepository: RoomRepository

    constructor(userRespository: UserRepository, roomRepository: RoomRepository) {
        this._userRepository = userRespository;
        this._roomRepository = roomRepository;
    }

    public execute(userId: string, roomName: string): void {
        const room = this._roomRepository.getByName(roomName);
        if (!room) {
            throw new Error(`Room ${roomName} does not exist.`);
        }

        const user = this._userRepository.getById(userId);
        if(!user){
            throw new Error("User not found.");
        }

        room.leave(userId);
        user.returnToLobby();

        if (room.isEmpty) {
            this._roomRepository.remove(room.id);
        }
    }
}