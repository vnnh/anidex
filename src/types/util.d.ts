type NullableField<T extends object, TKey extends keyof T> = {
	[key in Exclude<keyof T, TKey>]: T[key];
} & {
	[key in TKey]?: T[key];
};
