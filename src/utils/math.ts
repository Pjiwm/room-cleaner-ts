export function keepNumberInDomain(min: number, max: number, value: number) {
	return Math.min(Math.max(value, min), max);
}

export function numberIsInDomain(min: number, max: number, value: number) {
	return value >= min && value < max;
}

export function randomNumberBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}
