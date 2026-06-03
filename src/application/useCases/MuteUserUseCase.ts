import { Role } from "../../domain/enums/Role";
import { UserRepository } from "../../domain/UserRepository"

export class MuteUserUseCase {
    private _userRepository: UserRepository

    constructor(userRespository: UserRepository) {
        this._userRepository = userRespository
    }

    public execute(requesterId: string, targetUsername: string) {
        let requester = this._userRepository.getById(requesterId);
        let targetUser = this._userRepository.getByUsername(targetUsername);

        if (!targetUser || !requester) {
            throw new Error("User does not exist.")
        }

        if (requester.role === Role.USER) {
            throw new Error("Unauthorized");
        }
        if (targetUser.role === Role.ADMIN) {
            throw new Error("You cannot mute an Admin!");
        }

        targetUser.applyMute()
    }
}