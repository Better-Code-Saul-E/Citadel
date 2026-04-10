import { Room } from "../../domain/entities/Room";
import { UserRepository } from "../../domain/UserRepository";
import { RoomRepository } from "../../domain/RoomRepository";
import { v4 as uuidv4 } from "uuid";

export class JoinRoomUseCase {
    private _userRepository: UserRepository
    private _roomRepository: RoomRepository

    constructor(userRespository: UserRepository, roomRepository: RoomRepository) {
        this._userRepository = userRespository;
        this._roomRepository = roomRepository;
    }

    public execute(userId: string, roomName: string, limit?: number): Room {
        const user = this._userRepository.getById(userId);

        if(!user){
            throw new Error("User not found.");
        }

        if(user.currentRoomName){
            if(user.currentRoomName === roomName){
                throw new Error(`You are already in the room: ${roomName}.`);
            }

            const oldRoom = this._roomRepository.getByName(user.currentRoomName);
            if(oldRoom){
                oldRoom.leave(user.id);

                if(oldRoom.isEmpty){
                    this._roomRepository.remove(oldRoom.id);
                }
            }
        }
        let room = this._roomRepository.getByName(roomName);

        if(!room){
            const roomLimit = limit !== undefined ? limit : 10;
            room = new Room(uuidv4(), roomName, roomLimit);
            this._roomRepository.add(room);
        }

        room.join(user);
        user.currentRoomName = room.name;

        return room;
    }
}