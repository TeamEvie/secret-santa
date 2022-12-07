import { Listener } from '@sapphire/framework';
import { Colors, EmbedBuilder, userMention } from 'discord.js';
import { SantaEvents } from '../lib/constants';
import type { PresentTimeEvent } from '../lib/types';

export class PresentTimeListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: SantaEvents.PresentTime
		});
	}

	public async run(event: PresentTimeEvent) {
		const matches = event.matchersP.map((matcher) => `${matcher.user} ➡️ ${matcher.givingTo}`).join('\n');

		const embed = new EmbedBuilder();

		embed.setTitle('Secret Santa');
		embed.setDescription(`Ho ho ho! It's present time!\n${matches}`);
		embed.setColor(Colors.Red);

		await event.channel.send({ content: userMention(event.creator), embeds: [embed] });
	}
}
