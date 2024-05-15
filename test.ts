import {
    should_equal,
    should_pass,
    should_fail,
    should_fail_then_pass,
    should_return_null,
} from "./lib/test.ts";

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

await should_equal(
    "set and get work as per normal",
    {
        max_set: {
            bytes: 100,
            interval_ms: 100,
        },
        max_get: {
            bytes: 100,
            interval_ms: 100
        }
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key"], "test_value");
        return (await kv.get(["test_key"])).value;
    },
    "test_value"
);

await should_pass(
    "max_set pass",
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

await should_fail(
    "max_set fail",
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

await should_fail_then_pass(
    "max_set fail then pass",
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
    async (kv) => {
        await delay(100);
        await kv.set(["test_key"], "a".repeat(98));
    },
);

await should_pass(
    "max_get pass",
    {
        max_get: {
            bytes: 100,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key"], "a".repeat(98));
        await kv.get(["test_key"]);
        await delay(200);
        await kv.get(["test_key"]);
    },
);

await should_fail(
    "max_get fail",
    {
        max_get: {
            bytes: 100,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key"], "a".repeat(98));
        await kv.get(["test_key"]);
        await delay(50);
        await kv.get(["test_key"]);
    },
);

await should_fail_then_pass(
    "max_get fail then pass",
    {
        max_get: {
            bytes: 100,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key"], "a".repeat(98));
        await kv.get(["test_key"]);
        await delay(50);
        await kv.get(["test_key"]);
    },
    async (kv) => {
        await delay(100);
        await kv.get(["test_key"]);
    },
);

await should_return_null(
    "max_get returns null",
    {
        max_get: {
            bytes: 100,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key"], "a".repeat(101));
        await kv.get(["test_key"]);
        await delay(50);
        return await kv.get(["test_key"]);
    },
);

await should_pass(
    "max_get for list passes",
    {
        max_get: {
            bytes: 200,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key", "one"], "a".repeat(98));
        await kv.set(['test_key', 'two'], "a".repeat(98));

        const iter = kv.list<string>({ prefix: ["test_key"] });
        const users = [];
        for await (const res of iter) users.push(res);
    }
);

await should_equal(
    "list should work as per normal",
    {
        max_get: {
            bytes: 200,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key", "one"], "a".repeat(98));
        await kv.set(['test_key', 'two'], "b".repeat(98));
        let str = '';
        const iter = kv.list<string>({ prefix: ["test_key"] });
        for await (const res of iter) str += res.value;
        return str;
    },
    "a".repeat(98) + "b".repeat(98)
);

await should_fail(
    "max_get for list fails",
    {
        max_get: {
            bytes: 100,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key", "one"], "a".repeat(98));
        await kv.set(['test_key', 'two'], "a".repeat(98));

        const iter = kv.list<string>({ prefix: ["test_key"] });
        const users = [];
        for await (const res of iter) users.push(res);
    }
)