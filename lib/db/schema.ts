import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    amount: real("amount").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    date: text("date").notNull().default(sql`(current_timestamp)`),
  },
  (table) => ({
    userIdIdx: index("transactions_user_id_idx").on(table.userId),
  })
);

export const friends = sqliteTable(
  "friends",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
  },
  (table) => ({
    userIdIdx: index("friends_user_id_idx").on(table.userId),
  })
);

export const lendingEntries = sqliteTable(
  "lending_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    friendId: text("friend_id")
      .notNull()
      .references(() => friends.id),
    amount: real("amount").notNull(),
    direction: text("direction", { enum: ["lent", "borrowed"] }).notNull(),
    note: text("note"),
    date: text("date").notNull().default(sql`(current_timestamp)`),
    settled: integer("settled", { mode: "boolean" }).notNull().default(false),
  },
  (table) => ({
    userIdIdx: index("lending_entries_user_id_idx").on(table.userId),
    friendIdIdx: index("lending_entries_friend_id_idx").on(table.friendId),
  })
);

export const budgetLimits = sqliteTable(
  "budget_limits",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    category: text("category").notNull(),
    monthlyLimit: real("monthly_limit").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => ({
    userIdIdx: index("budget_limits_user_id_idx").on(table.userId),
    userCategoryIdx: index("budget_limits_user_category_idx").on(table.userId, table.category),
  })
);
