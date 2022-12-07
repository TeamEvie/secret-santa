import { Listener } from '@sapphire/framework';
import { Events, Guild } from 'discord.js';

export class GuildJoinListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildCreate
		});
	}

	public async run(guild: Guild) {
		await this.container.client.prisma.guild.upsert({
			where: {
				id: guild.id
			},
			update: {
				id: guild.id
			},
			create: {
				id: guild.id
			}
		});
	}
}
