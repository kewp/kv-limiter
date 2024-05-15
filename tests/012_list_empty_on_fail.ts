import { should_equal } from "../lib/test.ts";

export default async function () {
    return should_equal(
        "012 list should return empty on failure",
        {
            max_get: {
                bytes: 100,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.set(["test_key", "one"], "a".repeat(98));
            await kv.set(["test_key", "two"], "a".repeat(98));

            await kv.reset_limits();

            await kv.get(["test_key", "one"]);
            await kv.get(["test_key", "two"]);

            // this should come back with nothing ...

            const iter = kv.list<string>({ prefix: ["test_key"] });
            const users = [];
            for await (const res of iter) users.push(res);
            return users.length;
        },
        0,
    );
}
