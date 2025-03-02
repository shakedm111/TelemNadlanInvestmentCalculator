import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertCalculatorSchema, 
  insertPropertySchema, 
  insertInvestmentSchema, 
  insertAnalysisSchema 
} from "@shared/schema";
import { ZodError } from "zod";

// Middleware to ensure user is authenticated
function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to ensure user is an advisor
function ensureAdvisor(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user.role === "advisor") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Advisor role required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handling for Zod validation errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors,
      });
    }
    next(err);
  });

  // Dashboard Overview Route
  app.get("/api/dashboard/overview", ensureAuthenticated, async (req, res) => {
    try {
      const overview = await storage.getDashboardOverview();
      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard overview" });
    }
  });

  // Calculators Routes
  app.get("/api/calculators", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.role === "investor" ? req.user.id : undefined;
      const calculators = await storage.getCalculators(userId);
      res.json(calculators);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calculators" });
    }
  });

  app.get("/api/calculators/recent", ensureAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const calculators = await storage.getRecentCalculators(limit);
      res.json(calculators);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent calculators" });
    }
  });

  app.get("/api/calculators/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const calculator = await storage.getCalculator(id);
      
      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      // Check if user has access to this calculator
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your calculator" });
      }
      
      res.json(calculator);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calculator" });
    }
  });

  app.post("/api/calculators", ensureAuthenticated, async (req, res) => {
    try {
      const data = insertCalculatorSchema.parse(req.body);
      
      // If user is an investor, they can only create calculators for themselves
      if (req.user.role === "investor" && data.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Can only create calculator for yourself" });
      }
      
      const calculator = await storage.createCalculator(data);
      res.status(201).json(calculator);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating calculator" });
    }
  });

  app.patch("/api/calculators/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const calculator = await storage.getCalculator(id);
      
      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      // Check if user has access to edit this calculator
      if (req.user.role === "investor") {
        if (calculator.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: Not your calculator" });
        }
        
        // Investors can only update limited fields
        const allowedFields = ["selfEquity", "hasMortgage", "hasPropertyInIsrael", "investmentPreference"];
        const disallowedUpdates = Object.keys(req.body).filter(key => !allowedFields.includes(key));
        
        if (disallowedUpdates.length > 0) {
          return res.status(403).json({ 
            message: "Forbidden: Can only update limited fields", 
            disallowedFields: disallowedUpdates 
          });
        }
      }
      
      const updatedCalculator = await storage.updateCalculator(id, req.body);
      res.json(updatedCalculator);
    } catch (error) {
      res.status(500).json({ message: "Error updating calculator" });
    }
  });

  app.post("/api/calculators/:id/duplicate", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const calculator = await storage.getCalculator(id);
      
      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      // Check if user has access to duplicate this calculator
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your calculator" });
      }
      
      const duplicatedCalculator = await storage.duplicateCalculator(id);
      res.status(201).json(duplicatedCalculator);
    } catch (error) {
      res.status(500).json({ message: "Error duplicating calculator" });
    }
  });

  app.delete("/api/calculators/:id", ensureAdvisor, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCalculator(id);
      
      if (!success) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting calculator" });
    }
  });

  // Investors Routes
  app.get("/api/investors", ensureAuthenticated, async (req, res) => {
    try {
      // Only get users with investor role
      const allUsers = await storage.getUsers?.() || [];
      const investors = allUsers.filter(user => user.role === "investor");
      
      // For security, don't send passwords
      const investorsWithoutPasswords = investors.map(({ password, ...investor }) => investor);
      
      res.json(investorsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching investors" });
    }
  });

  // Properties Routes
  app.get("/api/properties", ensureAuthenticated, async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Error fetching properties" });
    }
  });

  app.get("/api/properties/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Error fetching property" });
    }
  });

  app.post("/api/properties", ensureAdvisor, async (req, res) => {
    try {
      const data = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(data);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating property" });
    }
  });

  app.patch("/api/properties/:id", ensureAdvisor, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProperty = await storage.updateProperty(id, req.body);
      
      if (!updatedProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(updatedProperty);
    } catch (error) {
      res.status(500).json({ message: "Error updating property" });
    }
  });

  app.delete("/api/properties/:id", ensureAdvisor, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProperty(id);
      
      if (!success) {
        return res.status(404).json({ message: "Property not found or cannot be deleted" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting property" });
    }
  });

  // Investments Routes
  app.get("/api/investments", ensureAuthenticated, async (req, res) => {
    try {
      const calculatorId = req.query.calculatorId ? parseInt(req.query.calculatorId as string) : undefined;
      
      if (!calculatorId) {
        return res.status(400).json({ message: "Calculator ID is required" });
      }
      
      // Check if user has access to this calculator's investments
      const calculator = await storage.getCalculator(calculatorId);
      
      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your calculator" });
      }
      
      const investments = await storage.getInvestments(calculatorId);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching investments" });
    }
  });

  app.get("/api/investments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const investment = await storage.getInvestment(id);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      // Check if user has access to this investment
      const calculator = await storage.getCalculator(investment.calculatorId);
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your investment" });
      }
      
      res.json(investment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching investment" });
    }
  });

  app.post("/api/investments", ensureAuthenticated, async (req, res) => {
    try {
      const data = insertInvestmentSchema.parse(req.body);
      
      // Check if user has access to this calculator
      const calculator = await storage.getCalculator(data.calculatorId);
      
      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your calculator" });
      }
      
      const investment = await storage.createInvestment(data);
      res.status(201).json(investment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating investment" });
    }
  });

  app.patch("/api/investments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const investment = await storage.getInvestment(id);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      // Check if user has access to this investment
      const calculator = await storage.getCalculator(investment.calculatorId);
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your investment" });
      }
      
      // If user is an investor, they can only update limited fields
      if (req.user.role === "investor") {
        const allowedFields = ["hasFurniture", "hasPropertyManagement", "hasRealEstateAgent"];
        const disallowedUpdates = Object.keys(req.body).filter(key => !allowedFields.includes(key));
        
        if (disallowedUpdates.length > 0) {
          return res.status(403).json({ 
            message: "Forbidden: Can only update limited fields", 
            disallowedFields: disallowedUpdates 
          });
        }
      }
      
      const updatedInvestment = await storage.updateInvestment(id, req.body);
      res.json(updatedInvestment);
    } catch (error) {
      res.status(500).json({ message: "Error updating investment" });
    }
  });

  app.delete("/api/investments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const investment = await storage.getInvestment(id);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      // Check if user has access to delete this investment
      const calculator = await storage.getCalculator(investment.calculatorId);
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your investment" });
      }
      
      const success = await storage.deleteInvestment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting investment" });
    }
  });

  // Analyses Routes
  app.get("/api/analyses", ensureAuthenticated, async (req, res) => {
    try {
      const calculatorId = req.query.calculatorId ? parseInt(req.query.calculatorId as string) : undefined;
      const investmentId = req.query.investmentId ? parseInt(req.query.investmentId as string) : undefined;
      
      // If calculator ID is provided, check if user has access
      if (calculatorId) {
        const calculator = await storage.getCalculator(calculatorId);
        
        if (!calculator) {
          return res.status(404).json({ message: "Calculator not found" });
        }
        
        if (req.user.role === "investor" && calculator.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: Not your calculator" });
        }
      }
      
      const analyses = await storage.getAnalyses({ calculatorId, investmentId });
      
      // If user is an investor, filter analyses for their calculators only
      if (req.user.role === "investor" && !calculatorId) {
        const userCalculators = await storage.getCalculators(req.user.id);
        const calculatorIds = userCalculators.map(calc => calc.id);
        const filteredAnalyses = analyses.filter(analysis => 
          calculatorIds.includes(analysis.calculatorId)
        );
        return res.json(filteredAnalyses);
      }
      
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analyses" });
    }
  });

  app.get("/api/analyses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Check if user has access to this analysis
      const calculator = await storage.getCalculator(analysis.calculatorId);
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your analysis" });
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analysis" });
    }
  });

  app.post("/api/analyses", ensureAuthenticated, async (req, res) => {
    try {
      const data = insertAnalysisSchema.parse(req.body);
      
      // Check if user has access to this calculator
      const calculator = await storage.getCalculator(data.calculatorId);
      
      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your calculator" });
      }
      
      const analysis = await storage.createAnalysis(data);
      res.status(201).json(analysis);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating analysis" });
    }
  });

  app.patch("/api/analyses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Check if user has access to this analysis
      const calculator = await storage.getCalculator(analysis.calculatorId);
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your analysis" });
      }
      
      const updatedAnalysis = await storage.updateAnalysis(id, req.body);
      res.json(updatedAnalysis);
    } catch (error) {
      res.status(500).json({ message: "Error updating analysis" });
    }
  });

  app.delete("/api/analyses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Check if user has access to delete this analysis
      const calculator = await storage.getCalculator(analysis.calculatorId);
      
      if (req.user.role === "investor" && calculator.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your analysis" });
      }
      
      const success = await storage.deleteAnalysis(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting analysis" });
    }
  });

  // Settings Routes
  app.get("/api/settings", ensureAdvisor, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  app.get("/api/settings/:key", ensureAuthenticated, async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Error fetching setting" });
    }
  });

  app.put("/api/settings/:key", ensureAdvisor, async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const setting = await storage.updateSetting(key, value);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Error updating setting" });
    }
  });

  // Helper function to get users (for the storage.getUsers fallback above)
  storage.getUsers = async () => {
    try {
      return await db.select().from(users);
    } catch (error) {
      return [];
    }
  };

  const httpServer = createServer(app);
  return httpServer;
}
