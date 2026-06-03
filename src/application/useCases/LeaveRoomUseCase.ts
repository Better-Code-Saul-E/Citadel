import { RoomRepository } from "../../domain/RoomRepository";
import { UserRepository } from "../../domain/UserRepository";

export class LeaveRoomUseCase {
    private _userRepository: UserRepository
    private _roomRepository: RoomRepository

    constructor(userRespository: UserRepository, roomRepository: RoomRepository) {
        this._userRepository = userRespository;
        this._roomRepository = roomRepository;
    }

    public execute(userId: string, roomName: string): boolean {
        const room = this._roomRepository.getByName(roomName);
        if (!room) {
            return false;
        }

        const user = this._userRepository.getById(userId);
        if(!user){
            return false;
        }

        const wasRemoved = room.leave(userId);
        user.returnToLobby();

        if (room.isEmpty) {
            this._roomRepository.remove(room.id);
        }

        return wasRemoved;
    }
}