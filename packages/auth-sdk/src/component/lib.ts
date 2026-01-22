import { query, action, mutation } from "./_generated/server";

export const getUser = query({
	args: {},
	handler: async () => {
		return null;
	},
});

export const syncUser = action({
	args: {},
	handler: async () => {
		return null;
	},
});

export const deleteSession = mutation({
	args: {},
	handler: async () => {
		return false;
	},
});
