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

		if (!interaction.guild) return void interaction.reply({ content: 'This command can only be used in a guild!', ephemeral: true });

		const presentTime = interaction.options.getString('present-time', true);

		const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new UserSelectMenuBuilder()
				.setCustomId(`start-v1:${presentTime}:${interaction.user.id}`)
				.setPlaceholder('Nothing selected')
				.setMaxValues(25)
				.setMinValues(3)
		);

		return void (await interaction.reply({
			content: 'Choose 3-25 people to be included in your Secret Santa.',
			components: [row]
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
					description: 'Time users will have their Secret Santa revealed to each other (can be set to an exact date)',
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true
				}
			]
		});
	}
}
