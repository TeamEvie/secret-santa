import { SnowflakeUtil } from 'discord.js';
import { join } from 'path';
import type { AutocompleteDB } from './types';
import { numbth } from './utils';

export const rootDir = join(__dirname, '..', '..');
export const srcDir = join(rootDir, 'src');

export enum SantaEvents {
	Match = 'match',
	PresentTime = 'presentTime'
}

export const DayMonthYearDB: AutocompleteDB = [];

const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

for (const month of months) {
	for (let dayI = 1; dayI <= 31; dayI++) {
		for (let yearI = new Date().getFullYear(); yearI <= new Date().getFullYear() + 1; yearI++) {
			DayMonthYearDB.push({
				name: `${dayI}${numbth(dayI)} ${month[0].toUpperCase()}${month.slice(1)} ${yearI}`,
				value: SnowflakeUtil.generate({
					timestamp: new Date(`${month} ${dayI}, ${yearI}`)
				}).toString()
			});
		}
	}
}

export const HourlyDB: AutocompleteDB = [...Array(24).keys()]
	.map((hour) => {
		if (hour === 0) return null;
		return {
			name: `In ${hour} hour${hour === 1 ? '' : 's'}`,
			value: SnowflakeUtil.generate({
				timestamp: new Date(Date.now() + hour * 60 * 60 * 1000)
			}).toString()
		};
	})
	.filter(Boolean) as AutocompleteDB;

export const TimeDB: AutocompleteDB = [...DayMonthYearDB, ...HourlyDB];
