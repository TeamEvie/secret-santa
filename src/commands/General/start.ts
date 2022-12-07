import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageActionRowComponentBuilder,
	UserSelectMenuBuilder
} from 'discord.js';
import { TimeDB } from '../../lib/constants';
import { hitLimit } from '../../lib/utils';

export class Start extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (await hitLimit(interaction.user)) {
			return void interaction.reply({
				content: `You have reached the limit of 2 Secret Santa events per user. You can only
				create a new event after your current events have ended.`,
				ephemeral: true
			});
		}

		const presentTime = interaction.options.getString('present-time', true);

		const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new UserSelectMenuBuilder().setCustomId(`start-v1:${presentTime}`).setPlaceholder('Nothing selected').setMaxValues(25).setMinValues(3)
		);

		return void (await interaction.reply({
			content: 'Choose 3-25 people to be included in your Secret Santa.',
			components: [row],
			ephemeral: true
		}));
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		const query = interaction.options.getString('present-time', true);

		const matches = TimeDB.filter((data) => data.name.toLowerCase().includes(query ? query.toLowerCase() : 'hour')).slice(0, 5);

		interaction.respond(
			matches.map((match) => ({
				name: match.name,
				value: match.value
			}))
		);
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand({
			name: 'start',
			description: 'Start a Secret Santa event.',
			options: [
				{
					name: 'present-time',
					description: 'The time you want to give your presents.',
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true
				}
			]
		});
	}
}
