import { UserRepository } from "../../domain/UserRepository"
import { User } from "../../domain/entities/User";
import { Username } from "../../domain/valueObjects/Username";

export class InMemoryUserRepository implements UserRepository {
    private clients: User[] = [];

    add(user: User): void {
        this.clients.push(user);
    }
    remove(userId: string): void {
        this.clients = this.clients.filter(
            user => user.id !== userId
        );
    }
    getById(userId: string): User | undefined {
        return this.clients.find(
            user => user.id === userId
        );
    }
    isUsernameTaken(username: Username): boolean {
        return this.clients.some(
            user => user.username.value === username.value
        );
    }
    getAll(): User[] {
        return this.clients;
    }
}