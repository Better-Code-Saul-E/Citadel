import { User } from './entities/User';
import { Username } from './valueObjects/Username';

export interface UserRepository {
    add(user: User): void;
    remove(userId: string): void;   
    getById(userId: string): User | undefined;
    getByUsername(username: string): User | undefined;
    isUsernameTaken(username: Username): boolean;
    getAll(): User[];
}