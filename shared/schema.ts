import { pgTable, text, serial, integer, boolean, decimal, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (advisors and investors)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("investor"), // investor or advisor
  status: text("status").notNull().default("active"), // active or inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  calculatorsCount: integer("calculators_count").default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  calculators: many(calculators),
}));

// Calculators table
export const calculators = pgTable("calculators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  selfEquity: decimal("self_equity").notNull().default("0"),
  hasMortgage: boolean("has_mortgage").notNull().default(false),
  hasPropertyInIsrael: boolean("has_property_in_israel").notNull().default(false),
  investmentPreference: text("investment_preference").notNull().default("positive_cashflow"),
  exchangeRate: decimal("exchange_rate").notNull().default("3.95"),
  vatRate: decimal("vat_rate").notNull().default("19"),
  status: text("status").notNull().default("draft"), // draft, active, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  investmentOptionsCount: integer("investment_options_count").default(0),
  analysesCount: integer("analyses_count").default(0),
  investorName: text("investor_name").notNull(), // Denormalized for display purposes
});

export const calculatorsRelations = relations(calculators, ({ one, many }) => ({
  user: one(users, {
    fields: [calculators.userId],
    references: [users.id],
  }),
  investments: many(investments),
  analyses: many(analyses),
}));

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  priceWithoutVAT: decimal("price_without_vat").notNull(),
  monthlyRent: decimal("monthly_rent").notNull(),
  guaranteedRent: boolean("guaranteed_rent").default(false),
  deliveryDate: timestamp("delivery_date").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const propertiesRelations = relations(properties, ({ many }) => ({
  investments: many(investments),
}));

// Investments table (Investment Options)
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  calculatorId: integer("calculator_id").notNull().references(() => calculators.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  name: text("name").notNull(),
  isSelected: boolean("is_selected").notNull().default(false),
  priceOverride: decimal("price_override"),
  monthlyRentOverride: decimal("monthly_rent_override"),
  hasFurniture: boolean("has_furniture").notNull().default(false),
  hasPropertyManagement: boolean("has_property_management").notNull().default(false),
  hasRealEstateAgent: boolean("has_real_estate_agent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  calculator: one(calculators, {
    fields: [investments.calculatorId],
    references: [calculators.id],
  }),
  property: one(properties, {
    fields: [investments.propertyId],
    references: [properties.id],
  }),
  analyses: many(analyses),
}));

// Analyses table
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  calculatorId: integer("calculator_id").notNull().references(() => calculators.id),
  investmentId: integer("investment_id").references(() => investments.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // mortgage, cashflow, sensitivity, comparison, yield
  parameters: text("parameters").notNull(), // JSON string
  results: text("results").notNull(), // JSON string
  isDefault: boolean("is_default").notNull().default(false),
  status: text("status").notNull().default("active"), // draft, active, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  calculatorName: text("calculator_name").notNull(), // Denormalized for display purposes
  investmentName: text("investment_name"), // Denormalized for display purposes
});

export const analysesRelations = relations(analyses, ({ one }) => ({
  calculator: one(calculators, {
    fields: [analyses.calculatorId],
    references: [calculators.id],
  }),
  investment: one(investments, {
    fields: [analyses.investmentId],
    references: [investments.id],
  }),
}));

// System settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
});

export const insertCalculatorSchema = createInsertSchema(calculators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  investmentOptionsCount: true,
  analysesCount: true,
  investorName: true, // Omit since it's auto-populated based on userId
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  calculatorName: true,
  investmentName: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCalculator = z.infer<typeof insertCalculatorSchema>;
export type Calculator = typeof calculators.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
