import { Events, Listener, Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { SantaEvents } from '../lib/constants';
import { deserializeMatchers, PresentTimeEvent } from '../lib/types';

const dev = process.env.NODE_ENV !== 'production';

export class UserEvent extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			once: true,
			event: Events.ClientReady
		});
	}

	private readonly style = dev ? yellow : blue;

	public run() {
		this.printBanner();
		this.printStoreDebugInformation();
		this.monitorEvents();
	}

	private async monitorEvents() {
		setInterval(async () => {
			try {
				const readyEvents = await this.container.client.prisma.secretSantaEvent.findMany({
					where: {
						presentTime: {
							lt: new Date()
						},
						sentPresentTimeAlert: false
					}
				});

				for (const event of readyEvents) {
					const guild = await this.container.client.guilds.fetch(event.guildId);
					if (!guild) {
						this.container.logger.warn(`Guild ${event.guildId} not found, skipping event ${event.id}`);
						continue;
					}

					const channel = await this.container.client.channels.fetch(event.channelId);
					if (!channel) {
						this.container.logger.warn(`Channel ${event.channelId} not found, skipping event ${event.id}`);
						continue;
					}

					if (!channel.isTextBased()) {
						this.container.logger.warn(`Channel ${event.channelId} is not text based, skipping event ${event.id}`);
						continue;
					}

					const matchersP = await deserializeMatchers(event.matchers, this.container.client);

					const creatorP = await this.container.client.users.fetch(event.creator);

					const payload = {
						...event,
						guild,
						channel,
						matchersP,
						creatorP
					} satisfies PresentTimeEvent;

					this.container.client.emit(SantaEvents.PresentTime, payload);

					await this.container.client.prisma.secretSantaEvent.update({
						where: {
							id: event.id
						},
						data: {
							sentPresentTimeAlert: true
						}
					});
				}
			} catch (error) {
				this.container.logger.error(error);
			}
		}, 1000);
	}

	private printBanner() {
		const success = green('+');

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc('');
		const line02 = llc('');
		const line03 = llc('');

		// Offset Pad
		const pad = ' '.repeat(7);

		console.log(
			String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	private styleStore(store: Store<any>, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}
}
