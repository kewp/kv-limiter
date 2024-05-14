# kv limiter

this is for deno kv, but primarily for deno deploy -
there is no way to limit spending on deploy so
you can get a huge bill if you aren't careful. this
library aims to mitigate that by wrapping deno kv
with a rate limiter that will fail if the rate is
exceeded.

## how it works

look at `test.ts` to see examples. it looks like this:

```ts
import limiter from "./kv_limiter.ts";

const kv = limiter({
    max_set: {
        bytes: 100,
        interval_ms: 100
    },
    max_get: {
        bytes: 100,
        interval_ms: 100
    },
    on_exceed: async (type) => {
        console.log(`kv ${type} limit exceeded`);
    },
});

// now use kv as per usual

await kv.set(["key"], 'hello');
const res = await kv.get(["key"]);

```

here we specify that the max bytes set is 100 bytes
within 100 milliseconds.

## running tests

just run `./test.sh` (or `test.ts` yourself) to run
the tests. the `test.ts` should also show you how
it works.

## limitations

i've only implemented `get` and `set`. also i have
yet to use this in production.

and it will slow `kv` down a lot - it does several
calls to `kv` instead of just the one you ask for.

## how it works

it sets the following keys:

```ts
const SET_BYTES_KEY = "kv_limiter_set_bytes";
const SET_MS_KEY = "kv_limiter_set_ms";

const GET_BYTES_KEY = "kv_limiter_get_bytes";
const GET_MS_KEY = "kv_limiter_get_ms";
```

every time you ask for something it first checks
how much time has elapsed since the last call
(to get/set). if the elapsed `ms` has passed then
we're good - set `ms` in the kv database and carry on.
if not, check if what we are doing is ok i.e. are
we setting too much, or have we gotten too much.

## get vs set

get and set work differently - with set you know
beforehand if you are going to overtake the limit -
you get the last total in the kv db and then add
what is about to be set.

with get you can't know if you've overtaken the
limit until you've gotten the value! so we get
the value, _then_ check if it and the last total
exceeds ...
