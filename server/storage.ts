import { 
  users, 
  calculators, 
  properties, 
  investments, 
  analyses, 
  settings,
  type User, 
  type InsertUser, 
  type Calculator, 
  type InsertCalculator,
  type Property,
  type InsertProperty,
  type Investment,
  type InsertInvestment,
  type Analysis,
  type InsertAnalysis,
  type Setting,
  type InsertSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, isNotNull, like, or } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Calculator operations
  getCalculators(userId?: number): Promise<Calculator[]>;
  getCalculator(id: number): Promise<Calculator | undefined>;
  getRecentCalculators(limit?: number): Promise<Calculator[]>;
  createCalculator(calculator: InsertCalculator): Promise<Calculator>;
  updateCalculator(id: number, calculator: Partial<Calculator>): Promise<Calculator | undefined>;
  duplicateCalculator(id: number): Promise<Calculator | undefined>;
  deleteCalculator(id: number): Promise<boolean>;
  
  // Property operations
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Investment operations
  getInvestments(calculatorId: number): Promise<Investment[]>;
  getInvestment(id: number): Promise<Investment | undefined>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, investment: Partial<Investment>): Promise<Investment | undefined>;
  deleteInvestment(id: number): Promise<boolean>;
  
  // Analysis operations
  getAnalyses(filters?: { calculatorId?: number, investmentId?: number }): Promise<Analysis[]>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: number, analysis: Partial<Analysis>): Promise<Analysis | undefined>;
  deleteAnalysis(id: number): Promise<boolean>;
  
  // Settings operations
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
  
  // Dashboard operations
  getDashboardOverview(): Promise<{
    investorsCount: number,
    calculatorsCount: number,
    propertiesCount: number,
    analysesCount: number
  }>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Calculator operations
  async getCalculators(userId?: number): Promise<Calculator[]> {
    let query = db.select().from(calculators).orderBy(desc(calculators.updatedAt));
    
    if (userId) {
      query = query.where(eq(calculators.userId, userId));
    }
    
    return await query;
  }

  async getCalculator(id: number): Promise<Calculator | undefined> {
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(eq(calculators.id, id));
    return calculator;
  }

  async getRecentCalculators(limit: number = 5): Promise<Calculator[]> {
    return await db
      .select()
      .from(calculators)
      .orderBy(desc(calculators.updatedAt))
      .limit(limit);
  }

  async createCalculator(insertCalculator: InsertCalculator): Promise<Calculator> {
    // Get investor name for denormalization
    const [investor] = await db
      .select()
      .from(users)
      .where(eq(users.id, insertCalculator.userId));
    
    const [calculator] = await db
      .insert(calculators)
      .values({
        ...insertCalculator,
        investorName: investor.name,
      })
      .returning();
    
    // Update user's calculator count
    await db
      .update(users)
      .set({ 
        calculatorsCount: investor.calculatorsCount + 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, insertCalculator.userId));
    
    return calculator;
  }

  async updateCalculator(id: number, calculatorData: Partial<Calculator>): Promise<Calculator | undefined> {
    // If userId is changing, update investor name
    if (calculatorData.userId) {
      const [investor] = await db
        .select()
        .from(users)
        .where(eq(users.id, calculatorData.userId));
      
      calculatorData.investorName = investor.name;
    }
    
    const [calculator] = await db
      .update(calculators)
      .set({ ...calculatorData, updatedAt: new Date() })
      .where(eq(calculators.id, id))
      .returning();
    
    return calculator;
  }

  async duplicateCalculator(id: number): Promise<Calculator | undefined> {
    // Get original calculator
    const [originalCalculator] = await db
      .select()
      .from(calculators)
      .where(eq(calculators.id, id));
    
    if (!originalCalculator) return undefined;
    
    // Create a copy with new name
    const [newCalculator] = await db
      .insert(calculators)
      .values({
        ...originalCalculator,
        name: `${originalCalculator.name} (העתק)`,
        id: undefined, // Let DB assign new ID
        createdAt: new Date(),
        updatedAt: new Date(),
        investmentOptionsCount: 0,
        analysesCount: 0,
      })
      .returning();
    
    // Update user's calculator count
    await db
      .update(users)
      .set({ 
        calculatorsCount: originalCalculator.investmentOptionsCount + 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, originalCalculator.userId));
    
    // Copy investment options
    const originalInvestments = await db
      .select()
      .from(investments)
      .where(eq(investments.calculatorId, id));
    
    for (const investment of originalInvestments) {
      await db
        .insert(investments)
        .values({
          ...investment,
          id: undefined, // Let DB assign new ID
          calculatorId: newCalculator.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      
      // Update new calculator's investment count
      await db
        .update(calculators)
        .set({ 
          investmentOptionsCount: newCalculator.investmentOptionsCount + 1,
          updatedAt: new Date()
        })
        .where(eq(calculators.id, newCalculator.id));
    }
    
    return newCalculator;
  }

  async deleteCalculator(id: number): Promise<boolean> {
    // Get calculator to update user's calculator count
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(eq(calculators.id, id));
    
    if (!calculator) return false;
    
    // Delete all related analyses
    await db
      .delete(analyses)
      .where(eq(analyses.calculatorId, id));
    
    // Delete all related investments
    await db
      .delete(investments)
      .where(eq(investments.calculatorId, id));
    
    // Delete calculator
    const result = await db
      .delete(calculators)
      .where(eq(calculators.id, id));
    
    // Update user's calculator count
    await db
      .update(users)
      .set({ 
        calculatorsCount: calculator.calculatorsCount - 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, calculator.userId));
    
    return result.rowCount > 0;
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .orderBy(desc(properties.updatedAt));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    return property;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ ...propertyData, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // Check if property is used in any investment
    const [investment] = await db
      .select()
      .from(investments)
      .where(eq(investments.propertyId, id));
    
    if (investment) {
      // Property is used, can't delete
      return false;
    }
    
    const result = await db
      .delete(properties)
      .where(eq(properties.id, id));
    
    return result.rowCount > 0;
  }

  // Investment operations
  async getInvestments(calculatorId: number): Promise<Investment[]> {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.calculatorId, calculatorId))
      .orderBy(desc(investments.updatedAt));
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    const [investment] = await db
      .select()
      .from(investments)
      .where(eq(investments.id, id));
    return investment;
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    // If this is marked as selected, unmark other investments in the calculator
    if (insertInvestment.isSelected) {
      await db
        .update(investments)
        .set({ isSelected: false, updatedAt: new Date() })
        .where(eq(investments.calculatorId, insertInvestment.calculatorId));
    }
    
    const [investment] = await db
      .insert(investments)
      .values(insertInvestment)
      .returning();
    
    // Update calculator's investment count
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(eq(calculators.id, insertInvestment.calculatorId));
    
    await db
      .update(calculators)
      .set({ 
        investmentOptionsCount: calculator.investmentOptionsCount + 1,
        updatedAt: new Date()
      })
      .where(eq(calculators.id, insertInvestment.calculatorId));
    
    return investment;
  }

  async updateInvestment(id: number, investmentData: Partial<Investment>): Promise<Investment | undefined> {
    // Get current investment to check for changes
    const [currentInvestment] = await db
      .select()
      .from(investments)
      .where(eq(investments.id, id));
    
    if (!currentInvestment) return undefined;
    
    // If this is being marked as selected, unmark other investments in the calculator
    if (investmentData.isSelected && !currentInvestment.isSelected) {
      await db
        .update(investments)
        .set({ isSelected: false, updatedAt: new Date() })
        .where(and(
          eq(investments.calculatorId, currentInvestment.calculatorId),
          eq(investments.isSelected, true)
        ));
    }
    
    const [investment] = await db
      .update(investments)
      .set({ ...investmentData, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    
    return investment;
  }

  async deleteInvestment(id: number): Promise<boolean> {
    // Get investment to update calculator count
    const [investment] = await db
      .select()
      .from(investments)
      .where(eq(investments.id, id));
    
    if (!investment) return false;
    
    // Delete all related analyses
    await db
      .delete(analyses)
      .where(eq(analyses.investmentId, id));
    
    // Delete investment
    const result = await db
      .delete(investments)
      .where(eq(investments.id, id));
    
    // Update calculator's investment count
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(eq(calculators.id, investment.calculatorId));
    
    await db
      .update(calculators)
      .set({ 
        investmentOptionsCount: calculator.investmentOptionsCount - 1,
        updatedAt: new Date()
      })
      .where(eq(calculators.id, investment.calculatorId));
    
    return result.rowCount > 0;
  }

  // Analysis operations
  async getAnalyses(filters?: { calculatorId?: number, investmentId?: number }): Promise<Analysis[]> {
    let query = db.select().from(analyses).orderBy(desc(analyses.updatedAt));
    
    if (filters) {
      if (filters.calculatorId) {
        query = query.where(eq(analyses.calculatorId, filters.calculatorId));
      }
      
      if (filters.investmentId) {
        query = query.where(eq(analyses.investmentId, filters.investmentId));
      }
    }
    
    return await query;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));
    return analysis;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    // Get calculator name for denormalization
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(eq(calculators.id, insertAnalysis.calculatorId));
    
    // Get investment name for denormalization (if applicable)
    let investmentName = null;
    if (insertAnalysis.investmentId) {
      const [investment] = await db
        .select()
        .from(investments)
        .where(eq(investments.id, insertAnalysis.investmentId));
      
      if (investment) {
        investmentName = investment.name;
      }
    }
    
    // If this is marked as default, unmark other analyses of the same type in the calculator
    if (insertAnalysis.isDefault) {
      await db
        .update(analyses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(analyses.calculatorId, insertAnalysis.calculatorId),
          eq(analyses.type, insertAnalysis.type)
        ));
    }
    
    const [analysis] = await db
      .insert(analyses)
      .values({
        ...insertAnalysis,
        calculatorName: calculator.name,
        investmentName: investmentName,
      })
      .returning();
    
    // Update calculator's analysis count
    await db
      .update(calculators)
      .set({ 
        analysesCount: calculator.analysesCount + 1,
        updatedAt: new Date()
      })
      .where(eq(calculators.id, insertAnalysis.calculatorId));
    
    return analysis;
  }

  async updateAnalysis(id: number, analysisData: Partial<Analysis>): Promise<Analysis | undefined> {
    // Get current analysis to check for changes
    const [currentAnalysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));
    
    if (!currentAnalysis) return undefined;
    
    // If calculator ID is changing, update calculator name
    if (analysisData.calculatorId && analysisData.calculatorId !== currentAnalysis.calculatorId) {
      const [calculator] = await db
        .select()
        .from(calculators)
        .where(eq(calculators.id, analysisData.calculatorId));
      
      analysisData.calculatorName = calculator.name;
      
      // Update old calculator's analysis count
      const [oldCalculator] = await db
        .select()
        .from(calculators)
        .where(eq(calculators.id, currentAnalysis.calculatorId));
      
      await db
        .update(calculators)
        .set({ 
          analysesCount: oldCalculator.analysesCount - 1,
          updatedAt: new Date()
        })
        .where(eq(calculators.id, currentAnalysis.calculatorId));
      
      // Update new calculator's analysis count
      await db
        .update(calculators)
        .set({ 
          analysesCount: calculator.analysesCount + 1,
          updatedAt: new Date()
        })
        .where(eq(calculators.id, analysisData.calculatorId));
    }
    
    // If investment ID is changing, update investment name
    if (analysisData.investmentId !== undefined && 
        analysisData.investmentId !== currentAnalysis.investmentId) {
      if (analysisData.investmentId === null) {
        analysisData.investmentName = null;
      } else {
        const [investment] = await db
          .select()
          .from(investments)
          .where(eq(investments.id, analysisData.investmentId));
        
        if (investment) {
          analysisData.investmentName = investment.name;
        }
      }
    }
    
    // If this is being marked as default, unmark other analyses of the same type in the calculator
    if (analysisData.isDefault && !currentAnalysis.isDefault) {
      await db
        .update(analyses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(analyses.calculatorId, currentAnalysis.calculatorId),
          eq(analyses.type, currentAnalysis.type),
          eq(analyses.isDefault, true)
        ));
    }
    
    const [analysis] = await db
      .update(analyses)
      .set({ ...analysisData, updatedAt: new Date() })
      .where(eq(analyses.id, id))
      .returning();
    
    return analysis;
  }

  async deleteAnalysis(id: number): Promise<boolean> {
    // Get analysis to update calculator count
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));
    
    if (!analysis) return false;
    
    // Delete analysis
    const result = await db
      .delete(analyses)
      .where(eq(analyses.id, id));
    
    // Update calculator's analysis count
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(eq(calculators.id, analysis.calculatorId));
    
    await db
      .update(calculators)
      .set({ 
        analysesCount: calculator.analysesCount - 1,
        updatedAt: new Date()
      })
      .where(eq(calculators.id, analysis.calculatorId));
    
    return result.rowCount > 0;
  }

  // Settings operations
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    // Check if setting exists
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      // Update existing setting
      const [setting] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return setting;
    } else {
      // Create new setting
      const [setting] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return setting;
    }
  }

  // Dashboard operations
  async getDashboardOverview(): Promise<{
    investorsCount: number,
    calculatorsCount: number,
    propertiesCount: number,
    analysesCount: number
  }> {
    try {
      // הדרך הבטוחה ביותר לקבלת ספירה ללא שגיאות
      let investorsCount = 0;
      let calculatorsCount = 0;
      let propertiesCount = 0;
      let analysesCount = 0;
      
      try {
        // Count investors - with safer error handling
        const investorsResult = await db
          .select({ count: db.fn.count(users.id) })
          .from(users)
          .where(eq(users.role, 'investor'));
        investorsCount = Number(investorsResult[0]?.count ?? 0);
      } catch (e) {
        console.error("Error counting investors:", e);
      }
      
      try {
        // Count calculators
        const calculatorsResult = await db
          .select({ count: db.fn.count(calculators.id) })
          .from(calculators);
        calculatorsCount = Number(calculatorsResult[0]?.count ?? 0);
      } catch (e) {
        console.error("Error counting calculators:", e);
      }
      
      try {
        // Count properties
        const propertiesResult = await db
          .select({ count: db.fn.count(properties.id) })
          .from(properties);
        propertiesCount = Number(propertiesResult[0]?.count ?? 0);
      } catch (e) {
        console.error("Error counting properties:", e);
      }
      
      try {
        // Count analyses
        const analysesResult = await db
          .select({ count: db.fn.count(analyses.id) })
          .from(analyses);
        analysesCount = Number(analysesResult[0]?.count ?? 0);
      } catch (e) {
        console.error("Error counting analyses:", e);
      }
      
      return {
        investorsCount,
        calculatorsCount,
        propertiesCount,
        analysesCount
      };
    } catch (error) {
      console.error("Error in getDashboardOverview:", error);
      // Return default values if there's an error
      return {
        investorsCount: 0,
        calculatorsCount: 0,
        propertiesCount: 0,
        analysesCount: 0
      };
    }
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
