import { container } from '@sapphire/framework';
import type { User } from 'discord.js';

/**
 * Gets the ordinal number of a number
 * @param n The number to get the ordinal number of
 */
export function numbth(n: number) {
	if (n > 3 && n < 21) return 'th';
	switch (n % 10) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

export async function hitLimit(user: User) {
	const events = await container.client.prisma.secretSantaEvent.count({
		where: {
			creator: user.id,
			sentPresentTimeAlert: false
		}
	});

	if (events >= 2) {
		return true;
	}

	return false;
}
