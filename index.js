const {
  createSchema,
  createYoga,
  createPubSub,
  filter,
  pipe,
} = require("graphql-yoga");
const { createServer } = require("node:http");
const { nanoid } = require("nanoid");
const pubSub = createPubSub();
const { events, locations, users, participants } = require("./data.js");
const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Event {
      id: ID!
      title: String
      desc: String
      date: String
      from: String
      to: String
      location_id: Int
      user_id: Int
      user: [User]!
      participant: [Participant]!
      location: [Location]!
    }
    input addEventInput {
      title: String!
      desc: String!
      date: String!
      from: String
      to: String
      location_id: Int
      user_id: Int
    }
    input updateEventInput {
      title: String!
      desc: String!
      date: String!
      from: String
      to: String
      location_id: Int
      user_id: Int
    }
    # Location
    type Location {
      id: ID!
      name: String
      desc: String
      lat: Float
      lng: Float
    }
    input addLocationInput {
      name: String!
      desc: String!
      lat: Float!
      lng: Float!
    }
    input updateLocationInput {
      name: String!
      desc: String!
      lat: Float!
      lng: Float!
    }
    # User
    type User {
      id: ID!
      username: String!
      email: String!
    }
    input addUserInput {
      username: String!
      email: String!
    }
    input updateUserInput {
      username: String
      email: String
    }
    # Participant
    type Participant {
      id: ID!
      user_id: Int
      event_id: Int
    }
    input addParticipantInput {
      user_id: ID!
      event_id: ID!
    }
    input updateParticipantInput {
      user_id: Int
      event_id: Int
    }
    type deleteAllOutput {
      count: Int!
    }
    type Query {
      # Events
      events: [Event!]!
      event(id: ID!): Event!
      # Locations
      locations: [Location]!
      location(id: ID!): Location!
      # Users
      users: [User]!
      user(id: ID!): User!
      # Participants
      participants: [Participant]
      participant(id: ID!): Participant!
    }

    type Mutation {
      # User
      addUser(data: addUserInput): User!
      updateUser(id: ID!, data: updateUserInput): User!
      deleteUser(id: ID): User!
      deleteAllUsers: deleteAllOutput!
      # Event
      addEvent(data: addEventInput): Event!
      updateEvent(id: ID!, data: updateEventInput): Event!
      deleteEvent(id: ID): Event!
      deleteAllEvents: deleteAllOutput!
      # Location
      addLocation(data: addLocationInput): Location!
      updateLocation(id: ID!, data: updateLocationInput): Location!
      deleteLocation(id: ID): Location!
      deleteAllLocations: deleteAllOutput!
      # Participant
      addParticipant(data: addParticipantInput): Participant!
      updateParticipant(id: ID!, data: updateParticipantInput): Participant!
      deleteParticipant(id: ID): Participant!
      deleteAllParticipants: deleteAllOutput!
    }
    # Subscribe
    type Subscription {
      userCreated: User!
      eventCreated: Event!
      participantCreated: Participant!
    }
  `,
  resolvers: {
    Query: {
      // Events
      events: () => events,
      event: (parent, args) => events.find((item) => item.id == args.id),
      // Locations
      locations: () => locations,
      location: (parent, args) => locations.find((item) => item.id == args.id),
      // Users
      users: () => users,
      user: (parent, args) => users.find((item) => item.id == args.id),
      // Participants
      participants: () => participants,
      participant: (parent, args) => {
        return participants.find((item) => item.id == args.id);
      },
    },
    Event: {
      user: (parent, args) => users.filter((item) => item.id == parent.user_id),
      participant: (parent, args) =>
        participants.filter((item) => item.event_id == parent.location_id),
      location: (parent, args) =>
        locations.filter((item) => item.id == parent.location_id),
    },
    Mutation: {
      // User
      addUser: (parent, { data }, { pubSub }) => {
        const user = { id: nanoid(), ...data };
        users.push(user);
        pubSub.publish("userCreated", user);
        return user;
      },
      updateUser: (parent, { id, data }) => {
        const findex = users.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        users[findex] = { ...users[findex], ...data };
        return users[findex];
      },
      deleteUser: (parent, { id }) => {
        const findex = users.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        let user = users[findex];
        users.splice(findex, 1);
        return user;
      },
      deleteAllUsers: () => {
        const length = users.length;
        users.splice(0, length);
        return {
          count: length,
        };
      },
      // Event
      addEvent: (parent, { data }, { pubSub }) => {
        const event = { id: nanoid(), ...data };
        events.push(event);
        pubSub.publish("eventCreated", event);
        return event;
      },
      updateEvent: (parent, { id, data }) => {
        const findex = events.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        events[findex] = { ...events[findex], ...data };
        return events[findex];
      },
      deleteEvent: (parent, { id }) => {
        const findex = events.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        let user = events[findex];
        events.splice(findex, 1);
        return user;
      },
      deleteAllEvents: () => {
        const length = events.length;
        events.splice(0, length);
        return {
          count: length,
        };
      },
      // Location
      addLocation: (parent, { data }) => {
        const location = { id: nanoid(), ...data };
        locations.push(location);
        return location;
      },
      updateLocation: (parent, { id, data }) => {
        const findex = locations.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        locations[findex] = { ...locations[findex], ...data };
        return locations[findex];
      },
      deleteLocation: (parent, { id }) => {
        const findex = locations.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        let location = locations[findex];
        locations.splice(findex, 1);
        return location;
      },
      deleteAllUsers: () => {
        const length = locations.length;
        locations.splice(0, length);
        return {
          count: length,
        };
      },
      // Participant
      addParticipant: (parent, { data }, { pubSub }) => {
        const participant = { id: nanoid(), ...data };
        participants.push(participant);
        pubSub.publish("participantCreated", participant);
        return participant;
      },
      updateParticipant: (parent, { id, data }) => {
        const findex = participants.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        participants[findex] = { ...participants[findex], ...data };
        return participants[findex];
      },
      deleteParticipant: (parent, { id }) => {
        const findex = participants.findIndex((item) => item.id == id);
        if (findex === -1) {
          throw new Error("User not found");
        }
        let participant = participants[findex];
        participants.splice(findex, 1);
        return participant;
      },
      deleteAllParticipants: () => {
        const length = participants.length;
        participants.splice(0, length);
        return {
          count: length,
        };
      },
    },
    Subscription: {
      userCreated: {
        subscribe: (_, __, { pubSub }) => pubSub.subscribe("userCreated"),
        resolve: (payload) => payload,
      },
      eventCreated: {
        subscribe: (_, __, { pubSub }) => pubSub.subscribe("eventCreated"),
        resolve: (payload) => payload,
      },
      participantCreated: {
        subscribe: (_, __, { pubSub }) =>
          pubSub.subscribe("participantCreated"),
        resolve: (payload, variables) => payload,
      },
    },
  },
});

const yoga = createYoga({ schema, context: { pubSub } });
const server = createServer(yoga);
server.listen(4000, () => {
  console.log("server is running on http://localhost:4000/graphql");
});
