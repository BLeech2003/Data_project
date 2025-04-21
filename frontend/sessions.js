
// const session = require("express-session");
// const { createClient } = require("redis");
// const RedisStore = require("connect-redis").default;

// const redisClient = createClient({
//     url: "redis://localhost:6379",
//     legacyMode: true
// });

// redisClient.connect().catch(console.error);

// const redisStore = new RedisStore({
//     client: redisClient,
//     prefix: "myapp:"
// })

// module.exports = session({
//     store: redisStore,
//     secret: process.env.SESSION_SECRET || "test-key",
//     resave: false,
//     cookie: {
//         secure: false, //http
//         httpOnly: true,
//         sameSite: "lax",
//         maxAge: 2 * 60 * 60 * 1000 //2 hours
//     }
// })
