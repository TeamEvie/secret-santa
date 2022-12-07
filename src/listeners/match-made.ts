import { Listener } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, MessageActionRowComponentBuilder, time, User } from 'discord.js';
import { SantaEvents } from '../lib/constants';
import { MatchEvent, serializeMatchers } from '../lib/types';

export class MatchListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: SantaEvents.Match
		});
	}

	public async run(match: MatchEvent) {
		await this.container.client.prisma.secretSantaEvent.create({
			data: {
				presentTime: match.presentTime,
				guildId: match.guild.id,
				channelId: match.channel.id,
				matchers: {
					set: await serializeMatchers(match.matchers)
				},
				creator: match.creator.id
			}
		});

		const ignored = await this.container.client.prisma.memberSettings.findMany({
			where: {
				id: {
					in: match.matchers.map((matcher) => matcher.user.id)
				},
				guildId: match.guild.id
			}
		});

		const filtered = match.matchers.filter((matcher) => !ignored.find((member) => member.id === matcher.user.id));

		for (const matcher of filtered) {
			const embed = new EmbedBuilder();

			embed.setTitle('Secret Santa');
			embed.setDescription(
				`Ho ho ho! ${match.creator} has created a Secret Santa event! You are the Secret Santa for ${
					matcher.givingTo
				}! Present time is in ${time(match.presentTime, 'R')}!`
			);
			embed.setColor(Colors.Red);
			embed.setFooter({
				text: `This is an automated message. You can stop receiving Secret Santa alerts from ${match.guild.name} by clicking the 'Ignore' button below.`
			});

			const failedDms: User[] = [];

			try {
				await matcher.user.send({
					embeds: [embed],
					components: [
						new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
							new ButtonBuilder().setCustomId(`ignore:${match.guild.id}`).setLabel('Ignore').setStyle(ButtonStyle.Danger)
						)
					]
				});
			} catch {
				failedDms.push(matcher.user);
			}

			if (failedDms.length) {
				const embed = new EmbedBuilder();

				embed.setTitle('Secret Santa');
				embed.setDescription(`I was unable to send a DM to ${failedDms.map((user) => user.toString()).join(', ')}.`);
				embed.setColor(Colors.Red);

				await match.channel.send({ embeds: [embed] }).catch(() => null);
			}
		}
	}
}
