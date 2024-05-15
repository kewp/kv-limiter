import { should_pass } from "../lib/test.ts";

export default async function () {
    return should_pass(
        "009 max_get for list passes",
        {
            max_get: {
                bytes: 200,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key", "one"], "a".repeat(98));
            await kv.set(["test_key", "two"], "a".repeat(98));

            const iter = kv.list<string>({ prefix: ["test_key"] });
            const users = [];
            for await (const res of iter) users.push(res);
        },
    );
}
