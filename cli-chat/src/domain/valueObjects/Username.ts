export class Username {
    private readonly value: string;

    constructor(value: string){
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      throw new Error("Invalid username: Must be 3-20 characters and contain only letters, numbers, and underscores.");
    }
    this.value = value;
  }

  public getValue(): string{
    return this.value;
  }

  public equals(other: Username): boolean{
    return this.value === other.getValue();
  }
}