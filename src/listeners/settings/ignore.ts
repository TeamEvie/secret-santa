import { Listener } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Events, Interaction, MessageActionRowComponentBuilder } from 'discord.js';

export class Ignore extends Listener {
	private async entryPoint(interaction: ButtonInteraction, guildId: string) {
		const guild = await this.container.client.guilds.fetch(guildId);

		if (!guild) {
			return interaction.editReply('That server does not exist.');
		}

		if (!guild.members.fetch(interaction.user.id).catch(() => null)) {
			return interaction.editReply('You are not in that server.');
		}

		await this.container.client.prisma.guild.upsert({
			where: {
				id: guild.id
			},
			update: {
				memberSettings: {
					upsert: {
						where: {
							id_guildId: {
								id: interaction.user.id,
								guildId: guild.id
							}
						},
						create: {
							id: interaction.user.id,
							blacklisted: true
						},
						update: {
							id: interaction.user.id,
							blacklisted: true
						}
					}
				}
			},
			create: {
				id: guild.id,
				memberSettings: {
					create: {
						id: interaction.user.id,
						blacklisted: true
					}
				}
			}
		});

		return void interaction.editReply({
			content: `Done! You will no longer receive any notifications from ${guild.name}.`,
			components: [
				new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
					new ButtonBuilder().setCustomId(`unignore:${guildId}`).setLabel('Undo').setStyle(ButtonStyle.Danger)
				)
			]
		});
	}

	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.InteractionCreate
		});
	}

	public async run(interaction: Interaction) {
		if (!interaction.isButton() || !interaction.customId.startsWith('ignore:')) return;

		await interaction.deferReply({ ephemeral: true });

		const guildId = interaction.customId.split(':')[1];

		this.entryPoint(interaction, guildId);
	}
}
