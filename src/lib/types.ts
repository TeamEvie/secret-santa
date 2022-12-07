import type { SecretSantaEvent } from '@prisma/client';
import type { Client, Guild, Snowflake, TextBasedChannel, User } from 'discord.js';
import { z } from 'zod';

const MatchersSchema = z.array(
	z.object({
		user: z.string(),
		receivingFrom: z.string(),
		givingTo: z.string()
	})
);

export type MatchersSerialized = z.infer<typeof MatchersSchema>;

export type Matchers = {
	user: User;
	receivingFrom: User;
	givingTo: User;
}[];

export async function serializeMatchers(matchers: Matchers): Promise<MatchersSerialized> {
	return MatchersSchema.parseAsync(
		matchers.map((matcher) => ({
			user: matcher.user.id,
			receivingFrom: matcher.receivingFrom.id,
			givingTo: matcher.givingTo.id
		}))
	);
}

export async function deserializeMatchers(matchers: unknown, client: Client): Promise<Matchers> {
	const parsed = await MatchersSchema.parseAsync(matchers);

	return Promise.all(
		parsed.map(async (matcher) => ({
			user: await client.users.fetch(matcher.user),
			receivingFrom: await client.users.fetch(matcher.receivingFrom),
			givingTo: await client.users.fetch(matcher.givingTo)
		}))
	);
}

export interface MatchEvent {
	matchers: Matchers;
	client: Client;
	guild: Guild;
	channel: TextBasedChannel;
	presentTime: Date;
	creator: User;
}

export type PresentTimeEvent = SecretSantaEvent & {
	guild: Guild;
	channel: TextBasedChannel;
	matchersP: Matchers;
	creatorP: User;
};

export type AutocompleteDB = {
	name: string;
	value: Snowflake;
}[];
