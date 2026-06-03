export class Username {
  private readonly _value: string;

  constructor(value: string) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      throw new Error("Invalid username: Must be 3-20 characters and contain only letters, numbers, and underscores.");
    }

    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public equals(other: Username): boolean {
    return this._value === other.value;
  }
}