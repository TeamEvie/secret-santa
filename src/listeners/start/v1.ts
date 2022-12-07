import { Listener } from '@sapphire/framework';
import { Events, Interaction, SnowflakeUtil, User, UserSelectMenuInteraction } from 'discord.js';
import { SantaEvents } from '../../lib/constants';
import type { MatchEvent } from '../../lib/types';
import { hitLimit } from '../../lib/utils';

export class StartV1 extends Listener {
	private async entryPoint(interaction: UserSelectMenuInteraction, presentTime: Date) {
		const { guild, users, channel } = interaction;

		if (!guild || !channel) return void (await interaction.editReply({ content: 'This command can only be used in a guild!' }));

		if (users.size < 3) {
			return void (await interaction.editReply({ content: 'You need at least 3 users!' }));
		}

		const links: {
			user: User;
			receivingFrom: User;
			givingTo: User;
		}[] = [];
		const usersArray = [...users.values()].sort(() => Math.random() - 0.5);

		for (let i = 0; i < usersArray.length; i++) {
			const user = usersArray[i];
			const receivingFrom = usersArray[i - 1] ?? usersArray[usersArray.length - 1];
			const givingTo = usersArray[i + 1] ?? usersArray[0];

			links.push({ user, receivingFrom, givingTo });
		}

		const payload: MatchEvent = { matchers: links, client: this.container.client, guild, presentTime, channel, creator: interaction.user };
		this.container.client.emit(SantaEvents.Match, payload);

		return void (await interaction.editReply({ content: 'Done!' }));
	}

	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.InteractionCreate
		});
	}

	public async run(interaction: Interaction) {
		if (!interaction.isUserSelectMenu() || !interaction.customId.startsWith('start-v1:')) return;

		await interaction.deferReply({ ephemeral: true });

		if (await hitLimit(interaction.user)) return;

		const presentTime = new Date(SnowflakeUtil.timestampFrom(interaction.customId.split(':')[1]));

		this.entryPoint(interaction, presentTime);
	}
}
