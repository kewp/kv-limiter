import { should_fail, delay } from "../lib/test.ts";

export default async function () {
    return should_fail(
        "003 max_set fail",
        {
            max_set: {
                bytes: 100,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key"], "a".repeat(98));
            await delay(50);
            await kv.set(["test_key"], "a".repeat(98));
        },
    );
}
