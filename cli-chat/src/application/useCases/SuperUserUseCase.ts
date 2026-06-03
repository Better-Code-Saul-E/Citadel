import { Role } from "../../domain/enums/Role";
import { UserRepository } from "../../domain/UserRepository";

export class SuperUserUseCase {
    private _userRepository: UserRepository;
    private _password: string;

    constructor(password: string, userRepository: UserRepository) {
        this._userRepository = userRepository;
        this._password = password;
    }

    public execute(userId: string, attemptedPassword: string) {
        if (attemptedPassword !== this._password) {
            throw new Error("Invalid superuser password.");
        }

        let user = this._userRepository.getById(userId);
        if (!user) {
            throw new Error("User does not exist");
        }

        user.changeRole(Role.ADMIN);
        return true;
    }
}