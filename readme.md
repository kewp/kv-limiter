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
exceeds ... if so, set the total value, and fail.
subsequent gets will then fail / pass through
(and not add to your kv usage) until you go past
the ms ...

## return value

not sure what to return when the wrapper passes
through i.e. you've exceeded your limit ... should
we just return `null`? that's what's happening
currently. but of course, we'd have to change
existing code to handle this. might be better to
return a proper kv result but with `null` in the
value field...

## list

i'm not sure but i think `kv.list` pulls in
everything at once ... so we can't go through
each item and check if we've reached a limit,
we have to go through everything and check at
the end if the total was exceeded ... so only
subsequent get/list calls will fail ...

one thing about list that's nice, though, is
when subsequent calls do fail you just get
an empty list ... because of generators ...
which i don't fully understand ... but the
tests are working!

## local count

if we save the bytes and the ms in a local
variable we can check if we've exceeded
without going to kv to check the count
variables - that's because even in a separate
process the timing (i.e. `Date.now()`) should
be appropriate. so we can see if we're still
within the current interval window. if so,
and the last saved count is above the limit,
then we don't need to check in the kv db -
we have previously failed ... hence these
variables:

```ts
const local_count = {
    set: {
        bytes: 0,
        ms: 0,
    },
    get: {
        bytes: 0,
        ms: 0,
    },
};
```

however, we have to make sure these are kept
up to date correctly ... and i need to come
up with some tests that make sure this is the
case ...

## other considerations

how sure are we that ... `Date.now()` is going to
give ... the same, synchronised value across isolates?
like, if one isolate is running in Asia and another
is in Europe ... surely that means that one could be
giving a totally different millisecond value?

i see the docs say it's based on utc ...
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
so shouldn't be time zone dependent i.e. should have
the same value regardless of where the isolate it.

## research

i just saw this on hacker news:
https://smudge.ai/blog/ratelimit-algorithms

a great article on rate limiters. goes through the different types.
what i've implemented here is the fixed window limiter.