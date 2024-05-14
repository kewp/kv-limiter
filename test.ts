import { should_pass, should_fail } from "./lib/test.ts";

await should_pass(
    "max_set pass",
    {
        max_set: 100,
    },
    (kv) => {
        return kv.set(["test_key"], "a".repeat(99));
    },
);

await should_fail(
    "max_set fail",
    {
        max_set: 100,
    },
    (kv) => {
        return kv.set(["test_key"], "a".repeat(101));
    },
);
