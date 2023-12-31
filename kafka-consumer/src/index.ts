import { Kafka, KafkaConfig } from "kafkajs";
import { Consumer, EachMessagePayload } from "kafkajs";
import sql from "mssql";
import { ICustomerEvent } from "../types/events.js";

// import fs from "fs";
// import ip from "ip";

// const host = process.env.HOST_IP || ip.address();
// console.log(`HOST:${host}`);

const KAFKA_TOPIC_CUSTOMERS = "server1.testDB.dbo.customers";
const kafkaConfig: KafkaConfig = {
  brokers: [`kafka:9092`],
  clientId: "my-consumer",
  authenticationTimeout: 10000,
  connectionTimeout: 1000,
  ssl: false,
  requestTimeout: 10000,
};
const kafka = new Kafka(kafkaConfig);

const consumer = kafka.consumer({
  groupId: "server1.testDB.dbo.customers-group",
});

const sqlConfig = {
  user: "sa",
  password: "Password!",
  database: "auditDB",
  server: "tutorial-sqlserver-1",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: false, // change to true for local dev / self-signed certs
  },
} as sql.config;

(async () => {
  try {
    await sql.connect(sqlConfig);
    const result = await sql.query`select * from customers`;
    console.log(result);
  } catch (e) {
    console.log("SQL CONNECT ERR");
  }
})();

(async () => {
  try {
    await consumer.connect();
  } catch (e) {
    console.log("NOT CONNECTED");
  }

  try {
    await consumer.subscribe({
      topic: KAFKA_TOPIC_CUSTOMERS,
      fromBeginning: true,
    });
  } catch (e) {
    console.log("TOPIC ERR");
  }

  try {
    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        if (topic === KAFKA_TOPIC_CUSTOMERS) {
          const value = JSON.parse(message.value?.toString() || "{}");
          const event = value as ICustomerEvent;
          console.log(event.payload);

          const before = event.payload.before;
          const after = event.payload.after;

          for (const key in before) {
            if (before.hasOwnProperty(key) && after.hasOwnProperty(key)) {
              if (before[key] !== after[key]) {
                console.log(`${key} CHANGED: ${before[key]} => ${after[key]}`);
                // You can add your code to write to AUDITDB here (this is for a single field cause we are running a loop for each property in the object)
              }
            }
          }

          //here you can add your code to write to AUDITDB (this is for the whole row or a single field or whatever depending on the query we run)
        } else {
          console.log("TOPIC DOES NOT MATCH");
        }
      },
    });
  } catch (e) {
    console.log("RUN ERR");
  }
})();
