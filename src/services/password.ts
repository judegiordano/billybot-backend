import { genSalt, hash, compare } from "bcryptjs";

export async function generateSalt() {
	return genSalt(12);
}

export async function hashPassword(password: string) {
	const salt = await generateSalt();
	return hash(password, salt);
}

export async function comparePassword(password: string, hashedPassword: string) {
	return compare(password, hashedPassword);
}
