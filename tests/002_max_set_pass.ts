import { should_pass, delay } from "../lib/test.ts";

export default async function () {
    return should_pass(
        "002 max_set pass",
        {
            max_set: {
                bytes: 100,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key"], "a".repeat(98));
            await delay(200);
            await kv.set(["test_key"], "a".repeat(98));
        },
    );
}
