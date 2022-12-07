import { Listener } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Events, Interaction, MessageActionRowComponentBuilder } from 'discord.js';

export class UnIgnore extends Listener {
	private async entryPoint(interaction: ButtonInteraction, guildId: string) {
		const guild = await this.container.client.guilds.fetch(guildId);

		if (!guild) {
			return interaction.editReply('That server does not exist.');
		}

		if (!guild.members.fetch(interaction.user.id).catch(() => null)) {
			return interaction.editReply('You are not in that server.');
		}

		const memberSettings = await this.container.client.prisma.memberSettings.findFirst({
			where: {
				id: interaction.user.id,
				guildId: guild.id
			}
		});

		if (!memberSettings) {
			return interaction.editReply(`You're not ignoring ${guild.name}`);
		}

		await this.container.client.prisma.memberSettings.update({
			where: {
				id_guildId: {
					id: interaction.user.id,
					guildId: guild.id
				}
			},
			data: {
				blacklisted: false
			}
		});

		return void interaction.editReply({
			content: `Done! You will now receive notifications from ${guild.name}.`,
			components: [
				new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
					new ButtonBuilder().setCustomId(`ignore:${guildId}`).setLabel('Undo').setStyle(ButtonStyle.Danger)
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
		if (!interaction.isButton() || !interaction.customId.startsWith('unignore:')) return;

		await interaction.deferReply({ ephemeral: true });

		const guildId = interaction.customId.split(':')[1];

		this.entryPoint(interaction, guildId);
	}
}
