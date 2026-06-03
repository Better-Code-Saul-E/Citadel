import { UserRepository } from "../../domain/UserRepository";
import { v4 as uuid } from "uuid";
import { Username } from "../../domain/valueObjects/Username";
import { User } from "../../domain/entities/User";

export class UserJoinUseCase {
    private _userRepository: UserRepository

    constructor(userRespository: UserRepository) {
        this._userRepository = userRespository
    }

    execute(name: string) {
        let username = new Username(name);

        if (this._userRepository.isUsernameTaken(username)) {
            throw new Error("Username is already taken");
        }

        const id = uuid()
        const user = new User(username, id);

        this._userRepository.add(user);

        return user
    }
}