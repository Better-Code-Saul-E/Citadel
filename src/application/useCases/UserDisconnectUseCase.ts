import { UserRepository } from "../../domain/UserRepository";
import { RoomRepository } from "../../domain/RoomRepository";
import { User } from "../../domain/entities/User";

export class UserDisconnectUseCase {
    private _userRepository: UserRepository
    private _roomRepository: RoomRepository

    constructor(userRespository: UserRepository, roomRepository: RoomRepository) {
        this._userRepository = userRespository
        this._roomRepository = roomRepository
    }

    execute(userId: string) {
        let user = this._userRepository.getById(userId);

        if (!user) {
            return null
        }

        if (user.currentRoomName) {
            const room = this._roomRepository.getByName(user.currentRoomName);
            if (room) {
                room.leave(user.id);
                if (room.isEmpty) {
                    this._roomRepository.remove(room.id);
                }
            }
        }

        this._userRepository.remove(userId);

        return user
    }
}