import { UserRepository } from "../../domain/UserRepository";

export class SendMessageUseCase {
    private _userRepository: UserRepository

    constructor(userRespository: UserRepository) {
        this._userRepository = userRespository
    }

    execute(userId: string, text: string) {
        const senderUser = this._userRepository.getById(userId);

        if (senderUser?.isMuted) {
            throw new Error("You are currently muted and cannot send messages.");
        }

        if (!senderUser) {
            throw new Error("User not found.");
        }
        if (!text) {
            throw new Error("MESSAGE payload must contain 'text'.");
        }

        return {
            user: senderUser,
            username: senderUser.username.value,
            text
        };
    }
}