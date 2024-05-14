const kv = await Deno.openKv();

export default function (limits) {
    return {
        set: async (keys, obj) => {
            if (limits.max_set) {
                const size = JSON.stringify(obj).length;
                if (size > limits.max_set + 1) {
                    if (limits.on_exceed) {
                        limits.on_exceed();
                    }
                    return;
                }
            }

            return await kv.set(keys, obj);
        },

        get: async (keys) => {
            return await kv.get(keys);
        },
    };
}
