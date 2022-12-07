import { PrismaClient } from '@prisma/client';
import { ApplicationCommandRegistries, LogLevel, RegisterBehavior, SapphireClient } from '@sapphire/framework';
import { IntentsBitField } from 'discord.js';
import './lib/setup';

const client = new SapphireClient({
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers],
	loadMessageCommandListeners: true,
	defaultPrefix: ''
});

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);

client.prisma = new PrismaClient();

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.prisma.$connect();
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();

declare module 'discord.js' {
	interface Client {
		prisma: PrismaClient;
	}
}
