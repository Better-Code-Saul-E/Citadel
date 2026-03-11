import { UserRepository } from "../../domain/UserRepository";

export class UserDisconnectUseCase {
    private _userRepository: UserRepository

    constructor(userRespository: UserRepository) {
        this._userRepository = userRespository
    }

    execute(userId: string) {
        let user = this._userRepository.getById(userId);

        if (!user) {
            return null
        }

        this._userRepository.remove(userId);

        return user
    }
}