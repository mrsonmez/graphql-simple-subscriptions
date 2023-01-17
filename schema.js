const { createSchema, createPubSub } = require("graphql-yoga");

const { nanoid } = require("nanoid");
const pubSub = createPubSub();

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type User {
      id: ID!
      username: String!
    }

    type Mutation {
      addUser(username: String!): User
    }

    type Subscription {
      countdown(from: Int!): Int!
      userAdded: User!
    }
    type Query {
      user: [User]!
    }
  `,
  resolvers: {
    Query: {
      user: () => users,
    },
    Mutation: {
      addUser: (_, { username }, { pubSub }) => {
        const user = { id: nanoid(), username };
        users.push(user);
        pubSub.publish("userCreated", user);
        return user;
      },
    },
    Subscription: {
      countdown: {
        subscribe: async function* (_, { from }) {
          for (let i = from; i >= 0; i--) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            yield { countdown: i };
          }
        },
      },
      userAdded: {
        subscribe: async function* () {
          pubSub.subscribe("userAdded");
        },
        resolve: (payload) => console.log(payload),
      },
    },
  },
});
