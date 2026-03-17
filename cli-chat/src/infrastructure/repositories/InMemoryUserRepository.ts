import { UserRepository } from "../../domain/UserRepository"
import { User } from "../../domain/entities/User";
import { Username } from "../../domain/valueObjects/Username";

export class InMemoryUserRepository implements UserRepository {
    private usersById = new Map<string, User>();
    private usersByUsername = new Map<string, User>();

    add(user: User): void {
        this.usersById.set(user.id, user);
        this.usersByUsername.set(user.username.value, user);
    }
    remove(userId: string): void {
        const user = this.usersById.get(userId);

        if (!user) {
            return;
        }

        this.usersById.delete(userId);
        this.usersByUsername.delete(user.username.value);
    }
    getById(userId: string): User | undefined {
        return this.usersById.get(userId);
    }
    getByUsername(username: string): User | undefined {
        return this.usersByUsername.get(username);
    }
    isUsernameTaken(username: Username): boolean {
        return this.usersByUsername.has(username.value);
    }
    getAll(): User[] {
        return Array.from(this.usersById.values());
    }
}