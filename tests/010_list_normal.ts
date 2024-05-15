import { should_equal } from "../lib/test.ts";

export default async function () {
    return should_equal(
        "010 list should work as per normal",
        {
            max_get: {
                bytes: 200,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key", "one"], "a".repeat(98));
            await kv.set(["test_key", "two"], "b".repeat(98));
            let str = "";
            const iter = kv.list<string>({ prefix: ["test_key"] });
            for await (const res of iter) str += res.value;
            return str;
        },
        "a".repeat(98) + "b".repeat(98),
    );
}
